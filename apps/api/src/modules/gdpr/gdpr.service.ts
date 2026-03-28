import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class GdprService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Request data export (GDPR Article 20 / UU PDP Pasal 13)
   */
  async requestDataExport(userId: string, format: string = 'json') {
    // Check for pending export
    const pending = await this.prisma.dataExportRequest.findFirst({
      where: { userId, status: { in: ['PENDING', 'PROCESSING'] } },
    });
    if (pending) {
      throw new BadRequestException('Permintaan export data sedang diproses. Mohon tunggu.');
    }

    const request = await this.prisma.dataExportRequest.create({
      data: { userId, format },
    });

    // Process immediately (in production, use a queue)
    this.processExport(request.id, userId, format).catch(console.error);

    return {
      id: request.id,
      status: 'PROCESSING',
      message: 'Permintaan export data sedang diproses. Anda akan mendapat notifikasi saat sudah siap.',
    };
  }

  /**
   * Get export status
   */
  async getExportStatus(userId: string) {
    const exports = await this.prisma.dataExportRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return exports.map((e) => ({
      id: e.id,
      status: e.status,
      format: e.format,
      downloadUrl: e.status === 'COMPLETED' ? e.downloadUrl : null,
      expiresAt: e.expiresAt,
      createdAt: e.createdAt,
    }));
  }

  /**
   * Delete account (GDPR Article 17 / UU PDP Pasal 14)
   */
  async requestAccountDeletion(userId: string, confirmPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, passwordHash: true, role: true },
    });

    if (!user) throw new NotFoundException('User tidak ditemukan');

    // Verify password (import bcrypt dynamically to avoid circular deps)
    const bcrypt = await import('bcrypt');
    const valid = await bcrypt.compare(confirmPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Password salah');

    // Check active bookings
    const activeBookings = await this.prisma.booking.count({
      where: {
        OR: [{ clientId: userId }, { escortId: userId }],
        status: { in: ['PENDING', 'CONFIRMED', 'ONGOING'] },
      },
    });
    if (activeBookings > 0) {
      throw new BadRequestException(
        'Tidak bisa menghapus akun karena masih ada booking aktif. Selesaikan atau batalkan booking terlebih dahulu.',
      );
    }

    // Anonymize user data instead of hard delete (preserve referential integrity)
    await this.prisma.$transaction(async (tx) => {
      // Delete personal data
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `deleted_${userId.substring(0, 8)}@areton.id`,
          phone: null,
          firstName: 'Deleted',
          lastName: 'User',
          passwordHash: 'DELETED',
          profilePhoto: null,
          isActive: false,
          isVerified: false,
          twoFactorEnabled: false,
          twoFactorSecret: null,
          referralCode: null,
        },
      });

      // Delete escort profile if exists
      await tx.escortProfile.deleteMany({ where: { userId } });

      // Delete favorites
      await tx.favorite.deleteMany({ where: { OR: [{ userId }, { escortId: userId }] } });

      // Delete notification preferences (Redis) — handled outside transaction
      // Delete notifications
      await tx.notification.deleteMany({ where: { userId } });

      // Delete testimonials
      await tx.testimonial.deleteMany({ where: { userId } });

      // Delete articles
      await tx.article.deleteMany({ where: { authorId: userId } });

      // Delete data export requests
      await tx.dataExportRequest.deleteMany({ where: { userId } });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'ACCOUNT_DELETED',
          resource: 'users',
          resourceId: userId,
          details: { email: user.email, deletedAt: new Date().toISOString() },
          severity: 'CRITICAL',
        },
      });
    });

    return {
      success: true,
      message: 'Akun berhasil dihapus. Data personal telah dianonymisasi sesuai UU PDP.',
    };
  }

  /**
   * Get privacy dashboard
   */
  async getPrivacyDashboard(userId: string) {
    const [user, bookingCount, reviewCount, chatCount, notifCount, exportRequests] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, phone: true, createdAt: true, lastLoginAt: true },
      }),
      this.prisma.booking.count({ where: { OR: [{ clientId: userId }, { escortId: userId }] } }),
      this.prisma.review.count({ where: { OR: [{ reviewerId: userId }, { revieweeId: userId }] } }),
      this.prisma.chatMessage.count({ where: { senderId: userId } }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.dataExportRequest.count({ where: { userId } }),
    ]);

    return {
      dataCategories: [
        { category: 'Profil & Akun', description: 'Nama, email, telepon, foto profil', items: 1 },
        { category: 'Booking', description: 'Riwayat pemesanan', items: bookingCount },
        { category: 'Review', description: 'Review diberikan & diterima', items: reviewCount },
        { category: 'Pesan', description: 'Pesan chat (terenkripsi)', items: chatCount },
        { category: 'Notifikasi', description: 'Riwayat notifikasi', items: notifCount },
      ],
      accountCreated: user?.createdAt,
      lastLogin: user?.lastLoginAt,
      exportRequests,
      rights: [
        { right: 'Akses Data', description: 'Lihat semua data yang kami simpan', action: 'export' },
        { right: 'Portabilitas Data', description: 'Download data dalam format JSON/CSV', action: 'export' },
        { right: 'Hapus Data', description: 'Hapus akun dan data personal Anda', action: 'delete' },
        { right: 'Koreksi Data', description: 'Perbarui data yang tidak akurat', action: 'edit_profile' },
      ],
    };
  }

  // ── Private methods ──

  private async processExport(requestId: string, userId: string, format: string) {
    await this.prisma.dataExportRequest.update({
      where: { id: requestId },
      data: { status: 'PROCESSING' },
    });

    try {
      const [user, bookings, reviews, notifications, favorites] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true, email: true, phone: true, role: true,
            firstName: true, lastName: true, isVerified: true,
            createdAt: true, lastLoginAt: true,
            escortProfile: true,
          },
        }),
        this.prisma.booking.findMany({
          where: { OR: [{ clientId: userId }, { escortId: userId }] },
          select: {
            id: true, serviceType: true, status: true, startTime: true,
            endTime: true, location: true, totalAmount: true, createdAt: true,
          },
        }),
        this.prisma.review.findMany({
          where: { OR: [{ reviewerId: userId }, { revieweeId: userId }] },
          select: {
            id: true, rating: true, comment: true, replyComment: true, createdAt: true,
          },
        }),
        this.prisma.notification.findMany({
          where: { userId },
          select: { id: true, title: true, body: true, type: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
        this.prisma.favorite.findMany({
          where: { userId },
          select: { id: true, escortId: true, createdAt: true },
        }),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        platform: 'ARETON.id',
        user: {
          ...user,
          escortProfile: user?.escortProfile ? {
            tier: user.escortProfile.tier,
            bio: user.escortProfile.bio,
            languages: user.escortProfile.languages,
            skills: user.escortProfile.skills,
            hourlyRate: Number(user.escortProfile.hourlyRate),
            ratingAvg: user.escortProfile.ratingAvg,
            totalBookings: user.escortProfile.totalBookings,
          } : null,
        },
        bookings,
        reviews,
        notifications: notifications.slice(0, 100),
        favorites,
      };

      // Save to file
      const exportsDir = join(process.cwd(), 'uploads', 'exports');
      if (!existsSync(exportsDir)) mkdirSync(exportsDir, { recursive: true });

      const fileName = `export_${userId.substring(0, 8)}_${Date.now()}.json`;
      const filePath = join(exportsDir, fileName);
      writeFileSync(filePath, JSON.stringify(exportData, null, 2));

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48); // 48-hour download window

      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          downloadUrl: `/api/gdpr/exports/download/${fileName}`,
          expiresAt,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Data export failed:', error);
      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: { status: 'PENDING' }, // Reset for retry
      });
    }
  }

  // ── Admin methods ──

  async adminOverview() {
    const [totalExportRequests, pendingExports, completedExports, deletedAccounts] = await Promise.all([
      this.prisma.dataExportRequest.count(),
      this.prisma.dataExportRequest.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } }),
      this.prisma.dataExportRequest.count({ where: { status: 'COMPLETED' } }),
      this.prisma.auditLog.count({ where: { action: 'ACCOUNT_DELETED' } }),
    ]);

    return {
      totalExportRequests,
      pendingExports,
      completedExports,
      deletedAccounts,
    };
  }

  async adminListExports(page = 1, limit = 20) {
    const [exports, total] = await Promise.all([
      this.prisma.dataExportRequest.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.dataExportRequest.count(),
    ]);

    return {
      data: exports.map((e) => ({
        id: e.id,
        user: {
          name: `${e.user.firstName} ${e.user.lastName || ''}`.trim(),
          email: e.user.email,
        },
        format: e.format,
        status: e.status,
        downloadUrl: e.downloadUrl,
        expiresAt: e.expiresAt,
        completedAt: e.completedAt,
        createdAt: e.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
