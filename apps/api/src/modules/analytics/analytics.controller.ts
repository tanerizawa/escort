import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getPlatformAnalytics() {
    return this.analyticsService.getPlatformAnalytics();
  }

  @Get('revenue/forecast')
  async getRevenueForecast() {
    return this.analyticsService.getRevenueForecast();
  }

  @Get('escorts/benchmarks')
  async getEscortBenchmarks(@Query('limit') limit?: string) {
    return this.analyticsService.getEscortBenchmarks(Number(limit) || 20);
  }

  @Get('bookings/trend')
  async getBookingTrend(@Query('days') days?: string) {
    return this.analyticsService.getBookingTrend(Number(days) || 30);
  }
}
