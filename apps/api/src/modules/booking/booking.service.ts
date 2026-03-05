import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';
import { NotificationService } from '@modules/notification/notification.service';
import { CreateBookingDto, BookingQueryDto, RescheduleBookingDto, TipBookingDto } from './dto/booking.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(clientId: string, dto: CreateBookingDto) {
    // Validate escort exists and is active
    const escort = await this.prisma.user.findFirst({
      where: { id: dto.escortId, role: 'ESCORT', isActive: true },
      include: { escortProfile: true },
    });

    if (!escort || !escort.escortProfile?.isApproved) {
      throw new BadRequestException('Escort tidak tersedia atau belum terverifikasi');
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

    return this.prisma.booking.create({
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
  }

  async findAll(userId: string, role: string, query: BookingQueryDto) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {
      ...(role === 'ESCORT' ? { escortId: userId } : { clientId: userId }),
      ...(status ? { status: status as any } : {}),
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

  async findOne(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, profilePhoto: true } },
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
        reviews: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan');
    }

    if (booking.clientId !== userId && booking.escortId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke booking ini');
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
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (booking.clientId !== userId && booking.escortId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke booking ini');
    }
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new BadRequestException('Booking tidak dapat dibatalkan pada status ini');
    }

    // Check cancellation policy (< 24h before start = penalty)
    const hoursUntilStart = (booking.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
    const lateCancellation = hoursUntilStart < 24;

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancelReason: reason || (lateCancellation ? 'Late cancellation (penalty may apply)' : 'Cancelled by user'),
      },
    });

    await this.notificationService.notifyBookingStatus(bookingId, 'CANCELLED');

    return updated;
  }

  async checkin(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (booking.clientId !== userId && booking.escortId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses');
    }
    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException('Booking harus dalam status CONFIRMED untuk check-in');
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
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (booking.clientId !== userId && booking.escortId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses');
    }
    if (booking.status !== 'ONGOING') {
      throw new BadRequestException('Booking harus dalam status ONGOING untuk check-out');
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'COMPLETED',
        checkoutAt: new Date(),
      },
    });

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

    return this.prisma.booking.update({
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
}
