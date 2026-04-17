import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/config/prisma.service';
import { RedisService } from '@/config/redis.service';
import { CreatePaymentDto, PaymentQueryDto, WithdrawRequestDto, RefundPaymentDto, WebhookPayloadDto } from './dto/payment.dto';
import { Prisma } from '@prisma/client';
import { XenditService } from './xendit.service';
import { CryptoPaymentService } from './crypto-payment.service';
import { DokuService } from './doku.service';
import { EmailService } from '@modules/notification/email.service';
import { PLATFORM_FEE_RATE, CANCELLATION_FEE_RATES } from '@common/constants/platform.constants';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly xendit: XenditService,
    private readonly cryptoPayment: CryptoPaymentService,
    private readonly doku: DokuService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Read commission rate from Redis (admin-configurable), fallback to constant.
   */
  private async getCommissionRate(): Promise<number> {
    const redisVal = await this.redis.get('platform:commission_rate');
    return redisVal ? Number(redisVal) / 100 : PLATFORM_FEE_RATE;
  }

  private isPaymentMockEnabled(): boolean {
    // Explicit opt-in via PAYMENT_MODE wins when set (used by UAT harness).
    const paymentMode = this.configService.get<string>('PAYMENT_MODE');
    if (paymentMode) {
      return paymentMode.toUpperCase() !== 'REAL';
    }

    // Fall back to the documented ENABLE_PAYMENT_MOCK flag so local dev can
    // flip mocks on/off without redeploying. Defaults to OFF so production
    // does not silently short-circuit real gateways.
    const raw = this.configService.get<string>('ENABLE_PAYMENT_MOCK');
    if (!raw) return false;
    return !['0', 'false', 'no', 'off'].includes(raw.trim().toLowerCase());
  }

  async create(userId: string, dto: CreatePaymentDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        payment: true,
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        escort: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (booking.clientId !== userId) throw new ForbiddenException('Bukan booking Anda');
    if (booking.payment && booking.payment.status !== 'PENDING') {
      throw new BadRequestException('Payment sudah diproses untuk booking ini');
    }
    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException('Booking harus dalam status CONFIRMED untuk pembayaran');
    }

    // Determine payment type: FULL (100%) or DP_50 (50% down payment)
    const paymentType = dto.paymentType === 'DP_50' ? 'DP_50' : 'FULL';
    const dpMultiplier = paymentType === 'DP_50' ? 0.5 : 1.0;

    const amount = booking.totalAmount;
    const amountNum = amount.toNumber();
    const commissionRate = await this.getCommissionRate();

    // Calculate charge amount based on payment type
    const chargeAmount = Math.round(amountNum * dpMultiplier);
    const totalCharge = chargeAmount + (dto.tipAmount || 0);

    // Fee split must be proportional to the actual charged amount, not full booking amount
    const platformFee = new Prisma.Decimal(Math.round(chargeAmount * commissionRate));
    const escortPayout = new Prisma.Decimal(Math.round(chargeAmount * (1 - commissionRate)));
    const tipAmount = dto.tipAmount ? new Prisma.Decimal(dto.tipAmount) : null;

    // Create payment via appropriate gateway
    const orderId = `ARETON-${booking.id.substring(0, 8)}-${Date.now()}`;
    const itemName = paymentType === 'DP_50'
      ? `DP 50% - Booking ${booking.serviceType || 'Pendamping'} - ${booking.escort.firstName}`
      : `Booking ${booking.serviceType || 'Pendamping'} - ${booking.escort.firstName}`;

    const isCrypto = dto.method.startsWith('crypto');
    const isDoku = dto.method.startsWith('doku');

    let gatewayResult: any;

    if (this.isPaymentMockEnabled()) {
      const webUrl = this.configService.get('WEB_URL') || 'https://areton.id';
      gatewayResult = {
        orderId,
        invoiceId: `MOCK-PAY-${Date.now()}`,
        redirectUrl: `${webUrl}/user/payments/status?order_id=${orderId}&mock=true`,
        invoiceUrl: `${webUrl}/user/payments/status?order_id=${orderId}&mock=true`,
        paymentType: isCrypto ? 'crypto-mock' : isDoku ? 'doku-mock' : 'fiat-mock',
        mock: true,
      };

      this.logger.warn(`Payment mock enabled: ${dto.method} → ${orderId} for booking ${booking.id}`);
    } else if (isCrypto) {
      // Route to crypto (NOWPayments)
      const payCurrency = dto.method === 'crypto' ? undefined : dto.method.replace('crypto_', '');
      try {
        const cryptoResult = await this.cryptoPayment.createInvoice({
          orderId,
          amount: Math.round(totalCharge),
          payCurrency,
          customer: {
            firstName: booking.client.firstName,
            lastName: booking.client.lastName || '',
            email: booking.client.email,
          },
          description: itemName,
        });

        gatewayResult = {
          orderId: cryptoResult.orderId,
          invoiceId: cryptoResult.transactionId,
          redirectUrl: cryptoResult.invoiceUrl,
          invoiceUrl: cryptoResult.invoiceUrl,
          paymentType: 'crypto',
          payCurrency: cryptoResult.payCurrency,
          payAmount: cryptoResult.payAmount,
        };
      } catch (error: unknown) {
        const err = error as Error;
        this.logger.error(`Crypto gateway error for order ${orderId}: ${err.message}`, err.stack);
        throw new BadRequestException('Gagal membuat pembayaran crypto. Silakan coba lagi atau pilih metode lain.');
      }
    } else if (isDoku) {
      // Route to DOKU Checkout
      const dokuMethodMap: Record<string, string | undefined> = {
        doku: undefined, // all methods
        doku_va: 'bank_transfer',
        doku_ewallet: 'ewallet',
        doku_qris: 'qris',
        doku_cc: 'credit_card',
        doku_retail: 'retail_outlet',
      };
      const dokuPaymentMethod = dokuMethodMap[dto.method];
      try {
        const dokuResult = await this.doku.createInvoice({
          orderId,
          amount: Math.round(totalCharge),
          paymentMethod: dokuPaymentMethod,
          customer: {
            firstName: booking.client.firstName,
            lastName: booking.client.lastName || '',
            email: booking.client.email,
            phone: booking.client.phone || undefined,
          },
          itemDetails: [
            {
              id: booking.id,
              price: chargeAmount,
              quantity: 1,
              name: itemName,
            },
            ...(dto.tipAmount && dto.tipAmount > 0 ? [{
              id: `tip-${booking.id}`,
              price: Math.round(dto.tipAmount),
              quantity: 1,
              name: 'Tip',
            }] : []),
          ],
          description: itemName,
        });

        gatewayResult = {
          orderId: dokuResult.orderId,
          invoiceId: dokuResult.transactionId,
          redirectUrl: dokuResult.redirectUrl,
          invoiceUrl: dokuResult.invoiceUrl,
          paymentType: 'doku',
          expiryDate: dokuResult.expiryDate,
        };
      } catch (error: unknown) {
        const err = error as Error;
        this.logger.error(`DOKU gateway error for order ${orderId}: ${err.message}`, err.stack);
        throw new BadRequestException('Gagal membuat pembayaran DOKU. Silakan coba lagi atau pilih metode lain.');
      }
    } else {
      // Route to Xendit (fiat fallback)
      try {
        const xenditResult = await this.xendit.createInvoice({
          orderId,
          amount: Math.round(totalCharge),
          paymentMethod: dto.method,
          customer: {
            firstName: booking.client.firstName,
            lastName: booking.client.lastName || '',
            email: booking.client.email,
            phone: booking.client.phone || undefined,
          },
          itemDetails: [
            {
              id: booking.id,
              price: chargeAmount,
              quantity: 1,
              name: itemName,
            },
            ...(dto.tipAmount && dto.tipAmount > 0 ? [{
              id: `tip-${booking.id}`,
              price: Math.round(dto.tipAmount),
              quantity: 1,
              name: 'Tip',
            }] : []),
          ],
          description: itemName,
        });

        gatewayResult = {
          orderId: xenditResult.orderId,
          invoiceId: xenditResult.transactionId,
          redirectUrl: xenditResult.redirectUrl,
          invoiceUrl: xenditResult.invoiceUrl,
          paymentType: xenditResult.paymentType,
          expiryDate: xenditResult.expiryDate,
        };
      } catch (error: unknown) {
        const err = error as Error;
        this.logger.error(`Xendit gateway error for order ${orderId}: ${err.message}`, err.stack);
        throw new BadRequestException('Gagal membuat pembayaran. Silakan coba lagi atau pilih metode lain.');
      }
    }

    // Create or update payment record (may already exist as PLATFORM stub from accept())
    const payment = await this.prisma.payment.upsert({
      where: { bookingId: dto.bookingId },
      create: {
        bookingId: dto.bookingId,
        amount,
        method: dto.method,
        status: 'PENDING',
        paymentType,
        platformFee,
        escortPayout,
        tipAmount,
        paymentGatewayRef: orderId,
      },
      update: {
        amount,
        method: dto.method,
        status: 'PENDING',
        paymentType,
        platformFee,
        escortPayout,
        tipAmount,
        paymentGatewayRef: orderId,
      },
    });

    this.logger.log(`Payment created [${paymentType}${isCrypto ? '/crypto' : isDoku ? '/doku' : ''}]: ${payment.id} → order: ${orderId}, charge: ${totalCharge}`);

    return {
      payment,
      gateway: gatewayResult,
    };
  }

  async findAll(userId: string, role: string, query: PaymentQueryDto) {
    const { page: rawPage = 1, limit: rawLimit = 10, status } = query;
    const page = Math.max(1, Number(rawPage) || 1);
    const limit = Math.max(1, Math.min(100, Number(rawLimit) || 10));
    const skip = (page - 1) * limit;

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role);
    const where: Prisma.PaymentWhereInput = {
      ...(isAdmin ? {} : { booking: role === 'ESCORT' ? { escortId: userId } : { clientId: userId } }),
      ...(status ? { status: status as any } : {}),
    };

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            select: {
              id: true,
              serviceType: true,
              startTime: true,
              client: { select: { firstName: true, lastName: true } },
              escort: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            client: { select: { id: true, firstName: true, lastName: true } },
            escort: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Payment tidak ditemukan');

    // Check access: owner or admin
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const isOwner = payment.booking.clientId === userId || payment.booking.escortId === userId;
    if (!isOwner && !isAdmin) throw new ForbiddenException('Akses ditolak');

    return payment;
  }

  async findByGatewayRef(userId: string, orderId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          { paymentGatewayRef: orderId },
          { id: orderId },
        ],
      },
      include: {
        booking: {
          include: {
            client: { select: { id: true, firstName: true, lastName: true } },
            escort: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Payment tidak ditemukan untuk order ini');

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const isOwner = payment.booking.clientId === userId || payment.booking.escortId === userId;
    if (!isOwner && !isAdmin) throw new ForbiddenException('Akses ditolak');

    return payment;
  }

  async getEarningsSummary(escortId: string) {
    const [totalEarnings, pendingPayouts, releasedPayouts, totalBookings] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { booking: { escortId }, status: { in: ['ESCROW', 'RELEASED'] } },
        _sum: { escortPayout: true, tipAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: { booking: { escortId }, status: 'ESCROW' },
        _sum: { escortPayout: true },
      }),
      this.prisma.payment.aggregate({
        where: { booking: { escortId }, status: 'RELEASED' },
        _sum: { escortPayout: true },
      }),
      this.prisma.booking.count({
        where: { escortId, status: 'COMPLETED' },
      }),
    ]);

    return {
      totalEarnings: totalEarnings._sum.escortPayout?.toNumber() || 0,
      totalTips: totalEarnings._sum.tipAmount?.toNumber() || 0,
      pendingPayout: pendingPayouts._sum.escortPayout?.toNumber() || 0,
      releasedPayout: releasedPayouts._sum.escortPayout?.toNumber() || 0,
      completedBookings: totalBookings,
    };
  }

  async requestWithdraw(escortId: string, dto: WithdrawRequestDto) {
    // Acquire a Redis lock to prevent concurrent withdrawal race conditions
    const lockKey = `withdraw_lock:${escortId}`;
    const acquired = await this.redis.setNX(lockKey, '1', 30); // 30s TTL, NX (set-if-not-exists)
    if (!acquired) {
      throw new BadRequestException('Permintaan withdrawal sedang diproses. Silakan tunggu.');
    }

    try {
      const earnings = await this.getEarningsSummary(escortId);

      if (dto.amount > earnings.pendingPayout) {
        throw new BadRequestException(
          `Saldo tersedia: Rp ${earnings.pendingPayout.toLocaleString('id-ID')}. Withdrawal melebihi saldo.`,
        );
      }

      const withdrawal = await this.prisma.withdrawal.create({
        data: {
          escortId,
          amount: new Prisma.Decimal(dto.amount),
          bankName: dto.bankName,
          bankAccount: dto.bankAccount,
          accountHolder: dto.accountHolder || null,
          status: 'PENDING',
        },
      });

      return {
        message: 'Permintaan withdrawal berhasil diajukan',
        withdrawal,
        estimatedArrival: '1-3 hari kerja',
      };
    } finally {
      await this.redis.del(lockKey);
    }
  }

  async getWithdrawals(escortId: string, query: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where: { escortId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.withdrawal.count({ where: { escortId } }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async releaseEscrow(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: { include: { escort: { select: { email: true, firstName: true } } } } },
    });

    if (!payment) throw new NotFoundException('Payment tidak ditemukan');
    if (payment.status !== 'ESCROW') {
      throw new BadRequestException('Payment harus dalam status ESCROW untuk di-release');
    }
    if (payment.booking.status !== 'COMPLETED') {
      throw new BadRequestException('Booking harus COMPLETED sebelum escrow di-release');
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
      },
    });

    // Send payment released email to escort
    this.emailService.sendPaymentReleased(payment.booking.escort.email, {
      name: payment.booking.escort.firstName,
      amount: payment.amount.toNumber().toLocaleString('id-ID'),
      bookingId: payment.bookingId,
    }).catch(() => {});

    return updated;
  }

  async refund(userId: string, paymentId: string, dto: RefundPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });

    if (!payment) throw new NotFoundException('Payment tidak ditemukan');
    if (!['ESCROW', 'RELEASED'].includes(payment.status)) {
      throw new BadRequestException('Payment tidak dapat di-refund pada status ini');
    }

    const isOwner = payment.booking.clientId === userId || payment.booking.escortId === userId;
    if (!isOwner) throw new ForbiddenException('Akses ditolak');

    const refundAmount = dto.amount
      ? new Prisma.Decimal(Math.min(dto.amount, payment.amount.toNumber()))
      : payment.amount;

    // WARNING: Gateway refund not yet implemented — only DB status updated.
    // Actual money return must be done manually until gateway refund API is integrated.
    this.logger.warn(
      `REFUND [MANUAL REQUIRED]: Payment ${paymentId}, amount: ${refundAmount}, gateway: ${payment.method}. ` +
      `No automatic refund processed — admin must refund via gateway dashboard.`,
    );

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
      },
    });
  }

  async handleWebhook(payload: any, callbackToken?: string) {
    // Parse Xendit webhook notification
    const notification = this.xendit.parseWebhookNotification(payload);

    // Verify callback token
    if (callbackToken) {
      if (this.xendit.isConfigured()) {
        const isValid = this.xendit.verifyWebhookToken(callbackToken);
        if (!isValid) {
          this.logger.warn(`Invalid webhook callback token for invoice: ${notification.invoiceId}`);
          return { status: 'error', message: 'Invalid callback token' };
        }
      }
    } else if (!this.xendit.isConfigured()) {
      // Mock mode: only accept if externalId matches an existing payment's gateway ref
      const exists = await this.prisma.payment.findFirst({
        where: { paymentGatewayRef: notification.externalId },
      });
      if (!exists) {
        this.logger.warn(`Mock webhook rejected: no payment found for order ${notification.externalId}`);
        return { status: 'error', message: 'Unauthorized mock webhook' };
      }
    }

    // Find payment by gateway reference (externalId = our orderId)
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          { paymentGatewayRef: notification.externalId },
          { id: notification.externalId },
        ],
      },
      include: { booking: true },
    });

    // If payment marked forfeited, don't process webhook
    if (payment?.forfeited) {
      this.logger.log(`Webhook ignored for forfeited payment: ${notification.externalId}`);
      return { status: 'ignored', message: 'Payment forfeited' };
    }

    if (!payment) {
      this.logger.warn(`Webhook: payment not found for order ${notification.externalId}`);
      return { status: 'ignored', message: 'Payment not found' };
    }

    // Map Xendit invoice status to our payment status
    const statusMap: Record<string, string> = {
      PAID: 'ESCROW',
      SETTLED: 'ESCROW',
      EXPIRED: 'FAILED',
    };

    const newStatus = statusMap[notification.status];
    if (!newStatus) {
      return { status: 'ignored', message: `Unknown status: ${notification.status}` };
    }

    // Idempotency: skip if payment is already in desired or terminal state
    if (payment.status === newStatus || ['RELEASED', 'REFUNDED'].includes(payment.status)) {
      this.logger.log(`Webhook duplicate/terminal skip: ${notification.externalId} already ${payment.status}`);
      return { status: 'ok', message: 'Already processed', paymentId: payment.id };
    }

    const updateData: any = { status: newStatus };
    if (newStatus === 'ESCROW') {
      updateData.paidAt = notification.paidAt ? new Date(notification.paidAt) : new Date();
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: updateData,
    });

    // Send payment-received email when payment enters escrow
    if (newStatus === 'ESCROW') {
      const client = await this.prisma.user.findUnique({
        where: { id: payment.booking.clientId },
        select: { email: true, firstName: true },
      });
      if (client) {
        this.emailService.sendPaymentReceived(client.email, {
          name: client.firstName,
          amount: payment.amount.toNumber().toLocaleString('id-ID'),
          method: notification.paymentMethod || notification.paymentChannel || 'Online',
        }).catch(() => {});
      }
    }

    this.logger.log(`Webhook processed: ${notification.externalId} → ${newStatus}`);
    return { status: 'ok', paymentId: payment.id, newStatus };
  }

  async handleCryptoWebhook(payload: any, signature?: string) {
    const notification = this.cryptoPayment.parseWebhookNotification(payload);

    // Verify IPN signature
    if (signature) {
      if (this.cryptoPayment.isConfigured()) {
        const isValid = this.cryptoPayment.verifyWebhookSignature(payload, signature);
        if (!isValid) {
          this.logger.warn(`Invalid crypto webhook signature for payment: ${notification.paymentId}`);
          return { status: 'error', message: 'Invalid signature' };
        }
      }
    } else if (!this.cryptoPayment.isConfigured()) {
      const exists = await this.prisma.payment.findFirst({
        where: { paymentGatewayRef: notification.orderId },
      });
      if (!exists) {
        this.logger.warn(`Mock crypto webhook rejected: no payment for order ${notification.orderId}`);
        return { status: 'error', message: 'Unauthorized mock webhook' };
      }
    }

    // Find payment by gateway reference
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          { paymentGatewayRef: notification.orderId },
          { id: notification.orderId },
        ],
      },
      include: { booking: true },
    });

    if (payment?.forfeited) {
      this.logger.log(`Crypto webhook ignored for forfeited payment: ${notification.orderId}`);
      return { status: 'ignored', message: 'Payment forfeited' };
    }

    if (!payment) {
      this.logger.warn(`Crypto webhook: payment not found for order ${notification.orderId}`);
      return { status: 'ignored', message: 'Payment not found' };
    }

    // Map NOWPayments status to our payment status
    // waiting, confirming, confirmed, sending, partially_paid, finished, failed, refunded, expired
    const statusMap: Record<string, string> = {
      finished: 'ESCROW',
      confirmed: 'ESCROW',
      failed: 'FAILED',
      expired: 'FAILED',
      refunded: 'REFUNDED',
    };

    const newStatus = statusMap[notification.status];
    if (!newStatus) {
      this.logger.log(`Crypto webhook status update: ${notification.orderId} → ${notification.status} (no action)`);
      return { status: 'ignored', message: `Status ${notification.status} — no action` };
    }

    // Idempotency: skip if payment is already in desired or terminal state
    if (payment.status === newStatus || ['RELEASED', 'REFUNDED'].includes(payment.status)) {
      this.logger.log(`Crypto webhook duplicate/terminal skip: ${notification.orderId} already ${payment.status}`);
      return { status: 'ok', message: 'Already processed', paymentId: payment.id };
    }

    const updateData: any = { status: newStatus };
    if (newStatus === 'ESCROW') {
      updateData.paidAt = new Date();
      updateData.method = `crypto_${notification.payCurrency}`;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: updateData,
    });

    // Send payment-received email
    if (newStatus === 'ESCROW') {
      const client = await this.prisma.user.findUnique({
        where: { id: payment.booking.clientId },
        select: { email: true, firstName: true },
      });
      if (client) {
        this.emailService.sendPaymentReceived(client.email, {
          name: client.firstName,
          amount: payment.amount.toNumber().toLocaleString('id-ID'),
          method: `Crypto (${notification.payCurrency.toUpperCase()})`,
        }).catch(() => {});
      }
    }

    this.logger.log(`Crypto webhook processed: ${notification.orderId} → ${newStatus} (${notification.payCurrency})`);
    return { status: 'ok', paymentId: payment.id, newStatus, crypto: notification.payCurrency };
  }

  async handleDokuWebhook(payload: any, headers: { clientId?: string; requestId?: string; requestTimestamp?: string; signature?: string }) {
    const notification = this.doku.parseWebhookNotification(payload);

    // Verify DOKU notification signature
    if (headers.signature && headers.clientId && headers.requestId && headers.requestTimestamp) {
      if (this.doku.isConfigured()) {
        const isValid = this.doku.verifyNotificationSignature(
          payload,
          headers.clientId,
          headers.requestId,
          headers.requestTimestamp,
          headers.signature,
        );
        if (!isValid) {
          this.logger.warn(`Invalid DOKU webhook signature for invoice: ${notification.invoiceNumber}`);
          return { status: 'error', message: 'Invalid signature' };
        }
      }
    }

    // Find payment by gateway reference (invoiceNumber = our orderId)
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          { paymentGatewayRef: notification.invoiceNumber },
          { id: notification.invoiceNumber },
        ],
      },
      include: { booking: true },
    });

    if (payment?.forfeited) {
      this.logger.log(`DOKU webhook ignored for forfeited payment: ${notification.invoiceNumber}`);
      return { status: 'ignored', message: 'Payment forfeited' };
    }

    if (!payment) {
      this.logger.warn(`DOKU webhook: payment not found for order ${notification.invoiceNumber}`);
      return { status: 'ignored', message: 'Payment not found' };
    }

    // Map DOKU status to our payment status
    // DOKU statuses: SUCCESS, FAILED, EXPIRED
    const statusMap: Record<string, string> = {
      SUCCESS: 'ESCROW',
      FAILED: 'FAILED',
      EXPIRED: 'FAILED',
    };

    const newStatus = statusMap[notification.status];
    if (!newStatus) {
      this.logger.log(`DOKU webhook status: ${notification.invoiceNumber} → ${notification.status} (no action)`);
      return { status: 'ignored', message: `Status ${notification.status} — no action` };
    }

    // Idempotency: skip if payment is already in desired or terminal state
    if (payment.status === newStatus || ['RELEASED', 'REFUNDED'].includes(payment.status)) {
      this.logger.log(`DOKU webhook duplicate/terminal skip: ${notification.invoiceNumber} already ${payment.status}`);
      return { status: 'ok', message: 'Already processed', paymentId: payment.id };
    }

    const updateData: any = { status: newStatus };
    if (newStatus === 'ESCROW') {
      updateData.paidAt = new Date();
      // Update method with actual DOKU channel
      if (notification.paymentChannel) {
        updateData.method = `doku_${notification.paymentChannel.toLowerCase()}`;
      }
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: updateData,
    });

    // Send payment-received email
    if (newStatus === 'ESCROW') {
      const client = await this.prisma.user.findUnique({
        where: { id: payment.booking.clientId },
        select: { email: true, firstName: true },
      });
      if (client) {
        const channelLabel = notification.paymentChannel || notification.paymentMethod || 'DOKU';
        this.emailService.sendPaymentReceived(client.email, {
          name: client.firstName,
          amount: payment.amount.toNumber().toLocaleString('id-ID'),
          method: channelLabel,
        }).catch(() => {});
      }
    }

    this.logger.log(`DOKU webhook processed: ${notification.invoiceNumber} → ${newStatus} (${notification.paymentChannel})`);
    return { status: 'ok', paymentId: payment.id, newStatus, channel: notification.paymentChannel };
  }

  calculateCancellationFee(bookingAmount: number, startTime: Date): { fee: number; rate: number; tier: string } {
    const hoursUntilStart = (startTime.getTime() - Date.now()) / (1000 * 60 * 60);

    let rate: number;
    let tier: string;

    if (hoursUntilStart > 48) {
      rate = CANCELLATION_FEE_RATES.MORE_THAN_48H;
      tier = 'MORE_THAN_48H';
    } else if (hoursUntilStart > 24) {
      rate = CANCELLATION_FEE_RATES.BETWEEN_24_48H;
      tier = 'BETWEEN_24_48H';
    } else if (hoursUntilStart > 6) {
      rate = CANCELLATION_FEE_RATES.LESS_THAN_24H;
      tier = 'LESS_THAN_24H';
    } else if (hoursUntilStart > 0) {
      rate = CANCELLATION_FEE_RATES.LESS_THAN_6H;
      tier = 'LESS_THAN_6H';
    } else {
      rate = CANCELLATION_FEE_RATES.NO_SHOW;
      tier = 'NO_SHOW';
    }

    return {
      fee: Math.round(bookingAmount * rate),
      rate,
      tier,
    };
  }

  async getInvoice(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            escort: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Payment tidak ditemukan');
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const isOwner = payment.booking.clientId === userId || payment.booking.escortId === userId;
    if (!isOwner && !isAdmin) throw new ForbiddenException('Akses ditolak');

    const durationHours =
      (new Date(payment.booking.endTime).getTime() - new Date(payment.booking.startTime).getTime()) / (1000 * 60 * 60);

    return {
      invoiceNumber: `INV-${payment.createdAt.getFullYear()}${String(payment.createdAt.getMonth() + 1).padStart(2, '0')}-${payment.id.slice(0, 8).toUpperCase()}`,
      issuedAt: payment.createdAt,
      paidAt: payment.paidAt,
      status: payment.status,
      client: {
        name: `${payment.booking.client.firstName} ${payment.booking.client.lastName}`,
        email: payment.booking.client.email,
      },
      escort: {
        name: `${payment.booking.escort.firstName} ${payment.booking.escort.lastName}`,
      },
      booking: {
        id: payment.booking.id,
        serviceType: payment.booking.serviceType,
        startTime: payment.booking.startTime,
        endTime: payment.booking.endTime,
        location: payment.booking.location,
        durationHours,
      },
      breakdown: {
        serviceAmount: payment.amount.toNumber(),
        platformFee: payment.platformFee.toNumber(),
        escortPayout: payment.escortPayout.toNumber(),
        tipAmount: payment.tipAmount?.toNumber() || 0,
        totalPaid: payment.amount.toNumber() + (payment.tipAmount?.toNumber() || 0),
      },
      paymentMethod: payment.method,
      paymentGatewayRef: payment.paymentGatewayRef,
    };
  }

  async processRefund(paymentId: string, options: { reason: string; adminId: string }) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            client: true,
            escort: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'ESCROW' && payment.status !== 'RELEASED') {
      throw new BadRequestException('Only escrow or released payments can be refunded');
    }

    if (!payment.forfeited) {
      throw new BadRequestException('Payment is not marked as forfeited');
    }

    try {
      // Process refund through Xendit
      let refundResponse = null;
      if (payment.paymentGatewayRef && payment.paidAt) {
        try {
          refundResponse = await this.xendit.processRefund({
            invoiceId: payment.paymentGatewayRef,
            amount: payment.amount.toNumber(),
            reason: options.reason,
          });
        } catch (error) {
          this.logger.error('Xendit refund failed:', error);
          // Continue with database update even if gateway refund fails
        }
      }

      // Update payment status to REFUNDED
      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
        },
      });

      // Log the refund processing
      this.logger.log(
        `Refund processed for payment ${paymentId} by admin ${options.adminId}. ` +
        `Amount: ${payment.amount}. Xendit response: ${JSON.stringify(refundResponse)}`
      );

      return {
        payment: updatedPayment,
        refundResponse,
      };
    } catch (error) {
      this.logger.error('Failed to process refund:', error);
      throw new BadRequestException('Failed to process refund');
    }
  }
}
