import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';
import { CreatePaymentDto, PaymentQueryDto, WithdrawRequestDto, RefundPaymentDto, WebhookPayloadDto } from './dto/payment.dto';
import { Prisma } from '@prisma/client';

const PLATFORM_FEE_RATE = 0.20; // 20% commission
const CANCELLATION_FEE_RATES = {
  MORE_THAN_48H: 0,
  BETWEEN_24_48H: 0.25,
  LESS_THAN_24H: 0.50,
  LESS_THAN_6H: 0.75,
  NO_SHOW: 1.0,
};

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreatePaymentDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { payment: true },
    });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (booking.clientId !== userId) throw new ForbiddenException('Bukan booking Anda');
    if (booking.payment) throw new BadRequestException('Payment sudah ada untuk booking ini');
    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException('Booking harus dalam status CONFIRMED untuk pembayaran');
    }

    const amount = booking.totalAmount;
    const platformFee = new Prisma.Decimal(amount.toNumber() * PLATFORM_FEE_RATE);
    const escortPayout = new Prisma.Decimal(amount.toNumber() * (1 - PLATFORM_FEE_RATE));
    const tipAmount = dto.tipAmount ? new Prisma.Decimal(dto.tipAmount) : null;

    // Create payment record (in ESCROW — released after completion)
    const payment = await this.prisma.payment.create({
      data: {
        bookingId: dto.bookingId,
        amount,
        method: dto.method,
        status: 'ESCROW',
        platformFee,
        escortPayout,
        tipAmount,
        paidAt: new Date(),
        // paymentGatewayRef will be set by payment gateway callback
      },
    });

    // TODO: Integrate with Midtrans/Xendit payment gateway
    // const gatewayResponse = await midtrans.createTransaction(...)

    return payment;
  }

  async findAll(userId: string, role: string, query: PaymentQueryDto) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {
      booking: role === 'ESCORT' ? { escortId: userId } : { clientId: userId },
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

    const isOwner =
      payment.booking.clientId === userId || payment.booking.escortId === userId;
    if (!isOwner) throw new ForbiddenException('Akses ditolak');

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
    const earnings = await this.getEarningsSummary(escortId);

    if (dto.amount > earnings.pendingPayout) {
      throw new BadRequestException(
        `Saldo tersedia: Rp ${earnings.pendingPayout.toLocaleString('id-ID')}. Withdrawal melebihi saldo.`,
      );
    }

    // TODO: Process withdrawal via Xendit disbursement API
    // const disbursement = await xendit.createDisbursement({...})

    return {
      message: 'Permintaan withdrawal berhasil diajukan',
      amount: dto.amount,
      bankName: dto.bankName,
      bankAccount: dto.bankAccount,
      estimatedArrival: '1-3 hari kerja',
    };
  }

  async releaseEscrow(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });

    if (!payment) throw new NotFoundException('Payment tidak ditemukan');
    if (payment.status !== 'ESCROW') {
      throw new BadRequestException('Payment harus dalam status ESCROW untuk di-release');
    }
    if (payment.booking.status !== 'COMPLETED') {
      throw new BadRequestException('Booking harus COMPLETED sebelum escrow di-release');
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
      },
    });
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

    // TODO: Process refund via payment gateway
    // await midtrans.refund(payment.paymentGatewayRef, refundAmount)

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
      },
    });
  }

  async handleWebhook(payload: WebhookPayloadDto) {
    // Find payment by gateway reference
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          { paymentGatewayRef: payload.transactionId },
          { id: payload.transactionId },
        ],
      },
    });

    if (!payment) {
      return { status: 'ignored', message: 'Payment not found' };
    }

    const statusMap: Record<string, string> = {
      settlement: 'ESCROW',
      capture: 'ESCROW',
      pending: 'PENDING',
      deny: 'FAILED',
      cancel: 'FAILED',
      expire: 'FAILED',
      refund: 'REFUNDED',
    };

    const newStatus = statusMap[payload.status.toLowerCase()];
    if (!newStatus) {
      return { status: 'ignored', message: `Unknown status: ${payload.status}` };
    }

    const updateData: any = { status: newStatus };
    if (newStatus === 'ESCROW') updateData.paidAt = new Date();
    if (newStatus === 'REFUNDED') updateData.refundedAt = new Date();
    if (payload.externalRef) updateData.paymentGatewayRef = payload.externalRef;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: updateData,
    });

    return { status: 'ok', paymentId: payment.id, newStatus };
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
    const isOwner = payment.booking.clientId === userId || payment.booking.escortId === userId;
    if (!isOwner) throw new ForbiddenException('Akses ditolak');

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
}
