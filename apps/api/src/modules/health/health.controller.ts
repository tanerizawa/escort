import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';
import { RedisService } from '@/config/redis.service';
import { Public } from '@/common/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @SkipThrottle()
  @Get()
  async check() {
    const checks: Record<string, { status: string; latency?: number }> = {};

    // Database check
    const dbStart = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'healthy', latency: Date.now() - dbStart };
    } catch {
      checks.database = { status: 'unhealthy', latency: Date.now() - dbStart };
    }

    // Redis check
    const redisStart = Date.now();
    try {
      await this.redis.set('health:check', 'ok', 10);
      const val = await this.redis.get('health:check');
      checks.redis = { status: val === 'ok' ? 'healthy' : 'degraded', latency: Date.now() - redisStart };
    } catch {
      checks.redis = { status: 'unhealthy', latency: Date.now() - redisStart };
    }

    // Disk check
    const diskStart = Date.now();
    try {
      const { existsSync } = require('fs');
      checks.disk = {
        status: existsSync(process.cwd() + '/uploads') ? 'healthy' : 'degraded',
        latency: Date.now() - diskStart,
      };
    } catch {
      checks.disk = { status: 'unhealthy' };
    }

    const allHealthy = Object.values(checks).every((c) => c.status === 'healthy');

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks,
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    };
  }

  @Public()
  @SkipThrottle()
  @Get('ready')
  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready' };
    } catch {
      return { status: 'not_ready' };
    }
  }

  @Public()
  @SkipThrottle()
  @Get('live')
  async liveness() {
    return { status: 'alive', uptime: Math.round(process.uptime()) };
  }
}
