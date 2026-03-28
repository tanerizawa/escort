'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { WizardShell, WizardStep, StepIndicator, WizardNavigation } from '@/components/ui/wizard';

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
    group: 'Transfer Bank & E-Wallet — DOKU',
    emoji: '🏦',
    methods: [
      { id: 'doku', name: 'Semua Metode (Pilih di halaman pembayaran)', icon: 'CreditCard' },
      { id: 'doku_va', name: 'Virtual Account (BCA, BNI, BRI, Mandiri, dll)', icon: 'Landmark' },
      { id: 'doku_ewallet', name: 'E-Wallet (OVO, DANA, ShopeePay, LinkAja)', icon: 'Smartphone' },
      { id: 'doku_qris', name: 'QRIS (Scan QR — Semua Bank & E-Wallet)', icon: 'QrCode' },
    ],
  },
  {
    group: 'Kartu & Gerai — DOKU',
    emoji: '💳',
    methods: [
      { id: 'doku_cc', name: 'Kartu Kredit / Debit (Visa, Mastercard)', icon: 'CreditCard' },
      { id: 'doku_retail', name: 'Alfamart / Indomaret', icon: 'Store' },
    ],
  },
  {
    group: 'Cryptocurrency — Fast Payment',
    emoji: '⚡',
    methods: [
      { id: 'crypto', name: 'Semua Crypto (Pilih di halaman pembayaran)', icon: 'Wallet' },
    ],
  },
  {
    group: 'Stablecoin (Tanpa Volatilitas)',
    emoji: '🔒',
    methods: [
      { id: 'crypto_usdt', name: 'USDT (Tether) — TRC-20 / ERC-20', icon: 'Landmark' },
    ],
  },
  {
    group: 'Popular Crypto',
    emoji: '🪙',
    methods: [
      { id: 'crypto_eth', name: 'ETH (Ethereum)', icon: 'CreditCard' },
      { id: 'crypto_btc', name: 'BTC (Bitcoin)', icon: 'CreditCard' },
      { id: 'crypto_sol', name: 'SOL (Solana) — Ultra Cepat', icon: 'Smartphone' },
      { id: 'crypto_xrp', name: 'XRP (Ripple) — 3 Detik', icon: 'Smartphone' },
    ],
  },
];

type PaymentType = 'FULL' | 'DP_50';

const WIZARD_STEPS = [
  { label: 'Review' },
  { label: 'Metode' },
  { label: 'Konfirmasi' },
];

/* ── Step 1: Booking Review ── */
function BookingReviewStep({ booking }: { booking: BookingSummary }) {
  return (
    <div className="space-y-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10">
        <Icon name="ShoppingBag" className="h-8 w-8 text-brand-400" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-light text-dark-100">Review Booking</h2>
        <p className="mt-1 text-sm text-dark-400">Pastikan detail booking Anda sudah benar</p>
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

      <WizardNavigation nextLabel="Pilih Metode Pembayaran →" />
    </div>
  );
}

