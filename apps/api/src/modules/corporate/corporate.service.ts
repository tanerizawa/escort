import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';

@Injectable()
export class CorporateService {
  constructor(private prisma: PrismaService) {}

  async createSubscription(data: {
    companyName: string;
    contactPerson: string;
    contactEmail: string;
    contactPhone?: string;
    plan: string;
    maxUsers?: number;
    monthlyBudget: number;
    discountPercent?: number;
    features?: Record<string, boolean>;
    startDate: Date;
    endDate: Date;
  }) {
    const planLimits: Record<string, number> = {
      BASIC: 5,
      PROFESSIONAL: 20,
      ENTERPRISE: 100,
    };

    return this.prisma.corporateSubscription.create({
      data: {
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        plan: data.plan,
        maxUsers: data.maxUsers || planLimits[data.plan] || 5,
        monthlyBudget: data.monthlyBudget,
        discountPercent: data.discountPercent || 0,
        features: data.features || {},
        startDate: data.startDate,
        endDate: data.endDate,
      },
      include: { members: true },
    });
  }

  async listSubscriptions(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params?.limit) || 10));
    const where = params?.status ? { status: params.status } : {};

    const [data, total] = await Promise.all([
      this.prisma.corporateSubscription.findMany({
        where,
        include: { members: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.corporateSubscription.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getSubscription(id: string) {
    const sub = await this.prisma.corporateSubscription.findUnique({
      where: { id },
      include: { members: true },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    return sub;
  }

  async updateSubscription(id: string, data: Partial<{
    plan: string;
    maxUsers: number;
    monthlyBudget: number;
    discountPercent: number;
    features: Record<string, boolean>;
    status: string;
    endDate: Date;
  }>) {
    await this.getSubscription(id);
    return this.prisma.corporateSubscription.update({
      where: { id },
      data,
      include: { members: true },
    });
  }

  async addMember(subscriptionId: string, userId: string, role = 'MEMBER') {
    const sub = await this.getSubscription(subscriptionId);
    if (sub.members.length >= sub.maxUsers) {
      throw new BadRequestException('Maximum members reached for this subscription plan');
    }
    return this.prisma.corporateMember.create({
      data: { subscriptionId, userId, role },
    });
  }

  async removeMember(subscriptionId: string, userId: string) {
    return this.prisma.corporateMember.deleteMany({
      where: { subscriptionId, userId },
    });
  }

  async getStats() {
    const [total, active, plans] = await Promise.all([
      this.prisma.corporateSubscription.count(),
      this.prisma.corporateSubscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.corporateSubscription.groupBy({
        by: ['plan'],
        _count: { id: true },
        where: { status: 'ACTIVE' },
      }),
    ]);

    return {
      total,
      active,
      byPlan: plans.reduce((acc: Record<string, number>, p: any) => ({ ...acc, [p.plan]: p._count.id }), {}),
    };
  }
}
