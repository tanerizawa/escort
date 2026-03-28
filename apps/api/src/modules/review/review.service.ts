import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';
import { EmailService } from '@modules/notification/email.service';
import { CreateReviewDto, ReplyReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

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

    // Ensure reviewee is the other party (not just "not self")
    if (dto.revieweeId === reviewerId) {
      throw new BadRequestException('Tidak dapat mereview diri sendiri');
    }

    // Validate revieweeId is actually the other booking participant
    const otherParty = booking.clientId === reviewerId ? booking.escortId : booking.clientId;
    if (dto.revieweeId !== otherParty) {
      throw new BadRequestException('revieweeId harus merupakan pihak lain dalam booking ini');
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

    // Send email notification to reviewee
    const [reviewer, reviewee] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: reviewerId }, select: { firstName: true, lastName: true } }),
      this.prisma.user.findUnique({ where: { id: dto.revieweeId }, select: { email: true, firstName: true } }),
    ]);
    if (reviewee) {
      this.emailService.sendNewReview(reviewee.email, {
        name: reviewee.firstName,
        reviewerName: `${reviewer?.firstName || ''} ${reviewer?.lastName || ''}`.trim(),
        rating: dto.rating,
        comment: dto.comment || '',
      }).catch(() => {});
    }

    return review;
  }

  async findByEscort(escortId: string, page = 1, limit = 10) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 10));
    const skip = (safePage - 1) * safeLimit;

    const [reviews, total, aggregate] = await Promise.all([
      this.prisma.review.findMany({
        where: { revieweeId: escortId, isFlagged: false },
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: { select: { firstName: true, lastName: true, profilePhoto: true } },
          booking: { select: { serviceType: true, startTime: true } },
        },
      }),
      this.prisma.review.count({ where: { revieweeId: escortId, isFlagged: false } }),
      this.prisma.review.aggregate({
        where: { revieweeId: escortId, isFlagged: false },
        _avg: { rating: true },
      }),
    ]);

    return {
      data: reviews,
      averageRating: aggregate._avg.rating || 0,
      pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  async findByReviewer(reviewerId: string, page = 1, limit = 10) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 10));
    const skip = (safePage - 1) * safeLimit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { reviewerId, isFlagged: false },
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewee: { select: { firstName: true, lastName: true, profilePhoto: true } },
          booking: { select: { serviceType: true, startTime: true } },
        },
      }),
      this.prisma.review.count({ where: { reviewerId, isFlagged: false } }),
    ]);

    return {
      data: reviews,
      pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
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

    // Only the reviewee (person being reviewed) or admin can flag a review
    // Check if user is the reviewee or admin
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    if (review.revieweeId !== userId && !isAdmin) {
      throw new ForbiddenException('Hanya penerima review atau admin yang dapat melaporkan review');
    }

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
