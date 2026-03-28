import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';
import { RedisService } from '@/config/redis.service';
import { NotificationService } from '@/modules/notification/notification.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ReferralService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notification: NotificationService,
  ) {}

  /**
   * Generate or retrieve referral code for a user
   */
  async getOrCreateReferralCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true, firstName: true },
    });

    if (!user) throw new NotFoundException('User tidak ditemukan');

    if (user.referralCode) return user.referralCode;

    // Generate unique 8-char alphanumeric code
    const code = await this.generateUniqueCode(user.firstName);

    await this.prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
    });

    return code;
  }

  /**
   * Apply referral code during registration
   */
  async applyReferral(referredUserId: string, referralCode: string): Promise<void> {
    const referrer = await this.prisma.user.findFirst({
      where: { referralCode: referralCode.toUpperCase() },
      select: { id: true, firstName: true },
    });

    if (!referrer) throw new BadRequestException('Kode referral tidak valid');
    if (referrer.id === referredUserId) throw new BadRequestException('Tidak bisa menggunakan kode sendiri');

    // Check if user already referred
    const existing = await this.prisma.referral.findUnique({
      where: { referredId: referredUserId },
    });
    if (existing) return; // Already referred, skip silently

    // Get reward amount from Redis config
    const rewardAmount = await this.getRewardAmount();

    await this.prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: referredUserId,
        referralCode: referralCode.toUpperCase(),
        rewardAmount,
      },
    });

    // Notify referrer
    await this.notification.create(
      referrer.id,
      'Referral Berhasil! 🎉',
      `Seseorang bergabung menggunakan kode referral Anda. Reward Rp ${Number(rewardAmount).toLocaleString('id-ID')} akan dikreditkan.`,
      'SYSTEM',
      { type: 'referral_success', referredUserId },
    );
  }

  /**
   * Get referral stats for a user
   */
  async getReferralStats(userId: string) {
    const [referralCode, totalReferrals, totalReward, referrals] = await Promise.all([
      this.getOrCreateReferralCode(userId),
      this.prisma.referral.count({ where: { referrerId: userId } }),
      this.prisma.referral.aggregate({
        where: { referrerId: userId },
        _sum: { rewardAmount: true },
      }),
      this.prisma.referral.findMany({
        where: { referrerId: userId },
        include: {
          referred: { select: { firstName: true, createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const rewardPerReferral = await this.getRewardAmount();

    return {
      referralCode,
      referralLink: `https://areton.id/register?ref=${referralCode}`,
      totalReferrals,
      totalReward: Number(totalReward._sum.rewardAmount || 0),
      rewardPerReferral: Number(rewardPerReferral),
      recentReferrals: referrals.map((r) => ({
        id: r.id,
        name: r.referred.firstName,
        joinedAt: r.createdAt,
        rewardAmount: Number(r.rewardAmount),
        claimed: r.rewardClaimed,
      })),
    };
  }

  /**
   * Validate a referral code
   */
  async validateCode(code: string) {
    const user = await this.prisma.user.findFirst({
      where: { referralCode: code.toUpperCase() },
      select: { firstName: true },
    });

    return { valid: !!user, referrerName: user?.firstName || null };
  }

  // ── Private helpers ──

  private async generateUniqueCode(firstName: string): Promise<string> {
    const prefix = firstName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    let attempts = 0;

    while (attempts < 10) {
      const suffix = randomBytes(3).toString('hex').toUpperCase().substring(0, 5);
      const code = `${prefix}${suffix}`;

      const exists = await this.prisma.user.findFirst({
        where: { referralCode: code },
      });

      if (!exists) return code;
      attempts++;
    }

    // Fallback: pure random
    return randomBytes(4).toString('hex').toUpperCase();
  }

  private async getRewardAmount(): Promise<number> {
    const cached = await this.redis.get('platform:referral_reward');
    return cached ? Number(cached) : 50000; // Default Rp 50,000
  }

  // ── Admin methods ──

  async adminOverview() {
    const [totalReferrals, totalRewardSum, claimedCount, topReferrers] = await Promise.all([
      this.prisma.referral.count(),
      this.prisma.referral.aggregate({ _sum: { rewardAmount: true } }),
      this.prisma.referral.count({ where: { rewardClaimed: true } }),
      this.prisma.referral.groupBy({
        by: ['referrerId'],
        _count: true,
        _sum: { rewardAmount: true },
        orderBy: { _count: { referrerId: 'desc' } },
        take: 10,
      }),
    ]);

    const referrerIds = topReferrers.map((t) => t.referrerId);
    const referrerUsers = referrerIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: referrerIds } },
          select: { id: true, firstName: true, lastName: true, email: true, referralCode: true },
        })
      : [];

    const userMap = new Map(referrerUsers.map((u) => [u.id, u]));

    return {
      totalReferrals,
      totalRewardAmount: Number(totalRewardSum._sum.rewardAmount || 0),
      claimedCount,
      unclaimedCount: totalReferrals - claimedCount,
      topReferrers: topReferrers.map((t) => {
        const user = userMap.get(t.referrerId);
        return {
          userId: t.referrerId,
          name: user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Unknown',
          email: user?.email,
          referralCode: user?.referralCode,
          count: t._count,
          totalReward: Number(t._sum.rewardAmount || 0),
        };
      }),
    };
  }

  async adminList(page = 1, limit = 20) {
    const [referrals, total] = await Promise.all([
      this.prisma.referral.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          referrer: { select: { firstName: true, lastName: true, email: true, referralCode: true } },
          referred: { select: { firstName: true, lastName: true, email: true, createdAt: true } },
        },
      }),
      this.prisma.referral.count(),
    ]);

    return {
      data: referrals.map((r) => ({
        id: r.id,
        referrer: {
          name: `${r.referrer.firstName} ${r.referrer.lastName || ''}`.trim(),
          email: r.referrer.email,
          code: r.referrer.referralCode,
        },
        referred: {
          name: `${r.referred.firstName} ${r.referred.lastName || ''}`.trim(),
          email: r.referred.email,
          joinedAt: r.referred.createdAt,
        },
        referralCode: r.referralCode,
        rewardAmount: Number(r.rewardAmount),
        rewardClaimed: r.rewardClaimed,
        createdAt: r.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
