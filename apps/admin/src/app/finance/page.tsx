'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin-layout';
import api from '@/lib/api';

export default function AdminFinancePage() {
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [financeSummary, setFinanceSummary] = useState({
    totalRevenue: 0,
    platformFee: 0,
    escortPayouts: 0,
    pendingPayouts: 0,
    refunds: 0,
  });

  const fetchFinance = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/finance/summary?period=${period}`);
      const s = data?.data || data;
      setFinanceSummary({
        totalRevenue: Number(s.totalRevenue ?? 0),
        platformFee: Number(s.platformFee ?? 0),
        escortPayouts: Number(s.escortPayouts ?? 0),
        pendingPayouts: Number(s.escortPayouts ?? 0) - Number(s.releasedPayouts ?? 0),
        refunds: Number(s.refunds ?? 0),
      });
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat data keuangan');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchFinance();
  }, [fetchFinance]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-wide text-dark-100">Keuangan</h1>
            <p className="mt-1 text-sm text-dark-400">Laporan keuangan dan rekonsiliasi platform</p>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-dark-700 bg-dark-800/50 px-3 py-2 text-sm text-dark-200 focus:border-brand-400/50 focus:outline-none"
          >
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="quarter">Kuartal Ini</option>
            <option value="year">Tahun Ini</option>
          </select>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {/* Finance Cards */}
        <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'animate-pulse' : ''}`}>
          {[
            { label: 'Total Revenue', value: financeSummary.totalRevenue, color: 'text-emerald-400' },
            { label: 'Platform Fee (20%)', value: financeSummary.platformFee, color: 'text-brand-400' },
            { label: 'Escort Payouts', value: financeSummary.escortPayouts, color: 'text-blue-400' },
            { label: 'Pending Payouts', value: financeSummary.pendingPayouts, color: 'text-amber-400' },
            { label: 'Refunds', value: financeSummary.refunds, color: 'text-red-400' },
          ].map((card, i) => (
            <div key={i} className="rounded-xl border border-dark-700/50 bg-dark-800/40 p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-dark-400">{card.label}</p>
              <p className={`mt-2 text-2xl font-light ${card.color}`}>
                Rp {card.value.toLocaleString('id-ID')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
