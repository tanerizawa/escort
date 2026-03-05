'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface BookingSummary {
  id: string;
  escort: { firstName: string; lastName: string; profilePhoto?: string };
  eventType: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  basePrice: number;
  platformFee: number;
  totalAmount: number;
}

const PAYMENT_METHODS = [
  {
    group: 'Virtual Account',
    methods: [
      { id: 'va_bca', name: 'BCA Virtual Account', icon: '🏦' },
      { id: 'va_bni', name: 'BNI Virtual Account', icon: '🏦' },
      { id: 'va_mandiri', name: 'Mandiri Virtual Account', icon: '🏦' },
      { id: 'va_bri', name: 'BRI Virtual Account', icon: '🏦' },
    ],
  },
  {
    group: 'E-Wallet',
    methods: [
      { id: 'ew_gopay', name: 'GoPay', icon: '💚' },
      { id: 'ew_ovo', name: 'OVO', icon: '💜' },
      { id: 'ew_dana', name: 'DANA', icon: '💙' },
      { id: 'ew_shopeepay', name: 'ShopeePay', icon: '🧡' },
    ],
  },
  {
    group: 'Kartu Kredit / Debit',
    methods: [
      { id: 'cc_visa', name: 'Visa / Mastercard', icon: '💳' },
    ],
  },
];

export default function PaymentCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bookingId) loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const res = await api.get(`/bookings/${bookingId}`);
      const b = res.data;
      const hours = Math.ceil(
        (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60 * 60)
      );
      setBooking({
        id: b.id,
        escort: b.escort,
        eventType: b.eventType || b.serviceType,
        startTime: b.startTime,
        endTime: b.endTime,
        totalHours: hours,
        basePrice: b.totalPrice || b.basePrice || 0,
        platformFee: Math.round((b.totalPrice || b.basePrice || 0) * 0.2),
        totalAmount: b.totalPrice || b.totalAmount || 0,
      });
    } catch {
      setError('Booking tidak ditemukan');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!selectedMethod || !booking) return;
    setProcessing(true);
    setError('');
    try {
      const res = await api.post('/payments', {
        bookingId: booking.id,
        paymentMethod: selectedMethod,
        amount: booking.totalAmount,
      });
      router.push(`/payments/${res.data.id || booking.id}/status`);
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
        <p className="text-dark-400">Booking tidak ditemukan</p>
        <Button className="mt-4" onClick={() => router.push('/bookings')}>Kembali</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-light text-dark-100">Pembayaran</h1>
        <p className="mt-1 text-sm text-dark-400">Pilih metode pembayaran untuk melanjutkan</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Payment Methods — left */}
        <div className="lg:col-span-3 space-y-6">
          {PAYMENT_METHODS.map((group) => (
            <Card key={group.group}>
              <CardHeader>
                <CardTitle className="text-sm">{group.group}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.methods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                        selectedMethod === method.id
                          ? 'border-brand-400 bg-brand-400/5'
                          : 'border-dark-700/50 hover:border-dark-600'
                      }`}
                    >
                      <span className="text-xl">{method.icon}</span>
                      <span className="text-sm text-dark-200">{method.name}</span>
                      {selectedMethod === method.id && (
                        <svg className="ml-auto h-5 w-5 text-brand-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary — right */}
        <div className="lg:col-span-2">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-sm">Ringkasan Pembayaran</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Escort */}
              <div className="flex items-center gap-3 pb-4 border-b border-dark-700/50">
                {booking.escort.profilePhoto ? (
                  <img src={booking.escort.profilePhoto} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-400/10">
                    <span className="text-sm font-medium text-brand-400">{booking.escort.firstName[0]}</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-dark-200">
                    {booking.escort.firstName} {booking.escort.lastName}
                  </p>
                  <p className="text-xs text-dark-500">{booking.eventType}</p>
                </div>
              </div>

              {/* Details */}
              <div className="mt-4 space-y-2 text-sm">
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
                  <span className="text-dark-400">Biaya layanan</span>
                  <span className="text-dark-200">{formatCurrency(booking.basePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Platform fee (20%)</span>
                  <span className="text-dark-200">{formatCurrency(booking.platformFee)}</span>
                </div>
              </div>

              <div className="mt-4 border-t border-dark-700/50 pt-4">
                <div className="flex justify-between text-base">
                  <span className="font-medium text-dark-200">Total</span>
                  <span className="font-semibold text-brand-400">{formatCurrency(booking.totalAmount)}</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-400">
                  {error}
                </div>
              )}

              <Button
                className="mt-6 w-full"
                onClick={handlePay}
                disabled={!selectedMethod || processing}
              >
                {processing ? 'Memproses...' : `Bayar ${formatCurrency(booking.totalAmount)}`}
              </Button>

              <p className="mt-3 text-center text-[10px] text-dark-600">
                Pembayaran diproses secara aman melalui payment gateway tersertifikasi PCI-DSS
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
