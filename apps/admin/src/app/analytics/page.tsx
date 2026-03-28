'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import AdminLayout from '@/components/admin-layout';

interface PlatformAnalytics {
  users: { total: number; newLast30d: number; newLast7d: number; growthRate: number };
  escorts: { total: number; approved: number; pendingApproval: number; tierDistribution: Record<string, number> };
  bookings: { total: number; last30d: number; completed: number; completionRate: number };
  revenue: { total: number; last30d: number; platformFeeTotal: number; platformFee30d: number };
  quality: { averageRating: number };
  conversionFunnel: { registered: number; firstBooking: number; completed: number; conversionRate: number };
}

interface RevenueForecast {
  historical: { month: string; revenue: number; bookings: number; avgOrderValue: number }[];
  forecast: { month: string; projectedRevenue: number; isProjection: boolean }[];
  growthRate: number;
}

interface EscortBenchmark {
  id: string;
  name: string;
  photo: string | null;
  tier: string;
  rating: number;
  totalBookings: number;
  completedBookings: number;
  completionRate: number;
  cancellationRate: number;
  totalRevenue: number;
  totalPayout: number;
  reviewCount: number;
  hourlyRate: number;
}

interface BookingTrend {
  date: string;
  bookings: number;
  revenue: number;
}

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState<PlatformAnalytics | null>(null);
  const [forecast, setForecast] = useState<RevenueForecast | null>(null);
  const [benchmarks, setBenchmarks] = useState<EscortBenchmark[]>([]);
  const [benchmarkAvg, setBenchmarkAvg] = useState<{ rating: number; completionRate: number } | null>(null);
  const [trend, setTrend] = useState<BookingTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'escorts' | 'trends'>('overview');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [overviewRes, forecastRes, benchRes, trendRes] = await Promise.all([
        api.get('/analytics/overview').catch(() => null),
        api.get('/analytics/revenue/forecast').catch(() => null),
        api.get('/analytics/escorts/benchmarks?limit=20').catch(() => null),
        api.get('/analytics/bookings/trend?days=30').catch(() => null),
      ]);

      if (overviewRes) {
        const d = overviewRes.data?.data || overviewRes.data;
        setOverview(d);
      }
      if (forecastRes) {
        const d = forecastRes.data?.data || forecastRes.data;
        setForecast(d);
      }
      if (benchRes) {
        const d = benchRes.data?.data || benchRes.data;
        setBenchmarks(d?.escorts || []);
        setBenchmarkAvg(d?.averages || null);
      }
      if (trendRes) {
        const d = trendRes.data?.data || trendRes.data;
        setTrend(Array.isArray(d) ? d : []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

  const formatNumber = (n: number) =>
    new Intl.NumberFormat('id-ID').format(n);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-dark-600 border-t-brand-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light tracking-wide text-dark-100">Analytics</h1>
        <p className="mt-1 text-sm text-dark-400">Analisis mendalam platform</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg bg-dark-800/50 p-1">
        {([
          { key: 'overview', label: 'Overview' },
          { key: 'revenue', label: 'Revenue Forecast' },
          { key: 'escorts', label: 'Escort Benchmarks' },
          { key: 'trends', label: 'Booking Trends' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-dark-700 text-dark-100'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total Users" value={formatNumber(overview.users.total)} sub={`+${overview.users.newLast30d} (30 hari)`} color="brand" />
            <MetricCard label="Total Bookings" value={formatNumber(overview.bookings.total)} sub={`${overview.bookings.completionRate}% selesai`} color="emerald" />
            <MetricCard label="Revenue (30d)" value={formatCurrency(overview.revenue.last30d)} sub={`Total: ${formatCurrency(overview.revenue.total)}`} color="amber" />
            <MetricCard label="Avg Rating" value={String(overview.quality.averageRating)} sub={`${overview.escorts.approved} escort aktif`} color="purple" />
          </div>

          {/* Users & Escorts */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-5 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-dark-400">Users</h3>
              <div className="space-y-2 text-sm">
                <Row label="Total Aktif" value={formatNumber(overview.users.total)} />
                <Row label="Baru (7 hari)" value={formatNumber(overview.users.newLast7d)} />
                <Row label="Baru (30 hari)" value={formatNumber(overview.users.newLast30d)} />
                <Row label="Growth Rate" value={`${overview.users.growthRate}%`} />
              </div>
            </div>
            <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-5 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-dark-400">Escorts</h3>
              <div className="space-y-2 text-sm">
                <Row label="Total" value={formatNumber(overview.escorts.total)} />
                <Row label="Approved" value={formatNumber(overview.escorts.approved)} />
                <Row label="Pending Approval" value={formatNumber(overview.escorts.pendingApproval)} />
                {Object.entries(overview.escorts.tierDistribution).map(([tier, count]) => (
                  <Row key={tier} label={`Tier ${tier}`} value={String(count)} />
                ))}
              </div>
            </div>
          </div>

          {/* Revenue & Conversion */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-5 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-dark-400">Revenue</h3>
              <div className="space-y-2 text-sm">
                <Row label="Total Revenue" value={formatCurrency(overview.revenue.total)} />
                <Row label="Revenue (30d)" value={formatCurrency(overview.revenue.last30d)} />
                <Row label="Platform Fee Total" value={formatCurrency(overview.revenue.platformFeeTotal)} />
                <Row label="Platform Fee (30d)" value={formatCurrency(overview.revenue.platformFee30d)} />
              </div>
            </div>
            <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-5 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-dark-400">Conversion Funnel</h3>
              <div className="space-y-2 text-sm">
                <Row label="Registered Clients" value={formatNumber(overview.conversionFunnel.registered)} />
                <Row label="First Booking" value={formatNumber(overview.conversionFunnel.firstBooking)} />
                <Row label="Completed" value={formatNumber(overview.conversionFunnel.completed)} />
                <Row label="Conversion Rate" value={`${overview.conversionFunnel.conversionRate}%`} />
              </div>
              {/* Funnel Visual */}
              <div className="space-y-1 pt-2">
                <FunnelBar label="Registered" value={overview.conversionFunnel.registered} max={overview.conversionFunnel.registered} />
                <FunnelBar label="Booked" value={overview.conversionFunnel.firstBooking} max={overview.conversionFunnel.registered} />
                <FunnelBar label="Completed" value={overview.conversionFunnel.completed} max={overview.conversionFunnel.registered} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Forecast Tab */}
      {activeTab === 'revenue' && forecast && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 px-5 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-dark-500">Growth Rate</p>
              <p className={`text-xl font-light ${forecast.growthRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {forecast.growthRate >= 0 ? '+' : ''}{forecast.growthRate}%
              </p>
            </div>
          </div>

          {/* Historical Table */}
          <div className="rounded-lg border border-dark-700/50 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-800/50">
                <tr className="text-left text-xs uppercase tracking-wider text-dark-500">
                  <th className="px-4 py-3">Bulan</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Bookings</th>
                  <th className="px-4 py-3">Avg Order</th>
                  <th className="px-4 py-3">Visual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/30">
                {forecast.historical.map((m) => {
                  const maxRevenue = Math.max(...forecast.historical.map((h) => h.revenue), 1);
                  return (
                    <tr key={m.month} className="hover:bg-dark-800/30">
                      <td className="px-4 py-3 text-dark-200">{m.month}</td>
                      <td className="px-4 py-3 text-dark-300">{formatCurrency(m.revenue)}</td>
                      <td className="px-4 py-3 text-dark-300">{m.bookings}</td>
                      <td className="px-4 py-3 text-dark-300">{formatCurrency(m.avgOrderValue)}</td>
                      <td className="px-4 py-3">
                        <div className="h-2 w-full rounded-full bg-dark-700/50">
                          <div
                            className="h-2 rounded-full bg-brand-400"
                            style={{ width: `${(m.revenue / maxRevenue) * 100}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {forecast.forecast.map((m) => (
                  <tr key={m.month} className="hover:bg-dark-800/30 opacity-70">
                    <td className="px-4 py-3 text-dark-200">
                      {m.month} <span className="text-xs text-brand-400">(proyeksi)</span>
                    </td>
                    <td className="px-4 py-3 text-dark-400 italic">{formatCurrency(m.projectedRevenue)}</td>
                    <td className="px-4 py-3 text-dark-500">—</td>
                    <td className="px-4 py-3 text-dark-500">—</td>
                    <td className="px-4 py-3">
                      <div className="h-2 w-full rounded-full bg-dark-700/50">
                        <div
                          className="h-2 rounded-full bg-brand-400/40 border border-brand-400/30"
                          style={{ width: `${Math.min(100, (m.projectedRevenue / Math.max(...forecast.historical.map((h) => h.revenue), 1)) * 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Escort Benchmarks Tab */}
      {activeTab === 'escorts' && (
        <div className="space-y-6">
          {benchmarkAvg && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-dark-500">Avg Rating</p>
                <p className="text-2xl font-light text-brand-400">{benchmarkAvg.rating} ★</p>
              </div>
              <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-dark-500">Avg Completion Rate</p>
                <p className="text-2xl font-light text-emerald-400">{benchmarkAvg.completionRate}%</p>
              </div>
            </div>
          )}

          {benchmarks.length === 0 ? (
            <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-10 text-center text-dark-400">
              Belum ada data benchmark
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-dark-700/50">
              <table className="w-full text-sm">
                <thead className="bg-dark-800/50">
                  <tr className="text-left text-xs uppercase tracking-wider text-dark-500">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Escort</th>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Bookings</th>
                    <th className="px-4 py-3">Completion</th>
                    <th className="px-4 py-3">Revenue</th>
                    <th className="px-4 py-3">Payout</th>
                    <th className="px-4 py-3">Rate/hr</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/30">
                  {benchmarks.map((e, i) => (
                    <tr key={e.id} className="hover:bg-dark-800/30">
                      <td className="px-4 py-3 text-dark-500">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-400/20 text-xs text-brand-400">
                            {e.name.charAt(0)}
                          </div>
                          <span className="text-dark-200">{e.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-brand-400/10 px-2 py-0.5 text-xs text-brand-400">{e.tier}</span>
                      </td>
                      <td className="px-4 py-3 text-amber-400">{e.rating} ★</td>
                      <td className="px-4 py-3 text-dark-300">
                        {e.completedBookings}/{e.totalBookings}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${e.completionRate >= 80 ? 'text-emerald-400' : e.completionRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          {e.completionRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-dark-300">{formatCurrency(e.totalRevenue)}</td>
                      <td className="px-4 py-3 text-dark-300">{formatCurrency(e.totalPayout)}</td>
                      <td className="px-4 py-3 text-dark-300">{formatCurrency(e.hourlyRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Booking Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {trend.length === 0 ? (
            <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-10 text-center text-dark-400">
              Belum ada data trend
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-dark-500">Total Bookings (30d)</p>
                  <p className="mt-1 text-2xl font-light text-dark-100">
                    {formatNumber(trend.reduce((s, t) => s + t.bookings, 0))}
                  </p>
                </div>
                <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-dark-500">Total Revenue (30d)</p>
                  <p className="mt-1 text-2xl font-light text-emerald-400">
                    {formatCurrency(trend.reduce((s, t) => s + t.revenue, 0))}
                  </p>
                </div>
                <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-dark-500">Avg Bookings/Day</p>
                  <p className="mt-1 text-2xl font-light text-brand-400">
                    {(trend.reduce((s, t) => s + t.bookings, 0) / (trend.length || 1)).toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Bar chart visual */}
              <div className="rounded-lg border border-dark-700/50 bg-dark-800/30 p-5">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-dark-400">Daily Bookings</h3>
                <div className="flex items-end gap-1" style={{ height: '160px' }}>
                  {trend.map((t) => {
                    const maxBookings = Math.max(...trend.map((d) => d.bookings), 1);
                    const height = (t.bookings / maxBookings) * 100;
                    return (
                      <div
                        key={t.date}
                        className="group relative flex-1 rounded-t bg-brand-400/60 hover:bg-brand-400 transition-colors cursor-default"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${t.date}: ${t.bookings} bookings, ${formatCurrency(t.revenue)}`}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded bg-dark-800 px-2 py-1 text-xs text-dark-200 border border-dark-700/50">
                          {t.bookings}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex justify-between text-xs text-dark-500">
                  <span>{trend[0]?.date}</span>
                  <span>{trend[trend.length - 1]?.date}</span>
                </div>
              </div>

              {/* Revenue bar chart */}
              <div className="rounded-lg border border-dark-700/50 bg-dark-800/30 p-5">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-dark-400">Daily Revenue</h3>
                <div className="flex items-end gap-1" style={{ height: '160px' }}>
                  {trend.map((t) => {
                    const maxRevenue = Math.max(...trend.map((d) => d.revenue), 1);
                    const height = (t.revenue / maxRevenue) * 100;
                    return (
                      <div
                        key={t.date}
                        className="group relative flex-1 rounded-t bg-emerald-400/60 hover:bg-emerald-400 transition-colors cursor-default"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${t.date}: ${formatCurrency(t.revenue)}`}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded bg-dark-800 px-2 py-1 text-xs text-dark-200 border border-dark-700/50">
                          {formatCurrency(t.revenue)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex justify-between text-xs text-dark-500">
                  <span>{trend[0]?.date}</span>
                  <span>{trend[trend.length - 1]?.date}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
    </AdminLayout>
  );
}

// ── Sub-components ──

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colorClass = {
    brand: 'text-brand-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    purple: 'text-purple-400',
  }[color] || 'text-dark-100';

  return (
    <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-dark-500">{label}</p>
      <p className={`mt-1 text-2xl font-light ${colorClass}`}>{value}</p>
      <p className="mt-0.5 text-xs text-dark-500">{sub}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-dark-400">{label}</span>
      <span className="text-dark-200 font-medium">{value}</span>
    </div>
  );
}

function FunnelBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-xs text-dark-400">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-dark-700/50">
        <div className="h-3 rounded-full bg-brand-400/60" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-xs text-dark-300">{value}</span>
    </div>
  );
}
