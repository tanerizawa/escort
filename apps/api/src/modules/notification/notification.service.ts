import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';
import { RedisService } from '@/config/redis.service';
import { EmailService } from './email.service';
import { PushService } from './push.service';
import { WhatsAppService } from './whatsapp.service';

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
    private readonly emailService: EmailService,
    private readonly pushService: PushService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  async create(userId: string, title: string, body: string, type: string, data?: Record<string, any>) {
    return this.prisma.notification.create({
      data: { userId, title, body, type, data },
    });
  }

  /**
   * Broadcast a notification to all ADMIN and SUPER_ADMIN users
   */
  async notifyAdmins(title: string, body: string, type: string, data?: Record<string, any>) {
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true },
      select: { id: true },
    });

    if (admins.length === 0) return [];

    const notifications = await this.prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title,
        body,
        type,
        data: data || undefined,
      })),
    });

    // Also send push to each admin (fire & forget)
    for (const admin of admins) {
      this.pushService.sendToUser(admin.id, { title, body, data: data as any }).catch(() => {});
    }

    return notifications;
  }

  async findAll(userId: string, page = 1, limit = 20, unreadOnly = false) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const where = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
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
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: { select: { id: true, firstName: true, email: true, phone: true } },
        escort: { select: { id: true, firstName: true, email: true, phone: true } },
      },
    });

    if (!booking) return;

    const messages: Record<string, { userId: string; email: string; phone: string | null; title: string; body: string }[]> = {
      PENDING: [
        {
          userId: booking.escortId,
          email: booking.escort.email,
          phone: booking.escort.phone,
          title: 'Booking Baru',
          body: `Permintaan booking baru dari ${booking.client.firstName}`,
        },
      ],
      CONFIRMED: [
        {
          userId: booking.clientId,
          email: booking.client.email,
          phone: booking.client.phone,
          title: 'Booking Dikonfirmasi',
          body: `${booking.escort.firstName} telah menerima booking Anda`,
        },
      ],
      CANCELLED: [
        {
          userId: booking.escortId,
          email: booking.escort.email,
          phone: booking.escort.phone,
          title: 'Booking Dibatalkan',
          body: `Booking dari ${booking.client.firstName} telah dibatalkan`,
        },
      ],
      ONGOING: [
        {
          userId: booking.clientId,
          email: booking.client.email,
          phone: booking.client.phone,
          title: 'Booking Dimulai',
          body: `Check-in berhasil. Selamat menikmati layanan bersama ${booking.escort.firstName}`,
        },
        {
          userId: booking.escortId,
          email: booking.escort.email,
          phone: booking.escort.phone,
          title: 'Booking Dimulai',
          body: `Check-in dari ${booking.client.firstName} telah dikonfirmasi`,
        },
      ],
      COMPLETED: [
        {
          userId: booking.clientId,
          email: booking.client.email,
          phone: booking.client.phone,
          title: 'Booking Selesai',
          body: 'Berikan review untuk pengalaman Anda',
        },
        {
          userId: booking.escortId,
          email: booking.escort.email,
          phone: booking.escort.phone,
          title: 'Booking Selesai',
          body: 'Pembayaran akan segera diproses',
        },
      ],
    };

    const notifs = messages[status] || [];
    for (const n of notifs) {
      // In-app notification
      await this.create(n.userId, n.title, n.body, 'BOOKING', { bookingId, status });

      // Email notification (check user preferences)
      const shouldEmail = await this.shouldNotify(n.userId, 'email', 'booking');
      if (shouldEmail) {
        const templateMap: Record<string, () => Promise<any>> = {
          CONFIRMED: () => this.emailService.sendBookingConfirmation(n.email, {
            bookingId: bookingId.substring(0, 8).toUpperCase(),
            escortName: booking.escort.firstName,
            date: booking.startTime?.toLocaleDateString('id-ID') || '-',
            duration: Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / 3600000),
            amount: booking.totalAmount?.toString() || '0',
          }),
          CANCELLED: () => this.emailService.sendBookingCancelled(n.email, {
            bookingId: bookingId.substring(0, 8).toUpperCase(),
            reason: 'Dibatalkan oleh pengguna',
          }),
          COMPLETED: () => this.emailService.sendBookingCompleted(n.email, {
            bookingId: bookingId.substring(0, 8).toUpperCase(),
            escortName: booking.escort.firstName,
            amount: booking.totalAmount?.toString() || '0',
          }),
        };

        const sender = templateMap[status];
        if (sender) {
          sender().catch(err =>
            console.error(`Email to ${n.email} failed:`, err?.message),
          );
        }
      }

      // Push notification (check user preferences)
      const shouldPush = await this.shouldNotify(n.userId, 'push', 'booking');
      if (shouldPush) {
        const pushMap: Record<string, () => Promise<any>> = {
          PENDING: () => this.pushService.pushNewBookingRequest(
            n.userId, booking.client.firstName, bookingId,
          ),
          CONFIRMED: () => this.pushService.pushBookingConfirmed(
            n.userId, booking.escort.firstName, bookingId,
          ),
          CANCELLED: () => this.pushService.pushBookingCancelled(
            n.userId, `Booking dari ${booking.client.firstName} telah dibatalkan`, bookingId,
          ),
          COMPLETED: () => this.pushService.pushBookingCompleted(n.userId, bookingId),
        };

        const pushSender = pushMap[status];
        if (pushSender) {
          pushSender().catch(err =>
            console.error(`Push to user ${n.userId} failed:`, err?.message),
          );
        }
      }

      // WhatsApp notification (check user preferences)
      if (n.phone) {
        const shouldWA = await this.shouldNotify(n.userId, 'whatsapp', 'booking');
        if (shouldWA) {
          const shortId = bookingId.substring(0, 8).toUpperCase();
          const dateStr = booking.startTime?.toLocaleDateString('id-ID') || '-';
          const waMap: Record<string, () => Promise<any>> = {
            PENDING: () => this.whatsappService.sendNewBookingRequest(n.phone!, {
              escortName: booking.escort.firstName,
              clientName: booking.client.firstName,
              date: dateStr,
              bookingId: shortId,
            }),
            CONFIRMED: () => this.whatsappService.sendBookingConfirmation(n.phone!, {
              clientName: booking.client.firstName,
              escortName: booking.escort.firstName,
              date: dateStr,
              bookingId: shortId,
            }),
            CANCELLED: () => this.whatsappService.sendBookingCancelled(n.phone!, {
              name: booking.client.firstName,
              bookingId: shortId,
            }),
          };

          const waSender = waMap[status];
          if (waSender) {
            waSender().catch(err =>
              console.error(`WA to ${n.phone} failed:`, err?.message),
            );
          }
        }
      }
    }
  }

  // ---- Notification Preferences ----

  async getPreferences(userId: string) {
    const prefs = await this.redis.getJSON<Record<string, boolean>>(`notif:prefs:${userId}`);
    return prefs || { ...DEFAULT_PREFERENCES };
  }

  async updatePreferences(userId: string, updates: Partial<Record<string, boolean>>) {
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
