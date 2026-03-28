import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';
import { RedisService } from '@/config/redis.service';
import { EncryptionService } from '@/common/services/encryption.service';
import { AuditService } from '@/common/services/audit.service';
import { NotificationService } from '@modules/notification/notification.service';
import { EmailService } from '@modules/notification/email.service';
import { Prisma } from '@prisma/client';

const CONFIG_KEYS = {
  COMMISSION_RATE: 'platform:commission_rate',
  CANCELLATION_FEES: 'platform:cancellation_fees',
  MIN_BOOKING_HOURS: 'platform:min_booking_hours',
  MAX_BOOKING_HOURS: 'platform:max_booking_hours',
  PLATFORM_NAME: 'platform:name',
  SUPPORT_EMAIL: 'platform:support_email',
};

const DEFAULT_CONFIG = {
  commissionRate: 20,
  cancellationFees: [
    { hoursBeforeStart: 48, feePercent: 0 },
    { hoursBeforeStart: 24, feePercent: 25 },
    { hoursBeforeStart: 12, feePercent: 50 },
    { hoursBeforeStart: 6, feePercent: 75 },
    { hoursBeforeStart: 0, feePercent: 100 },
  ],
  minBookingHours: 2,
  maxBookingHours: 12,
  platformName: 'ARETON.id',
  supportEmail: 'support@areton.id',
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
  ) {}

  private decryptSafe(content: string): string {
    try {
      return this.encryption.decrypt(content);
    } catch {
      return content;
    }
  }

  async getPlatformStats() {
    const [
      totalUsers,
      totalEscorts,
      activeBookings,
      completedBookings,
      pendingVerifications,
      openIncidents,
      revenueResult,
      pendingKyc,
      pendingCertifications,
      pendingRefundClaims,
      pendingWithdrawals,
      disputedBookings,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'ESCORT' } }),
      this.prisma.booking.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'ONGOING'] } } }),
      this.prisma.booking.count({ where: { status: 'COMPLETED' } }),
      this.prisma.escortProfile.count({ where: { isApproved: false } }),
      this.prisma.incidentReport.count({ where: { resolutionStatus: 'OPEN' } }),
      this.prisma.payment.aggregate({
        where: { status: { in: ['ESCROW', 'RELEASED'] } },
        _sum: { amount: true, platformFee: true },
      }),
      this.prisma.kycVerification.count({ where: { status: 'PENDING' } }),
      this.prisma.certification.count({ where: { isVerified: false } }),
      this.prisma.refundClaim.count({ where: { status: 'PENDING' } }),
      this.prisma.withdrawal.count({ where: { status: 'PENDING' } }),
      this.prisma.booking.count({ where: { status: 'DISPUTED' } }),
    ]);

    return {
      totalUsers,
      totalEscorts,
      activeBookings,
      completedBookings,
      pendingVerifications,
      openIncidents,
      totalRevenue: revenueResult._sum.amount?.toNumber() || 0,
      totalPlatformFee: revenueResult._sum.platformFee?.toNumber() || 0,
      pendingKyc,
      pendingCertifications,
      pendingRefundClaims,
      pendingWithdrawals,
      disputedBookings,
    };
  }

  // ── User Detail (admin) ──────────────────────────────

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true,
        isActive: true,
        profilePhoto: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        escortProfile: {
          include: {
            certifications: true,
          },
        },
        clientBookings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            serviceType: true,
            status: true,
            startTime: true,
            endTime: true,
            totalAmount: true,
            location: true,
            escort: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        escortBookings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            serviceType: true,
            status: true,
            startTime: true,
            endTime: true,
            totalAmount: true,
            location: true,
            client: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        givenReviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, rating: true, comment: true, createdAt: true },
        },
        receivedReviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, rating: true, comment: true, createdAt: true },
        },
        incidentReports: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, type: true, severity: true, resolutionStatus: true, createdAt: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User tidak ditemukan');

    // Get booking stats
    const [totalBookings, completedBookings, totalSpent, totalEarned] = await Promise.all([
      this.prisma.booking.count({
        where: user.role === 'ESCORT'
          ? { escortId: userId }
          : { clientId: userId },
      }),
      this.prisma.booking.count({
        where: {
          ...(user.role === 'ESCORT' ? { escortId: userId } : { clientId: userId }),
          status: 'COMPLETED',
        },
      }),
      user.role === 'CLIENT'
        ? this.prisma.payment.aggregate({
            where: { booking: { clientId: userId }, status: { in: ['ESCROW', 'RELEASED'] } },
            _sum: { amount: true },
          })
        : null,
      user.role === 'ESCORT'
        ? this.prisma.payment.aggregate({
            where: { booking: { escortId: userId }, status: 'RELEASED' },
            _sum: { escortPayout: true },
          })
        : null,
    ]);

    return {
      ...user,
      stats: {
        totalBookings,
        completedBookings,
        totalSpent: totalSpent?._sum?.amount?.toNumber() || 0,
        totalEarned: totalEarned?._sum?.escortPayout?.toNumber() || 0,
      },
    };
  }

  // ── Booking Monitoring ────────────────────────────────

  async getActiveBookingsMonitor() {
    const bookings = await this.prisma.booking.findMany({
      where: { status: { in: ['CONFIRMED', 'ONGOING'] } },
      orderBy: { startTime: 'asc' },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, profilePhoto: true, phone: true } },
        escort: { select: { id: true, firstName: true, lastName: true, profilePhoto: true, phone: true } },
        payment: { select: { status: true, amount: true, platformFee: true, escortPayout: true } },
        incidents: { where: { resolutionStatus: 'OPEN' }, select: { id: true, type: true, severity: true, createdAt: true } },
      },
    });

    // Enrich with live GPS data from Redis
    const enriched = await Promise.all(
      bookings.map(async (booking) => {
        const [clientLoc, escortLoc, lateCheck] = await Promise.all([
          this.redis.getJSON<{ lat: number; lng: number; accuracy?: number; timestamp: number }>(`location:${booking.id}:${booking.clientId}`),
          this.redis.getJSON<{ lat: number; lng: number; accuracy?: number; timestamp: number }>(`location:${booking.id}:${booking.escortId}`),
          this.getLateStatus(booking),
        ]);

        // Also fetch general ping location as fallback
        const [clientPing, escortPing] = await Promise.all([
          !clientLoc ? this.redis.getJSON<{ lat: number; lng: number; accuracy?: number; timestamp: number }>(`user_location:${booking.clientId}`) : null,
          !escortLoc ? this.redis.getJSON<{ lat: number; lng: number; accuracy?: number; timestamp: number }>(`user_location:${booking.escortId}`) : null,
        ]);

        const clientLocation = clientLoc || clientPing || null;
        const escortLocation = escortLoc || escortPing || null;

        // Calculate distance between participants
        let distance: number | null = null;
        if (clientLocation && escortLocation) {
          distance = this.haversineDistance(
            clientLocation.lat, clientLocation.lng,
            escortLocation.lat, escortLocation.lng,
          );
        }

        // Geofence check (distance from booking location)
        let clientGeofence: number | null = null;
        let escortGeofence: number | null = null;
        if (booking.locationLat && booking.locationLng) {
          if (clientLocation) {
            clientGeofence = this.haversineDistance(clientLocation.lat, clientLocation.lng, booking.locationLat, booking.locationLng);
          }
          if (escortLocation) {
            escortGeofence = this.haversineDistance(escortLocation.lat, escortLocation.lng, booking.locationLat, booking.locationLng);
          }
        }

        return {
          id: booking.id,
          status: booking.status,
          serviceType: booking.serviceType,
          startTime: booking.startTime,
          endTime: booking.endTime,
          location: booking.location,
          locationLat: booking.locationLat,
          locationLng: booking.locationLng,
          checkinAt: booking.checkinAt,
          checkoutAt: booking.checkoutAt,
          totalAmount: booking.totalAmount,
          client: booking.client,
          escort: booking.escort,
          payment: booking.payment,
          incidents: booking.incidents,
          tracking: {
            clientLocation,
            escortLocation,
            distanceBetween: distance != null ? Math.round(distance * 100) / 100 : null,
            clientGeofence: clientGeofence != null ? Math.round(clientGeofence * 100) / 100 : null,
            escortGeofence: escortGeofence != null ? Math.round(escortGeofence * 100) / 100 : null,
          },
          alerts: {
            lateStatus: lateCheck,
            hasOpenIncidents: booking.incidents.length > 0,
            hasSOS: booking.incidents.some(i => i.type === 'SOS'),
            geofenceBreach: (clientGeofence != null && clientGeofence > 5) || (escortGeofence != null && escortGeofence > 5),
          },
        };
      }),
    );

    return {
      data: enriched,
      summary: {
        total: enriched.length,
        ongoing: enriched.filter(b => b.status === 'ONGOING').length,
        confirmed: enriched.filter(b => b.status === 'CONFIRMED').length,
        withAlerts: enriched.filter(b => b.alerts.hasOpenIncidents || b.alerts.lateStatus || b.alerts.geofenceBreach).length,
        withSOS: enriched.filter(b => b.alerts.hasSOS).length,
      },
    };
  }

  async getBookingMonitorDetail(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: {
          select: {
            id: true, firstName: true, lastName: true, email: true, phone: true,
            profilePhoto: true, role: true, createdAt: true,
          },
        },
        escort: {
          select: {
            id: true, firstName: true, lastName: true, email: true, phone: true,
            profilePhoto: true, role: true, createdAt: true,
            escortProfile: {
              select: { tier: true, hourlyRate: true, ratingAvg: true, totalBookings: true, totalReviews: true, isApproved: true },
            },
          },
        },
        payment: true,
        reviews: {
          include: {
            reviewer: { select: { firstName: true, lastName: true } },
          },
        },
        incidents: {
          orderBy: { createdAt: 'desc' },
          include: {
            reporter: { select: { firstName: true, lastName: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, senderId: true, content: true, type: true, readAt: true, createdAt: true },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');

    // Decrypt chat messages
    if (booking.messages) {
      booking.messages = booking.messages.map((msg: any) => ({
        ...msg,
        content: this.decryptSafe(msg.content),
      }));
    }

    // Get live tracking data
    const [clientLoc, escortLoc] = await Promise.all([
      this.redis.getJSON<{ lat: number; lng: number; accuracy?: number; timestamp: number }>(`location:${bookingId}:${booking.clientId}`),
      this.redis.getJSON<{ lat: number; lng: number; accuracy?: number; timestamp: number }>(`location:${bookingId}:${booking.escortId}`),
    ]);

    // Get location history
    const redisClient = this.redis.getClient();
    const [clientHistoryRaw, escortHistoryRaw] = await Promise.all([
      redisClient.lrange(`location_history:${bookingId}:${booking.clientId}`, 0, -1),
      redisClient.lrange(`location_history:${bookingId}:${booking.escortId}`, 0, -1),
    ]);

    const clientHistory = clientHistoryRaw.map((h: string) => JSON.parse(h));
    const escortHistory = escortHistoryRaw.map((h: string) => JSON.parse(h));

    // Calculate distance
    let distanceBetween: number | null = null;
    if (clientLoc && escortLoc) {
      distanceBetween = Math.round(this.haversineDistance(clientLoc.lat, clientLoc.lng, escortLoc.lat, escortLoc.lng) * 100) / 100;
    }

    // Late status
    const lateStatus = await this.getLateStatus(booking);

    // Timeline events
    const timeline = this.buildTimeline(booking);

    return {
      ...booking,
      tracking: {
        clientLocation: clientLoc,
        escortLocation: escortLoc,
        clientHistory,
        escortHistory,
        distanceBetween,
        bookingLocation: {
          lat: booking.locationLat,
          lng: booking.locationLng,
          address: booking.location,
        },
      },
      lateStatus,
      timeline,
    };
  }

  private async getLateStatus(booking: { status: string; startTime: Date; endTime: Date; checkinAt: Date | null; checkoutAt: Date | null }) {
    const now = new Date();
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);

    if (booking.status === 'CONFIRMED' && now > start && !booking.checkinAt) {
      const mins = Math.floor((now.getTime() - start.getTime()) / 60000);
      return { type: 'LATE_CHECKIN', minutes: mins, severity: mins > 60 ? 'CRITICAL' : mins > 30 ? 'WARNING' : 'INFO' };
    }
    if (booking.status === 'ONGOING' && now > end && !booking.checkoutAt) {
      const mins = Math.floor((now.getTime() - end.getTime()) / 60000);
      return { type: 'OVERTIME', minutes: mins, severity: mins > 60 ? 'CRITICAL' : mins > 30 ? 'WARNING' : 'INFO' };
    }
    return null;
  }

  private buildTimeline(booking: any) {
    const events: { time: string; event: string; type: string }[] = [];
    events.push({ time: booking.createdAt, event: 'Booking dibuat', type: 'INFO' });

    if (booking.status !== 'PENDING') {
      // Was confirmed/accepted at some point
      events.push({ time: booking.updatedAt, event: 'Status: ' + booking.status, type: booking.status === 'CANCELLED' ? 'DANGER' : 'SUCCESS' });
    }
    if (booking.checkinAt) {
      events.push({ time: booking.checkinAt, event: 'Check-in dilakukan', type: 'SUCCESS' });
    }
    if (booking.checkoutAt) {
      events.push({ time: booking.checkoutAt, event: 'Check-out dilakukan', type: 'SUCCESS' });
    }
    if (booking.cancelledAt) {
      events.push({ time: booking.cancelledAt, event: `Dibatalkan: ${booking.cancelReason || '-'}`, type: 'DANGER' });
    }
    if (booking.payment?.paidAt) {
      events.push({ time: booking.payment.paidAt, event: 'Pembayaran diterima', type: 'SUCCESS' });
    }
    if (booking.payment?.releasedAt) {
      events.push({ time: booking.payment.releasedAt, event: 'Payout dirilis ke escort', type: 'SUCCESS' });
    }
    if (booking.payment?.refundedAt) {
      events.push({ time: booking.payment.refundedAt, event: 'Refund diproses', type: 'WARNING' });
    }

    // Incidents
    for (const inc of (booking.incidents || [])) {
      events.push({
        time: inc.createdAt,
        event: `${inc.type === 'SOS' ? '🚨 SOS' : '⚠️ Insiden'}: ${inc.description?.slice(0, 80) || '-'}`,
        type: inc.type === 'SOS' ? 'CRITICAL' : 'WARNING',
      });
      if (inc.resolvedAt) {
        events.push({ time: inc.resolvedAt, event: `Insiden resolved: ${inc.adminNotes?.slice(0, 60) || '-'}`, type: 'SUCCESS' });
      }
    }

    // Sort by time
    events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    return events;
  }

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // ── User Live Location ───────────────────────────────

  async getUserLiveLocation(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, firstName: true, lastName: true },
    });

    if (!user) throw new NotFoundException('User tidak ditemukan');

    // Find active bookings for this user
    const activeBookings = await this.prisma.booking.findMany({
      where: {
        ...(user.role === 'ESCORT' ? { escortId: userId } : { clientId: userId }),
        status: { in: ['CONFIRMED', 'ONGOING'] },
      },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        location: true,
        locationLat: true,
        locationLng: true,
        serviceType: true,
        client: { select: { id: true, firstName: true, lastName: true } },
        escort: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    // Get live locations from Redis for each active booking
    const locations = await Promise.all(
      activeBookings.map(async (booking) => {
        // Get the viewed user's location
        const locationKey = `location:${booking.id}:${userId}`;
        const locationData = await this.redis.getJSON<{
          lat: number;
          lng: number;
          accuracy?: number;
          timestamp: number;
        }>(locationKey);

        // Get the other participant's location too
        const otherUserId = user.role === 'ESCORT' ? booking.client.id : booking.escort.id;
        const otherLocationKey = `location:${booking.id}:${otherUserId}`;
        const otherLocationData = await this.redis.getJSON<{
          lat: number;
          lng: number;
          accuracy?: number;
          timestamp: number;
        }>(otherLocationKey);

        // Get location history for the viewed user
        const historyKey = `location_history:${booking.id}:${userId}`;
        const client = this.redis.getClient();
        const historyRaw = await client.lrange(historyKey, 0, 49);
        const history = historyRaw.map((h: string) => JSON.parse(h));

        return {
          booking: {
            id: booking.id,
            status: booking.status,
            startTime: booking.startTime,
            endTime: booking.endTime,
            location: booking.location,
            locationLat: booking.locationLat,
            locationLng: booking.locationLng,
            serviceType: booking.serviceType,
            client: booking.client,
            escort: booking.escort,
          },
          currentLocation: locationData,
          otherParticipantLocation: otherLocationData,
          locationHistory: history,
        };
      }),
    );

    return {
      userId,
      userName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      activeBookings: locations,
      // General GPS ping (independent of bookings) — stored when user grants GPS permission
      lastKnownLocation: await this.redis.getJSON<{
        lat: number;
        lng: number;
        accuracy?: number;
        timestamp: number;
      }>(`user_location:${userId}`),
    };
  }

  async listUsers(rawPage = 1, rawLimit = 20, role?: string, search?: string) {
    const page = Math.max(1, Number(rawPage) || 1);
    const limit = Math.max(1, Math.min(100, Number(rawLimit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(role ? { role: role as any } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          escortProfile: {
            select: { tier: true, isApproved: true, ratingAvg: true, totalBookings: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPendingEscorts(rawPage = 1) {
    const page = Math.max(1, Number(rawPage) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;

    const [escorts, total] = await Promise.all([
      this.prisma.escortProfile.findMany({
        where: { isApproved: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              profilePhoto: true,
              createdAt: true,
            },
          },
          certifications: true,
        },
      }),
      this.prisma.escortProfile.count({ where: { isApproved: false } }),
    ]);

    return {
      data: escorts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async verifyEscort(escortProfileId: string, approved: boolean, reason?: string) {
    const profile = await this.prisma.escortProfile.findUnique({
      where: { id: escortProfileId },
      include: { user: { select: { id: true, email: true, firstName: true } } },
    });

    if (!profile) throw new NotFoundException('Escort profile tidak ditemukan');

    const updated = await this.prisma.escortProfile.update({
      where: { id: escortProfileId },
      data: {
        isApproved: approved,
        approvedAt: approved ? new Date() : null,
      },
    });

    // Update user verification status
    if (approved) {
      await this.prisma.user.update({
        where: { id: profile.userId },
        data: { isVerified: true },
      });
    }

    // Send notification to escort about approval/rejection
    await this.notificationService.create(
      profile.userId,
      approved ? 'Profil Diverifikasi' : 'Verifikasi Ditolak',
      approved
        ? 'Selamat! Profil escort Anda telah disetujui dan kini aktif.'
        : `Maaf, profil Anda ditolak${reason ? ': ' + reason : '. Silakan perbaiki dan ajukan ulang.'}`,
      'SYSTEM',
    );

    // Send email notification
    if (approved) {
      this.emailService.sendEscortApproved(profile.user.email, {
        name: profile.user.firstName,
      }).catch(() => {});
    }

    await this.audit.log({
      action: approved ? 'ESCORT_APPROVED' : 'ESCORT_REJECTED',
      resource: 'escort_profiles',
      resourceId: escortProfileId,
      details: { approved, reason, escortName: profile.user.firstName },
      severity: 'INFO',
    });

    return {
      ...updated,
      message: approved
        ? `Escort ${profile.user.firstName} berhasil diverifikasi`
        : `Escort ${profile.user.firstName} ditolak${reason ? ': ' + reason : ''}`,
    };
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    await this.audit.log({
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      resource: 'users',
      resourceId: userId,
      details: { userName: `${user.firstName} ${user.lastName}`, isActive },
      severity: 'WARN',
    });

    return updated;
  }

  async listIncidents(rawPage = 1, status?: string, type?: string) {
    const page = Math.max(1, Number(rawPage) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;

    const where: Prisma.IncidentReportWhereInput = {
      ...(status ? { resolutionStatus: status } : {}),
      ...(type ? { type: type as any } : {}),
    };

    const [incidents, total] = await Promise.all([
      this.prisma.incidentReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { firstName: true, lastName: true, email: true } },
          booking: {
            select: {
              id: true,
              serviceType: true,
              client: { select: { firstName: true, lastName: true } },
              escort: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.incidentReport.count({ where }),
    ]);

    return {
      data: incidents,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async resolveIncident(incidentId: string, adminNotes: string) {
    const incident = await this.prisma.incidentReport.findUnique({
      where: { id: incidentId },
    });

    if (!incident) throw new NotFoundException('Incident report tidak ditemukan');

    return this.prisma.incidentReport.update({
      where: { id: incidentId },
      data: {
        resolutionStatus: 'RESOLVED',
        adminNotes,
        resolvedAt: new Date(),
      },
    });
  }

  async updateCommissionConfig(data: {
    commissionRate?: number;
    cancellationFees?: { hoursBeforeStart: number; feePercent: number }[];
    minBookingHours?: number;
    maxBookingHours?: number;
    supportEmail?: string;
  }) {
    const updates: Promise<void>[] = [];

    if (data.commissionRate !== undefined) {
      updates.push(this.redis.set(CONFIG_KEYS.COMMISSION_RATE, String(data.commissionRate)));
    }
    if (data.cancellationFees !== undefined) {
      updates.push(this.redis.setJSON(CONFIG_KEYS.CANCELLATION_FEES, data.cancellationFees));
    }
    if (data.minBookingHours !== undefined) {
      updates.push(this.redis.set(CONFIG_KEYS.MIN_BOOKING_HOURS, String(data.minBookingHours)));
    }
    if (data.maxBookingHours !== undefined) {
      updates.push(this.redis.set(CONFIG_KEYS.MAX_BOOKING_HOURS, String(data.maxBookingHours)));
    }
    if (data.supportEmail !== undefined) {
      updates.push(this.redis.set(CONFIG_KEYS.SUPPORT_EMAIL, data.supportEmail));
    }

    await Promise.all(updates);

    return this.getConfig();
  }

  async getConfig() {
    const [
      commissionRate,
      cancellationFees,
      minBookingHours,
      maxBookingHours,
      supportEmail,
    ] = await Promise.all([
      this.redis.get(CONFIG_KEYS.COMMISSION_RATE),
      this.redis.getJSON<{ hoursBeforeStart: number; feePercent: number }[]>(CONFIG_KEYS.CANCELLATION_FEES),
      this.redis.get(CONFIG_KEYS.MIN_BOOKING_HOURS),
      this.redis.get(CONFIG_KEYS.MAX_BOOKING_HOURS),
      this.redis.get(CONFIG_KEYS.SUPPORT_EMAIL),
    ]);

    return {
      commissionRate: commissionRate ? Number(commissionRate) : DEFAULT_CONFIG.commissionRate,
      cancellationFees: cancellationFees || DEFAULT_CONFIG.cancellationFees,
      minBookingHours: minBookingHours ? Number(minBookingHours) : DEFAULT_CONFIG.minBookingHours,
      maxBookingHours: maxBookingHours ? Number(maxBookingHours) : DEFAULT_CONFIG.maxBookingHours,
      platformName: DEFAULT_CONFIG.platformName,
      supportEmail: supportEmail || DEFAULT_CONFIG.supportEmail,
    };
  }

  async getFinanceSummary(period?: string) {
    const now = new Date();
    let dateFilter: Date;

    switch (period) {
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        dateFilter = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'year':
        dateFilter = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
      default:
        dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const [revenue, payouts, refunds, bookingCount] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          createdAt: { gte: dateFilter },
          status: { in: ['ESCROW', 'RELEASED'] },
        },
        _sum: { amount: true, platformFee: true, escortPayout: true, tipAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          createdAt: { gte: dateFilter },
          status: 'RELEASED',
        },
        _sum: { escortPayout: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          createdAt: { gte: dateFilter },
          status: 'REFUNDED',
        },
        _sum: { amount: true },
      }),
      this.prisma.booking.count({
        where: {
          createdAt: { gte: dateFilter },
          status: 'COMPLETED',
        },
      }),
    ]);

    return {
      period: period || 'month',
      totalRevenue: revenue._sum.amount?.toNumber() || 0,
      platformFee: revenue._sum.platformFee?.toNumber() || 0,
      escortPayouts: revenue._sum.escortPayout?.toNumber() || 0,
      tips: revenue._sum.tipAmount?.toNumber() || 0,
      releasedPayouts: payouts._sum.escortPayout?.toNumber() || 0,
      refunds: refunds._sum.amount?.toNumber() || 0,
      completedBookings: bookingCount,
    };
  }

  // ── Promo Codes (P8-12) ────────────────────────────

  async createPromoCode(data: {
    code: string;
    description?: string;
    discountType: string;
    discountValue: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    usageLimit?: number;
    validFrom: string;
    validUntil: string;
  }) {
    return this.prisma.promoCode.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
      },
    });
  }

  async listPromoCodes(rawPage = 1, isActive?: boolean) {
    const page = Math.max(1, Number(rawPage) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.promoCode.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.promoCode.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updatePromoCode(
    id: string,
    data: { isActive?: boolean; usageLimit?: number; validUntil?: string; maxDiscount?: number },
  ) {
    const existing = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Promo code tidak ditemukan');

    const updateData: any = {};
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;
    if (data.validUntil) updateData.validUntil = new Date(data.validUntil);
    if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount;

    return this.prisma.promoCode.update({
      where: { id },
      data: updateData,
    });
  }

  async deletePromoCode(id: string) {
    const existing = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Promo code tidak ditemukan');

    await this.prisma.promoCode.delete({ where: { id } });
    return { message: 'Promo code berhasil dihapus' };
  }

  async validatePromoCode(code: string, orderAmount: number) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo) return { valid: false, reason: 'Kode promo tidak ditemukan' };
    if (!promo.isActive) return { valid: false, reason: 'Kode promo tidak aktif' };

    const now = new Date();
    if (now < promo.validFrom || now > promo.validUntil) {
      return { valid: false, reason: 'Kode promo sudah expired' };
    }
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      return { valid: false, reason: 'Kuota promo sudah habis' };
    }
    if (promo.minOrderAmount && orderAmount < Number(promo.minOrderAmount)) {
      return { valid: false, reason: `Minimum order Rp ${promo.minOrderAmount}` };
    }

    let discount = 0;
    if (promo.discountType === 'PERCENTAGE') {
      discount = orderAmount * (Number(promo.discountValue) / 100);
      if (promo.maxDiscount && discount > Number(promo.maxDiscount)) {
        discount = Number(promo.maxDiscount);
      }
    } else {
      discount = Number(promo.discountValue);
    }

    return {
      valid: true,
      discount: Math.round(discount),
      promoId: promo.id,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
    };
  }

  async applyPromoCode(code: string) {
    await this.prisma.promoCode.update({
      where: { code: code.toUpperCase() },
      data: { usageCount: { increment: 1 } },
    });
  }

  // ── Certifications ──────────────────────────────────

  async getPendingCertifications(page = 1) {
    const limit = 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.certification.findMany({
        where: { isVerified: false },
        include: {
          escort: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true, profilePhoto: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.certification.count({ where: { isVerified: false } }),
    ]);

    return {
      data: items.map((c) => ({
        id: c.id,
        certType: c.certType,
        certName: c.certName,
        issuer: c.issuer,
        validUntil: c.validUntil,
        documentUrl: c.documentUrl,
        createdAt: c.createdAt,
        escort: {
          id: c.escort.id,
          userId: c.escort.user.id,
          name: `${c.escort.user.firstName} ${c.escort.user.lastName}`,
          email: c.escort.user.email,
          photo: c.escort.user.profilePhoto,
        },
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async verifyCertification(certId: string, approved: boolean) {
    const cert = await this.prisma.certification.findUnique({
      where: { id: certId },
      include: { escort: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
    });

    if (!cert) throw new NotFoundException('Certification not found');

    if (approved) {
      await this.prisma.certification.update({
        where: { id: certId },
        data: { isVerified: true },
      });

      await this.notificationService.create(
        cert.escort.user.id,
        'Sertifikasi Disetujui',
        `Sertifikasi "${cert.certName}" Anda telah diverifikasi.`,
        'CERTIFICATION',
      );

      return { message: 'Certification approved' };
    } else {
      await this.prisma.certification.delete({ where: { id: certId } });

      await this.notificationService.create(
        cert.escort.user.id,
        'Sertifikasi Ditolak',
        `Sertifikasi "${cert.certName}" Anda ditolak. Silakan upload ulang dengan dokumen yang valid.`,
        'CERTIFICATION',
      );

      return { message: 'Certification rejected and removed' };
    }
  }
}
