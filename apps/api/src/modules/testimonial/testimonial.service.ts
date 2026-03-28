import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';

@Injectable()
export class TestimonialService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit a testimonial (client only, must have completed booking)
   */
  async create(userId: string, content: string, rating: number) {
    if (rating < 1 || rating > 5) throw new BadRequestException('Rating harus 1-5');
    if (!content || content.length < 10) throw new BadRequestException('Testimonial minimal 10 karakter');

    // Check user has at least 1 completed booking
    const completedBooking = await this.prisma.booking.findFirst({
      where: { clientId: userId, status: 'COMPLETED' },
    });
    if (!completedBooking) {
      throw new BadRequestException('Anda harus memiliki minimal 1 booking selesai untuk memberikan testimonial');
    }

    // Check if user already submitted (limit 1 per user)
    const existing = await this.prisma.testimonial.findFirst({
      where: { userId },
    });
    if (existing) {
      // Update existing
      return this.prisma.testimonial.update({
        where: { id: existing.id },
        data: { content, rating, isApproved: false },
        include: { user: { select: { firstName: true, lastName: true, profilePhoto: true } } },
      });
    }

    return this.prisma.testimonial.create({
      data: { userId, content, rating },
      include: { user: { select: { firstName: true, lastName: true, profilePhoto: true } } },
    });
  }

  /**
   * Get approved testimonials (public)
   */
  async listApproved(limit = 10, featuredOnly = false) {
    const where: any = { isApproved: true };
    if (featuredOnly) where.isFeatured = true;

    const testimonials = await this.prisma.testimonial.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: {
        user: { select: { firstName: true, lastName: true, profilePhoto: true } },
      },
    });

    return testimonials.map((t) => ({
      id: t.id,
      content: t.content,
      rating: t.rating,
      isFeatured: t.isFeatured,
      author: `${t.user.firstName} ${t.user.lastName?.charAt(0) || ''}.`,
      photo: t.user.profilePhoto,
      createdAt: t.createdAt,
    }));
  }

  /**
   * Admin: list all testimonials
   */
  async adminList(page = 1, limit = 20) {
    const [testimonials, total] = await Promise.all([
      this.prisma.testimonial.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.testimonial.count(),
    ]);

    return {
      data: testimonials,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Admin: approve/reject/feature a testimonial
   */
  async adminUpdate(testimonialId: string, data: { isApproved?: boolean; isFeatured?: boolean }) {
    const testimonial = await this.prisma.testimonial.findUnique({ where: { id: testimonialId } });
    if (!testimonial) throw new NotFoundException('Testimonial tidak ditemukan');

    return this.prisma.testimonial.update({
      where: { id: testimonialId },
      data: {
        ...data,
        ...(data.isApproved ? { approvedAt: new Date() } : {}),
      },
    });
  }

  /**
   * Admin: delete a testimonial
   */
  async adminDelete(testimonialId: string) {
    await this.prisma.testimonial.delete({ where: { id: testimonialId } });
    return { deleted: true };
  }
}
