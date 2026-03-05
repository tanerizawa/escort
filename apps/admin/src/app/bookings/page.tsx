'use client';

import { useState } from 'react';

interface BookingRow {
  id: string;
  clientName: string;
  escortName: string;
  date: string;
  duration: number;
  status: string;
  totalAmount: number;
}

export default function AdminBookingsPage() {
  const [bookings] = useState<BookingRow[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-500/10 text-amber-400',
    CONFIRMED: 'bg-blue-500/10 text-blue-400',
    ONGOING: 'bg-emerald-500/10 text-emerald-400',
    COMPLETED: 'bg-green-500/10 text-green-400',
    CANCELLED: 'bg-red-500/10 text-red-400',
    DISPUTED: 'bg-orange-500/10 text-orange-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-wide text-dark-100">Booking Management</h1>
          <p className="mt-1 text-sm text-dark-400">Overview semua booking di platform</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'PENDING', 'CONFIRMED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'DISPUTED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
              statusFilter === s
                ? 'bg-brand-400/20 text-brand-400'
                : 'bg-dark-800/50 text-dark-400 hover:text-dark-200'
            }`}
          >
            {s === 'ALL' ? 'Semua' : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-dark-700/50">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-dark-700/50 bg-dark-800/50">
            <tr>
              <th className="px-4 py-3 font-medium text-dark-300">ID</th>
              <th className="px-4 py-3 font-medium text-dark-300">Client</th>
              <th className="px-4 py-3 font-medium text-dark-300">Escort</th>
              <th className="px-4 py-3 font-medium text-dark-300">Tanggal</th>
              <th className="px-4 py-3 font-medium text-dark-300">Durasi</th>
              <th className="px-4 py-3 font-medium text-dark-300">Status</th>
              <th className="px-4 py-3 font-medium text-dark-300">Total</th>
              <th className="px-4 py-3 font-medium text-dark-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-dark-500">
                  Belum ada data booking
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id} className="border-b border-dark-700/30 hover:bg-dark-800/30">
                  <td className="px-4 py-3 font-mono text-xs text-dark-400">{b.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-dark-200">{b.clientName}</td>
                  <td className="px-4 py-3 text-dark-200">{b.escortName}</td>
                  <td className="px-4 py-3 text-dark-300">{b.date}</td>
                  <td className="px-4 py-3 text-dark-300">{b.duration}h</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusColors[b.status] || ''}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-dark-200">Rp {b.totalAmount.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-brand-400 hover:text-brand-300">Detail</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
