'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import api from '@/lib/api';

interface BookingRow {
  id: string;
  clientName: string;
  escortName: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number;
  serviceType: string;
  notes: string | null;
}

type Tab = 'bookings' | 'disputes';

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={null}>
      <AdminBookingsContent />
    </Suspense>
  );
}

function AdminBookingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'disputes' ? 'disputes' : 'bookings';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab as Tab);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-500/10 text-amber-400',
    CONFIRMED: 'bg-blue-500/10 text-blue-400',
    ONGOING: 'bg-emerald-500/10 text-emerald-400',
    COMPLETED: 'bg-green-500/10 text-green-400',
    CANCELLED: 'bg-red-500/10 text-red-400',
    DISPUTED: 'bg-orange-500/10 text-orange-400',
  };

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const effectiveStatus = activeTab === 'disputes' ? 'DISPUTED' : statusFilter;
      let url = `/bookings?page=${page}&limit=20`;
      if (effectiveStatus !== 'ALL') url += `&status=${effectiveStatus}`;
      const { data } = await api.get(url);
      const d = data?.data || data;
      const list = (d.data || []).map((b: any) => ({
        id: b.id,
        clientName: b.client ? `${b.client.firstName} ${b.client.lastName}` : 'N/A',
        escortName: b.escort ? `${b.escort.firstName} ${b.escort.lastName}` : 'N/A',
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
        totalAmount: Number(b.totalAmount || b.payment?.amount || 0),
        serviceType: b.serviceType || '',
        notes: b.notes || null,
      }));
      setBookings(list);
      setTotalPages(d.pagination?.totalPages ?? 1);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat data booking');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, activeTab]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setPage(1);
    setStatusFilter('ALL');
  };

  const tabs: { id: Tab; label: string; description: string }[] = [
    { id: 'bookings', label: 'Semua Booking', description: 'Overview semua booking di platform' },
    { id: 'disputes', label: 'Disputes', description: 'Booking dengan status DISPUTED — tangani keluhan client & escort' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-light tracking-wide text-dark-100">Booking Management</h1>
          <p className="mt-1 text-sm text-dark-400">
            {tabs.find((t) => t.id === activeTab)?.description}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-dark-700/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative px-4 py-2.5 text-sm transition-colors ${
                activeTab === tab.id
                  ? 'text-brand-400'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-400" />
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {/* Filters — only for bookings tab */}
        {activeTab === 'bookings' && (
          <div className="flex flex-wrap gap-2">
            {['ALL', 'PENDING', 'CONFIRMED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'DISPUTED'].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
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
        )}

        {/* Disputes empty state */}
        {activeTab === 'disputes' && !loading && bookings.length === 0 ? (
          <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-12 text-center">
            <p className="text-dark-400">Tidak ada booking dengan status DISPUTED</p>
            <p className="mt-2 text-xs text-dark-500">
              Untuk insiden keamanan (SOS, harassment), lihat halaman{' '}
              <a href="/incidents" className="text-brand-400 hover:underline">Incidents</a>
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-dark-700/50">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-dark-700/50 bg-dark-800/50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-dark-300">ID</th>
                    <th className="px-4 py-3 font-medium text-dark-300">Client</th>
                    <th className="px-4 py-3 font-medium text-dark-300">Escort</th>
                    <th className="px-4 py-3 font-medium text-dark-300">Tanggal</th>
                    <th className="px-4 py-3 font-medium text-dark-300">Service</th>
                    <th className="px-4 py-3 font-medium text-dark-300">Status</th>
                    <th className="px-4 py-3 font-medium text-dark-300">Total</th>
                    {activeTab === 'disputes' && (
                      <th className="px-4 py-3 font-medium text-dark-300">Notes</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-dark-700/30">
                        <td colSpan={activeTab === 'disputes' ? 8 : 7} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-dark-700/50" /></td>
                      </tr>
                    ))
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'disputes' ? 8 : 7} className="px-4 py-12 text-center text-dark-500">
                        Belum ada data booking
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => (
                      <tr key={b.id} className="border-b border-dark-700/30 hover:bg-dark-800/30">
                        <td className="px-4 py-3 font-mono text-xs text-dark-400">{b.id.slice(0, 8)}</td>
                        <td className="px-4 py-3 text-dark-200">{b.clientName}</td>
                        <td className="px-4 py-3 text-dark-200">{b.escortName}</td>
                        <td className="px-4 py-3 text-dark-300">{b.startTime ? new Date(b.startTime).toLocaleDateString('id-ID') : '-'}</td>
                        <td className="px-4 py-3 text-dark-300">{b.serviceType}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs ${statusColors[b.status] || 'bg-dark-700/50 text-dark-400'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-dark-200">Rp {b.totalAmount.toLocaleString('id-ID')}</td>
                        {activeTab === 'disputes' && (
                          <td className="max-w-[200px] truncate px-4 py-3 text-xs text-dark-400">{b.notes || '-'}</td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-dark-700 px-3 py-1.5 text-xs text-dark-300 disabled:opacity-30">Prev</button>
                <span className="text-xs text-dark-400">Page {page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-dark-700 px-3 py-1.5 text-xs text-dark-300 disabled:opacity-30">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
