'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import AdminLayout from '@/components/admin-layout';

interface ReferralOverview {
  totalReferrals: number;
  totalRewardAmount: number;
  claimedCount: number;
  unclaimedCount: number;
  topReferrers: {
    userId: string;
    name: string;
    email: string;
    referralCode: string;
    count: number;
    totalReward: number;
  }[];
}

interface ReferralEntry {
  id: string;
  referrer: { name: string; email: string; code: string };
  referred: { name: string; email: string; joinedAt: string };
  referralCode: string;
  rewardAmount: number;
  rewardClaimed: boolean;
  createdAt: string;
}

export default function AdminReferralsPage() {
  const [overview, setOverview] = useState<ReferralOverview | null>(null);
  const [referrals, setReferrals] = useState<ReferralEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'list'>('overview');

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, listRes] = await Promise.all([
        api.get('/referrals/admin/overview').catch(() => null),
        api.get(`/referrals/admin/all?page=${page}&limit=20`).catch(() => null),
      ]);

      if (overviewRes) {
        const d = overviewRes.data?.data || overviewRes.data;
        setOverview(d);
      }
      if (listRes) {
        const d = listRes.data?.data || listRes.data;
        const list = d?.data || d || [];
        setReferrals(Array.isArray(list) ? list : []);
        const pag = d?.pagination;
        if (pag) setTotalPages(pag.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-dark-600 border-t-brand-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light tracking-wide text-dark-100">Referrals</h1>
        <p className="mt-1 text-sm text-dark-400">Program referral dan tracking</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg bg-dark-800/50 p-1">
        {([
          { key: 'overview', label: 'Overview' },
          { key: 'list', label: 'Semua Referral' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-dark-700 text-dark-100'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-dark-500">Total Referrals</p>
              <p className="mt-1 text-2xl font-light text-dark-100">{overview.totalReferrals}</p>
            </div>
            <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-dark-500">Total Reward</p>
              <p className="mt-1 text-2xl font-light text-brand-400">{formatCurrency(overview.totalRewardAmount)}</p>
            </div>
            <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-dark-500">Claimed</p>
              <p className="mt-1 text-2xl font-light text-emerald-400">{overview.claimedCount}</p>
            </div>
            <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-dark-500">Unclaimed</p>
              <p className="mt-1 text-2xl font-light text-amber-400">{overview.unclaimedCount}</p>
            </div>
          </div>

          {/* Top Referrers */}
          <div className="rounded-lg border border-dark-700/50 bg-dark-800/30 p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-dark-400">Top Referrers</h3>
            {overview.topReferrers.length === 0 ? (
              <p className="text-sm text-dark-500">Belum ada data referrer</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-dark-500">
                      <th className="pb-3 pr-4">#</th>
                      <th className="pb-3 pr-4">Referrer</th>
                      <th className="pb-3 pr-4">Kode</th>
                      <th className="pb-3 pr-4">Referrals</th>
                      <th className="pb-3 pr-4">Total Reward</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/30">
                    {overview.topReferrers.map((r, i) => (
                      <tr key={r.userId} className="hover:bg-dark-800/30">
                        <td className="py-2.5 pr-4 text-dark-500">{i + 1}</td>
                        <td className="py-2.5 pr-4">
                          <p className="text-dark-200">{r.name}</p>
                          <p className="text-xs text-dark-500">{r.email}</p>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="font-mono text-xs text-brand-400">{r.referralCode}</span>
                        </td>
                        <td className="py-2.5 pr-4 text-dark-300">{r.count}</td>
                        <td className="py-2.5 pr-4 text-emerald-400">{formatCurrency(r.totalReward)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* List Tab */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {referrals.length === 0 ? (
            <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-10 text-center text-dark-400">
              Belum ada referral
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-dark-700/50">
              <table className="w-full text-sm">
                <thead className="bg-dark-800/50">
                  <tr className="text-left text-xs uppercase tracking-wider text-dark-500">
                    <th className="px-4 py-3">Referrer</th>
                    <th className="px-4 py-3">Referred User</th>
                    <th className="px-4 py-3">Kode</th>
                    <th className="px-4 py-3">Reward</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/30">
                  {referrals.map((r) => (
                    <tr key={r.id} className="hover:bg-dark-800/30">
                      <td className="px-4 py-3">
                        <p className="text-dark-200">{r.referrer.name}</p>
                        <p className="text-xs text-dark-500">{r.referrer.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-dark-200">{r.referred.name}</p>
                        <p className="text-xs text-dark-500">{r.referred.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-brand-400">{r.referralCode}</span>
                      </td>
                      <td className="px-4 py-3 text-dark-300">{formatCurrency(r.rewardAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.rewardClaimed
                            ? 'bg-emerald-400/10 text-emerald-400'
                            : 'bg-amber-400/10 text-amber-400'
                        }`}>
                          {r.rewardClaimed ? 'Claimed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-dark-400">
                        {new Date(r.createdAt).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-dark-600/30 px-3 py-1.5 text-sm text-dark-300 hover:text-dark-100 disabled:opacity-30"
              >
                Prev
              </button>
              <span className="text-sm text-dark-400">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-dark-600/30 px-3 py-1.5 text-sm text-dark-300 hover:text-dark-100 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
