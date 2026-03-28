import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/config/prisma.service';
import { NotificationService } from '@modules/notification/notification.service';
import { EncryptionService } from '@/common/services/encryption.service';
import { UpdateEscortProfileDto } from './dto/user.dto';
import { CreateCertificationDto } from './dto/certification.dto';

@Injectable()
export class UserService {
  private readonly apiBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly encryption: EncryptionService,
    private readonly config: ConfigService,
  ) {
    this.apiBaseUrl = this.config.get<string>('app.apiUrl') || 'https://api.areton.id';
  }

  private generatePreviewUrl(originalUrl: string): string | null {
    if (!originalUrl) return null;
    try {
      // Extract relative path from full URL: https://api.areton.id/uploads/avatars/xxx.jpg -> avatars/xxx.jpg
      const match = originalUrl.match(/\/uploads\/(.+)$/);
      if (!match) return null;
      const payload = JSON.stringify({ path: match[1], exp: Date.now() + 10 * 60 * 1000 });
      const token = encodeURIComponent(this.encryption.encrypt(payload));
      return `${this.apiBaseUrl}/api/images/preview/${token}`;
    } catch {
      return null;
    }
  }

  async getProfile(userId: string) {
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
        profilePhoto: true,
        createdAt: true,
        escortProfile: {
          include: {
            certifications: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        profilePhoto: data.profilePhoto,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        profilePhoto: true,
      },
    });
  }

  async listEscorts(query: any, isAuthenticated = false) {
    const { page: rawPage = 1, limit: rawLimit = 20, search, tier, minRate, maxRate, language, skill, sortBy: rawSortBy = 'ratingAvg' } = query;

    // Normalize sortBy — map common aliases to actual DB column names
    const sortByMap: Record<string, string> = {
      rating: 'ratingAvg',
      ratingAvg: 'ratingAvg',
      price: 'hourlyRate',
      hourlyRate: 'hourlyRate',
      bookings: 'totalBookings',
      totalBookings: 'totalBookings',
      reviews: 'totalReviews',
      totalReviews: 'totalReviews',
      newest: 'createdAt',
      createdAt: 'createdAt',
    };
    const sortBy = sortByMap[rawSortBy] || 'ratingAvg';

    const page = Math.max(1, Number(rawPage) || 1);
    const limit = Math.max(1, Math.min(100, Number(rawLimit) || 20));

    const skip = (page - 1) * limit;

    // ── Full-text search with PostgreSQL ──
    if (search && search.trim().length > 0) {
      return this.searchEscortsFullText(search.trim(), { page, limit, skip, tier, minRate, maxRate, language, skill, sortBy }, isAuthenticated);
    }

    const where: any = {
      user: { isActive: true },
      isApproved: true,
    };

    if (tier) where.tier = tier;
    if (minRate || maxRate) {
      where.hourlyRate = {};
      if (minRate) where.hourlyRate.gte = Number(minRate);
      if (maxRate) where.hourlyRate.lte = Number(maxRate);
    }
    if (language) where.languages = { has: language };
    if (skill) where.skills = { has: skill };

    const [escorts, total] = await Promise.all([
      this.prisma.escortProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhoto: true,
            },
          },
        },
        orderBy: { [sortBy]: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.escortProfile.count({ where }),
    ]);

    return {
      data: escorts.map(({ portfolioUrls, videoIntroUrl, ...rest }) => ({
        ...rest,
        ...(!isAuthenticated && rest.user?.profilePhoto ? {
          user: { ...rest.user, profilePhoto: this.generatePreviewUrl(rest.user.profilePhoto) },
        } : {}),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * PostgreSQL full-text search for escorts.
   * Searches across: firstName, lastName, bio, languages[], skills[]
   * Uses ts_vector/ts_query for proper stemming + ranking.
   * Falls back to ILIKE for short queries or special characters.
   */
  private async searchEscortsFullText(
    search: string,
    opts: { page: number; limit: number; skip: number; tier?: string; minRate?: number; maxRate?: number; language?: string; skill?: string; sortBy: string },
    isAuthenticated = false,
  ) {
    const { page, limit, skip, tier, minRate, maxRate, language, skill, sortBy } = opts;

    // Build additional WHERE clauses for filters
    const filterClauses: string[] = [
      'ep."isApproved" = true',
      'u."isActive" = true',
    ];
    const filterParams: any[] = [];
    let paramIndex = 1;

    // Search query param
    const searchTerms = search.replace(/[^\w\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
    const tsQuery = searchTerms.map((t) => `${t}:*`).join(' & ');
    filterParams.push(tsQuery);
    paramIndex++;

    if (tier) {
      filterClauses.push(`ep."tier" = $${paramIndex}::text::"EscortTier"`);
      filterParams.push(tier);
      paramIndex++;
    }
    if (minRate) {
      filterClauses.push(`ep."hourlyRate" >= $${paramIndex}`);
      filterParams.push(Number(minRate));
      paramIndex++;
    }
    if (maxRate) {
      filterClauses.push(`ep."hourlyRate" <= $${paramIndex}`);
      filterParams.push(Number(maxRate));
      paramIndex++;
    }
    if (language) {
      filterClauses.push(`$${paramIndex} = ANY(ep."languages")`);
      filterParams.push(language);
      paramIndex++;
    }
    if (skill) {
      filterClauses.push(`$${paramIndex} = ANY(ep."skills")`);
      filterParams.push(skill);
      paramIndex++;
    }

    const whereSQL = filterClauses.join(' AND ');

    // Full-text search with rank scoring
    // Searches: user first+last name (weight A), bio (weight B), languages+skills (weight C)
    const searchSQL = `
      WITH search_results AS (
        SELECT
          ep.id,
          ep."userId",
          ep.tier,
          ep.languages,
          ep.skills,
          ep."hourlyRate",
          ep."ratingAvg",
          ep."totalBookings",
          ep."totalReviews",
          ep.bio,
          ep."portfolioUrls",
          ep."videoIntroUrl",
          ep."isApproved",
          ep."createdAt",
          ep."updatedAt",
          u.id AS user_id,
          u."firstName",
          u."lastName",
          u."profilePhoto",
          ts_rank_cd(
            setweight(to_tsvector('simple', coalesce(u."firstName", '') || ' ' || coalesce(u."lastName", '')), 'A') ||
            setweight(to_tsvector('simple', coalesce(ep.bio, '')), 'B') ||
            setweight(to_tsvector('simple', coalesce(array_to_string(ep.languages, ' '), '')), 'C') ||
            setweight(to_tsvector('simple', coalesce(array_to_string(ep.skills, ' '), '')), 'C'),
            to_tsquery('simple', $1)
          ) AS search_rank
        FROM escort_profiles ep
        JOIN users u ON u.id = ep."userId"
        WHERE ${whereSQL}
          AND (
            to_tsvector('simple', coalesce(u."firstName", '') || ' ' || coalesce(u."lastName", '')) ||
            to_tsvector('simple', coalesce(ep.bio, '')) ||
            to_tsvector('simple', coalesce(array_to_string(ep.languages, ' '), '')) ||
            to_tsvector('simple', coalesce(array_to_string(ep.skills, ' '), ''))
          ) @@ to_tsquery('simple', $1)
      )
      SELECT * FROM search_results
      ORDER BY search_rank DESC, "ratingAvg" DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const countSQL = `
      SELECT COUNT(*)::int AS total
      FROM escort_profiles ep
      JOIN users u ON u.id = ep."userId"
      WHERE ${whereSQL}
        AND (
          to_tsvector('simple', coalesce(u."firstName", '') || ' ' || coalesce(u."lastName", '')) ||
          to_tsvector('simple', coalesce(ep.bio, '')) ||
          to_tsvector('simple', coalesce(array_to_string(ep.languages, ' '), '')) ||
          to_tsvector('simple', coalesce(array_to_string(ep.skills, ' '), ''))
        ) @@ to_tsquery('simple', $1)
    `;

    try {
      const [results, countResult] = await Promise.all([
        this.prisma.$queryRawUnsafe(searchSQL, ...filterParams) as Promise<any[]>,
        this.prisma.$queryRawUnsafe(countSQL, ...filterParams) as Promise<any[]>,
      ]);

      const total = countResult[0]?.total || 0;

      // Re-shape results to match Prisma include format
      const data = results.map((r) => ({
        id: r.id,
        userId: r.userId,
        tier: r.tier,
        languages: r.languages,
        skills: r.skills,
        hourlyRate: r.hourlyRate,
        ratingAvg: r.ratingAvg,
        totalBookings: r.totalBookings,
        totalReviews: r.totalReviews,
        bio: r.bio,
        isApproved: r.isApproved,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        searchRank: r.search_rank,
        user: {
          id: r.user_id,
          firstName: r.firstName,
          lastName: r.lastName,
          profilePhoto: !isAuthenticated && r.profilePhoto ? this.generatePreviewUrl(r.profilePhoto) : r.profilePhoto,
        },
      }));

      return {
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        searchQuery: search,
      };
    } catch (err: any) {
      // Fallback to ILIKE search if ts_query fails (e.g., invalid syntax)
      return this.searchEscortsILike(search, opts, isAuthenticated);
    }
  }

  /**
   * Fallback ILIKE search for escorts (used when full-text search fails)
   */
  private async searchEscortsILike(
    search: string,
    opts: { page: number; limit: number; skip: number; tier?: string; minRate?: number; maxRate?: number; language?: string; skill?: string; sortBy: string },
    isAuthenticated = false,
  ) {
    const { page, limit, skip, tier, minRate, maxRate, language, skill, sortBy } = opts;
    const searchPattern = `%${search}%`;

    const where: any = {
      user: { isActive: true },
      isApproved: true,
      OR: [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { bio: { contains: search, mode: 'insensitive' } },
        { languages: { has: search } },
        { skills: { hasSome: search.split(/\s+/) } },
      ],
    };

    if (tier) where.tier = tier;
    if (minRate || maxRate) {
      where.hourlyRate = {};
      if (minRate) where.hourlyRate.gte = Number(minRate);
      if (maxRate) where.hourlyRate.lte = Number(maxRate);
    }
    if (language) where.languages = { has: language };
    if (skill) where.skills = { has: skill };

    const [escorts, total] = await Promise.all([
      this.prisma.escortProfile.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, profilePhoto: true } },
        },
        orderBy: { [sortBy]: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.escortProfile.count({ where }),
    ]);

    return {
      data: escorts.map(({ portfolioUrls, videoIntroUrl, ...rest }) => ({
        ...rest,
        ...(!isAuthenticated && rest.user?.profilePhoto ? {
          user: { ...rest.user, profilePhoto: this.generatePreviewUrl(rest.user.profilePhoto) },
        } : {}),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      searchQuery: search,
    };
  }

  /**
   * Search autocomplete suggestions from escort names, skills, and languages.
   */
  async getSearchSuggestions(q?: string) {
    if (!q || q.trim().length < 2) {
      // Return popular skills and languages when no query
      const popular = await this.prisma.escortProfile.findMany({
        where: { isApproved: true },
        select: { skills: true, languages: true },
        take: 50,
      });
      const skillCounts: Record<string, number> = {};
      const langCounts: Record<string, number> = {};
      popular.forEach((p) => {
        p.skills.forEach((s) => (skillCounts[s] = (skillCounts[s] || 0) + 1));
        p.languages.forEach((l) => (langCounts[l] = (langCounts[l] || 0) + 1));
      });
      return {
        suggestions: [],
        popularSkills: Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count })),
        popularLanguages: Object.entries(langCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count })),
      };
    }

    const term = q.trim();
    const results = await this.prisma.$queryRawUnsafe(`
      SELECT DISTINCT suggestion, type FROM (
        SELECT "firstName" || ' ' || "lastName" AS suggestion, 'escort' AS type
        FROM users u
        JOIN escort_profiles ep ON ep."userId" = u.id
        WHERE ep."isApproved" = true AND u."isActive" = true
          AND ("firstName" ILIKE $1 OR "lastName" ILIKE $1)
        UNION ALL
        SELECT DISTINCT unnest(skills) AS suggestion, 'skill' AS type
        FROM escort_profiles WHERE "isApproved" = true
          AND EXISTS (SELECT 1 FROM unnest(skills) s WHERE s ILIKE $1)
        UNION ALL
        SELECT DISTINCT unnest(languages) AS suggestion, 'language' AS type
        FROM escort_profiles WHERE "isApproved" = true
          AND EXISTS (SELECT 1 FROM unnest(languages) l WHERE l ILIKE $1)
      ) sub
      ORDER BY type, suggestion
      LIMIT 15
    `, `%${term}%`) as any[];

    return {
      suggestions: results.map((r) => ({ text: r.suggestion, type: r.type })),
    };
  }

  async getEscortDetail(idParam: string, isAuthenticated = false) {
    // Try by profile ID first, then by user ID for frontend compatibility
    let escort = await this.prisma.escortProfile.findUnique({
      where: { id: idParam },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            isVerified: true,
          },
        },
        certifications: {
          where: { isVerified: true },
        },
      },
    });

    // Fallback: lookup by userId
    if (!escort) {
      escort = await this.prisma.escortProfile.findUnique({
        where: { userId: idParam },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhoto: true,
              isVerified: true,
            },
          },
          certifications: {
            where: { isVerified: true },
          },
        },
      });
    }

    if (!escort) {
      throw new NotFoundException('Escort not found');
    }

    if (!isAuthenticated) {
      const previewPhoto = escort.user?.profilePhoto
        ? this.generatePreviewUrl(escort.user.profilePhoto)
        : null;
      const previewPortfolio = (escort.portfolioUrls || [])
        .slice(0, 3)
        .map((url) => this.generatePreviewUrl(url))
        .filter(Boolean);

      return {
        ...escort,
        portfolioUrls: previewPortfolio,
        videoIntroUrl: null,
        user: escort.user ? { ...escort.user, profilePhoto: previewPhoto } : escort.user,
      };
    }

    return escort;
  }

  async updateEscortProfile(userId: string, dto: UpdateEscortProfileDto) {
    const escort = await this.prisma.escortProfile.findUnique({
      where: { userId },
    });

    if (!escort) {
      throw new NotFoundException('Escort profile not found');
    }

    return this.prisma.escortProfile.update({
      where: { userId },
      data: {
        bio: dto.bio,
        languages: dto.languages,
        skills: dto.skills,
        hourlyRate: dto.hourlyRate,
        portfolioUrls: dto.portfolioUrls,
        videoIntroUrl: dto.videoIntroUrl,
        availabilitySchedule: dto.availabilitySchedule ?? undefined,
        // Physical appearance
        age: dto.age,
        height: dto.height,
        weight: dto.weight,
        bodyType: dto.bodyType,
        hairStyle: dto.hairStyle,
        eyeColor: dto.eyeColor,
        complexion: dto.complexion,
        // Personal background
        nationality: dto.nationality,
        occupation: dto.occupation,
        fieldOfWork: dto.fieldOfWork,
        basedIn: dto.basedIn,
        travelScope: dto.travelScope,
        // Lifestyle
        smoking: dto.smoking,
        tattooPiercing: dto.tattooPiercing,
        // Favourites
        favourites: dto.favourites ?? undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePhoto: true,
          },
        },
        certifications: true,
      },
    });
  }

  async addCertification(userId: string, dto: CreateCertificationDto) {
    const escort = await this.prisma.escortProfile.findUnique({
      where: { userId },
    });

    if (!escort) {
      throw new NotFoundException('Escort profile not found');
    }

    const cert = await this.prisma.certification.create({
      data: {
        escortId: escort.id,
        certType: dto.certType,
        certName: dto.certName,
        issuer: dto.issuer,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        documentUrl: dto.documentUrl,
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } });
    await this.notificationService.notifyAdmins(
      'Sertifikasi Baru Diupload',
      `${user?.firstName} ${user?.lastName} mengupload sertifikasi "${dto.certName}" (${dto.certType}). Menunggu verifikasi.`,
      'CERTIFICATION',
      { certificationId: cert.id, userId },
    );

    return cert;
  }

  async deleteCertification(userId: string, certificationId: string) {
    const escort = await this.prisma.escortProfile.findUnique({
      where: { userId },
    });

    if (!escort) {
      throw new NotFoundException('Escort profile not found');
    }

    const cert = await this.prisma.certification.findUnique({
      where: { id: certificationId },
    });

    if (!cert || cert.escortId !== escort.id) {
      throw new ForbiddenException('Cannot delete this certification');
    }

    await this.prisma.certification.delete({
      where: { id: certificationId },
    });

    return { message: 'Certification deleted' };
  }

  async updateAvailability(userId: string, dto: { schedule: Record<string, { start: string; end: string }>; blockedDates?: { start: string; end: string; reason?: string }[] }) {
    const escort = await this.prisma.escortProfile.findUnique({
      where: { userId },
    });

    if (!escort) {
      throw new NotFoundException('Escort profile not found');
    }

    return this.prisma.escortProfile.update({
      where: { userId },
      data: {
        availabilitySchedule: {
          weeklySchedule: dto.schedule,
          blockedDates: dto.blockedDates || [],
          updatedAt: new Date().toISOString(),
        },
      },
      select: {
        availabilitySchedule: true,
      },
    });
  }

  async getAvailability(userId: string) {
    const escort = await this.prisma.escortProfile.findUnique({
      where: { userId },
      select: { availabilitySchedule: true },
    });

    if (!escort) {
      throw new NotFoundException('Escort profile not found');
    }

    return escort.availabilitySchedule || {
      weeklySchedule: {},
      blockedDates: [],
    };
  }

  // ---- Favorites System ----

  async getFavorites(userId: string, rawPage = 1, rawLimit = 20) {
    const page = Math.max(1, Number(rawPage) || 1);
    const limit = Math.max(1, Math.min(100, Number(rawLimit) || 20));
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          escort: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhoto: true,
              escortProfile: {
                select: {
                  tier: true,
                  hourlyRate: true,
                  ratingAvg: true,
                  totalBookings: true,
                  languages: true,
                  skills: true,
                  isApproved: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);

    return {
      data: favorites.map((f) => ({
        id: f.id,
        addedAt: f.createdAt,
        escort: f.escort,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async addFavorite(userId: string, escortId: string) {
    // Verify escort exists
    const escort = await this.prisma.user.findFirst({
      where: { id: escortId, role: 'ESCORT' },
    });
    if (!escort) throw new NotFoundException('Escort tidak ditemukan');

    // Upsert to avoid duplicate errors
    const favorite = await this.prisma.favorite.upsert({
      where: { userId_escortId: { userId, escortId } },
      create: { userId, escortId },
      update: {},
    });

    return { ...favorite, message: 'Escort ditambahkan ke favorit' };
  }

  async removeFavorite(userId: string, escortId: string) {
    await this.prisma.favorite.deleteMany({
      where: { userId, escortId },
    });

    return { message: 'Escort dihapus dari favorit' };
  }

  async isFavorited(userId: string, escortId: string) {
    const fav = await this.prisma.favorite.findUnique({
      where: { userId_escortId: { userId, escortId } },
    });
    return { isFavorited: !!fav };
  }

  // ---- Quick Re-book ----

  async getRecentEscorts(userId: string, rawLimit = 5) {
    const limit = Math.max(1, Math.min(20, Number(rawLimit) || 5));
    const recentBookings = await this.prisma.booking.findMany({
      where: {
        clientId: userId,
        status: 'COMPLETED',
      },
      orderBy: { endTime: 'desc' },
      take: limit * 2, // fetch more to deduplicate
      select: {
        id: true,
        serviceType: true,
        location: true,
        startTime: true,
        endTime: true,
        totalAmount: true,
        escort: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            escortProfile: {
              select: {
                tier: true,
                hourlyRate: true,
                ratingAvg: true,
              },
            },
          },
        },
      },
    });

    // Deduplicate by escort ID, keep most recent
    const seen = new Set<string>();
    const unique = recentBookings.filter((b) => {
      if (seen.has(b.escort.id)) return false;
      seen.add(b.escort.id);
      return true;
    }).slice(0, limit);

    return unique.map((b) => ({
      escort: b.escort,
      lastBooking: {
        id: b.id,
        serviceType: b.serviceType,
        location: b.location,
        date: b.startTime,
        amount: b.totalAmount,
      },
    }));
  }

  async getEscortAnalytics(userId: string, period: string = 'month') {
    // Determine date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const escortFilter = { escortId: userId };
    const periodFilter = { escortId: userId, startTime: { gte: startDate } };

    // Parallel queries for performance
    const [
      totalBookings,
      completedBookings,
      cancelledBookings,
      bookingsByStatus,
      earningsAgg,
      reviewAgg,
      totalReviews,
      recentReviews,
      monthlyRaw,
    ] = await Promise.all([
      this.prisma.booking.count({ where: periodFilter }),
      this.prisma.booking.count({ where: { ...periodFilter, status: 'COMPLETED' } }),
      this.prisma.booking.count({ where: { ...periodFilter, status: 'CANCELLED' } }),
      this.prisma.booking.groupBy({
        by: ['status'],
        where: periodFilter,
        _count: { id: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          booking: escortFilter,
          status: { in: ['RELEASED', 'ESCROW'] },
          paidAt: { gte: startDate },
        },
        _sum: { escortPayout: true },
      }),
      this.prisma.review.aggregate({
        where: { revieweeId: userId },
        _avg: { rating: true },
      }),
      this.prisma.review.count({ where: { revieweeId: userId } }),
      this.prisma.review.findMany({
        where: { revieweeId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          reviewer: { select: { firstName: true } },
        },
      }),
      // Monthly earnings for last 6 months
      this.prisma.$queryRaw<{ month: string; amount: number }[]>`
        SELECT
          TO_CHAR(p."paidAt", 'Mon') AS month,
          COALESCE(SUM(p."escortPayout"), 0)::float AS amount
        FROM "payments" p
        JOIN "bookings" b ON b."id" = p."bookingId"
        WHERE b."escortId" = ${userId}
          AND p."status" IN ('RELEASED', 'ESCROW')
          AND p."paidAt" >= ${new Date(now.getFullYear(), now.getMonth() - 5, 1)}
        GROUP BY TO_CHAR(p."paidAt", 'Mon'), EXTRACT(MONTH FROM p."paidAt")
        ORDER BY EXTRACT(MONTH FROM p."paidAt")
      `,
    ]);

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalEarnings: Number(earningsAgg._sum.escortPayout || 0),
      avgRating: Number(reviewAgg._avg.rating || 0),
      totalReviews,
      monthlyEarnings: monthlyRaw,
      bookingsByStatus: bookingsByStatus.map((g) => ({
        status: g.status,
        count: g._count.id,
      })),
      recentReviews,
    };
  }
}
