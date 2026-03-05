'use client';

import { useState } from 'react';

export default function AdminFinancePage() {
  const [period, setPeriod] = useState('month');

  const financeSummary = {
    totalRevenue: 0,
    platformFee: 0,
    escortPayouts: 0,
    pendingPayouts: 0,
    refunds: 0,
  };

  return (
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

      {/* Finance Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Revenue Chart Placeholder */}
      <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-6">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-dark-300">Revenue Trend</h3>
        <div className="flex h-64 items-center justify-center text-dark-500">
          <p className="text-sm">Grafik revenue akan ditampilkan menggunakan Recharts (Phase 7)</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="rounded-xl border border-dark-700/50">
        <div className="border-b border-dark-700/50 bg-dark-800/50 px-4 py-3">
          <h3 className="text-sm font-medium text-dark-300">Riwayat Transaksi</h3>
        </div>
        <div className="p-8 text-center text-dark-500">
          <p className="text-sm">Belum ada data transaksi</p>
        </div>
      </div>
    </div>
  );
}
