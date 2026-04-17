import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';
import { RedisService } from '@/config/redis.service';
import { AuditService } from '@/common/services/audit.service';
import { NotificationService } from '@modules/notification/notification.service';
import { UploadService } from '@common/services/upload.service';

export interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

@Injectable()
export class SafetyService {
  private readonly LOCATION_TTL = 3600; // 1 hour
  private readonly LOCATION_HISTORY_MAX = 100;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
    private readonly notificationService: NotificationService,
    private readonly uploadService: UploadService,
  ) {}

  async triggerSOS(
    userId: string,
    bookingId: string,
    description?: string,
    location?: { lat?: number; lng?: number },
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (!(await this.isBookingParticipant(userId, booking))) {
      throw new ForbiddenException('Anda tidak terlibat dalam booking ini');
    }

    const incident = await this.prisma.incidentReport.create({
      data: {
        bookingId,
        reporterId: userId,
        type: 'SOS',
        description: description || 'SOS Emergency Alert triggered',
        severity: 5, // Maximum severity for SOS
      },
    });

    // Record last-known GPS coordinates in Redis (if provided) so admins /
    // monitoring surfaces can show where the SOS was triggered from.
    if (location?.lat != null && location?.lng != null) {
      try {
        await this.pingUserLocation(userId, {
          lat: location.lat,
          lng: location.lng,
        });
      } catch {
        // non-fatal — don't fail the SOS because GPS recording failed
      }
    }

    // Audit log for SOS (critical)
    await this.audit.log({
      userId,
      action: 'SOS_TRIGGER',
      resource: 'bookings',
      resourceId: bookingId,
      details: { incidentId: incident.id, description, location },
      severity: 'CRITICAL',
    });

    // Notify admins of SOS alert
    this.notificationService.notifyAdmins(
      '🚨 SOS Alert!',
      `SOS darurat dipicu pada booking ${bookingId}. ${description || 'Segera tangani.'}`,
      'SAFETY',
      { link: `/incidents`, bookingId, incidentId: incident.id },
    ).catch(() => {});

    return {
      message: 'SOS alert telah dikirim. Tim keamanan akan segera merespons.',
      incidentId: incident.id,
      severity: 'CRITICAL',
    };
  }

  async reportIncident(
    userId: string,
    data: { bookingId: string; type: string; description: string; severity: number },
    files?: Express.Multer.File[],
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: data.bookingId },
    });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (!(await this.isBookingParticipant(userId, booking))) {
      throw new ForbiddenException('Anda tidak terlibat dalam booking ini');
    }

    // Upload evidence files
    let evidenceUrls: string[] = [];
    if (files?.length) {
      for (const file of files) {
        const upload = await this.uploadService.saveFile(file, 'incident-evidence', {
          maxSizeMB: 10,
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
        });
        evidenceUrls.push(upload.url);
      }
    }

    const incident = await this.prisma.incidentReport.create({
      data: {
        bookingId: data.bookingId,
        reporterId: userId,
        type: data.type as any,
        description: data.description,
        severity: Math.min(5, Math.max(1, data.severity)),
        evidence: evidenceUrls.length > 0 ? evidenceUrls : undefined,
      },
    });

    // Notify admins of new incident report
    this.notificationService.notifyAdmins(
      `⚠️ Laporan Insiden (Severity ${data.severity})`,
      `Insiden baru dilaporkan pada booking ${data.bookingId}: ${data.description.slice(0, 100)}`,
      'SAFETY',
      { link: `/incidents`, bookingId: data.bookingId, incidentId: incident.id },
    ).catch(() => {});

    return incident;
  }

  async listIncidents(userId: string, rawPage = 1) {
    const page = Math.max(1, Number(rawPage) || 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    const [incidents, total] = await Promise.all([
      this.prisma.incidentReport.findMany({
        where: { reporterId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            select: { id: true, serviceType: true, startTime: true },
          },
        },
      }),
      this.prisma.incidentReport.count({ where: { reporterId: userId } }),
    ]);

    return {
      data: incidents,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getIncident(userId: string, incidentId: string) {
    const incident = await this.prisma.incidentReport.findUnique({
      where: { id: incidentId },
      include: {
        booking: {
          select: {
            id: true,
            serviceType: true,
            startTime: true,
            endTime: true,
            location: true,
          },
        },
        reporter: { select: { firstName: true, lastName: true } },
      },
    });

    if (!incident) throw new NotFoundException('Laporan tidak ditemukan');
    if (incident.reporterId !== userId) throw new ForbiddenException('Akses ditolak');

    return incident;
  }

  // ── General Location Ping (no booking required) ──────

  private readonly USER_LOCATION_TTL = 86400; // 24 hours

  async pingUserLocation(
    userId: string,
    location: { lat: number; lng: number; accuracy?: number },
  ) {
    const locationData: LocationData = {
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy,
      timestamp: Date.now(),
    };

    // Store latest known position for this user (independent of bookings)
    const key = `user_location:${userId}`;
    await this.redis.setJSON(key, locationData, this.USER_LOCATION_TTL);

    return { success: true, location: locationData };
  }

  async getUserLastLocation(userId: string): Promise<LocationData | null> {
    const key = `user_location:${userId}`;
    return this.redis.getJSON<LocationData>(key);
  }

  // ── Location Tracking (P6-BE-03) ─────────────────────

  async updateLocation(
    userId: string,
    bookingId: string,
    location: { lat: number; lng: number; accuracy?: number },
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (!(await this.isBookingParticipant(userId, booking))) {
      throw new ForbiddenException('Anda tidak terlibat dalam booking ini');
    }

    // Only allow location tracking for active bookings
    if (!['CONFIRMED', 'ONGOING'].includes(booking.status)) {
      throw new ForbiddenException('Booking tidak dalam status aktif');
    }

    const locationData: LocationData = {
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy,
      timestamp: Date.now(),
    };

    // Store latest location in Redis
    const locationKey = `location:${bookingId}:${userId}`;
    await this.redis.setJSON(locationKey, locationData, this.LOCATION_TTL);

    // Store location history (capped list)
    const historyKey = `location_history:${bookingId}:${userId}`;
    const client = this.redis.getClient();
    await client.lpush(historyKey, JSON.stringify(locationData));
    await client.ltrim(historyKey, 0, this.LOCATION_HISTORY_MAX - 1);
    await client.expire(historyKey, this.LOCATION_TTL);

    // Check geofence if booking has location coordinates
    let geofenceAlert = false;
    if (booking.locationLat && booking.locationLng) {
      const distance = this.calculateDistance(
        location.lat,
        location.lng,
        booking.locationLat,
        booking.locationLng,
      );
      // Alert if more than 5km from booking location
      if (distance > 5) {
        geofenceAlert = true;
        await this.audit.log({
          userId,
          action: 'GEOFENCE_BREACH',
          resource: 'bookings',
          resourceId: bookingId,
          details: { distance: Math.round(distance * 100) / 100, location: locationData },
          severity: 'WARN',
        });
      }
    }

    return {
      success: true,
      geofenceAlert,
      timestamp: locationData.timestamp,
    };
  }

  // ── Get Live Tracking (P6-BE-04) ─────────────────────

  async getTracking(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');

    // Only participants + admins can view tracking
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isParticipant = await this.isBookingParticipant(userId, booking);
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    if (!isParticipant && !isAdmin) {
      throw new ForbiddenException('Akses ditolak');
    }

    // Get latest locations for both participants
    const [clientLocation, escortLocation] = await Promise.all([
      this.redis.getJSON<LocationData>(`location:${bookingId}:${booking.clientId}`),
      this.redis.getJSON<LocationData>(`location:${bookingId}:${booking.escortId}`),
    ]);

    // Log data access for audit
    await this.audit.log({
      userId,
      action: 'LOCATION_VIEW',
      resource: 'bookings',
      resourceId: bookingId,
      severity: 'INFO',
    });

    return {
      bookingId,
      status: booking.status,
      bookingLocation: {
        lat: booking.locationLat,
        lng: booking.locationLng,
        address: booking.location,
      },
      clientLocation,
      escortLocation,
    };
  }

  async getLocationHistory(userId: string, bookingId: string, targetUserId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isParticipant = await this.isBookingParticipant(userId, booking);
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    if (!isParticipant && !isAdmin) {
      throw new ForbiddenException('Akses ditolak');
    }

    const historyKey = `location_history:${bookingId}:${targetUserId}`;
    const client = this.redis.getClient();
    const history = await client.lrange(historyKey, 0, -1);

    return {
      bookingId,
      userId: targetUserId,
      locations: history.map((h: string) => JSON.parse(h) as LocationData),
    };
  }

  // ── Late Alert Check (P6-BE-07) ──────────────────────

  async checkLateAlert(bookingId: string, userId?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');

    // Access control: only booking participants or admin can check
    if (userId) {
      const isParticipant = await this.isBookingParticipant(userId, booking);
      if (!isParticipant) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
          throw new ForbiddenException('Akses ditolak');
        }
      }
    }

    const now = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);

    let alert = null;

    // Check if booking hasn't started (no checkin)
    if (booking.status === 'CONFIRMED' && now > startTime && !booking.checkinAt) {
      const minutesLate = Math.floor((now.getTime() - startTime.getTime()) / 60000);
      alert = {
        type: 'LATE_CHECKIN',
        minutesLate,
        message: `Booking belum check-in, terlambat ${minutesLate} menit`,
      };

      if (minutesLate > 30) {
        await this.audit.log({
          action: 'LATE_CHECKIN_ALERT',
          resource: 'bookings',
          resourceId: bookingId,
          details: { minutesLate },
          severity: minutesLate > 60 ? 'CRITICAL' : 'WARN',
        });
      }
    }

    // Check if booking should have ended
    if (booking.status === 'ONGOING' && now > endTime && !booking.checkoutAt) {
      const minutesOvertime = Math.floor((now.getTime() - endTime.getTime()) / 60000);
      alert = {
        type: 'OVERTIME',
        minutesOvertime,
        message: `Booking melebihi waktu, overtime ${minutesOvertime} menit`,
      };

      if (minutesOvertime > 15) {
        await this.audit.log({
          action: 'OVERTIME_ALERT',
          resource: 'bookings',
          resourceId: bookingId,
          details: { minutesOvertime },
          severity: minutesOvertime > 60 ? 'CRITICAL' : 'WARN',
        });
      }
    }

    return {
      bookingId,
      status: booking.status,
      startTime,
      endTime,
      checkinAt: booking.checkinAt,
      checkoutAt: booking.checkoutAt,
      alert,
    };
  }

  // ── Participant Check (handles escortId as user-ID or profile-ID) ──

  private async isBookingParticipant(
    userId: string,
    booking: { clientId: string; escortId: string },
  ): Promise<boolean> {
    if (booking.clientId === userId || booking.escortId === userId) return true;

    // Fallback: old bookings may store escort-profile-ID instead of user-ID
    const profile = await this.prisma.escortProfile.findUnique({
      where: { id: booking.escortId },
      select: { userId: true },
    });
    return profile?.userId === userId;
  }

  // ── Utilities ────────────────────────────────────────

  private calculateDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number,
  ): number {
    // Haversine formula — returns distance in km
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
