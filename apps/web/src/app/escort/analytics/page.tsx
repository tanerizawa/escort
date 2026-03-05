'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import api from '@/lib/api';

interface AnalyticsData {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalEarnings: number;
  avgRating: number;
  totalReviews: number;
  monthlyEarnings: { month: string; amount: number }[];
  bookingsByStatus: { status: string; count: number }[];
  recentReviews: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    reviewer: { firstName: string };
  }[];
}

export default function EscortAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/escorts/me/analytics?period=${period}`);
      setData(res.data);
    } catch {
      // Fallback demo data
      setData({
        totalBookings: 48,
        completedBookings: 42,
        cancelledBookings: 3,
        totalEarnings: 25600000,
        avgRating: 4.8,
        totalReviews: 38,
        monthlyEarnings: [
          { month: 'Jan', amount: 3200000 },
          { month: 'Feb', amount: 4100000 },
          { month: 'Mar', amount: 3800000 },
          { month: 'Apr', amount: 5200000 },
          { month: 'Mei', amount: 4800000 },
          { month: 'Jun', amount: 4500000 },
        ],
        bookingsByStatus: [
          { status: 'COMPLETED', count: 42 },
          { status: 'CANCELLED', count: 3 },
          { status: 'ONGOING', count: 1 },
          { status: 'PENDING', count: 2 },
        ],
        recentReviews: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  if (!data) return null;

  const completionRate = data.totalBookings > 0
    ? Math.round((data.completedBookings / data.totalBookings) * 100)
    : 0;

  const maxEarning = Math.max(...data.monthlyEarnings.map((e) => e.amount), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Performance Analytics</h1>
        <div className="flex gap-1 rounded-lg bg-dark-800 p-1">
          {['week', 'month', 'quarter', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p
                  ? 'bg-brand-400 text-dark-900'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {p === 'week' ? 'Minggu' : p === 'month' ? 'Bulan' : p === 'quarter' ? 'Kuartal' : 'Tahun'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Total Booking</p>
              <p className="mt-2 text-3xl font-bold text-white">{data.totalBookings}</p>
              <p className="mt-1 text-xs text-green-400">{completionRate}% selesai</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Total Pendapatan</p>
              <p className="mt-2 text-2xl font-bold text-brand-400">{formatCurrency(data.totalEarnings)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Rating Rata-rata</p>
              <p className="mt-2 text-3xl font-bold text-yellow-400">
                ★ {data.avgRating.toFixed(1)}
              </p>
              <p className="mt-1 text-xs text-gray-400">{data.totalReviews} ulasan</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Tingkat Pembatalan</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {data.totalBookings > 0
                  ? Math.round((data.cancelledBookings / data.totalBookings) * 100)
                  : 0}%
              </p>
              <p className="mt-1 text-xs text-gray-400">{data.cancelledBookings} dibatalkan</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Chart (CSS bar chart) */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Tren Pendapatan</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-48">
            {data.monthlyEarnings.map((entry) => (
              <div key={entry.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400">
                  {formatCurrency(entry.amount).replace('Rp', '').trim()}
                </span>
                <div
                  className="w-full bg-brand-400/80 rounded-t-md transition-all duration-500"
                  style={{ height: `${(entry.amount / maxEarning) * 100}%`, minHeight: 4 }}
                />
                <span className="text-xs text-gray-400">{entry.month}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Booking Status Breakdown */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Status Booking</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.bookingsByStatus.map((item) => {
              const pct = data.totalBookings > 0
                ? Math.round((item.count / data.totalBookings) * 100)
                : 0;
              const colors: Record<string, string> = {
                COMPLETED: 'bg-green-500',
                CANCELLED: 'bg-red-500',
                ONGOING: 'bg-blue-500',
                PENDING: 'bg-yellow-500',
                CONFIRMED: 'bg-brand-400',
                DISPUTED: 'bg-orange-500',
              };
              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">{item.status}</span>
                    <span className="text-gray-400">{item.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-dark-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${colors[item.status] || 'bg-gray-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
