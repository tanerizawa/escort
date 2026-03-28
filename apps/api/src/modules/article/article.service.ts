import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';

@Injectable()
export class ArticleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new article (escort or admin only)
   */
  async create(authorId: string, data: {
    title: string;
    content: string;
    excerpt?: string;
    category?: string;
    tags?: string[];
    coverImage?: string;
  }) {
    const slug = this.generateSlug(data.title);

    return this.prisma.article.create({
      data: {
        authorId,
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt || data.content.substring(0, 200).replace(/<[^>]*>/g, ''),
        category: data.category || 'tips',
        tags: data.tags || [],
        coverImage: data.coverImage,
        status: 'DRAFT',
      },
      include: { author: { select: { firstName: true, lastName: true, profilePhoto: true } } },
    });
  }

  /**
   * Update an article
   */
  async update(articleId: string, userId: string, userRole: string, data: Partial<{
    title: string;
    content: string;
    excerpt: string;
    category: string;
    tags: string[];
    coverImage: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  }>) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } });
    if (!article) throw new NotFoundException('Artikel tidak ditemukan');
    if (article.authorId !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      throw new ForbiddenException('Akses ditolak');
    }

    const updateData: any = { ...data };
    if (data.title) {
      updateData.slug = this.generateSlug(data.title);
    }
    if (data.status === 'PUBLISHED' && !article.publishedAt) {
      updateData.publishedAt = new Date();
    }

    return this.prisma.article.update({
      where: { id: articleId },
      data: updateData,
      include: { author: { select: { firstName: true, lastName: true, profilePhoto: true } } },
    });
  }

  /**
   * Get published articles (public)
   */
  async listPublished(page = 1, limit = 10, category?: string) {
    const where: any = { status: 'PUBLISHED' };
    if (category) where.category = category;

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: { select: { firstName: true, lastName: true, profilePhoto: true } },
        },
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      data: articles,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get article by slug (public)
   */
  async getBySlug(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: { firstName: true, lastName: true, profilePhoto: true, role: true },
        },
      },
    });

    if (!article || article.status !== 'PUBLISHED') {
      throw new NotFoundException('Artikel tidak ditemukan');
    }

    // Increment view count
    await this.prisma.article.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    });

    return article;
  }

  /**
   * Get my articles (author's draft & published)
   */
  async getMyArticles(authorId: string, page = 1, limit = 10) {
    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where: { authorId },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.article.count({ where: { authorId } }),
    ]);

    return {
      data: articles,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Delete article
   */
  async delete(articleId: string, userId: string, userRole: string) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } });
    if (!article) throw new NotFoundException('Artikel tidak ditemukan');
    if (article.authorId !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      throw new ForbiddenException('Akses ditolak');
    }

    await this.prisma.article.delete({ where: { id: articleId } });
    return { deleted: true };
  }

  /**
   * Admin: list all articles
   */
  async adminList(page = 1, limit = 20, status?: string) {
    const where: any = {};
    if (status) where.status = status;

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: { select: { firstName: true, lastName: true, role: true } },
        },
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      data: articles,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get article categories with counts
   */
  async getCategories() {
    const results = await this.prisma.article.groupBy({
      by: ['category'],
      where: { status: 'PUBLISHED' },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });

    return results.map((r) => ({
      category: r.category,
      count: r._count.category,
    }));
  }

  // ── Private helpers ──

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 80);

    const suffix = Date.now().toString(36).slice(-4);
    return `${base}-${suffix}`;
  }
}
