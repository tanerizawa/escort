import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';
import { RedisService } from '@/config/redis.service';
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
  ) {}

  async getPlatformStats() {
    const [
      totalUsers,
      totalEscorts,
      activeBookings,
      completedBookings,
      pendingVerifications,
      openIncidents,
      revenueResult,
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
    };
  }

  async listUsers(page = 1, limit = 20, role?: string, search?: string) {
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

  async getPendingEscorts(page = 1) {
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
      include: { user: { select: { id: true, firstName: true } } },
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

    // TODO: Send notification to escort about approval/rejection

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

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
  }

  async listIncidents(page = 1, status?: string, type?: string) {
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

  async listPromoCodes(page = 1, isActive?: boolean) {
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
}
