'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface BookingDetail {
  id: string;
  status: string;
  startTime: string;
  endTime: string;
  eventType: string;
  location: string;
  notes?: string;
  totalAmount: number;
  platformFee: number;
  cancellationReason?: string;
  checkinAt?: string;
  checkoutAt?: string;
  createdAt: string;
  escortProfile: {
    id: string;
    tier: string;
    hourlyRate: number;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      profilePhoto?: string;
    };
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Menunggu Konfirmasi', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  CONFIRMED: { label: 'Dikonfirmasi', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  ONGOING: { label: 'Sedang Berlangsung', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  COMPLETED: { label: 'Selesai', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  DISPUTED: { label: 'Sengketa', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

const statusSteps = ['PENDING', 'CONFIRMED', 'ONGOING', 'COMPLETED'];

export default function BookingDetailPage() {
  const params = useParams();
  const { user } = useAuthStore();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadBooking();
  }, [params.id]);

  const loadBooking = async () => {
    try {
      const res = await api.get(`/bookings/${params.id}`);
      setBooking(res.data);
    } catch {
      setError('Booking tidak ditemukan');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    setActionLoading(action);
    try {
      await api.patch(`/bookings/${params.id}/${action}`);
      await loadBooking();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal melakukan aksi');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-light text-dark-100">Booking Tidak Ditemukan</h2>
        <Link href="/bookings" className="mt-4 inline-block text-sm text-brand-400 hover:text-brand-300">
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  const status = statusConfig[booking.status] || statusConfig.PENDING;
  const isClient = user?.id === booking.client.id;
  const isEscort = user?.id === booking.escortProfile.user.id;
  const currentStepIdx = statusSteps.indexOf(booking.status);

  const duration = Math.ceil(
    (new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60)
  );

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 text-sm text-dark-500">
        <Link href="/bookings" className="hover:text-brand-400 transition-colors">Bookings</Link>
        <span className="mx-2">/</span>
        <span className="text-dark-300">Detail</span>
      </nav>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Status Header */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Badge className={status.color}>{status.label}</Badge>
              <p className="mt-2 text-xs text-dark-500">
                Booking ID: {booking.id.slice(0, 8)}...
              </p>
            </div>
            <p className="text-2xl font-light text-brand-400">
              {formatCurrency(booking.totalAmount + booking.platformFee)}
            </p>
          </div>

          {/* Progress Steps */}
          {booking.status !== 'CANCELLED' && booking.status !== 'DISPUTED' && (
            <div className="flex items-center justify-between">
              {statusSteps.map((step, idx) => {
                const isActive = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={step} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                        isActive
                          ? 'border-brand-400 bg-brand-400/10 text-brand-400'
                          : 'border-dark-600 text-dark-600'
                      } ${isCurrent ? 'ring-2 ring-brand-400/30' : ''}`}>
                        {isActive && idx < currentStepIdx ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-xs">{idx + 1}</span>
                        )}
                      </div>
                      <span className={`mt-1 text-[10px] ${isActive ? 'text-brand-400' : 'text-dark-600'}`}>
                        {statusConfig[step]?.label?.split(' ')[0]}
                      </span>
                    </div>
                    {idx < statusSteps.length - 1 && (
                      <div className={`mx-2 h-0.5 flex-1 ${isActive && idx < currentStepIdx ? 'bg-brand-400' : 'bg-dark-700'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Booking Info */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-dark-100">Detail Booking</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Tanggal & Waktu', value: formatDateTime(booking.startTime) },
              { label: 'Durasi', value: `${duration} jam` },
              { label: 'Jenis Acara', value: booking.eventType },
              { label: 'Lokasi', value: booking.location },
              ...(booking.notes ? [{ label: 'Catatan', value: booking.notes }] : []),
              ...(booking.checkinAt ? [{ label: 'Check-in', value: formatDateTime(booking.checkinAt) }] : []),
              ...(booking.checkoutAt ? [{ label: 'Check-out', value: formatDateTime(booking.checkoutAt) }] : []),
              ...(booking.cancellationReason ? [{ label: 'Alasan Batal', value: booking.cancellationReason }] : []),
            ].map((field) => (
              <div key={field.label} className="flex justify-between border-b border-dark-700/30 pb-2 last:border-0">
                <span className="text-sm text-dark-400">{field.label}</span>
                <span className="text-sm text-dark-200 text-right max-w-[60%]">{field.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Price & Partner */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-dark-100">
                {isClient ? 'Escort Partner' : 'Client'}
              </h3>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {isClient ? (
                  <>
                    {booking.escortProfile.user.profilePhoto ? (
                      <img src={booking.escortProfile.user.profilePhoto} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-400/10">
                        <span className="text-lg text-brand-400">{booking.escortProfile.user.firstName[0]}</span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-dark-200">
                        {booking.escortProfile.user.firstName} {booking.escortProfile.user.lastName}
                      </p>
                      <p className="text-xs text-dark-400">Tier {booking.escortProfile.tier}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-400/10">
                      <span className="text-lg text-brand-400">{booking.client.firstName[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium text-dark-200">
                        {booking.client.firstName} {booking.client.lastName}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-dark-100">Rincian Biaya</h3>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-400">Layanan ({duration} jam)</span>
                <span className="text-dark-200">{formatCurrency(booking.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Biaya Platform</span>
                <span className="text-dark-200">{formatCurrency(booking.platformFee)}</span>
              </div>
              <div className="flex justify-between border-t border-dark-700/50 pt-2 font-medium">
                <span className="text-dark-200">Total</span>
                <span className="text-brand-400">{formatCurrency(booking.totalAmount + booking.platformFee)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <Card className="mt-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Escort actions */}
            {isEscort && booking.status === 'PENDING' && (
              <>
                <Button onClick={() => handleAction('accept')} disabled={!!actionLoading}>
                  {actionLoading === 'accept' ? 'Memproses...' : 'Terima Booking'}
                </Button>
                <Button variant="outline" onClick={() => handleAction('reject')} disabled={!!actionLoading}>
                  {actionLoading === 'reject' ? 'Memproses...' : 'Tolak'}
                </Button>
              </>
            )}

            {isEscort && booking.status === 'CONFIRMED' && (
              <Button onClick={() => handleAction('checkin')} disabled={!!actionLoading}>
                {actionLoading === 'checkin' ? 'Memproses...' : 'Check-in'}
              </Button>
            )}

            {isEscort && booking.status === 'ONGOING' && (
              <Button onClick={() => handleAction('checkout')} disabled={!!actionLoading}>
                {actionLoading === 'checkout' ? 'Memproses...' : 'Check-out'}
              </Button>
            )}

            {/* Client actions */}
            {isClient && (booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
              <Button variant="outline" onClick={() => handleAction('cancel')} disabled={!!actionLoading}>
                {actionLoading === 'cancel' ? 'Memproses...' : 'Batalkan Booking'}
              </Button>
            )}

            {/* Chat */}
            {(booking.status === 'CONFIRMED' || booking.status === 'ONGOING') && (
              <Button variant="outline" onClick={() => window.alert('Chat akan segera tersedia')}>
                Chat
              </Button>
            )}

            {/* Review */}
            {isClient && booking.status === 'COMPLETED' && (
              <Link href={`/bookings/${booking.id}/review`}>
                <Button variant="outline">Beri Ulasan</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
