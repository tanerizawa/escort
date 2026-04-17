import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/config/prisma.service';
import { RedisService } from '@/config/redis.service';
import { NotificationService } from '@modules/notification/notification.service';
import { EncryptionService } from '@common/services/encryption.service';
import { CreateBookingDto, BookingQueryDto, RescheduleBookingDto, TipBookingDto } from './dto/booking.dto';
import { Prisma } from '@prisma/client';
import { PLATFORM_FEE_RATE } from '@common/constants/platform.constants';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notificationService: NotificationService,
    private readonly encryption: EncryptionService,
  ) {}

  /**
   * Read commission rate from Redis (admin-configurable), fallback to constant.
   */
  private async getCommissionRate(): Promise<number> {
    const redisVal = await this.redis.get('platform:commission_rate');
    return redisVal ? Number(redisVal) / 100 : PLATFORM_FEE_RATE;
  }

  /**
   * Read cancellation fee config from Redis, fallback to defaults.
   */
  private async getCancellationFees(): Promise<{ hoursBeforeStart: number; feePercent: number }[]> {
    const redisVal = await this.redis.getJSON<{ hoursBeforeStart: number; feePercent: number }[]>('platform:cancellation_fees');
    return redisVal || [
      { hoursBeforeStart: 48, feePercent: 0 },
      { hoursBeforeStart: 24, feePercent: 25 },
      { hoursBeforeStart: 12, feePercent: 50 },
      { hoursBeforeStart: 6, feePercent: 75 },
      { hoursBeforeStart: 0, feePercent: 100 },
    ];
  }

  async create(clientId: string, dto: CreateBookingDto) {
    // Resolve escort - accept both user ID and escort profile ID
    let escort = await this.prisma.user.findFirst({
      where: { id: dto.escortId, role: 'ESCORT', isActive: true },
      include: { escortProfile: true },
    });

    // Fallback: try looking up by escort profile ID
    if (!escort) {
      const profile = await this.prisma.escortProfile.findUnique({
        where: { id: dto.escortId },
        include: { user: true },
      });
      if (profile?.user && profile.user.role === 'ESCORT' && profile.user.isActive) {
        escort = await this.prisma.user.findFirst({
          where: { id: profile.userId, role: 'ESCORT', isActive: true },
          include: { escortProfile: true },
        });
        // Override dto escortId with the resolved user ID
        dto.escortId = profile.userId;
      }
    }

    if (!escort || !escort.escortProfile?.isApproved) {
      throw new BadRequestException('Escort tidak tersedia atau belum terverifikasi');
    }

    if (!escort.escortProfile.hourlyRate || escort.escortProfile.hourlyRate.toNumber() <= 0) {
      throw new BadRequestException('Escort belum mengatur tarif per jam. Silakan hubungi escort untuk mengupdate profil.');
    }

    if (clientId === dto.escortId) {
      throw new BadRequestException('Tidak dapat membooking diri sendiri');
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('End time harus setelah start time');
    }

    if (startTime <= new Date()) {
      throw new BadRequestException('Start time harus di masa depan');
    }

    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours < 3) {
      throw new BadRequestException('Minimum durasi booking adalah 3 jam');
    }

    // Check escort availability (no overlapping bookings)
    const overlap = await this.prisma.booking.findFirst({
      where: {
        escortId: dto.escortId,
        status: { in: ['PENDING', 'CONFIRMED', 'ONGOING'] },
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } },
        ],
      },
    });

    if (overlap) {
      throw new BadRequestException('Escort tidak tersedia pada waktu yang dipilih');
    }

    // Calculate total amount
    const hourlyRate = escort.escortProfile.hourlyRate;
    const totalAmount = new Prisma.Decimal(hourlyRate.toNumber() * durationHours);

    const booking = await this.prisma.booking.create({
      data: {
        clientId,
        escortId: dto.escortId,
        serviceType: dto.serviceType,
        startTime,
        endTime,
        location: dto.location,
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
        specialRequests: dto.specialRequests,
        totalAmount,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, profilePhoto: true } },
        escort: { select: { id: true, firstName: true, lastName: true, profilePhoto: true } },
      },
    });

    // Notify escort about new booking request
    this.notificationService.notifyBookingStatus(booking.id, 'PENDING').catch(() => {});

    return booking;
  }

  async findAll(userId: string, role: string, query: BookingQueryDto) {
    const { page: rawPage = 1, limit: rawLimit = 10, status, startDate, endDate } = query;
    const page = Math.max(1, Number(rawPage) || 1);
    const limit = Math.max(1, Math.min(100, Number(rawLimit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {
      ...(['ADMIN', 'SUPER_ADMIN'].includes(role) ? {} : role === 'ESCORT' ? { escortId: userId } : { clientId: userId }),
      ...(status ? { status: status as any } : {}),
      ...(startDate || endDate ? {
        startTime: {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate) } : {}),
        },
      } : {}),
    };

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, firstName: true, lastName: true, profilePhoto: true } },
          escort: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhoto: true,
              escortProfile: { select: { tier: true } },
            },
          },
          payment: { select: { id: true, status: true, amount: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find the active booking for transaction lock mode.
   * Returns booking in CONFIRMED (with ESCROW payment) or ONGOING status.
   * Includes partner info, payment, and last 5 chat messages.
   */
  async findActive(userId: string, role: string) {
    const isClient = role === 'CLIENT';
    const whereClause = isClient
      ? { clientId: userId }
      : { escortId: userId };

    const includeFields = {
      client: {
        select: {
          id: true, firstName: true, lastName: true,
          profilePhoto: true, isVerified: true, phone: true,
        },
      },
      escort: {
        select: {
          id: true, firstName: true, lastName: true,
          profilePhoto: true,
          escortProfile: { select: { tier: true, ratingAvg: true, totalReviews: true } },
        },
      },
      payment: true,
      messages: {
        orderBy: { createdAt: 'desc' as const },
        take: 10,
        select: {
          id: true, senderId: true, content: true,
          type: true, createdAt: true,
        },
      },
    };

    // Fetch ALL active bookings (ONGOING first, then CONFIRMED+ESCROW)
    const [ongoingBookings, confirmedBookings] = await Promise.all([
      this.prisma.booking.findMany({
        where: { ...whereClause, status: 'ONGOING' },
        include: includeFields,
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.booking.findMany({
        where: {
          ...whereClause,
          status: 'CONFIRMED',
          payment: { status: 'ESCROW' },
        },
        include: includeFields,
        orderBy: { startTime: 'asc' },
      }),
    ]);

    const allActive = [...ongoingBookings, ...confirmedBookings];

    if (allActive.length === 0) {
      return { active: false, booking: null, bookings: [], totalActive: 0 };
    }

    // Decrypt messages & reverse to chronological order
    const processBooking = (b: typeof allActive[0]) => {
      const decryptedMessages = [...b.messages]
        .map(m => ({ ...m, content: this.decryptSafe(m.content) }))
        .reverse();
      return {
        ...b,
        messages: decryptedMessages,
        phase: b.status === 'ONGOING' ? 'ONGOING' : 'READY_CHECKIN',
      };
    };

    const processedBookings = allActive.map(processBooking);
    const primary = processedBookings[0];

    return {
      active: true,
      booking: primary, // primary (first ONGOING, or first CONFIRMED+ESCROW)
      bookings: processedBookings, // all active bookings
      totalActive: processedBookings.length,
      phase: primary.phase,
    };
  }

  private decryptSafe(content: string): string {
    try {
      return this.encryption.decrypt(content);
    } catch {
      return content;
    }
  }

  async findOne(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: {
          select: {
            id: true, firstName: true, lastName: true, email: true, phone: true,
            profilePhoto: true, isVerified: true, isActive: true, createdAt: true,
            _count: { select: { clientBookings: true } },
          },
        },
        escort: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            escortProfile: { select: { tier: true, ratingAvg: true, languages: true } },
          },
        },
        payment: true,
        reviews: {
          include: {
            reviewer: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan');
    }

    // Check access: client, escort, or admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const isParticipant = booking.clientId === userId || booking.escortId === userId;

    if (!isParticipant && !isAdmin) {
      // Fallback: check if escortId is a profile ID
      const profile = await this.prisma.escortProfile.findUnique({
        where: { id: booking.escortId },
        select: { userId: true },
      });
      if (profile?.userId !== userId) {
        throw new ForbiddenException('Anda tidak memiliki akses ke booking ini');
      }
    }

    return booking;
  }

  async accept(escortId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (booking.escortId !== escortId) throw new ForbiddenException('Bukan booking Anda');
    if (booking.status !== 'PENDING') throw new BadRequestException('Booking tidak dalam status PENDING');

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
    });

    // Auto-create Payment record
    const totalAmount = booking.totalAmount;
    const commissionRate = await this.getCommissionRate();
    const platformFee = totalAmount.mul(new Prisma.Decimal(commissionRate));
    const escortPayout = totalAmount.sub(platformFee);

    await this.prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        amount: totalAmount,
        method: 'PLATFORM',
        status: 'PENDING',
        platformFee,
        escortPayout,
      },
      update: {}, // Don't overwrite if already exists
    });

    // Notify client
    await this.notificationService.notifyBookingStatus(bookingId, 'CONFIRMED');

    return updated;
  }

  async reject(escortId: string, bookingId: string, reason?: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (booking.escortId !== escortId) throw new ForbiddenException('Bukan booking Anda');
    if (booking.status !== 'PENDING') throw new BadRequestException('Booking tidak dalam status PENDING');

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: escortId,
        cancelReason: reason || 'Ditolak oleh escort',
      },
    });

    await this.notificationService.notifyBookingStatus(bookingId, 'CANCELLED');

    return updated;
  }

  async cancel(userId: string, bookingId: string, reason?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        client: { select: { firstName: true, lastName: true } },
      },
    });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (booking.clientId !== userId && booking.escortId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke booking ini');
    }
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new BadRequestException('Booking tidak dapat dibatalkan pada status ini');
    }

    // Escort is not allowed to cancel; they should recommend replacement instead
    if (booking.escortId === userId) {
      throw new ForbiddenException('Escort tidak diperkenankan membatalkan booking. Gunakan fitur rekomendasikan pengganti.');
    }

    // Only client may cancel here
    // Calculate cancellation fee based on configurable policy
    const hoursUntilStart = (booking.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
    const cancellationFees = await this.getCancellationFees();

    // Sort by hoursBeforeStart descending to find the matching tier
    const sortedFees = [...cancellationFees].sort((a, b) => b.hoursBeforeStart - a.hoursBeforeStart);
    let feePercent = 0;
    for (const tier of sortedFees) {
      if (hoursUntilStart < tier.hoursBeforeStart) {
        feePercent = tier.feePercent;
      }
    }
    // If past start time, 100% fee
    if (hoursUntilStart <= 0) feePercent = 100;

    const cancellationFeeRate = feePercent / 100;
    const lateCancellation = feePercent > 0;

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancelReason: reason || (lateCancellation
          ? `Pembatalan terlambat — biaya pembatalan ${feePercent}%`
          : 'Dibatalkan oleh client'),
      },
    });

    // If a payment exists, calculate refund minus cancellation fee
    if (booking.payment) {
      const paymentAmount = booking.payment.amount.toNumber();
      const cancellationFeeAmount = Math.round(paymentAmount * cancellationFeeRate);
      const refundAmount = paymentAmount - cancellationFeeAmount;

      await this.prisma.payment.update({
        where: { id: booking.payment.id },
        data: { forfeited: cancellationFeeRate >= 1.0 },
      });

      const claim = await this.prisma.refundClaim.create({ data: {
        paymentId: booking.payment.id,
        bookingId: booking.id,
        requesterId: userId,
        reason: reason || (lateCancellation
          ? `Pembatalan ${hoursUntilStart.toFixed(1)} jam sebelum jadwal`
          : 'Dibatalkan oleh client'),
        evidence: {
          cancellationFeePercent: feePercent,
          cancellationFeeAmount,
          refundAmount,
          hoursBeforeStart: Math.round(hoursUntilStart * 10) / 10,
        },
      }});

      // Notify admins about the new refund claim
      const clientName = `${booking.client?.firstName || ''} ${booking.client?.lastName || ''}`.trim();
      const feeInfo = cancellationFeeAmount > 0
        ? ` (biaya pembatalan ${feePercent}%: Rp ${cancellationFeeAmount.toLocaleString('id-ID')}, refund: Rp ${refundAmount.toLocaleString('id-ID')})`
        : '';
      await this.notificationService.notifyAdmins(
        'Refund Claim Baru',
        `${clientName} membatalkan booking ${booking.id.substring(0, 8).toUpperCase()}${feeInfo}`,
        'PAYMENT',
        { claimId: claim.id, bookingId: booking.id, link: '/finance' },
      );

      this.logger.log(`Booking ${bookingId} cancelled: fee=${feePercent}%, feeAmount=${cancellationFeeAmount}, refund=${refundAmount}`);
    }

    await this.notificationService.notifyBookingStatus(bookingId, 'CANCELLED');

    return updated;
  }

  async recommendReplacement(escortId: string, bookingId: string, note?: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (booking.escortId !== escortId) throw new ForbiddenException('Bukan booking Anda');
    if (booking.status !== 'CONFIRMED') throw new BadRequestException('Hanya booking CONFIRMED yang bisa meminta pengganti');

    const updated = await this.prisma.booking.update({ where: { id: bookingId }, data: { replacementRequested: true, replacementNote: note } });

    // Notify the client + platform ops so they can find a replacement escort.
    this.notificationService.create(
      booking.clientId,
      'Permintaan pengganti dari escort',
      `Escort Anda meminta pengganti untuk booking ${booking.id}. ${note ? `Catatan: ${note}` : ''}`.trim(),
      'BOOKING',
      { bookingId: booking.id, replacementNote: note },
    ).catch(() => {});
    this.notificationService.notifyAdmins(
      'Permintaan pengganti escort',
      `Escort meminta pengganti untuk booking ${booking.id}.`,
      'BOOKING',
      { link: `/bookings/${booking.id}`, bookingId: booking.id, replacementNote: note },
      { severity: 'WARN' },
    ).catch(() => {});

    return updated;
  }

  async checkin(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (booking.clientId !== userId && booking.escortId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses');
    }
    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException('Booking harus dalam status CONFIRMED untuk check-in');
    }

    // Enforce payment before check-in (min DP 50% or full)
    if (!booking.payment || booking.payment.status !== 'ESCROW') {
      throw new BadRequestException(
        'Client harus menyelesaikan pembayaran (minimal DP 50%) sebelum check-in. Pembayaran belum diterima.',
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'ONGOING',
        checkinAt: new Date(),
      },
    });

    await this.notificationService.notifyBookingStatus(bookingId, 'ONGOING');

    return updated;
  }

  async checkout(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (booking.clientId !== userId && booking.escortId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses');
    }
    if (booking.status !== 'ONGOING') {
      throw new BadRequestException('Booking harus dalam status ONGOING untuk check-out');
    }

    // Verify payment was actually received before completing
    if (!booking.payment || booking.payment.status !== 'ESCROW') {
      throw new BadRequestException(
        'Tidak dapat check-out: pembayaran belum dikonfirmasi oleh payment gateway.',
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'COMPLETED',
        checkoutAt: new Date(),
      },
    });

    // Payment already in ESCROW (confirmed by gateway), no status change needed
    // Escrow will be released by admin after completion

    await this.notificationService.notifyBookingStatus(bookingId, 'COMPLETED');

    return updated;
  }

  async reschedule(userId: string, bookingId: string, dto: RescheduleBookingDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (booking.clientId !== userId && booking.escortId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke booking ini');
    }
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new BadRequestException('Booking tidak dapat di-reschedule pada status ini');
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('End time harus setelah start time');
    }
    if (startTime <= new Date()) {
      throw new BadRequestException('Start time harus di masa depan');
    }

    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours < 3) {
      throw new BadRequestException('Minimum durasi booking adalah 3 jam');
    }

    // Re-check availability (exclude current booking)
    const overlap = await this.prisma.booking.findFirst({
      where: {
        escortId: booking.escortId,
        id: { not: bookingId },
        status: { in: ['PENDING', 'CONFIRMED', 'ONGOING'] },
        OR: [{ startTime: { lt: endTime }, endTime: { gt: startTime } }],
      },
    });

    if (overlap) {
      throw new BadRequestException('Escort tidak tersedia pada waktu baru yang dipilih');
    }

    // Recalculate total if duration changed
    const escort = await this.prisma.user.findUnique({
      where: { id: booking.escortId },
      include: { escortProfile: true },
    });

    const hourlyRate = escort?.escortProfile?.hourlyRate;
    const totalAmount = hourlyRate
      ? new Prisma.Decimal(hourlyRate.toNumber() * durationHours)
      : booking.totalAmount;

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        startTime,
        endTime,
        totalAmount,
        status: 'PENDING', // Reset to pending for re-confirmation
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, profilePhoto: true } },
        escort: { select: { id: true, firstName: true, lastName: true, profilePhoto: true } },
      },
    });

    // Sync payment record if amount changed
    if (totalAmount.toNumber() !== booking.totalAmount.toNumber()) {
      const rescheduleCommRate = await this.getCommissionRate();
      const platformFee = new Prisma.Decimal(totalAmount.toNumber() * rescheduleCommRate);
      const escortPayout = new Prisma.Decimal(totalAmount.toNumber() - platformFee.toNumber());
      await this.prisma.payment.updateMany({
        where: { bookingId, status: 'PENDING' },
        data: { amount: totalAmount, platformFee, escortPayout },
      });
    }

    return updatedBooking;
  }

  async addTip(clientId: string, bookingId: string, dto: TipBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (booking.clientId !== clientId) {
      throw new ForbiddenException('Hanya client yang dapat memberikan tip');
    }
    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException('Tip hanya dapat diberikan untuk booking yang telah selesai');
    }
    if (!booking.payment) {
      throw new BadRequestException('Pembayaran booking tidak ditemukan');
    }
    if (booking.payment.tipAmount && booking.payment.tipAmount.toNumber() > 0) {
      throw new BadRequestException('Anda sudah memberikan tip untuk booking ini');
    }

    const tipAmount = new Prisma.Decimal(dto.amount);

    const updatedPayment = await this.prisma.payment.update({
      where: { id: booking.payment.id },
      data: {
        tipAmount,
        escortPayout: booking.payment.escortPayout.add(tipAmount),
      },
    });

    return {
      message: 'Tip berhasil diberikan',
      tipAmount: updatedPayment.tipAmount,
      totalEscortPayout: updatedPayment.escortPayout,
    };
  }

  /**
   * Auto-expire PENDING bookings older than 24 hours.
   * Runs every hour to prevent stale PENDING bookings from blocking time slots.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async expireStalePendingBookings() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const staleBookings = await this.prisma.booking.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: cutoff },
      },
      select: { id: true },
    });

    if (staleBookings.length === 0) return;

    const result = await this.prisma.booking.updateMany({
      where: {
        id: { in: staleBookings.map(b => b.id) },
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: 'Otomatis dibatalkan — tidak direspon dalam 24 jam',
      },
    });

    if (result.count > 0) {
      this.logger.log(`Auto-expired ${result.count} stale PENDING booking(s)`);

      // Notify clients about expired bookings
      for (const booking of staleBookings) {
        this.notificationService.notifyBookingStatus(booking.id, 'CANCELLED').catch(() => {});
      }
    }
  }

  /**
   * Auto-expire CONFIRMED bookings where payment is still PENDING after 72 hours.
   * Runs every 6 hours to free up escort availability.
   */
  @Cron('0 */6 * * *')
  async expireUnpaidConfirmedBookings() {
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);

    const unpaidBookings = await this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        updatedAt: { lt: cutoff },
        payment: { status: 'PENDING' },
      },
      select: { id: true },
    });

    if (unpaidBookings.length === 0) return;

    const result = await this.prisma.booking.updateMany({
      where: {
        id: { in: unpaidBookings.map(b => b.id) },
        status: 'CONFIRMED',
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: 'Otomatis dibatalkan — pembayaran tidak diterima dalam 72 jam',
      },
    });

    if (result.count > 0) {
      this.logger.log(`Auto-expired ${result.count} unpaid CONFIRMED booking(s)`);

      for (const booking of unpaidBookings) {
        this.notificationService.notifyBookingStatus(booking.id, 'CANCELLED').catch(() => {});
      }
    }
  }

  /**
   * Cleanup expired OTP keys from Redis.
   * Runs daily at 3 AM — scans for otp:* keys with no TTL remaining.
   */
  @Cron('0 3 * * *')
  async cleanupStaleOtps() {
    try {
      const keys = await this.redis.keys('otp:*');
      if (keys.length > 0) {
        const client = this.redis.getClient();
        let cleaned = 0;
        for (const key of keys) {
          const ttl = await client.ttl(key);
          if (ttl <= 0) {
            await this.redis.del(key);
            cleaned++;
          }
        }
        if (cleaned > 0) {
          this.logger.log(`Cleaned up ${cleaned} stale OTP key(s) from Redis`);
        }
      }
    } catch (error: unknown) {
      this.logger.warn(`OTP cleanup skipped: ${(error as Error).message}`);
    }
  }
}
