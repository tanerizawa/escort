'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import api from '@/lib/api';

interface Booking {
  id: string;
  status: string;
  startTime: string;
  endTime: string;
  eventType: string;
  location: string;
  notes?: string;
  totalAmount: number;
  createdAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Menunggu', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  CONFIRMED: { label: 'Dikonfirmasi', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  ONGOING: { label: 'Berlangsung', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  COMPLETED: { label: 'Selesai', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export default function EscortRequestsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<'PENDING' | 'all'>('PENDING');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { role: 'escort' };
      if (filter !== 'all') params.status = filter;
      const res = await api.get('/bookings', { params });
      setBookings(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (bookingId: string, action: 'accept' | 'reject') => {
    setActionLoading(`${bookingId}-${action}`);
    try {
      await api.patch(`/bookings/${bookingId}/${action}`);
      await loadBookings();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal melakukan aksi');
    } finally {
      setActionLoading('');
    }
  };

  const handleCheckin = async (bookingId: string) => {
    setActionLoading(`${bookingId}-checkin`);
    try {
      await api.patch(`/bookings/${bookingId}/checkin`);
      await loadBookings();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal check-in');
    } finally {
      setActionLoading('');
    }
  };

  const handleCheckout = async (bookingId: string) => {
    setActionLoading(`${bookingId}-checkout`);
    try {
      await api.patch(`/bookings/${bookingId}/checkout`);
      await loadBookings();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal check-out');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-light text-dark-100">Permintaan Booking</h1>
        <p className="mt-1 text-sm text-dark-400">Kelola permintaan booking dari client</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2">
        {[
          { value: 'PENDING' as const, label: 'Menunggu' },
          { value: 'all' as const, label: 'Semua' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`rounded-lg px-4 py-2 text-sm transition-colors ${
              filter === tab.value
                ? 'bg-brand-400/10 text-brand-400 border border-brand-400/20'
                : 'bg-dark-800/50 text-dark-400 border border-dark-700/50 hover:border-dark-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
        </div>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent>
            <div className="py-16 text-center">
              <div className="mb-4 text-4xl">📋</div>
              <h3 className="text-lg font-light text-dark-200">
                {filter === 'PENDING' ? 'Tidak Ada Permintaan Baru' : 'Belum Ada Booking'}
              </h3>
              <p className="mt-2 text-sm text-dark-500">
                {filter === 'PENDING'
                  ? 'Permintaan booking dari client akan muncul di sini.'
                  : 'Riwayat booking Anda akan ditampilkan di sini.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const status = statusConfig[booking.status] || statusConfig.PENDING;
            const duration = Math.ceil(
              (new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60)
            );

            return (
              <Card key={booking.id}>
                <CardContent className="py-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Client Info */}
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-400/10">
                        {booking.client.profilePhoto ? (
                          <img
                            src={booking.client.profilePhoto}
                            alt=""
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="text-lg font-medium text-brand-400">
                            {booking.client.firstName[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-dark-100">
                            {booking.client.firstName} {booking.client.lastName}
                          </h3>
                          <Badge className={status.color}>{status.label}</Badge>
                        </div>
                        <div className="mt-1 space-y-0.5 text-sm text-dark-400">
                          <p>{formatDateTime(booking.startTime)} — {duration} jam</p>
                          <p>{booking.location}</p>
                          <p className="text-xs text-dark-500">{booking.eventType}</p>
                        </div>
                        {booking.notes && (
                          <p className="mt-2 rounded bg-dark-800/50 px-3 py-2 text-xs text-dark-400">
                            {booking.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Price & Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <p className="text-lg font-medium text-brand-400">
                        {formatCurrency(booking.totalAmount)}
                      </p>

                      <div className="flex gap-2">
                        {booking.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAction(booking.id, 'accept')}
                              disabled={!!actionLoading}
                            >
                              {actionLoading === `${booking.id}-accept` ? '...' : 'Terima'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(booking.id, 'reject')}
                              disabled={!!actionLoading}
                            >
                              {actionLoading === `${booking.id}-reject` ? '...' : 'Tolak'}
                            </Button>
                          </>
                        )}

                        {booking.status === 'CONFIRMED' && (
                          <Button
                            size="sm"
                            onClick={() => handleCheckin(booking.id)}
                            disabled={!!actionLoading}
                          >
                            {actionLoading === `${booking.id}-checkin` ? '...' : 'Check-in'}
                          </Button>
                        )}

                        {booking.status === 'ONGOING' && (
                          <Button
                            size="sm"
                            onClick={() => handleCheckout(booking.id)}
                            disabled={!!actionLoading}
                          >
                            {actionLoading === `${booking.id}-checkout` ? '...' : 'Check-out'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
