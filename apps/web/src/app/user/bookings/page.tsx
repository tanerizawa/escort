'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: 'warning' | 'info' | 'brand' | 'success' | 'danger' }> = {
  PENDING: { label: 'Menunggu', variant: 'warning' },
  CONFIRMED: { label: 'Dikonfirmasi', variant: 'info' },
  ONGOING: { label: 'Berlangsung', variant: 'brand' },
  COMPLETED: { label: 'Selesai', variant: 'success' },
  CANCELLED: { label: 'Dibatalkan', variant: 'danger' },
};

type TabKey = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'ALL', label: 'Semua' },
  { key: 'ACTIVE', label: 'Aktif' },
  { key: 'COMPLETED', label: 'Selesai' },
  { key: 'CANCELLED', label: 'Dibatalkan' },
];

interface Booking {
  id: string;
  status: string;
  serviceType: string;
  startTime: string;
  totalAmount: number;
  escort?: { firstName?: string; lastName?: string };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings');
      const payload = res.data?.data || res.data;
      const items = Array.isArray(payload) ? payload : (payload?.data || payload?.bookings || []);
      setBookings(items);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ACTIVE') return ['PENDING', 'CONFIRMED', 'ONGOING'].includes(b.status);
    if (activeTab === 'COMPLETED') return b.status === 'COMPLETED';
    if (activeTab === 'CANCELLED') return b.status === 'CANCELLED';
    return true;
  });

  const formatCurrency = (amount: number) =>
    `Rp ${amount.toLocaleString('id-ID')}`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-dark-100">Booking Saya</h1>
          <p className="mt-1 text-sm text-dark-400">
            Kelola semua booking aktif dan riwayat Anda
          </p>
        </div>
        <Link href="/user/escorts">
          <Button size="sm">
            + Booking Baru
          </Button>
        </Link>
      </div>

      {/* Tab Filters */}
      <div className="mb-6 flex gap-2 border-b border-dark-700/30 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative rounded-lg px-4 py-2 text-sm transition-all duration-300 ${
              activeTab === tab.key
                ? 'bg-brand-400/10 text-brand-400 shadow-sm shadow-brand-400/5'
                : 'text-dark-400 hover:text-dark-200 hover:bg-dark-700/30'
            }`}
          >
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-brand-400 rounded-full" />
            )}
            {tab.label}
            {tab.key !== 'ALL' && (
              <span className="ml-1.5 text-xs opacity-60">
                {bookings.filter((b) => {
                  if (tab.key === 'ACTIVE') return ['PENDING', 'CONFIRMED', 'ONGOING'].includes(b.status);
                  if (tab.key === 'COMPLETED') return b.status === 'COMPLETED';
                  if (tab.key === 'CANCELLED') return b.status === 'CANCELLED';
                  return false;
                }).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <Card>
          <CardContent>
            <div className="py-16 text-center">
              <div className="mb-4"><Calendar className="h-10 w-10" /></div>
              <h3 className="text-lg font-light text-dark-200">
                {activeTab === 'ALL' ? 'Belum Ada Booking' : `Tidak ada booking ${tabs.find(t => t.key === activeTab)?.label.toLowerCase()}`}
              </h3>
              <p className="mt-2 text-sm text-dark-500">
                {activeTab === 'ALL'
                  ? 'Anda belum memiliki booking. Mulai cari partner untuk membuat booking pertama.'
                  : 'Coba pilih tab lain untuk melihat booking Anda.'}
              </p>
              {activeTab === 'ALL' && (
                <Link href="/user/escorts">
                  <Button size="sm" className="mt-4">
                    Cari Partner
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredBookings.map((booking) => {
            const escortName = [booking.escort?.firstName, booking.escort?.lastName].filter(Boolean).join(' ') || 'Partner';
            const cfg = statusConfig[booking.status];
            return (
              <Link key={booking.id} href={`/user/bookings/${booking.id}`}>
                <Card variant="outline" className="group hover:border-brand-400/20 hover:shadow-md hover:shadow-brand-400/5 hover:translate-y-[-1px] transition-all duration-300 cursor-pointer">
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-dark-100 group-hover:text-brand-400 transition-colors">
                              {escortName}
                            </h3>
                            {cfg && (
                              <Badge variant={cfg.variant} pulse={booking.status === 'ONGOING'}>
                                {cfg.label}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-dark-500">
                            {booking.serviceType} — {formatDate(booking.startTime)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-brand-400">
                          {formatCurrency(Number(booking.totalAmount) || 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
