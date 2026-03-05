import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';
import { CreateReviewDto, ReplyReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reviewerId: string, dto: CreateReviewDto) {
    // Verify booking is completed
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
    });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException('Review hanya dapat diberikan untuk booking yang telah selesai');
    }

    // Ensure reviewer is part of the booking
    if (booking.clientId !== reviewerId && booking.escortId !== reviewerId) {
      throw new ForbiddenException('Anda tidak terlibat dalam booking ini');
    }

    // Ensure reviewee is the other party
    if (dto.revieweeId === reviewerId) {
      throw new BadRequestException('Tidak dapat mereview diri sendiri');
    }

    // Check if already reviewed
    const existing = await this.prisma.review.findUnique({
      where: {
        bookingId_reviewerId: {
          bookingId: dto.bookingId,
          reviewerId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Anda sudah memberikan review untuk booking ini');
    }

    const review = await this.prisma.review.create({
      data: {
        bookingId: dto.bookingId,
        reviewerId,
        revieweeId: dto.revieweeId,
        rating: dto.rating,
        comment: dto.comment,
        attitudeScore: dto.attitudeScore,
        punctualityScore: dto.punctualityScore,
        professionalismScore: dto.professionalismScore,
      },
    });

    // Update escort's average rating
    await this.updateEscortRating(dto.revieweeId);

    return review;
  }

  async findByEscort(escortId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { revieweeId: escortId, isFlagged: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: { select: { firstName: true, lastName: true, profilePhoto: true } },
          booking: { select: { serviceType: true, startTime: true } },
        },
      }),
      this.prisma.review.count({ where: { revieweeId: escortId, isFlagged: false } }),
    ]);

    return {
      data: reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        reviewer: { select: { firstName: true, lastName: true, profilePhoto: true } },
        reviewee: { select: { firstName: true, lastName: true, profilePhoto: true } },
        booking: { select: { serviceType: true, startTime: true, endTime: true } },
      },
    });

    if (!review) throw new NotFoundException('Review tidak ditemukan');
    return review;
  }

  async reply(userId: string, reviewId: string, dto: ReplyReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });

    if (!review) throw new NotFoundException('Review tidak ditemukan');
    if (review.revieweeId !== userId) {
      throw new ForbiddenException('Hanya penerima review yang dapat membalas');
    }
    if (review.replyComment) {
      throw new BadRequestException('Review sudah dibalas');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        replyComment: dto.replyComment,
        repliedAt: new Date(),
      },
    });
  }

  async flag(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review tidak ditemukan');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { isFlagged: true },
    });
  }

  private async updateEscortRating(escortUserId: string) {
    const result = await this.prisma.review.aggregate({
      where: { revieweeId: escortUserId },
      _avg: { rating: true },
      _count: { id: true },
    });

    await this.prisma.escortProfile.updateMany({
      where: { userId: escortUserId },
      data: {
        ratingAvg: result._avg.rating || 0,
        totalReviews: result._count.id,
      },
    });
  }
}
