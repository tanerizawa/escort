import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';
import { RedisService } from '@/config/redis.service';

const DEFAULT_PREFERENCES = {
  inApp: true,
  email: true,
  push: true,
  whatsapp: false,
  booking: true,
  chat: true,
  payment: true,
  promotion: false,
};

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async create(userId: string, title: string, body: string, type: string, data?: Record<string, any>) {
    return this.prisma.notification.create({
      data: { userId, title, body, type, data },
    });
  }

  async findAll(userId: string, page = 1, limit = 20, unreadOnly = false) {
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) throw new NotFoundException('Notifikasi tidak ditemukan');
    if (notification.userId !== userId) throw new ForbiddenException('Akses ditolak');

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { markedAsRead: result.count };
  }

  // Helper: send booking-related notifications
  async notifyBookingStatus(bookingId: string, status: string) {
    // TODO: Integrate with Firebase Cloud Messaging, SendGrid, Twilio
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: { select: { id: true, firstName: true } },
        escort: { select: { id: true, firstName: true } },
      },
    });

    if (!booking) return;

    const messages: Record<string, { userId: string; title: string; body: string }[]> = {
      CONFIRMED: [
        {
          userId: booking.clientId,
          title: 'Booking Dikonfirmasi',
          body: `${booking.escort.firstName} telah menerima booking Anda`,
        },
      ],
      CANCELLED: [
        {
          userId: booking.escortId,
          title: 'Booking Dibatalkan',
          body: `Booking dari ${booking.client.firstName} telah dibatalkan`,
        },
      ],
      ONGOING: [
        {
          userId: booking.clientId,
          title: 'Booking Dimulai',
          body: `Check-in berhasil. Selamat menikmati layanan bersama ${booking.escort.firstName}`,
        },
        {
          userId: booking.escortId,
          title: 'Booking Dimulai',
          body: `Check-in dari ${booking.client.firstName} telah dikonfirmasi`,
        },
      ],
      COMPLETED: [
        {
          userId: booking.clientId,
          title: 'Booking Selesai',
          body: 'Berikan review untuk pengalaman Anda',
        },
        {
          userId: booking.escortId,
          title: 'Booking Selesai',
          body: 'Pembayaran akan segera diproses',
        },
      ],
    };

    const notifs = messages[status] || [];
    for (const n of notifs) {
      await this.create(n.userId, n.title, n.body, 'BOOKING', { bookingId, status });
    }
  }

  // ---- Notification Preferences ----

  async getPreferences(userId: string) {
    const prefs = await this.redis.getJSON<Record<string, boolean>>(`notif:prefs:${userId}`);
    return prefs || { ...DEFAULT_PREFERENCES };
  }

  async updatePreferences(userId: string, updates: Record<string, boolean>) {
    const current = await this.getPreferences(userId);
    const merged = { ...current, ...updates };
    await this.redis.setJSON(`notif:prefs:${userId}`, merged);
    return merged;
  }

  async shouldNotify(userId: string, channel: string, type: string): Promise<boolean> {
    const prefs = await this.getPreferences(userId);
    const channelEnabled = prefs[channel] !== false;
    const typeEnabled = prefs[type] !== false;
    return channelEnabled && typeEnabled;
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) throw new NotFoundException('Notifikasi tidak ditemukan');
    if (notification.userId !== userId) throw new ForbiddenException('Akses ditolak');

    await this.prisma.notification.delete({ where: { id: notificationId } });
    return { deleted: true };
  }
}
