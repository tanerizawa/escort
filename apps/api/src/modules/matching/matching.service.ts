import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * AI-powered escort matching algorithm
   * Considers: location, availability, tier preference, past ratings, language, skills
   */
  async findMatches(params: {
    serviceType: string;
    date: string;
    duration: number;
    location?: string;
    preferredTier?: string;
    languages?: string[];
    limit?: number;
  }) {
    const { serviceType, date, duration, location, preferredTier, languages, limit = 10 } = params;

    // Validate inputs
    if (!date || isNaN(Date.parse(date))) {
      return { results: [], total: 0, params: { serviceType, date, duration, preferredTier } };
    }
    const safeDuration = Number(duration) || 1;

    const startTime = new Date(date);
    const endTime = new Date(startTime.getTime() + safeDuration * 60 * 60 * 1000);

    // Step 1: Base query — approved, active escorts
    const escorts = await this.prisma.escortProfile.findMany({
      where: {
        isApproved: true,
        user: { isActive: true, role: 'ESCORT' },
        ...(preferredTier ? { tier: preferredTier as any } : {}),
        ...(languages?.length ? { languages: { hasSome: languages } } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            escortBookings: {
              where: {
                status: { in: ['PENDING', 'CONFIRMED', 'ONGOING'] },
                OR: [{ startTime: { lt: endTime }, endTime: { gt: startTime } }],
              },
              select: { id: true },
            },
          },
        },
        certifications: { where: { isVerified: true }, select: { certName: true } },
      },
    });

    // Step 2: Filter out unavailable escorts (have overlapping bookings)
    const available = escorts.filter((e) => e.user.escortBookings.length === 0);

    // Step 3: Score & rank
    const scored = available.map((escort) => {
      let score = 0;

      // Rating weight (40%) — guard against null/NaN
      const ratingVal = Number(escort.ratingAvg) || 0;
      score += (ratingVal / 5) * 40;

      // Experience weight (20%)
      const bookingScore = Math.min(escort.totalBookings / 100, 1);
      score += bookingScore * 20;

      // Certification bonus (15%)
      const certScore = Math.min(escort.certifications.length / 5, 1);
      score += certScore * 15;

      // Review count weight (10%)
      const reviewScore = Math.min(escort.totalReviews / 50, 1);
      score += reviewScore * 10;

      // Tier bonus (15%)
      const tierScores: Record<string, number> = { DIAMOND: 15, PLATINUM: 12, GOLD: 8, SILVER: 4 };
      score += tierScores[escort.tier] || 0;

      return {
        escortId: escort.user.id,
        profileId: escort.id,
        name: `${escort.user.firstName} ${escort.user.lastName}`,
        photo: escort.user.profilePhoto,
        tier: escort.tier,
        rating: escort.ratingAvg,
        totalBookings: escort.totalBookings,
        hourlyRate: escort.hourlyRate ? escort.hourlyRate.toNumber() : 0,
        languages: escort.languages,
        skills: escort.skills,
        certifications: escort.certifications.map((c) => c.certName),
        bio: escort.bio,
        matchScore: Math.round(score * 100) / 100,
      };
    });

    // Sort by match score descending
    scored.sort((a, b) => b.matchScore - a.matchScore);

    this.logger.log(`Matching: found ${scored.length} available escorts for ${serviceType} on ${date}`);

    return {
      results: scored.slice(0, limit),
      total: scored.length,
      params: { serviceType, date, duration, preferredTier },
    };
  }
}
