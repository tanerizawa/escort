'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { AlarmClock, AlertTriangle, CheckCircle2, FlaskConical, Hourglass, Lock, Undo2, XCircle } from 'lucide-react';
import { Icon } from '@/components/ui/icon';

type PaymentStatus = 'PENDING' | 'ESCROW' | 'RELEASED' | 'REFUNDED' | 'FAILED';

interface PaymentInfo {
  id: string;
  bookingId: string;
  amount: number;
  chargeAmount?: number;
  status: PaymentStatus;
  paymentMethod: string;
  paymentType?: string;
  paymentGatewayRef?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<PaymentStatus, { icon: string; title: string; desc: string; color: string }> = {
  PENDING: {
    icon: 'Hourglass',
    title: 'Menunggu Pembayaran',
    desc: 'Pembayaran sedang diverifikasi. Halaman ini akan memperbarui status secara otomatis.',
    color: 'text-yellow-400',
  },
  ESCROW: {
    icon: 'Lock',
    title: 'Pembayaran Berhasil',
    desc: 'Dana sudah diterima dan diamankan sampai sesi layanan selesai.',
    color: 'text-blue-400',
  },
  RELEASED: {
    icon: 'CheckCircle2',
    title: 'Pembayaran Selesai',
    desc: 'Pembayaran telah berhasil diproses dan dana telah dicairkan.',
    color: 'text-green-400',
  },
  REFUNDED: {
    icon: 'Undo2',
    title: 'Dana Dikembalikan',
    desc: 'Pembayaran telah direfund ke metode pembayaran Anda.',
    color: 'text-purple-400',
  },
  FAILED: {
    icon: 'XCircle',
    title: 'Pembayaran Gagal',
    desc: 'Pembayaran gagal diproses. Silakan coba lagi.',
    color: 'text-red-400',
  },
};

function formatPaymentMethod(method?: string) {
  if (!method) return '-';

  const normalized = method.toLowerCase();
  if (normalized === 'doku') return 'Pembayaran Simulasi';

  return method
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function getNextStepMessage(status: PaymentStatus) {
  switch (status) {
    case 'PENDING':
      return 'Tunggu konfirmasi pembayaran selesai. Jika Anda baru saja membayar, gunakan tombol cek ulang.';
    case 'ESCROW':
      return 'Booking sudah siap dilanjutkan. Buka detail booking untuk melihat status sesi dan langkah check-in.';
    case 'RELEASED':
      return 'Transaksi sudah selesai seluruhnya. Anda bisa kembali ke detail booking atau melihat riwayat booking lainnya.';
    case 'REFUNDED':
      return 'Dana sudah dikembalikan. Periksa detail booking bila Anda perlu melihat konteks transaksi ini.';
    case 'FAILED':
      return 'Pembayaran belum berhasil. Kembali ke detail booking untuk mencoba lagi dari jalur pembayaran yang sama.';
    default:
      return 'Periksa detail booking untuk melanjutkan proses transaksi Anda.';
  }
}

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams?.get('order_id');
  const mockRequested = searchParams?.get('mock') === 'true';
  const isMockEnabled = process.env.NEXT_PUBLIC_ENABLE_PAYMENT_MOCK === 'true';
  const isMock = mockRequested && isMockEnabled;

  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mockSettled, setMockSettled] = useState(false);
  const [checking, setChecking] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mockTriggeredRef = useRef(false);

  // Mock settlement is intentionally gated by env to prevent production misuse.
  useEffect(() => {
    if (isMock && orderId && !mockTriggeredRef.current) {
      mockTriggeredRef.current = true;
      settleMockPayment(orderId);
    }
  }, [isMock, orderId]);

