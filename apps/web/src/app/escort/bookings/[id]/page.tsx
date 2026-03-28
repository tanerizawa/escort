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
import { BarChart3, Calendar, Check, CheckCircle2, Hourglass, Mail, MessageCircle, Smartphone, Star } from 'lucide-react';

interface BookingDetail {
  id: string;
  status: string;
  startTime: string;
  endTime: string;
  serviceType: string;
  location: string;
  specialRequests?: string;
  totalAmount: number;
  platformFee?: number;
  cancelReason?: string;
  checkinAt?: string;
  checkoutAt?: string;
  createdAt: string;
  escort?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    escortProfile?: {
      tier: string;
      ratingAvg: number;
      languages: string[];
    };
  };
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    email?: string;
    phone?: string;
    isVerified?: boolean;
    isActive?: boolean;
    createdAt?: string;
    _count?: { clientBookings: number };
  };
  payment?: any;
  reviews?: any[];
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

const paymentStatusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Menunggu Pembayaran', color: 'text-yellow-400' },
  ESCROW: { label: 'Lunas (Escrow)', color: 'text-green-400' },
  RELEASED: { label: 'Dicairkan', color: 'text-green-400' },
  REFUNDED: { label: 'Dikembalikan', color: 'text-red-400' },
  FAILED: { label: 'Gagal', color: 'text-red-400' },
};

// 5 steps including payment
const progressSteps = [
  { key: 'PENDING', label: 'Konfirmasi' },
  { key: 'PAYMENT', label: 'Pembayaran' },
  { key: 'CONFIRMED_PAID', label: 'Check-in' },
  { key: 'ONGOING', label: 'Berlangsung' },
  { key: 'COMPLETED', label: 'Selesai' },
];

function getProgressIndex(bookingStatus: string, paymentStatus?: string): number {
  if (bookingStatus === 'COMPLETED') return 4;
  if (bookingStatus === 'ONGOING') return 3;
  if (bookingStatus === 'CONFIRMED' && paymentStatus === 'ESCROW') return 2;
  if (bookingStatus === 'CONFIRMED') return 1;
  return 0;
}

