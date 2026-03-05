'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';

interface Earnings {
  totalEarnings: number;
  pendingPayout: number;
  completedPayouts: number;
  totalBookings: number;
}

export default function EscortEarningsPage() {
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const res = await api.get('/payments/earnings');
      setEarnings(res.data);
    } catch (err) {
      console.error('Failed to load earnings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawLoading(true);
    setMessage('');
    try {
      await api.post('/payments/withdraw', {
        amount: Number(withdrawAmount),
        bankAccount,
      });
      setMessage('Permintaan withdraw berhasil diajukan');
      setShowWithdraw(false);
      setWithdrawAmount('');
      setBankAccount('');
      await loadEarnings();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Gagal mengajukan withdraw');
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-light text-dark-100">Pendapatan</h1>
        <p className="mt-1 text-sm text-dark-400">Ringkasan pendapatan dan penarikan dana</p>
      </div>

      {message && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
          message.includes('berhasil')
            ? 'border-green-500/20 bg-green-500/10 text-green-400'
            : 'border-red-500/20 bg-red-500/10 text-red-400'
        }`}>
          {message}
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="py-5 text-center">
            <p className="text-sm text-dark-400">Total Pendapatan</p>
            <p className="mt-1 text-2xl font-light text-brand-400">
              {formatCurrency(earnings?.totalEarnings || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 text-center">
            <p className="text-sm text-dark-400">Menunggu Pencairan</p>
            <p className="mt-1 text-2xl font-light text-yellow-400">
              {formatCurrency(earnings?.pendingPayout || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 text-center">
            <p className="text-sm text-dark-400">Sudah Dicairkan</p>
            <p className="mt-1 text-2xl font-light text-green-400">
              {formatCurrency(earnings?.completedPayouts || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 text-center">
            <p className="text-sm text-dark-400">Total Booking</p>
            <p className="mt-1 text-2xl font-light text-dark-100">
              {earnings?.totalBookings || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Withdraw */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-dark-100">Penarikan Dana</h3>
            {!showWithdraw && (
              <Button size="sm" onClick={() => setShowWithdraw(true)}>
                Tarik Dana
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showWithdraw ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark-300">Jumlah (Rp)</label>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Minimal Rp 100.000"
                  min={100000}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark-300">Nomor Rekening Bank</label>
                <Input
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="BCA - 1234567890 - Nama Pemilik"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleWithdraw} disabled={withdrawLoading || !withdrawAmount || !bankAccount}>
                  {withdrawLoading ? 'Memproses...' : 'Ajukan Penarikan'}
                </Button>
                <Button variant="outline" onClick={() => setShowWithdraw(false)}>
                  Batal
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-dark-500">
              <p>Saldo tersedia untuk penarikan: <span className="font-medium text-brand-400">{formatCurrency(earnings?.pendingPayout || 0)}</span></p>
              <p className="mt-1 text-xs">Penarikan diproses dalam 1-3 hari kerja</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
