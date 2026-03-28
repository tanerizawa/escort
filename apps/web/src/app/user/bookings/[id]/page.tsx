'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { CheckCircle2, CreditCard, DollarSign, MapPin, MessageCircle, Star } from 'lucide-react';

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
  };
  payment?: {
    id: string;
    status: string;
    amount: number;
    platformFee: number;
    escortPayout: number;
    tipAmount?: number;
    paymentType?: string;
    method?: string;
    paidAt?: string;
  };
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

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Menunggu Pembayaran', color: 'text-yellow-400' },
  ESCROW: { label: 'Lunas (Escrow)', color: 'text-green-400' },
  RELEASED: { label: 'Dana Dicairkan', color: 'text-green-400' },
  REFUNDED: { label: 'Dikembalikan', color: 'text-red-400' },
  FAILED: { label: 'Gagal', color: 'text-red-400' },
};

// 5 steps: Konfirmasi -> Pembayaran -> Check-in -> Berlangsung -> Selesai
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
  return 0; // PENDING
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
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

  const handleTip = async () => {
    const amountStr = prompt('Masukkan jumlah tip (minimum Rp 10.000):');
    if (!amountStr) return;
    const amount = parseInt(amountStr.replace(/\D/g, ''), 10);
    if (isNaN(amount) || amount < 10000) {
      setError('Minimum tip adalah Rp 10.000');
      return;
    }
    setActionLoading('tip');
    try {
      await api.post(`/bookings/${params?.id}/tip`, { amount });
      await loadBooking();
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal mengirim tip');
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
        <Link href="/user/bookings" className="mt-4 inline-block text-sm text-brand-400 hover:text-brand-300">
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  const status = statusConfig[booking.status] || statusConfig.PENDING;
  const isClient = user?.id === booking.client?.id;
  const currentProgressIdx = getProgressIndex(booking.status, booking.payment?.status);
  const isPaid = booking.payment?.status === 'ESCROW' || booking.payment?.status === 'RELEASED';
  const needsPayment = booking.status === 'CONFIRMED' && (!booking.payment || booking.payment.status === 'PENDING');

  const duration = Math.ceil(
    (new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60)
  );

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 text-sm text-dark-500">
        <Link href="/user/bookings" className="hover:text-brand-400 transition-colors">Bookings</Link>
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
                            ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400 ring-2 ring-yellow-400/30 animate-pulse'
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

      {/* PAYMENT CTA — prominent call-to-action when payment is needed */}
      {isClient && needsPayment && (
        <Card className="mb-6 border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-brand-400/5">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <CreditCard className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-dark-100">Pembayaran Diperlukan</h3>
                <p className="mt-1 text-sm text-dark-400">
                  Escort telah mengkonfirmasi booking Anda. Silakan lakukan pembayaran untuk melanjutkan.
                  Anda dapat memilih <strong className="text-dark-200">bayar penuh (100%)</strong> atau <strong className="text-dark-200">DP 50%</strong> di muka.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link href={`/user/payments/checkout?bookingId=${booking.id}`}>
                    <Button className="gap-2">
                      Bayar Sekarang — {formatCurrency(Number(booking.totalAmount))}
                    </Button>
                  </Link>
                  <span className="text-xs text-dark-500">
                    Minimal DP 50%: {formatCurrency(Math.round(Number(booking.totalAmount) * 0.5))}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment confirmed message */}
      {booking.status === 'CONFIRMED' && isPaid && (
        <Card className="mb-6 border-green-500/30 bg-green-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5" />
              <div>
                <p className="text-sm font-medium text-green-400">
                  Pembayaran {booking.payment?.paymentType === 'DP_50' ? 'DP 50%' : 'Lunas'} Dikonfirmasi
                </p>
                <p className="text-xs text-dark-400">
                  Menunggu check-in dari escort untuk memulai layanan.
                  {booking.payment?.paidAt && ` Dibayar pada ${formatDateTime(booking.payment.paidAt)}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

        {/* Price & Partner */}
        <div className="space-y-6">
          {/* Escort Partner */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-dark-100">Escort Partner</h3>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {booking?.escort?.profilePhoto ? (
                  <img src={booking.escort.profilePhoto} alt="" className="h-12 w-12 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-400/10">
                    <span className="text-lg text-brand-400">{booking?.escort?.firstName?.[0] || '?'}</span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-dark-200">
                    {booking?.escort?.firstName} {booking?.escort?.lastName}
                  </p>
                  <p className="text-xs text-dark-400">Tier {booking?.escort?.escortProfile?.tier || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-dark-100">Rincian Biaya</h3>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-400">Layanan ({duration} jam)</span>
                <span className="text-dark-200">{formatCurrency(Number(booking.totalAmount))}</span>
              </div>
              {booking.payment?.tipAmount != null && Number(booking.payment.tipAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-dark-400">Tip</span>
                  <span className="text-green-400">{formatCurrency(Number(booking.payment.tipAmount))}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-dark-700/50 pt-2 font-medium">
                <span className="text-dark-200">Total</span>
                <span className="text-brand-400">{formatCurrency(Number(booking.totalAmount))}</span>
              </div>

              {/* Payment Status */}
              {booking.payment?.status && (
                <div className="mt-3 rounded-lg border border-dark-700/30 bg-dark-800/30 p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-dark-400">Status Pembayaran</span>
                    <span className={paymentStatusConfig[booking.payment.status]?.color || 'text-dark-300'}>
                      {paymentStatusConfig[booking.payment.status]?.label || booking.payment.status}
                    </span>
                  </div>
                  {booking.payment.paymentType && booking.payment.paymentType !== 'PLATFORM' && (
                    <div className="flex justify-between">
                      <span className="text-dark-400">Tipe Pembayaran</span>
                      <span className="text-dark-200">
                        {booking.payment.paymentType === 'DP_50' ? 'DP 50% (Uang Muka)' : 'Bayar Penuh (100%)'}
                      </span>
                    </div>
                  )}
                  {booking.payment.paymentType === 'DP_50' && isPaid && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-dark-400">Dibayar (DP)</span>
                        <span className="text-green-400">{formatCurrency(Math.round(Number(booking.totalAmount) * 0.5))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-400">Sisa Pelunasan</span>
                        <span className="text-yellow-400">{formatCurrency(Math.round(Number(booking.totalAmount) * 0.5))}</span>
                      </div>
                    </>
                  )}
                  {booking.payment.method && booking.payment.method !== 'PLATFORM' && (
                    <div className="flex justify-between">
                      <span className="text-dark-400">Metode</span>
                      <span className="text-dark-200 capitalize">{booking.payment.method.replace('_', ' ')}</span>
                    </div>
                  )}
                  {booking.payment.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-dark-400">Dibayar Pada</span>
                      <span className="text-dark-200">{formatDateTime(booking.payment.paidAt)}</span>
                    </div>
                  )}
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
            {/* Client: Pay button when CONFIRMED and unpaid */}
            {isClient && needsPayment && (
              <Link href={`/user/payments/checkout?bookingId=${booking.id}`}>
                <Button className="gap-2">
                  <CreditCard className="h-4 w-4 inline-block" /> Bayar Sekarang
                </Button>
              </Link>
            )}

            {/* Client: Cancel booking */}
            {isClient && (booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
              <Button variant="outline" onClick={() => {
                const reason = prompt('Alasan pembatalan (opsional):');
                if (window.confirm('Apakah Anda yakin ingin membatalkan booking ini?')) {
                  handleAction('cancel', reason ? { reason } : {});
                }
              }} disabled={!!actionLoading}>
                {actionLoading === 'cancel' ? 'Memproses...' : 'Batalkan Booking'}
              </Button>
            )}

            {/* Chat */}
            {(booking.status === 'CONFIRMED' || booking.status === 'ONGOING') && (
              <Link href={`/user/chat/${booking.id}`}>
                <Button variant="outline"><MessageCircle className="h-4 w-4 inline-block mr-1" /> Chat</Button>
              </Link>
            )}

            {/* Live Tracking */}
            {booking.status === 'ONGOING' && (
              <Link href={`/user/bookings/${booking.id}/tracking`}>
                <Button variant="outline"><MapPin className="h-4 w-4 inline-block mr-1" /> Live Tracking</Button>
              </Link>
            )}

            {/* Post-completion: Review + Tip */}
            {isClient && booking.status === 'COMPLETED' && (
              <>
                {(!booking.reviews || booking.reviews.length === 0) && (
                  <Link href={`/user/bookings/${booking.id}/review`}>
                    <Button variant="outline"><Star className="h-4 w-4 inline-block mr-1" /> Beri Ulasan</Button>
                  </Link>
                )}
                {(!booking.payment?.tipAmount || Number(booking.payment.tipAmount) === 0) && (
                  <Button variant="outline" onClick={handleTip} disabled={actionLoading === 'tip'}>
                    {actionLoading === 'tip' ? 'Memproses...' : <><DollarSign className="h-4 w-4 inline-block" /> Beri Tip</>}
                  </Button>
                )}
              </>
            )}

            {/* No actions available */}
            {booking.status === 'CANCELLED' && (
              <p className="text-sm text-dark-500">Booking ini telah dibatalkan</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}