export default function EscortBookingDetailPage() {
  const params = useParams();
  const { user } = useAuthStore();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadBooking();
  }, [params?.id]);

  const loadBooking = async () => {
    try {
      const res = await api.get(`/bookings/${params?.id}`);
      const d = res.data?.data || res.data;
      setBooking(d);
    } catch {
      setError('Booking tidak ditemukan');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, body: Record<string, any> = {}) => {
    setActionLoading(action);
    try {
      await api.patch(`/bookings/${params?.id}/${action}`, body);
      await loadBooking();
      setError('');
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
        <Link href="/escort/requests" className="mt-4 inline-block text-sm text-brand-400 hover:text-brand-300">
          Kembali ke Permintaan
        </Link>
      </div>
    );
  }

  const status = statusConfig[booking.status] || statusConfig.PENDING;
  const isEscort = user?.id === booking.escort?.id;
  const currentProgressIdx = getProgressIndex(booking.status, booking.payment?.status);
  const isPaid = booking.payment?.status === 'ESCROW' || booking.payment?.status === 'RELEASED';
  const needsPayment = booking.status === 'CONFIRMED' && (!booking.payment || booking.payment.status === 'PENDING');

  const duration = Math.ceil(
    (new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60)
  );

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 text-sm text-dark-500">
        <Link href="/escort/requests" className="hover:text-brand-400 transition-colors">Permintaan</Link>
        <span className="mx-2">/</span>
        <span className="text-dark-300">Detail Booking</span>
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
              {formatCurrency(Number(booking.totalAmount))}
            </p>
          </div>

          {/* Progress Steps — 5 stages including Payment */}
          {booking.status !== 'CANCELLED' && booking.status !== 'DISPUTED' && (
            <div className="flex items-center justify-between">
              {progressSteps.map((step, idx) => {
                const isActive = idx <= currentProgressIdx;
                const isCurrent = idx === currentProgressIdx;
                const isPaymentStep = step.key === 'PAYMENT';
                return (
                  <div key={step.key} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                        isActive
                          ? 'border-brand-400 bg-brand-400/10 text-brand-400'
                          : isPaymentStep && needsPayment
                            ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                            : 'border-dark-600 text-dark-600'
                      } ${isCurrent && !isPaymentStep ? 'ring-2 ring-brand-400/30' : ''}`}>
                        {isActive && idx < currentProgressIdx ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-xs">{idx + 1}</span>
                        )}
                      </div>
                      <span className={`mt-1 text-[10px] ${
                        isActive ? 'text-brand-400' :
                        isPaymentStep && needsPayment ? 'text-yellow-400 font-medium' :
                        'text-dark-600'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {idx < progressSteps.length - 1 && (
                      <div className={`mx-1 h-0.5 flex-1 ${isActive && idx < currentProgressIdx ? 'bg-brand-400' : 'bg-dark-700'}`} />
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
        <div className="space-y-6">
          {/* Payment Status Banner */}
          {booking.status === 'CONFIRMED' && needsPayment && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <Hourglass className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-400">Menunggu Pembayaran Client</p>
                    <p className="text-xs text-dark-400">
                      Client belum melakukan pembayaran. Check-in hanya dapat dilakukan setelah pembayaran dikonfirmasi (minimal DP 50%).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {booking.status === 'CONFIRMED' && isPaid && (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium text-green-400">
                      Pembayaran {booking.payment?.paymentType === 'DP_50' ? 'DP 50%' : 'Lunas'} Dikonfirmasi
                    </p>
                    <p className="text-xs text-dark-400">
                      Anda dapat melakukan check-in untuk memulai layanan.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-dark-100">Detail Booking</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Tanggal & Waktu', value: formatDateTime(booking.startTime) },
              { label: 'Durasi', value: `${duration} jam` },
              { label: 'Jenis Acara', value: booking.serviceType },
              { label: 'Lokasi', value: booking.location },
              ...(booking.specialRequests ? [{ label: 'Catatan', value: booking.specialRequests }] : []),
              ...(booking.checkinAt ? [{ label: 'Check-in', value: formatDateTime(booking.checkinAt) }] : []),
              ...(booking.checkoutAt ? [{ label: 'Check-out', value: formatDateTime(booking.checkoutAt) }] : []),
              ...(booking.cancelReason ? [{ label: 'Alasan Batal', value: booking.cancelReason }] : []),
            ].map((field) => (
              <div key={field.label} className="flex justify-between border-b border-dark-700/30 pb-2 last:border-0">
                <span className="text-sm text-dark-400">{field.label}</span>
                <span className="text-sm text-dark-200 text-right max-w-[60%]">{field.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        </div>

        {/* Client & Price */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-dark-100">Profil Client</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar & Name */}
              <div className="flex items-center gap-3">
                {booking?.client?.profilePhoto ? (
                  <img src={booking.client.profilePhoto} alt="" className="h-14 w-14 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-400/10">
                    <span className="text-xl text-brand-400">{booking?.client?.firstName?.[0] || '?'}</span>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-dark-200">
                      {booking?.client?.firstName} {booking?.client?.lastName}
                    </p>
                    {booking?.client?.isVerified && (
                      <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400 border border-green-500/20">
                        <Check className="h-4 w-4 inline-block" /> Terverifikasi
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-dark-500">Client</p>
                </div>
              </div>

              {/* Client Details */}
              <div className="space-y-2 rounded-lg border border-dark-700/30 bg-dark-800/30 p-3">
                {booking?.client?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-dark-500" />
                    <span className="text-dark-300">{booking.client.email}</span>
                  </div>
                )}
                {booking?.client?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Smartphone className="h-4 w-4 text-dark-500" />
                    <span className="text-dark-300">{booking.client.phone}</span>
                  </div>
                )}
                {booking?.client?.createdAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-dark-500" />
                    <span className="text-dark-300">
                      Member sejak {new Date(booking.client.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
                    </span>
                  </div>
                )}
                {booking?.client?._count?.clientBookings != null && (
                  <div className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4 text-dark-500" />
                    <span className="text-dark-300">
                      {booking.client._count.clientBookings} total booking
                    </span>
                  </div>
                )}
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-2">
                {booking?.client?.isVerified ? (
                  <span className="inline-flex items-center rounded-md bg-green-500/5 px-2.5 py-1 text-xs text-green-400 border border-green-500/20">
                    Identitas Terverifikasi
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-md bg-yellow-500/5 px-2.5 py-1 text-xs text-yellow-400 border border-yellow-500/20">
                    Belum Verifikasi
                  </span>
                )}
                {(booking?.client?._count?.clientBookings ?? 0) >= 5 && (
                  <span className="inline-flex items-center rounded-md bg-blue-500/5 px-2.5 py-1 text-xs text-blue-400 border border-blue-500/20">
                    Client Reguler
                  </span>
                )}
                {(booking?.client?._count?.clientBookings ?? 0) === 0 && (
                  <span className="inline-flex items-center rounded-md bg-dark-700/30 px-2.5 py-1 text-xs text-dark-400 border border-dark-600/30">
                    Client Baru
                  </span>
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
                <span className="text-dark-200">{formatCurrency(Number(booking.totalAmount))}</span>
              </div>
              {booking.payment?.platformFee != null && (
                <div className="flex justify-between">
                  <span className="text-dark-400">Biaya Platform (20%)</span>
                  <span className="text-dark-200">-{formatCurrency(Number(booking.payment.platformFee))}</span>
                </div>
              )}
              {booking.payment?.escortPayout != null && (
                <div className="flex justify-between">
                  <span className="text-dark-400">Pendapatan Bersih</span>
                  <span className="text-green-400">{formatCurrency(Number(booking.payment.escortPayout))}</span>
                </div>
              )}
              {booking.payment?.tipAmount != null && Number(booking.payment.tipAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-dark-400">Tip</span>
                  <span className="text-green-400">+{formatCurrency(Number(booking.payment.tipAmount))}</span>
                </div>
              )}
              {booking.payment?.status && (
                <div className="flex justify-between border-t border-dark-700/50 pt-2">
                  <span className="text-dark-400">Status Pembayaran</span>
                  <span className={paymentStatusLabels[booking.payment.status]?.color || 'text-dark-300'}>
                    {paymentStatusLabels[booking.payment.status]?.label || booking.payment.status}
                  </span>
                </div>
              )}
              {booking.payment?.paymentType && booking.payment.paymentType !== 'PLATFORM' && (
                <div className="flex justify-between">
                  <span className="text-dark-400">Tipe Pembayaran</span>
                  <span className="text-dark-200">
                    {booking.payment.paymentType === 'DP_50' ? 'DP 50%' : 'Bayar Penuh'}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <Card className="mt-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-3">
            {isEscort && booking.status === 'PENDING' && (
              <>
                <Button onClick={() => handleAction('accept')} disabled={!!actionLoading}>
                  {actionLoading === 'accept' ? 'Memproses...' : 'Terima Booking'}
                </Button>
                <Button variant="outline" onClick={() => {
                  const reason = prompt('Alasan penolakan (opsional):');
                  handleAction('reject', reason ? { reason } : {});
                }} disabled={!!actionLoading}>
                  {actionLoading === 'reject' ? 'Memproses...' : 'Tolak'}
                </Button>
              </>
            )}

            {isEscort && booking.status === 'CONFIRMED' && isPaid && (
              <Button onClick={() => handleAction('checkin')} disabled={!!actionLoading}>
                {actionLoading === 'checkin' ? 'Memproses...' : 'Check-in'}
              </Button>
            )}

            {isEscort && booking.status === 'CONFIRMED' && needsPayment && (
              <Button disabled className="opacity-50 cursor-not-allowed">
                <Hourglass className="h-4 w-4 inline-block" /> Menunggu Pembayaran Client
              </Button>
            )}

            {isEscort && booking.status === 'ONGOING' && (
              <Button onClick={() => handleAction('checkout')} disabled={!!actionLoading}>
                {actionLoading === 'checkout' ? 'Memproses...' : 'Check-out'}
              </Button>
            )}

            {(booking.status === 'CONFIRMED' || booking.status === 'ONGOING') && (
              <Link href={`/escort/chat/${booking.id}`}>
                <Button variant="outline"><MessageCircle className="h-4 w-4 inline-block mr-1" /> Chat</Button>
              </Link>
            )}


          </div>
        </CardContent>
      </Card>

      {/* Reviews */}
      {booking.reviews && booking.reviews.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <h3 className="text-lg font-medium text-dark-100">Ulasan</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {booking.reviews.map((review: any) => (
              <div key={review.id} className="rounded-lg border border-dark-700/30 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex items-center gap-0.5 text-yellow-400">
                    {Array.from({ length: review.rating || 0 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </span>
                  <span className="text-xs text-dark-500">
                    {review.reviewer?.firstName} {review.reviewer?.lastName}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-dark-300">{review.comment}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
