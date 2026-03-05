'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import api from '@/lib/api';

interface Payment {
  id: string;
  amount: number;
  platformFee: number;
  status: string;
  paymentMethod?: string;
  createdAt: string;
  booking: {
    id: string;
    startTime: string;
    location: string;
    escortProfile?: {
      user: { firstName: string; lastName: string };
    };
  };
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Menunggu', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  ESCROW: { label: 'Escrow', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  RELEASED: { label: 'Selesai', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  REFUNDED: { label: 'Refund', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  FAILED: { label: 'Gagal', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadPayments();
  }, [statusFilter]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/payments', { params });
      setPayments(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = payments
    .filter((p) => p.status !== 'FAILED' && p.status !== 'REFUNDED')
    .reduce((sum, p) => sum + p.amount + p.platformFee, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-light text-dark-100">Riwayat Transaksi</h1>
        <p className="mt-1 text-sm text-dark-400">Riwayat pembayaran dan transaksi Anda</p>
      </div>

      {/* Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-sm text-dark-400">Total Transaksi</p>
            <p className="mt-1 text-2xl font-light text-brand-400">{payments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-sm text-dark-400">Total Pengeluaran</p>
            <p className="mt-1 text-2xl font-light text-dark-100">{formatCurrency(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-sm text-dark-400">Menunggu Pembayaran</p>
            <p className="mt-1 text-2xl font-light text-yellow-400">
              {payments.filter((p) => p.status === 'PENDING').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-dark-400">{payments.length} transaksi</p>
        <div className="w-40">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="Semua Status"
            options={[
              { value: 'PENDING', label: 'Menunggu' },
              { value: 'ESCROW', label: 'Escrow' },
              { value: 'RELEASED', label: 'Selesai' },
              { value: 'REFUNDED', label: 'Refund' },
            ]}
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
        </div>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent>
            <div className="py-16 text-center">
              <div className="mb-4 text-4xl">💳</div>
              <h3 className="text-lg font-light text-dark-200">Belum Ada Transaksi</h3>
              <p className="mt-2 text-sm text-dark-500">
                Riwayat transaksi Anda akan ditampilkan di sini.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => {
            const status = statusConfig[payment.status] || statusConfig.PENDING;
            return (
              <Card key={payment.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-400/10">
                        <svg className="h-5 w-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-dark-200">
                          {payment.booking?.escortProfile?.user
                            ? `${payment.booking.escortProfile.user.firstName} ${payment.booking.escortProfile.user.lastName}`
                            : 'Booking'}
                        </p>
                        <p className="text-xs text-dark-500">
                          {formatDateTime(payment.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge className={status.color}>{status.label}</Badge>
                      <p className="text-sm font-medium text-dark-100">
                        {formatCurrency(payment.amount + payment.platformFee)}
                      </p>
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
