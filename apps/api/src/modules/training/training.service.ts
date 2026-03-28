import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';

@Injectable()
export class TrainingService {
  constructor(private prisma: PrismaService) {}

  // ── Module CRUD ──────────────────────────

  async createModule(data: {
    title: string;
    description: string;
    category: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    durationMins?: number;
    sortOrder?: number;
    isRequired?: boolean;
    passingScore?: number;
  }) {
    return this.prisma.trainingModule.create({ data });
  }

  async listModules(params?: {
    category?: string;
    isPublished?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params?.limit) || 20));
    const where: any = {};
    if (params?.category) where.category = params.category;
    if (params?.isPublished !== undefined) where.isPublished = params.isPublished;

    const [data, total] = await Promise.all([
      this.prisma.trainingModule.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.trainingModule.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getModule(id: string) {
    const mod = await this.prisma.trainingModule.findUnique({ where: { id } });
    if (!mod) throw new NotFoundException('Training module not found');
    return mod;
  }

  async updateModule(id: string, data: Partial<{
    title: string;
    description: string;
    category: string;
    videoUrl: string;
    thumbnailUrl: string;
    durationMins: number;
    sortOrder: number;
    isRequired: boolean;
    isPublished: boolean;
    passingScore: number;
  }>) {
    await this.getModule(id);
    return this.prisma.trainingModule.update({ where: { id }, data });
  }

  async deleteModule(id: string) {
    await this.getModule(id);
    return this.prisma.trainingModule.delete({ where: { id } });
  }

  // ── Progress Tracking ────────────────────

  async getUserProgress(userId: string) {
    const progress = await this.prisma.trainingProgress.findMany({
      where: { userId },
      include: { module: true },
      orderBy: { module: { sortOrder: 'asc' } },
    });

    const totalModules = await this.prisma.trainingModule.count({
      where: { isPublished: true },
    });
    const completed = progress.filter((p: any) => p.status === 'COMPLETED').length;

    return {
      progress,
      totalModules,
      completedModules: completed,
      completionRate: totalModules > 0 ? Math.round((completed / totalModules) * 100) : 0,
    };
  }

  async startModule(userId: string, moduleId: string) {
    await this.getModule(moduleId);

    return this.prisma.trainingProgress.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      create: { userId, moduleId, status: 'IN_PROGRESS' },
      update: { lastAccessedAt: new Date(), status: 'IN_PROGRESS' },
    });
  }

  async updateProgress(userId: string, moduleId: string, data: {
    progressPct: number;
    score?: number;
  }) {
    const module = await this.getModule(moduleId);
    const isComplete = data.progressPct >= 100 && (!data.score || data.score >= module.passingScore);

    return this.prisma.trainingProgress.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      create: {
        userId,
        moduleId,
        progressPct: data.progressPct,
        score: data.score,
        status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: isComplete ? new Date() : null,
      },
      update: {
        progressPct: data.progressPct,
        score: data.score,
        lastAccessedAt: new Date(),
        status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: isComplete ? new Date() : undefined,
      },
    });
  }

  async getModuleWithProgress(userId: string, moduleId: string) {
    const [module, progress] = await Promise.all([
      this.getModule(moduleId),
      this.prisma.trainingProgress.findUnique({
        where: { userId_moduleId: { userId, moduleId } },
      }),
    ]);

    return { ...module, progress };
  }

  // ── Admin Stats ──────────────────────────

  async getStats() {
    const [totalModules, totalRequired, progressStats] = await Promise.all([
      this.prisma.trainingModule.count({ where: { isPublished: true } }),
      this.prisma.trainingModule.count({ where: { isRequired: true, isPublished: true } }),
      this.prisma.trainingProgress.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const categories = await this.prisma.trainingModule.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { isPublished: true },
    });

    return {
      totalModules,
      totalRequired,
      byStatus: progressStats.reduce((acc: Record<string, number>, s: any) => ({ ...acc, [s.status]: s._count.id }), {}),
      byCategory: categories.reduce((acc: Record<string, number>, c: any) => ({ ...acc, [c.category]: c._count.id }), {}),
    };
  }
}
