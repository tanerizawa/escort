'use client';

import { useEffect, useState } from 'react';

interface DashboardStats {
  totalUsers: number;
  totalEscorts: number;
  activeBookings: number;
  pendingVerifications: number;
  monthlyRevenue: number;
  totalDisputes: number;
}

const defaultStats: DashboardStats = {
  totalUsers: 0,
  totalEscorts: 0,
  activeBookings: 0,
  pendingVerifications: 0,
  monthlyRevenue: 0,
  totalDisputes: 0,
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch from admin API
    const timer = setTimeout(() => {
      setStats({
        totalUsers: 0,
        totalEscorts: 0,
        activeBookings: 0,
        pendingVerifications: 0,
        monthlyRevenue: 0,
        totalDisputes: 0,
      });
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const kpiCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'text-blue-400' },
    { label: 'Total Escorts', value: stats.totalEscorts, icon: '⭐', color: 'text-brand-400' },
    { label: 'Active Bookings', value: stats.activeBookings, icon: '📅', color: 'text-emerald-400' },
    { label: 'Pending Verifikasi', value: stats.pendingVerifications, icon: '⏳', color: 'text-amber-400' },
    { label: 'Revenue Bulan Ini', value: `Rp ${stats.monthlyRevenue.toLocaleString('id-ID')}`, icon: '💰', color: 'text-green-400' },
    { label: 'Open Disputes', value: stats.totalDisputes, icon: '⚠️', color: 'text-red-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-light tracking-wide text-dark-100">Dashboard</h1>
        <p className="mt-1 text-sm text-dark-400">Overview performa platform ARETON.id</p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map((kpi, i) => (
          <div
            key={i}
            className={`rounded-xl border border-dark-700/50 bg-dark-800/40 p-5 transition-colors hover:border-dark-600/50 ${loading ? 'animate-pulse' : ''}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-dark-400">{kpi.label}</p>
              <span className="text-lg">{kpi.icon}</span>
            </div>
            <p className={`mt-3 text-2xl font-light ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity & Charts Placeholder */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-6">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-dark-300">Revenue Chart</h3>
          <div className="flex h-48 items-center justify-center text-dark-500">
            <p className="text-sm">Chart akan ditampilkan setelah integrasi Recharts (Phase 7)</p>
          </div>
        </div>

        <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-6">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-dark-300">Aktivitas Terbaru</h3>
          <div className="flex h-48 items-center justify-center text-dark-500">
            <p className="text-sm">Belum ada data aktivitas</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-6">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-dark-300">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Verifikasi Escort Baru', href: '/escorts/pending' },
            { label: 'Lihat Open Disputes', href: '/disputes' },
            { label: 'Kelola Users', href: '/users' },
            { label: 'Laporan Keuangan', href: '/finance' },
          ].map((action) => (
            <a
              key={action.href}
              href={action.href}
              className="rounded-lg border border-brand-400/20 bg-brand-400/5 px-4 py-2 text-sm text-brand-400 transition-colors hover:bg-brand-400/10"
            >
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
