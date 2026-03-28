import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';

@Injectable()
export class PremiumService {
  constructor(private prisma: PrismaService) {}

  async createListing(data: {
    escortId: string;
    type: string;
    startDate: Date;
    endDate: Date;
    amount: number;
  }) {
    // Check for overlapping active listing of same type
    const existing = await this.prisma.premiumListing.findFirst({
      where: {
        escortId: data.escortId,
        type: data.type,
        isActive: true,
        endDate: { gte: new Date() },
      },
    });

    if (existing) {
      throw new BadRequestException(`Escort already has an active ${data.type} listing`);
    }

    return this.prisma.premiumListing.create({
      data: {
        escortId: data.escortId,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        amount: data.amount,
      },
    });
  }

  async listListings(params?: {
    type?: string;
    isActive?: boolean;
    escortId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params?.limit) || 20));
    const where: any = {};
    if (params?.type) where.type = params.type;
    if (params?.isActive !== undefined) where.isActive = params.isActive;
    if (params?.escortId) where.escortId = params.escortId;

    const [data, total] = await Promise.all([
      this.prisma.premiumListing.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.premiumListing.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getListing(id: string) {
    const listing = await this.prisma.premiumListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Premium listing not found');
    return listing;
  }

  async deactivateListing(id: string) {
    await this.getListing(id);
    return this.prisma.premiumListing.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async trackImpression(id: string) {
    return this.prisma.premiumListing.update({
      where: { id },
      data: { impressions: { increment: 1 } },
    });
  }

  async trackClick(id: string) {
    return this.prisma.premiumListing.update({
      where: { id },
      data: { clicks: { increment: 1 } },
    });
  }

  async getFeaturedEscorts(type = 'FEATURED', rawLimit = 10) {
    const limit = Math.max(1, Math.min(50, Number(rawLimit) || 10));
    const now = new Date();
    return this.prisma.premiumListing.findMany({
      where: {
        type,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getStats() {
    const now = new Date();
    const [total, active, revenue, byType] = await Promise.all([
      this.prisma.premiumListing.count(),
      this.prisma.premiumListing.count({
        where: { isActive: true, endDate: { gte: now } },
      }),
      this.prisma.premiumListing.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.premiumListing.groupBy({
        by: ['type'],
        _count: { id: true },
        _sum: { amount: true },
        where: { isActive: true },
      }),
    ]);

    const totalImpressions = await this.prisma.premiumListing.aggregate({
      _sum: { impressions: true, clicks: true },
    });

    return {
      total,
      active,
      totalRevenue: revenue._sum.amount || 0,
      totalImpressions: totalImpressions._sum.impressions || 0,
      totalClicks: totalImpressions._sum.clicks || 0,
      ctr: totalImpressions._sum.impressions
        ? ((totalImpressions._sum.clicks || 0) / totalImpressions._sum.impressions * 100).toFixed(2) + '%'
        : '0%',
      byType: byType.map((t: any) => ({
        type: t.type,
        count: t._count.id,
        revenue: t._sum.amount || 0,
      })),
    };
  }

  // Auto-expire old listings (can be called via cron)
  async expireListings() {
    const result = await this.prisma.premiumListing.updateMany({
      where: {
        isActive: true,
        endDate: { lt: new Date() },
      },
      data: { isActive: false },
    });
    return { expired: result.count };
  }
}
