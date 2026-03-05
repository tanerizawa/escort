import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity?: 'INFO' | 'WARN' | 'CRITICAL';
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditLog');

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          details: entry.details as any,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          severity: entry.severity || 'INFO',
        },
      });

      // Also log to console for monitoring
      const level = entry.severity === 'CRITICAL' ? 'error' : entry.severity === 'WARN' ? 'warn' : 'log';
      this.logger[level](
        `[${entry.action}] ${entry.resource}${entry.resourceId ? ':' + entry.resourceId : ''} by user:${entry.userId || 'system'} — ${JSON.stringify(entry.details || {})}`,
      );
    } catch (error: any) {
      // Never let audit logging break the main flow
      this.logger.error(`Failed to write audit log: ${error.message}`, error.stack);
    }
  }

  async logFromRequest(
    req: any,
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, any>,
    severity?: 'INFO' | 'WARN' | 'CRITICAL',
  ): Promise<void> {
    await this.log({
      userId: req.user?.id,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get?.('user-agent')?.substring(0, 200),
      severity,
    });
  }

  async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    severity?: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.resource) where.resource = filters.resource;
    if (filters.severity) where.severity = filters.severity;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserAuditTrail(userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
