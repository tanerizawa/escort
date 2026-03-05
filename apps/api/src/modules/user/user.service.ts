import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';
import { UpdateEscortProfileDto } from './dto/user.dto';
import { CreateCertificationDto } from './dto/certification.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

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

  async listEscorts(query: any) {
    const { page = 1, limit = 20, search, tier, minRate, maxRate, language, skill, sortBy = 'ratingAvg' } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      user: { isActive: true },
      isApproved: true,
    };

    if (tier) where.tier = tier;
    if (minRate || maxRate) {
      where.hourlyRate = {};
      if (minRate) where.hourlyRate.gte = minRate;
      if (maxRate) where.hourlyRate.lte = maxRate;
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
        take: parseInt(limit),
      }),
      this.prisma.escortProfile.count({ where }),
    ]);

    return {
      data: escorts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEscortDetail(escortProfileId: string) {
    const escort = await this.prisma.escortProfile.findUnique({
      where: { id: escortProfileId },
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

    if (!escort) {
      throw new NotFoundException('Escort not found');
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

    return this.prisma.certification.create({
      data: {
        escortId: escort.id,
        certType: dto.certType,
        certName: dto.certName,
        issuer: dto.issuer,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        documentUrl: dto.documentUrl,
      },
    });
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

  async getFavorites(userId: string, page = 1, limit = 20) {
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

  async getRecentEscorts(userId: string, limit = 5) {
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
}
