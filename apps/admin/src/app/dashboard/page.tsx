'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin-layout';
import api from '@/lib/api';
import { Icon } from '@/components/ui/icon';
import { Check } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalEscorts: number;
  activeBookings: number;
  pendingVerifications: number;
  openIncidents: number;
  totalRevenue: number;
  totalPlatformFee: number;
  pendingKyc: number;
  pendingCertifications: number;
  pendingRefundClaims: number;
  pendingWithdrawals: number;
  disputedBookings: number;
}

const defaultStats: DashboardStats = {
  totalUsers: 0,
  totalEscorts: 0,
  activeBookings: 0,
  pendingVerifications: 0,
  openIncidents: 0,
  totalRevenue: 0,
  totalPlatformFee: 0,
  pendingKyc: 0,
  pendingCertifications: 0,
  pendingRefundClaims: 0,
  pendingWithdrawals: 0,
  disputedBookings: 0,
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/stats');
      const s = data?.data || data;
      setStats({
        totalUsers: s.totalUsers ?? 0,
        totalEscorts: s.totalEscorts ?? 0,
        activeBookings: s.activeBookings ?? 0,
        pendingVerifications: s.pendingVerifications ?? 0,
        openIncidents: s.openIncidents ?? 0,
        totalRevenue: s.totalRevenue ?? 0,
        totalPlatformFee: s.totalPlatformFee ?? 0,
        pendingKyc: s.pendingKyc ?? 0,
        pendingCertifications: s.pendingCertifications ?? 0,
        pendingRefundClaims: s.pendingRefundClaims ?? 0,
        pendingWithdrawals: s.pendingWithdrawals ?? 0,
        disputedBookings: s.disputedBookings ?? 0,
      });
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat statistik');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const kpiCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: 'Users', color: 'text-blue-400' },
    { label: 'Total Escorts', value: stats.totalEscorts, icon: 'Star', color: 'text-brand-400' },
    { label: 'Active Bookings', value: stats.activeBookings, icon: 'Calendar', color: 'text-emerald-400' },
    { label: 'Revenue', value: `Rp ${(stats.totalPlatformFee || 0).toLocaleString('id-ID')}`, icon: 'DollarSign', color: 'text-green-400' },
  ];

  const pendingApprovals = [
    { label: 'Verifikasi Escort', count: stats.pendingVerifications, href: '/users?tab=escort-pending', icon: 'User', desc: 'Escort baru menunggu persetujuan profil' },
    { label: 'Verifikasi KYC', count: stats.pendingKyc, href: '/users?tab=kyc', icon: 'Shield', desc: 'Dokumen identitas menunggu review' },
    { label: 'Sertifikasi', count: stats.pendingCertifications, href: '/users?tab=kyc', icon: 'Medal', desc: 'Sertifikat profesional menunggu verifikasi' },
    { label: 'Refund Claims', count: stats.pendingRefundClaims, href: '/finance', icon: 'Wallet', desc: 'Pengajuan refund menunggu keputusan' },
    { label: 'Withdrawal', count: stats.pendingWithdrawals, href: '/finance', icon: 'Landmark', desc: 'Pencairan dana menunggu diproses' },
    { label: 'Disputes', count: stats.disputedBookings, href: '/bookings?tab=disputes', icon: 'AlertTriangle', desc: 'Booking bermasalah perlu ditangani' },
    { label: 'Insiden Terbuka', count: stats.openIncidents, href: '/incidents', icon: 'ShieldAlert', desc: 'Laporan insiden belum diselesaikan' },
  ];

  const totalPending = pendingApprovals.reduce((sum, item) => sum + item.count, 0);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-light tracking-wide text-dark-100">Dashboard</h1>
          <p className="mt-1 text-sm text-dark-400">Overview performa platform ARETON.id</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
            <button onClick={fetchStats} className="ml-3 underline hover:no-underline">Retry</button>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((kpi, i) => (
            <div
              key={i}
              className={`rounded-xl border border-dark-700/50 bg-dark-800/40 p-5 transition-colors hover:border-dark-600/50 ${loading ? 'animate-pulse' : ''}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-dark-400">{kpi.label}</p>
                <span className="text-lg"><Icon name={kpi.icon} className="h-5 w-5" /></span>
              </div>
              <p className={`mt-3 text-2xl font-light ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Menunggu Persetujuan */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-light tracking-wide text-dark-100">Menunggu Persetujuan</h2>
            {totalPending > 0 && (
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                {totalPending}
              </span>
            )}
          </div>

          {totalPending === 0 && !loading ? (
            <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-8 text-center">
              <p className="text-dark-400"><Check className="h-4 w-4 inline-block text-emerald-400" /> Semua item sudah ditangani</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pendingApprovals.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group rounded-xl border p-4 transition-all ${
                    item.count > 0
                      ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-400/50 hover:bg-amber-500/10'
                      : 'border-dark-700/30 bg-dark-800/20 opacity-60 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg"><Icon name={item.icon} className="h-5 w-5" /></span>
                      <h3 className="text-sm font-medium text-dark-200">{item.label}</h3>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      item.count > 0
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-dark-700/30 text-dark-500'
                    }`}>
                      {item.count}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-dark-500">{item.desc}</p>
                  {item.count > 0 && (
                    <p className="mt-2 text-xs text-brand-400 group-hover:underline">Lihat & Proses →</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-6">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-dark-300">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Kelola Users', href: '/users' },
              { label: 'Monitoring Booking', href: '/monitoring' },
              { label: 'Laporan Keuangan', href: '/finance' },
              { label: 'Notifikasi', href: '/notifications' },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-lg border border-brand-400/20 bg-brand-400/5 px-4 py-2 text-sm text-brand-400 transition-colors hover:bg-brand-400/10"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
