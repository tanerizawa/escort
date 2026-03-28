'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import { ClipboardList } from 'lucide-react';

interface Earnings {
  totalEarnings: number;
  pendingPayout: number;
  completedPayouts: number;
  totalBookings: number;
}

interface Withdrawal {
  id: string;
  amount: number;
  bankName: string;
  bankAccount: string;
  accountHolder?: string;
  status: string;
  createdAt: string;
  processedAt?: string;
}

const withdrawStatusConfig: Record<string, { label: string; variant: string }> = {
  PENDING: { label: 'Menunggu', variant: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  PROCESSING: { label: 'Diproses', variant: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  COMPLETED: { label: 'Selesai', variant: 'bg-green-500/10 text-green-400 border-green-500/20' },
  REJECTED: { label: 'Ditolak', variant: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export default function EscortEarningsPage() {
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [earningsRes, withdrawalsRes] = await Promise.all([
        api.get('/payments/earnings/summary'),
        api.get('/payments/withdrawals').catch(() => ({ data: { data: [] } })),
      ]);
      const earningsPayload = earningsRes.data?.data || earningsRes.data;
      setEarnings(earningsPayload);
      const wdPayload = withdrawalsRes.data?.data || withdrawalsRes.data;
      setWithdrawals(Array.isArray(wdPayload) ? wdPayload : []);
    } catch (err) {
      console.error('Failed to load earnings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (amount < 100000) {
      setMessage('Jumlah minimal penarikan adalah Rp 100.000');
      return;
    }
    if (earnings && amount > earnings.pendingPayout) {
      setMessage('Jumlah penarikan melebihi saldo tersedia');
      return;
    }
    if (!bankAccount.trim() || !bankName.trim()) {
      setMessage('Mohon isi nama bank dan nomor rekening');
      return;
    }

    setWithdrawLoading(true);
    setMessage('');
    try {
      await api.post('/payments/withdraw', {
        amount,
        bankName: bankName.trim(),
        bankAccount: bankAccount.trim(),
        accountHolder: accountHolder.trim() || undefined,
      });
      setMessage('Permintaan withdraw berhasil diajukan');
      setShowWithdraw(false);
      setWithdrawAmount('');
      setBankName('');
      setBankAccount('');
      setAccountHolder('');
      await loadData();
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
              {(earnings?.totalBookings || 0).toLocaleString('id-ID')}
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
                <label className="mb-1.5 block text-sm font-medium text-dark-300">Nama Bank</label>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="BCA, BNI, BRI, Mandiri, dll"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark-300">Nomor Rekening</label>
                <Input
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="1234567890"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark-300">Nama Pemilik Rekening</label>
                <Input
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Sesuai nama di buku tabungan"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleWithdraw} disabled={withdrawLoading || !withdrawAmount || !bankAccount || !bankName}>
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

      {/* Withdrawal History */}
      <Card className="mt-6">
        <CardHeader>
          <h3 className="text-lg font-medium text-dark-100">Riwayat Penarikan</h3>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="py-8 text-center text-sm text-dark-500">
              <div className="mb-2"><ClipboardList className="h-7 w-7" /></div>
              <p>Belum ada riwayat penarikan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((wd) => {
                const statusCfg = withdrawStatusConfig[wd.status] || withdrawStatusConfig.PENDING;
                return (
                  <div key={wd.id} className="flex items-center justify-between rounded-lg border border-dark-700/30 p-4">
                    <div>
                      <p className="text-sm font-medium text-dark-200">{formatCurrency(wd.amount)}</p>
                      <p className="mt-0.5 text-xs text-dark-500">{wd.bankName} - {wd.bankAccount}</p>
                      <p className="mt-0.5 text-xs text-dark-600">
                        {new Date(wd.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <Badge className={statusCfg.variant}>{statusCfg.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
