'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface ReferralStats {
  code: string;
  link: string;
  totalReferrals: number;
  totalReward: number;
  recentReferrals: Array<{
    referredName: string;
    createdAt: string;
    rewardAmount: number;
  }>;
}

export default function ReferralPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.get('/referrals/stats');
      setStats(res.data.data || res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!stats?.link) return;
    try {
      await navigator.clipboard.writeText(stats.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-900">
        <p className="text-dark-400">Silakan login untuk mengakses program referral</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-2xl font-light text-dark-100">
          Program <span className="text-brand-400">Referral</span>
        </h1>
        <p className="mb-8 text-dark-400">Ajak teman, dapatkan reward untuk setiap referral berhasil</p>

        {/* Referral code card */}
        <Card className="mb-6 border-brand-400/20">
          <CardContent className="p-6">
            <p className="mb-2 text-xs uppercase tracking-wider text-dark-500">Kode Referral Anda</p>
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-lg bg-dark-700/50 px-4 py-2 font-mono text-xl tracking-widest text-brand-400">
                {stats?.code || '---'}
              </span>
              <Button size="sm" onClick={copyLink}>
                {copied ? <><Check className="h-4 w-4 inline-block" /> Disalin!</> : 'Salin Link'}
              </Button>
            </div>
            {stats?.link && (
              <p className="break-all text-xs text-dark-500">{stats.link}</p>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-2xl font-light text-brand-400">{stats?.totalReferrals || 0}</p>
              <p className="mt-1 text-xs text-dark-500">Total Referral</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-2xl font-light text-brand-400">{formatCurrency(stats?.totalReward || 0)}</p>
              <p className="mt-1 text-xs text-dark-500">Total Reward</p>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-medium text-dark-100">Cara Kerja</h2>
            <div className="space-y-4">
              {[
                { step: '1', title: 'Bagikan', desc: 'Kirim kode referral atau link unik Anda ke teman' },
                { step: '2', title: 'Daftar', desc: 'Teman Anda mendaftar menggunakan kode referral Anda' },
                { step: '3', title: 'Reward', desc: 'Anda mendapatkan reward setelah referral berhasil terverifikasi' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-400/10 text-sm font-medium text-brand-400">
                    {step}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark-200">{title}</p>
                    <p className="text-xs text-dark-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent referrals */}
        {stats?.recentReferrals && stats.recentReferrals.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-lg font-medium text-dark-100">Referral Terbaru</h2>
              <div className="space-y-3">
                {stats.recentReferrals.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-dark-700/30 px-4 py-3">
                    <div>
                      <p className="text-sm text-dark-200">{r.referredName}</p>
                      <p className="text-xs text-dark-500">
                        {new Date(r.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-brand-400">
                      +{formatCurrency(r.rewardAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