/* ── Step 2: Payment Type & Method ── */
function PaymentMethodStep({
  booking,
  paymentType,
  setPaymentType,
  selectedMethodKey,
  setSelectedMethodKey,
}: {
  booking: BookingSummary;
  paymentType: PaymentType;
  setPaymentType: (t: PaymentType) => void;
  selectedMethodKey: string;
  setSelectedMethodKey: (k: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10">
        <Icon name="CreditCard" className="h-8 w-8 text-brand-400" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-light text-dark-100">Metode Pembayaran</h2>
        <p className="mt-1 text-sm text-dark-400">Pilih tipe dan metode pembayaran</p>
      </div>

      {/* Payment type */}
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-dark-500">Tipe Pembayaran</p>
        <div className="grid grid-cols-2 gap-3">
          <button
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

      {/* Payment methods */}
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-dark-500">Metode Pembayaran</p>
        <div className="space-y-4">
          {PAYMENT_METHODS.map((group) => (
            <div key={group.group}>
              <p className="mb-2 flex items-center gap-2 text-xs font-medium text-dark-400">
                <span>{group.emoji}</span> {group.group}
              </p>
              <div className="space-y-1.5">
                {group.methods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethodKey(method.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                      selectedMethodKey === method.id
                        ? 'border-brand-400 bg-brand-400/5 ring-1 ring-brand-400/20'
                        : 'border-dark-700/50 hover:border-dark-600'
                    }`}
                  >
                    <Icon name={method.icon} className="h-5 w-5 text-dark-400" />
                    <span className="flex-1 text-sm text-dark-200">{method.name}</span>
                    {selectedMethodKey === method.id && (
                      <svg className="h-5 w-5 text-brand-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <WizardNavigation nextDisabled={!selectedMethodKey} nextLabel="Lanjut ke Konfirmasi →" />
    </div>
  );
}

/* ── Step 3: Confirm & Pay ── */
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
    for (const group of PAYMENT_METHODS) {
      for (const m of group.methods) {
        if (m.id === key) return m.name;
      }
    }
    return key;
  };

  return (
    <div className="space-y-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10">
        <Icon name="Shield" className="h-8 w-8 text-brand-400" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-light text-dark-100">Konfirmasi Pembayaran</h2>
        <p className="mt-1 text-sm text-dark-400">Periksa kembali sebelum melanjutkan</p>
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
            <span className="text-dark-200 text-right max-w-[200px] truncate">{getMethodName(selectedMethodKey)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dark-400">Tipe</span>
            <span className="text-dark-200">{paymentType === 'DP_50' ? 'DP 50%' : 'Bayar Penuh'}</span>
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
        Pembayaran diproses secara aman melalui DOKU & NOWPayments
      </p>
    </div>
  );
}

export default function PaymentCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams?.get('bookingId');

  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [selectedMethodKey, setSelectedMethodKey] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('FULL');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bookingId) loadBooking();
    else setError('Booking ID tidak ditemukan');
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const res = await api.get(`/bookings/${bookingId}`);
      const b = res.data?.data || res.data;
      const hours = Math.ceil(
        (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60 * 60)
      );

      if (b.status !== 'CONFIRMED') {
        setError('Booking harus dalam status DIKONFIRMASI untuk melakukan pembayaran');
        setLoading(false);
        return;
      }

      if (b.payment && b.payment.status !== 'PENDING') {
        setError('Pembayaran sudah diproses untuk booking ini');
        setLoading(false);
        return;
      }

      setBooking({
        id: b.id,
        escort: b.escort,
        serviceType: b.serviceType || b.eventType,
        startTime: b.startTime,
        endTime: b.endTime,
        totalHours: hours,
        totalAmount: Number(b.totalAmount),
      });
    } catch {
      setError('Booking tidak ditemukan');
    } finally {
      setLoading(false);
    }
  };

  const getMethodDetails = (key: string) => {
    for (const group of PAYMENT_METHODS) {
      for (const m of group.methods) {
        if (m.id === key) return m;
      }
    }
    return null;
  };

  const chargeAmount = paymentType === 'DP_50'
    ? Math.round((booking?.totalAmount || 0) * 0.5)
    : (booking?.totalAmount || 0);

  const handlePay = async () => {
    if (!selectedMethodKey || !booking) return;
    setProcessing(true);
    setError('');

    const methodDetail = getMethodDetails(selectedMethodKey);
    if (!methodDetail) {
      setError('Metode pembayaran tidak valid');
      setProcessing(false);
      return;
    }

    try {
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
        router.push(`/user/payments/status?order_id=${data?.gateway?.orderId || booking.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memproses pembayaran');
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

  return (
    <div className="mx-auto max-w-lg">
      <nav className="mb-6 text-sm text-dark-500">
        <Link href="/user/bookings" className="hover:text-brand-400 transition-colors">Bookings</Link>
        <span className="mx-2">/</span>
        <Link href={`/user/bookings/${booking.id}`} className="hover:text-brand-400 transition-colors">Detail</Link>
        <span className="mx-2">/</span>
        <span className="text-dark-300">Pembayaran</span>
      </nav>

      <WizardShell totalSteps={3}>
        {({ currentStep }) => (
          <>
            <StepIndicator steps={WIZARD_STEPS} current={currentStep} className="mb-8" />

            <WizardStep step={0}>
              <BookingReviewStep booking={booking} />
            </WizardStep>

            <WizardStep step={1}>
              <PaymentMethodStep
                booking={booking}
                paymentType={paymentType}
                setPaymentType={setPaymentType}
                selectedMethodKey={selectedMethodKey}
                setSelectedMethodKey={setSelectedMethodKey}
              />
            </WizardStep>

            <WizardStep step={2}>
              <ConfirmStep
                booking={booking}
                paymentType={paymentType}
                selectedMethodKey={selectedMethodKey}
                chargeAmount={chargeAmount}
                processing={processing}
                error={error}
                onPay={handlePay}
              />
            </WizardStep>
          </>
        )}
      </WizardShell>
    </div>
  );
}