  // Poll payment status
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError('Parameter order_id tidak ditemukan');
      return;
    }

    loadPayment();
    intervalRef.current = setInterval(loadPayment, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [orderId]);

  // Stop polling when payment is settled
  useEffect(() => {
    if (payment && payment.status !== 'PENDING') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [payment?.status]);

  const settleMockPayment = async (oid: string) => {
    try {
      // Try crypto webhook first (primary payment method), fallback to Xendit
      await api.post('/payments/crypto-webhook', {
        payment_id: `MOCK-CRYPTO-${Date.now()}`,
        payment_status: 'finished',
        order_id: oid,
        pay_currency: 'eth',
        pay_amount: 0.01,
        actually_paid: 0.01,
        price_amount: 0,
        price_currency: 'idr',
      });
      setMockSettled(true);
      setTimeout(loadPayment, 500);
    } catch (err) {
      // Fallback to Xendit webhook format
      try {
        await api.post('/payments/webhook', {
          id: `MOCK-INV-${Date.now()}`,
          external_id: oid,
          status: 'PAID',
          payment_method: 'BANK_TRANSFER',
          payment_channel: 'BCA',
          paid_amount: 0,
          paid_at: new Date().toISOString(),
        });
        setMockSettled(true);
        setTimeout(loadPayment, 500);
      } catch (err2) {
        console.warn('Mock settlement failed:', err2);
      }
    }
  };

  const loadPayment = async () => {
    try {
      const res = await api.get(`/payments/lookup?order_id=${encodeURIComponent(orderId!)}`);
      const data = res.data?.data || res.data;
      if (data) {
        setPayment(data);
        setError(null);
      }
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.message === 'No refresh token') {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      } else if (err?.response?.status === 404) {
        setError('Pembayaran tidak ditemukan untuk order ini');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setChecking(true);
    await loadPayment();
    setChecking(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
        <p className="mt-4 text-sm text-dark-400">
          {isMock ? 'Memproses pembayaran simulasi...' : 'Memuat status pembayaran...'}
        </p>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="py-20 text-center">
        <div className="mb-4"><AlertTriangle className="h-10 w-10" /></div>
        <p className="text-dark-400">{error || 'Pembayaran tidak ditemukan'}</p>
        <Button className="mt-4" onClick={() => router.push('/user/bookings')}>
          Lihat Booking Saya
        </Button>
      </div>
    );
  }

  const config = STATUS_CONFIG[payment.status] || STATUS_CONFIG.PENDING;
  const displayAmount = payment.chargeAmount || payment.amount;
  const nextStepMessage = getNextStepMessage(payment.status);

  return (
    <div className="mx-auto max-w-lg py-8">
      <Card>
        <CardContent>
          <div className="py-8 text-center">
            {/* Mock mode badge */}
            {isMock && mockSettled && (
              <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs text-green-400 inline-block">
                <FlaskConical className="h-4 w-4 inline-block" /> Pembayaran simulasi berhasil diproses otomatis
              </div>
            )}

            {mockRequested && !isMockEnabled && (
              <div className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-xs text-yellow-400 inline-block">
                <AlertTriangle className="h-4 w-4 inline-block" /> Mode simulasi tidak aktif di environment ini
              </div>
            )}

            {/* Status icon */}
            <div className={`mb-6 ${payment.status === 'PENDING' ? 'animate-pulse' : ''}`}>
              <Icon name={config.icon} className={`h-16 w-16 mx-auto ${config.color}`} />
            </div>

            <h2 className={`text-xl font-light ${config.color}`}>{config.title}</h2>
            <p className="mt-2 text-sm text-dark-400">{config.desc}</p>

            <div className="mt-6 rounded-xl border border-dark-700/50 bg-dark-800/30 p-4 text-left">
              <p className="text-[10px] font-medium uppercase tracking-widest text-dark-500">Langkah Berikutnya</p>
              <p className="mt-2 text-sm text-dark-300">{nextStepMessage}</p>
            </div>

            {/* Payment Details */}
            <div className="mt-8 rounded-xl border border-dark-700/50 bg-dark-800/30 p-4 text-left">
              <div className="mb-4 flex items-center justify-between border-b border-dark-700/40 pb-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-dark-500">Ringkasan Pembayaran</p>
                  <p className="mt-1 text-lg font-semibold text-dark-100">{formatCurrency(displayAmount)}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${payment.status === 'ESCROW' || payment.status === 'RELEASED' ? 'border-green-500/20 bg-green-500/10 text-green-400' : payment.status === 'PENDING' ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}>
                  {config.title}
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-500">ID Pembayaran</span>
                  <span className="font-mono text-xs text-dark-300">{payment.id.slice(0, 12)}...</span>
                </div>
                {payment.paymentGatewayRef && (
                  <div className="flex justify-between">
                    <span className="text-dark-500">Order ID</span>
                    <span className="font-mono text-xs text-dark-300">{payment.paymentGatewayRef.slice(0, 20)}...</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-dark-500">Jumlah</span>
                  <span className="font-medium text-dark-200">{formatCurrency(displayAmount)}</span>
                </div>
                {payment.paymentType === 'DP_50' && (
                  <div className="flex justify-between">
                    <span className="text-dark-500">Skema Bayar</span>
                    <span className="text-yellow-400 text-xs">DP 50% di muka</span>
                  </div>
                )}
                {payment.paymentType !== 'DP_50' && (
                  <div className="flex justify-between">
                    <span className="text-dark-500">Skema Bayar</span>
                    <span className="text-dark-300">Bayar penuh</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-dark-500">Metode</span>
                  <span className="text-dark-300">{formatPaymentMethod(payment.paymentMethod)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-500">Tanggal</span>
                  <span className="text-dark-300">
                    {new Date(payment.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Pending warning */}
            {payment.status === 'PENDING' && (
              <div className="mt-6 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                <p className="text-xs text-yellow-400">
                  <AlarmClock className="h-4 w-4 inline-block" /> Pembayaran masih diproses. Anda dapat menunggu pembaruan otomatis atau cek ulang manual.
                </p>
              </div>
            )}

            {/* Success message */}
            {payment.status === 'ESCROW' && (
              <div className="mt-6 rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                <p className="text-xs text-green-400">
                  <CheckCircle2 className="h-4 w-4 inline-block" /> Pembayaran sudah aman. Silakan kembali ke detail booking untuk memantau sesi dan proses check-in.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3">
              {payment.status === 'PENDING' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleRefresh}
                  disabled={checking}
                >
                  {checking ? 'Mengecek Status...' : 'Cek Status Sekarang'}
                </Button>
              )}
              <Button
                className="w-full"
                onClick={() => router.push(`/user/bookings/${payment.bookingId}`)}
              >
                {payment.status === 'ESCROW' ? 'Lanjut ke Detail Booking' : payment.status === 'FAILED' ? 'Kembali ke Detail Booking' : 'Lihat Detail Booking'}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => router.push('/user/bookings')}>
                Kembali ke Daftar Booking
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
        </div>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  );
}
