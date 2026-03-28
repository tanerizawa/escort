import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Revenue forecasting — trend analysis based on historical data
   */
  async getRevenueForecast() {
    const now = new Date();
    const months: { month: string; revenue: number; bookings: number; avgOrderValue: number }[] = [];

    // Get last 6 months data
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const [revenue, bookings] = await Promise.all([
        this.prisma.payment.aggregate({
          where: {
            status: { in: ['ESCROW', 'RELEASED'] },
            paidAt: { gte: start, lte: end },
          },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.booking.count({
          where: {
            status: { in: ['COMPLETED', 'ONGOING', 'CONFIRMED'] },
            createdAt: { gte: start, lte: end },
          },
        }),
      ]);

      const totalRevenue = Number(revenue._sum.amount || 0);
      months.push({
        month: start.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        revenue: totalRevenue,
        bookings, 
        avgOrderValue: bookings > 0 ? Math.round(totalRevenue / bookings) : 0,
      });
    }

    // Simple linear regression forecast (next 3 months)
    const revenueValues = months.map((m) => m.revenue);
    const forecast = this.linearForecast(revenueValues, 3);

    const forecastMonths = forecast.map((value, i) => {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
      return {
        month: futureDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        projectedRevenue: Math.round(Math.max(0, value)),
        isProjection: true,
      };
    });

    return {
      historical: months,
      forecast: forecastMonths,
      growthRate: this.calculateGrowthRate(revenueValues),
    };
  }

  /**
   * Escort performance benchmarking
   */
  async getEscortBenchmarks(limit = 20) {
    const escorts = await this.prisma.escortProfile.findMany({
      where: { isApproved: true },
      include: {
        user: { select: { firstName: true, lastName: true, profilePhoto: true } },
      },
      orderBy: { ratingAvg: 'desc' },
      take: limit,
    });

    // Get booking counts for each escort
    const benchmarks = await Promise.all(
      escorts.map(async (escort) => {
        const [bookingStats, revenueStats, reviewCount] = await Promise.all([
          this.prisma.booking.groupBy({
            by: ['status'],
            where: { escortId: escort.userId },
            _count: true,
          }),
          this.prisma.payment.aggregate({
            where: {
              booking: { escortId: escort.userId },
              status: { in: ['ESCROW', 'RELEASED'] },
            },
            _sum: { amount: true, escortPayout: true },
          }),
          this.prisma.review.count({ where: { revieweeId: escort.userId } }),
        ]);

        const statusCounts = Object.fromEntries(
          bookingStats.map((s) => [s.status, s._count]),
        );

        const completedCount = statusCounts['COMPLETED'] || 0;
        const cancelledCount = statusCounts['CANCELLED'] || 0;
        const totalCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);

        return {
          id: escort.userId,
          name: `${escort.user.firstName} ${escort.user.lastName || ''}`.trim(),
          photo: escort.user.profilePhoto,
          tier: escort.tier,
          rating: escort.ratingAvg,
          totalBookings: totalCount,
          completedBookings: completedCount,
          completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
          cancellationRate: totalCount > 0 ? Math.round((cancelledCount / totalCount) * 100) : 0,
          totalRevenue: Number(revenueStats._sum.amount || 0),
          totalPayout: Number(revenueStats._sum.escortPayout || 0),
          reviewCount,
          hourlyRate: Number(escort.hourlyRate),
        };
      }),
    );

    // Calculate averages
    const avgRating = benchmarks.length > 0
      ? benchmarks.reduce((s, e) => s + e.rating, 0) / benchmarks.length
      : 0;
    const avgCompletionRate = benchmarks.length > 0
      ? benchmarks.reduce((s, e) => s + e.completionRate, 0) / benchmarks.length
      : 0;

    return {
      escorts: benchmarks.sort((a, b) => b.totalRevenue - a.totalRevenue),
      averages: {
        rating: Math.round(avgRating * 10) / 10,
        completionRate: Math.round(avgCompletionRate),
      },
    };
  }

  /**
   * Platform overview analytics
   */
  async getPlatformAnalytics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers30d,
      newUsers7d,
      totalEscorts,
      approvedEscorts,
      totalBookings,
      bookings30d,
      completedBookings,
      revenue30d,
      totalRevenue,
      avgRating,
      tierDistribution,
    ] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.escortProfile.count(),
      this.prisma.escortProfile.count({ where: { isApproved: true } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.booking.count({ where: { status: 'COMPLETED' } }),
      this.prisma.payment.aggregate({
        where: { paidAt: { gte: thirtyDaysAgo }, status: { in: ['ESCROW', 'RELEASED'] } },
        _sum: { amount: true, platformFee: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: { in: ['ESCROW', 'RELEASED'] } },
        _sum: { amount: true, platformFee: true },
      }),
      this.prisma.review.aggregate({ _avg: { rating: true } }),
      this.prisma.escortProfile.groupBy({
        by: ['tier'],
        _count: true,
      }),
    ]);

    // Conversion funnel
    const registeredClients = await this.prisma.user.count({ where: { role: 'CLIENT' } });
    const clientsWithBooking = await this.prisma.booking.findMany({
      select: { clientId: true },
      distinct: ['clientId'],
    });
    const clientsWithCompleted = await this.prisma.booking.findMany({
      where: { status: 'COMPLETED' },
      select: { clientId: true },
      distinct: ['clientId'],
    });

    return {
      users: {
        total: totalUsers,
        newLast30d: newUsers30d,
        newLast7d: newUsers7d,
        growthRate: totalUsers > 0 ? Math.round((newUsers30d / totalUsers) * 100) : 0,
      },
      escorts: {
        total: totalEscorts,
        approved: approvedEscorts,
        pendingApproval: totalEscorts - approvedEscorts,
        tierDistribution: Object.fromEntries(tierDistribution.map((t) => [t.tier, t._count])),
      },
      bookings: {
        total: totalBookings,
        last30d: bookings30d,
        completed: completedBookings,
        completionRate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0,
      },
      revenue: {
        total: Number(totalRevenue._sum.amount || 0),
        last30d: Number(revenue30d._sum.amount || 0),
        platformFeeTotal: Number(totalRevenue._sum.platformFee || 0),
        platformFee30d: Number(revenue30d._sum.platformFee || 0),
      },
      quality: {
        averageRating: Math.round((avgRating._avg.rating || 0) * 10) / 10,
      },
      conversionFunnel: {
        registered: registeredClients,
        firstBooking: clientsWithBooking.length,
        completed: clientsWithCompleted.length,
        conversionRate: registeredClients > 0
          ? Math.round((clientsWithBooking.length / registeredClients) * 100)
          : 0,
      },
    };
  }

  /**
   * Daily/weekly booking trend
   */
  async getBookingTrend(days = 30) {
    const results: { date: string; bookings: number; revenue: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);

      const [bookingCount, revenue] = await Promise.all([
        this.prisma.booking.count({
          where: { createdAt: { gte: start, lte: end } },
        }),
        this.prisma.payment.aggregate({
          where: { paidAt: { gte: start, lte: end }, status: { in: ['ESCROW', 'RELEASED'] } },
          _sum: { amount: true },
        }),
      ]);

      results.push({
        date: start.toISOString().split('T')[0],
        bookings: bookingCount,
        revenue: Number(revenue._sum.amount || 0),
      });
    }

    return results;
  }

  // ── Private helpers ──

  private linearForecast(data: number[], steps: number): number[] {
    const n = data.length;
    if (n < 2) return Array(steps).fill(data[0] || 0);

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i];
      sumXY += i * data[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return Array.from({ length: steps }, (_, i) => intercept + slope * (n + i));
  }

  private calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0;
    const recent = values[values.length - 1];
    const previous = values[values.length - 2];
    if (previous === 0) return 0;
    return Math.round(((recent - previous) / previous) * 100);
  }
}
