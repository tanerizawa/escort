'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { WizardShell, WizardStep, WizardNavigation } from '@/components/ui/wizard';

interface BookingSummary {
  id: string;
  escort: { firstName: string; lastName: string; profilePhoto?: string };
  serviceType: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  totalAmount: number;
}

const PAYMENT_METHODS = [
  {
    group: 'Mode Uji Coba',
    emoji: '🧪',
    methods: [
      { id: 'doku', name: 'Pembayaran Simulasi', icon: 'Shield' },
    ],
  },
];

const PAYMENT_METHOD_OPTIONS = PAYMENT_METHODS.flatMap((group) =>
  group.methods.map((method) => ({
    ...method,
    group: group.group,
    emoji: group.emoji,
  }))
);

const DEFAULT_METHOD_KEY = PAYMENT_METHOD_OPTIONS[0]?.id || '';

type PaymentType = 'FULL' | 'DP_50';

const WIZARD_STEPS = [
  { label: 'Ringkasan' },
  { label: 'Konfirmasi' },
];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/* ── Step 1: Booking Review + Payment Setup ── */
function BookingReviewStep({
  booking,
  paymentType,
  setPaymentType,
  chargeAmount,
}: {
  booking: BookingSummary;
  paymentType: PaymentType;
  setPaymentType: (t: PaymentType) => void;
  chargeAmount: number;
}) {
  const selectedMethod = PAYMENT_METHOD_OPTIONS[0];

  return (
    <div className="space-y-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10">
        <Icon name="ShoppingBag" className="h-8 w-8 text-brand-400" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-light text-dark-100">Ringkasan Pembayaran</h2>
        <p className="mt-1 text-sm text-dark-400">Cek booking lalu pilih jumlah yang ingin dibayar sekarang</p>
      </div>

      {/* Escort card */}
      <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-4">
        <div className="flex items-center gap-4">
          {booking.escort?.profilePhoto ? (
            <img src={booking.escort.profilePhoto} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-brand-400/20" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-400/10 ring-2 ring-brand-400/20">
              <span className="text-xl font-medium text-brand-400">{booking.escort?.firstName?.[0] || '?'}</span>
            </div>
          )}
          <div>
            <p className="font-medium text-dark-100">{booking.escort?.firstName} {booking.escort?.lastName}</p>
            <p className="text-sm text-dark-400">{booking.serviceType}</p>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-4">
          <p className="text-xs text-dark-500">Tanggal</p>
          <p className="mt-1 text-sm font-medium text-dark-200">
            {new Date(booking.startTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-4">
          <p className="text-xs text-dark-500">Durasi</p>
          <p className="mt-1 text-sm font-medium text-dark-200">{booking.totalHours} jam</p>
        </div>
        <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-4">
          <p className="text-xs text-dark-500">Waktu Mulai</p>
          <p className="mt-1 text-sm font-medium text-dark-200">
            {new Date(booking.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-4">
          <p className="text-xs text-dark-500">Total Biaya</p>
          <p className="mt-1 text-sm font-semibold text-brand-400">{formatCurrency(booking.totalAmount)}</p>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-dark-500">Pilih Pembayaran</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentType('FULL')}
            className={`rounded-xl border p-4 text-left transition-all ${
              paymentType === 'FULL'
                ? 'border-brand-400 bg-brand-400/5 ring-1 ring-brand-400/20'
                : 'border-dark-700/50 hover:border-dark-600'
            }`}
          >
            <p className="text-2xl mb-2">💰</p>
            <p className="text-sm font-medium text-dark-200">Bayar Penuh</p>
            <p className="mt-0.5 text-xs text-dark-500">100% sekarang</p>
            <p className="mt-2 text-sm font-semibold text-brand-400">{formatCurrency(booking.totalAmount)}</p>
          </button>
          <button
            type="button"
            onClick={() => setPaymentType('DP_50')}
            className={`rounded-xl border p-4 text-left transition-all ${
              paymentType === 'DP_50'
                ? 'border-brand-400 bg-brand-400/5 ring-1 ring-brand-400/20'
                : 'border-dark-700/50 hover:border-dark-600'
            }`}
          >
            <p className="text-2xl mb-2">💎</p>
            <p className="text-sm font-medium text-dark-200">DP 50%</p>
            <p className="mt-0.5 text-xs text-dark-500">Bayar sisanya nanti</p>
            <p className="mt-2 text-sm font-semibold text-brand-400">{formatCurrency(Math.round(booking.totalAmount * 0.5))}</p>
          </button>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-dark-500">Metode Pembayaran</p>
        <div className="rounded-xl border border-brand-400/20 bg-brand-400/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dark-900/40 text-lg">
              {selectedMethod?.emoji || '🧪'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-dark-100">Pembayaran Simulasi</p>
                <span className="rounded-full border border-brand-400/20 bg-brand-400/10 px-2 py-0.5 text-[10px] text-brand-300">
                  Aktif
                </span>
              </div>
              <p className="mt-1 text-xs text-dark-400">
                Saat ini checkout memakai satu metode pembayaran simulasi yang dipilih otomatis agar alurnya tetap sederhana.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-dark-700/40 bg-dark-800/30 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-dark-500">Bayar Sekarang</p>
            <p className="mt-1 text-2xl font-semibold text-brand-400">{formatCurrency(chargeAmount)}</p>
            <p className="mt-1 text-xs text-dark-500">
              {paymentType === 'DP_50'
                ? `Sisa pelunasan ${formatCurrency(Math.round(booking.totalAmount * 0.5))} setelah sesi selesai`
                : 'Seluruh biaya booking dibayar di muka'}
            </p>
          </div>
          <div className="rounded-xl border border-dark-700/40 bg-dark-900/30 px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-wider text-dark-500">Total Booking</p>
            <p className="mt-1 text-sm font-medium text-dark-200">{formatCurrency(booking.totalAmount)}</p>
          </div>
        </div>
      </div>

      <WizardNavigation nextLabel="Lanjut ke Konfirmasi →" />
    </div>
  );
}

/* ── Step 2: Confirm & Pay ── */
function ConfirmStep({
  booking,
  paymentType,
  selectedMethodKey,
  chargeAmount,
  processing,
  error,
  onPay,
}: {
  booking: BookingSummary;
  paymentType: PaymentType;
  selectedMethodKey: string;
  chargeAmount: number;
  processing: boolean;
  error: string;
  onPay: () => void;
}) {
  const getMethodName = (key: string) => {
    return PAYMENT_METHOD_OPTIONS.find((method) => method.id === key)?.name || key;
  };

  return (
    <div className="space-y-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10">
        <Icon name="Shield" className="h-8 w-8 text-brand-400" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-light text-dark-100">Konfirmasi Pembayaran</h2>
        <p className="mt-1 text-sm text-dark-400">Satu langkah lagi sebelum proses pembayaran dimulai</p>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-5 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-dark-700/30">
          {booking.escort?.profilePhoto ? (
            <img src={booking.escort.profilePhoto} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-400/10">
              <span className="text-sm font-medium text-brand-400">{booking.escort?.firstName?.[0] || '?'}</span>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-dark-200">{booking.escort?.firstName} {booking.escort?.lastName}</p>
            <p className="text-xs text-dark-500">{booking.serviceType}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-dark-400">Tanggal</span>
            <span className="text-dark-200">
              {new Date(booking.startTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-dark-400">Durasi</span>
            <span className="text-dark-200">{booking.totalHours} jam</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dark-400">Metode</span>
            <span className="text-dark-200 text-right max-w-[200px] truncate">
              {getMethodName(selectedMethodKey)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-dark-400">Tipe</span>
            <span className="text-dark-200">{paymentType === 'DP_50' ? 'DP 50% di muka' : 'Bayar penuh 100%'}</span>
          </div>
        </div>

        <div className="border-t border-dark-700/30 pt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-dark-400">Total Booking</span>
            <span className="text-dark-200">{formatCurrency(booking.totalAmount)}</span>
          </div>
          {paymentType === 'DP_50' && (
            <div className="flex justify-between">
              <span className="text-dark-400">Sisa Pelunasan</span>
              <span className="text-yellow-400">{formatCurrency(Math.round(booking.totalAmount * 0.5))}</span>
            </div>
          )}
          <div className="flex justify-between text-base pt-2 border-t border-dark-700/30">
            <span className="font-medium text-dark-200">Bayar Sekarang</span>
            <span className="font-bold text-brand-400">{formatCurrency(chargeAmount)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <WizardNavigation
        nextLabel={processing ? 'Memproses...' : `Bayar ${formatCurrency(chargeAmount)}`}
        nextDisabled={processing}
        onNext={() => { onPay(); return false; }}
      />

      <p className="text-center text-[10px] text-dark-600">
        Transaksi ini menggunakan pembayaran simulasi untuk kebutuhan uji coba alur booking
      </p>
    </div>
  );
}

export default function PaymentCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams?.get('bookingId');

  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [selectedMethodKey, setSelectedMethodKey] = useState(DEFAULT_METHOD_KEY);
  const [paymentType, setPaymentType] = useState<PaymentType>('FULL');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [existingOrderId, setExistingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setError('Booking ID tidak ditemukan');
      setLoading(false);
      return;
    }

    if (!UUID_REGEX.test(bookingId)) {
      setError('Format Booking ID tidak valid');
      setLoading(false);
      return;
    }

    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const res = await api.get(`/bookings/${bookingId}`);
      const b = res.data?.data || res.data;
      const hours = Math.ceil(
        (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60 * 60)
      );

      setBooking({
        id: b.id,
        escort: b.escort,
        serviceType: b.serviceType || b.eventType,
        startTime: b.startTime,
        endTime: b.endTime,
        totalHours: hours,
        totalAmount: Number(b.totalAmount),
      });

      setExistingOrderId(null);
      setError('');

      if (b.status !== 'CONFIRMED') {
        setError('Booking harus dalam status DIKONFIRMASI untuk melakukan pembayaran');
        return;
      }

      if (b.payment && b.payment.status !== 'PENDING') {
        const resolvedOrderId = b.payment.paymentGatewayRef || b.payment.gatewayRef || b.payment.id || null;
        setExistingOrderId(resolvedOrderId);
        setError(`Pembayaran booking ini sudah berstatus ${b.payment.status}`);
        return;
      }
    } catch {
      setError('Booking tidak ditemukan');
      setBooking(null);
      setExistingOrderId(null);
    } finally {
      setLoading(false);
    }
  };

  const getMethodDetails = (key: string) => {
    return PAYMENT_METHOD_OPTIONS.find((method) => method.id === key) || null;
  };

  const chargeAmount = paymentType === 'DP_50'
    ? Math.round((booking?.totalAmount || 0) * 0.5)
    : (booking?.totalAmount || 0);

  const handlePay = async () => {
    if (!selectedMethodKey || !booking || processing) return;
    setProcessing(true);
    setSubmitError('');

    const methodDetail = getMethodDetails(selectedMethodKey);
    if (!methodDetail) {
      setSubmitError('Metode pembayaran tidak valid');
      setProcessing(false);
      return;
    }

    try {
      // Revalidate booking/payment state to prevent stale-tab payment attempts.
      const latest = await api.get(`/bookings/${booking.id}`);
      const latestBooking = latest.data?.data || latest.data;
      if (latestBooking?.status !== 'CONFIRMED') {
        setSubmitError('Status booking berubah. Booking harus dikonfirmasi sebelum pembayaran.');
        setProcessing(false);
        return;
      }
      if (latestBooking?.payment && latestBooking.payment.status !== 'PENDING') {
        const resolvedOrderId = latestBooking.payment.paymentGatewayRef || latestBooking.payment.gatewayRef || latestBooking.payment.id;
        setSubmitError(`Pembayaran sudah berstatus ${latestBooking.payment.status}.`);
        if (resolvedOrderId) {
          router.push(`/user/payments/status?order_id=${encodeURIComponent(resolvedOrderId)}`);
          return;
        }
        setProcessing(false);
        return;
      }

      const payload: Record<string, string> = {
        bookingId: booking.id,
        method: methodDetail.id,
        paymentType,
      };

      const res = await api.post('/payments', payload);
      const data = res.data?.data || res.data;

      if (data?.gateway?.redirectUrl || data?.gateway?.invoiceUrl) {
        window.location.href = data.gateway.redirectUrl || data.gateway.invoiceUrl;
      } else {
        const orderId = data?.gateway?.orderId || data?.paymentGatewayRef || data?.id || booking.id;
        router.push(`/user/payments/status?order_id=${encodeURIComponent(orderId)}`);
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Gagal memproses pembayaran');
      setProcessing(false);
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
        <p className="text-dark-400">{error || 'Booking tidak ditemukan'}</p>
        <Link href="/user/bookings">
          <Button className="mt-4">Kembali</Button>
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-5 text-center">
          <p className="text-sm text-yellow-300">{error}</p>
          <div className="mt-5 flex flex-col gap-2">
            {existingOrderId && (
              <Button onClick={() => router.push(`/user/payments/status?order_id=${encodeURIComponent(existingOrderId)}`)}>
                Lihat Status Pembayaran
              </Button>
            )}
            <Button variant="ghost" onClick={() => router.push(`/user/bookings/${booking.id}`)}>
              Kembali ke Detail Booking
            </Button>
            <Button variant="ghost" onClick={() => router.push('/user/bookings')}>
              Lihat Semua Booking
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <nav className="mb-6 text-sm text-dark-500">
        <Link href="/user/bookings" className="hover:text-brand-400 transition-colors">Bookings</Link>
        <span className="mx-2">/</span>
        <Link href={`/user/bookings/${booking.id}`} className="hover:text-brand-400 transition-colors">Detail</Link>
        <span className="mx-2">/</span>
        <span className="text-dark-300">Pembayaran</span>
      </nav>

      <WizardShell steps={WIZARD_STEPS} totalSteps={2}>
        <WizardStep step={0}>
          <BookingReviewStep
            booking={booking}
            paymentType={paymentType}
            setPaymentType={setPaymentType}
            chargeAmount={chargeAmount}
          />
        </WizardStep>

        <WizardStep step={1}>
          <ConfirmStep
            booking={booking}
            paymentType={paymentType}
            selectedMethodKey={selectedMethodKey}
            chargeAmount={chargeAmount}
            processing={processing}
            error={submitError}
            onPay={handlePay}
          />
        </WizardStep>
      </WizardShell>
    </div>
  );
}