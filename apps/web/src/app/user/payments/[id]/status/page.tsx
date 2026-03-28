'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { AlarmClock, CheckCircle2, Hourglass, Lock, Undo2, XCircle } from 'lucide-react';
import { Icon } from '@/components/ui/icon';

type PaymentStatus = 'PENDING' | 'ESCROW' | 'RELEASED' | 'REFUNDED' | 'FAILED';

interface PaymentInfo {
  id: string;
  bookingId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<PaymentStatus, { icon: string; title: string; desc: string; color: string }> = {
  PENDING: {
    icon: 'Hourglass',
    title: 'Menunggu Pembayaran',
    desc: 'Silakan selesaikan pembayaran sebelum batas waktu.',
    color: 'text-yellow-400',
  },
  ESCROW: {
    icon: 'Lock',
    title: 'Pembayaran Diterima',
    desc: 'Dana telah diterima dan disimpan dalam escrow hingga layanan selesai.',
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

export default function PaymentStatusPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params?.id as string;

  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadPayment();

    // Poll for status changes
    intervalRef.current = setInterval(loadPayment, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paymentId]);

  const loadPayment = async () => {
    try {
      const res = await api.get(`/payments/${paymentId}`);
      setPayment(res.data?.data || res.data);
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.message === 'No refresh token') {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="py-20 text-center">
        <p className="text-dark-400">Pembayaran tidak ditemukan</p>
        <Button className="mt-4" onClick={() => router.push('/user/payments')}>Kembali</Button>
      </div>
    );
  }

  const config = STATUS_CONFIG[payment.status] || STATUS_CONFIG.PENDING;

  return (
    <div className="mx-auto max-w-lg py-8">
      <Card>
        <CardContent>
          <div className="py-8 text-center">
            {/* Status icon with animation for pending */}
            <div className={`mb-6 ${payment.status === 'PENDING' ? 'animate-pulse' : ''}`}>
              <Icon name={config.icon} className={`h-16 w-16 mx-auto ${config.color}`} />
            </div>

            <h2 className={`text-xl font-light ${config.color}`}>{config.title}</h2>
            <p className="mt-2 text-sm text-dark-400">{config.desc}</p>

            {/* Payment Details */}
            <div className="mt-8 rounded-xl border border-dark-700/50 bg-dark-800/30 p-4 text-left">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-500">ID Pembayaran</span>
                  <span className="font-mono text-xs text-dark-300">{payment.id.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-500">Jumlah</span>
                  <span className="font-medium text-dark-200">{formatCurrency(payment.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-500">Metode</span>
                  <span className="text-dark-300">{payment.paymentMethod || '-'}</span>
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

            {/* Countdown for pending */}
            {payment.status === 'PENDING' && (
              <div className="mt-6 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                <p className="text-xs text-yellow-400">
                  <AlarmClock className="h-4 w-4 inline-block" /> Selesaikan pembayaran dalam 24 jam untuk menghindari pembatalan otomatis.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3">
              {payment.status === 'PENDING' && (
                <Button className="w-full" onClick={() => router.push(`/user/payments/checkout?bookingId=${payment.bookingId}`)}>
                  Bayar Sekarang
                </Button>
              )}
              <Button
                variant={payment.status === 'PENDING' ? 'outline' : 'secondary'}
                className="w-full"
                onClick={() => router.push(`/user/bookings/${payment.bookingId}`)}
              >
                Lihat Detail Booking
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => router.push('/user/payments')}>
                Riwayat Pembayaran
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
