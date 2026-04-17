'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { getLeaderboardScore } from '@/lib/recommendation';

type HallItem = {
  id: string;
  tier?: string;
  ratingAvg?: number;
  totalReviews?: number;
  totalBookings?: number;
  hourlyRate?: number;
  basedIn?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    profilePhoto?: string;
  };
};

type PeriodType = 'weekly' | 'monthly';

function getDisplayName(item: HallItem) {
  const first = item.user?.firstName || '';
  const last = item.user?.lastName || '';
  return `${first} ${last}`.trim() || 'Companion';
}

export default function HallOfFamePage() {
  const [period, setPeriod] = useState<PeriodType>('weekly');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<HallItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const sortBy = period === 'monthly' ? 'bookings' : 'rating';
        const res = await api.get('/escorts', { params: { limit: 24, sortBy } });
        const payload = res.data?.data || res.data;
        const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

        if (!cancelled) {
          const ranked = [...list]
            .map((item: HallItem) => ({ ...item, _score: getLeaderboardScore(item) }))
            .sort((a: any, b: any) => b._score - a._score);
          setItems(ranked);
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [period]);

  const podium = useMemo(() => items.slice(0, 3), [items]);
  const rest = useMemo(() => items.slice(3), [items]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-dark-700/50 bg-[radial-gradient(circle_at_top_left,rgba(201,169,110,0.18),transparent_45%),linear-gradient(135deg,rgba(12,16,24,0.95),rgba(9,12,20,0.96))] p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-300/70">Leaderboard</p>
        <h1 className="mt-2 text-2xl font-light text-dark-100">Hall of Fame Beta</h1>
        <p className="mt-2 max-w-2xl text-sm text-dark-400">
          Ranking ini masih versi beta dan dihitung dari sinyal yang sudah tersedia: volume booking, kualitas rating, dan aktivitas ulasan.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPeriod('weekly')}
            className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-wider ${
              period === 'weekly'
                ? 'border-brand-400/40 bg-brand-400/15 text-brand-300'
                : 'border-dark-600/50 text-dark-400 hover:border-dark-500/70'
            }`}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setPeriod('monthly')}
            className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-wider ${
              period === 'monthly'
                ? 'border-brand-400/40 bg-brand-400/15 text-brand-300'
                : 'border-dark-600/50 text-dark-400 hover:border-dark-500/70'
            }`}
          >
            Monthly
          </button>
          <Link href="/user/discover" className="ml-2 rounded-lg border border-dark-600/50 px-3 py-1.5 text-xs uppercase tracking-widest text-dark-300 hover:border-dark-500/70">
            Kembali ke Discover
          </Link>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-xl border border-dark-700/40 bg-dark-800/40" />
          ))}
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            {podium.map((item, index) => (
              <div key={item.id} className="rounded-xl border border-dark-700/50 bg-dark-800/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-dark-400">Rank #{index + 1}</p>
                  <span className="rounded-full border border-brand-400/30 bg-brand-400/10 px-2 py-0.5 text-[10px] text-brand-300">
                    {item.tier || 'Tier'}
                  </span>
                </div>
                <p className="mt-2 text-lg text-dark-100">{getDisplayName(item)}</p>
                <p className="mt-1 text-xs text-dark-500">{item.basedIn || 'Indonesia'}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border border-dark-700/40 bg-dark-900/35 p-2">
                    <p className="text-[10px] uppercase tracking-wider text-dark-500">Score</p>
                    <p className="mt-1 text-sm text-brand-300">{getLeaderboardScore(item)}</p>
                  </div>
                  <div className="rounded-lg border border-dark-700/40 bg-dark-900/35 p-2">
                    <p className="text-[10px] uppercase tracking-wider text-dark-500">Rating</p>
                    <p className="mt-1 text-sm text-dark-200">{(item.ratingAvg || 0).toFixed(1)}</p>
                  </div>
                  <div className="rounded-lg border border-dark-700/40 bg-dark-900/35 p-2">
                    <p className="text-[10px] uppercase tracking-wider text-dark-500">Booking</p>
                    <p className="mt-1 text-sm text-dark-200">{item.totalBookings || 0}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-dark-300">{formatCurrency(item.hourlyRate || 0)} / jam</p>
                  <Link href={`/user/escorts/${item.id}`} className="text-xs uppercase tracking-widest text-brand-300 hover:text-brand-200">
                    Detail
                  </Link>
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-xl border border-dark-700/50 bg-dark-800/35 p-4">
            <h2 className="text-lg text-dark-100">Ranking Lainnya</h2>
            <div className="mt-3 space-y-2">
              {rest.length === 0 && (
                <p className="text-sm text-dark-500">Belum ada data ranking tambahan.</p>
              )}
              {rest.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-dark-700/40 bg-dark-900/30 px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="w-9 text-sm text-dark-400">#{index + 4}</span>
                    <div>
                      <p className="text-sm text-dark-100">{getDisplayName(item)}</p>
                      <p className="text-xs text-dark-500">{item.totalBookings || 0} booking • {(item.ratingAvg || 0).toFixed(1)} rating</p>
                    </div>
                  </div>
                  <Link href={`/user/escorts/${item.id}`} className="text-xs uppercase tracking-widest text-brand-300 hover:text-brand-200">
                    Lihat
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}