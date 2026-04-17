'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { getLeaderboardScore } from '@/lib/recommendation';
import { getContestById } from '@/lib/contest';

type EscortItem = {
  id: string;
  tier?: string;
  ratingAvg?: number;
  totalReviews?: number;
  totalBookings?: number;
  user?: {
    firstName?: string;
    lastName?: string;
  };
};

function fullName(escort: EscortItem) {
  const first = escort.user?.firstName || '';
  const last = escort.user?.lastName || '';
  return `${first} ${last}`.trim() || 'Companion';
}

export default function UserContestDetailPage() {
  const params = useParams<{ id: string }>();
  const contestId = params?.id || '';
  const contest = useMemo(() => getContestById(contestId), [contestId]);

  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<EscortItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadLeaderboard = async () => {
      if (!contest) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const sortBy = contest.status === 'ONGOING' ? 'bookings' : 'rating';
        const res = await api.get('/escorts', { params: { limit: 16, sortBy } });
        const payload = res.data?.data || res.data;
        const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

        if (!cancelled) {
          const ranked = [...list]
            .sort((a: EscortItem, b: EscortItem) => getLeaderboardScore(b) - getLeaderboardScore(a))
            .slice(0, 10);
          setLeaderboard(ranked);
        }
      } catch {
        if (!cancelled) setLeaderboard([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [contest]);

  if (!contest) {
    return (
      <div className="space-y-4 rounded-xl border border-dark-700/50 bg-dark-800/35 p-6">
        <h1 className="text-xl text-dark-100">Contest tidak ditemukan</h1>
        <p className="text-sm text-dark-400">ID contest tidak valid atau sudah tidak tersedia.</p>
        <Link href="/user/contest" className="inline-flex rounded-lg border border-brand-400/35 bg-brand-400/10 px-4 py-2 text-xs uppercase tracking-widest text-brand-300 hover:bg-brand-400/20">
          Kembali ke Contest Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-dark-700/50 bg-[radial-gradient(circle_at_top_right,rgba(201,169,110,0.18),transparent_45%),linear-gradient(130deg,rgba(13,17,26,0.96),rgba(9,12,19,0.96))] p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-300/70">Contest Detail</p>
        <h1 className="mt-2 text-2xl font-light text-dark-100">{contest.title}</h1>
        <p className="mt-2 text-sm text-dark-400">{contest.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-dark-400">
          <span className="rounded-full border border-brand-400/30 bg-brand-400/10 px-2 py-0.5">{contest.theme}</span>
          <span className="rounded-full border border-dark-600/60 px-2 py-0.5">{contest.periodLabel}</span>
          <span className={`rounded-full border px-2 py-0.5 ${contest.status === 'ONGOING' ? 'border-green-500/30 bg-green-500/10 text-green-300' : 'border-brand-400/30 bg-brand-400/10 text-brand-300'}`}>
            {contest.status === 'ONGOING' ? 'Live' : 'Soon'}
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/user/contest" className="rounded-lg border border-dark-600/60 px-4 py-2 text-xs uppercase tracking-widest text-dark-300 hover:border-dark-500/70">
            Kembali ke Contest Catalog
          </Link>
          <Link href="/user/discover" className="rounded-lg border border-brand-400/35 bg-brand-400/10 px-4 py-2 text-xs uppercase tracking-widest text-brand-300 hover:bg-brand-400/20">
            Buka Discover
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-dark-700/50 bg-dark-800/35 p-4">
        <h2 className="text-lg text-dark-100">Rules Highlights</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {contest.highlights.map((item) => (
            <div key={item} className="rounded-lg border border-dark-700/40 bg-dark-900/30 p-3 text-sm text-dark-300">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-dark-700/50 bg-dark-800/35 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg text-dark-100">Leaderboard</h2>
          <span className="rounded-full border border-brand-400/25 bg-brand-400/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-300">
            Beta Score
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-12 animate-pulse rounded-lg border border-dark-700/40 bg-dark-900/35" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-sm text-dark-500">Belum ada data leaderboard untuk contest ini.</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((escort, idx) => (
              <div key={escort.id} className="flex items-center justify-between rounded-lg border border-dark-700/40 bg-dark-900/35 px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="w-8 text-sm text-dark-400">#{idx + 1}</span>
                  <div>
                    <p className="text-sm text-dark-100">{fullName(escort)}</p>
                    <p className="text-xs text-dark-500">Tier {escort.tier || 'SILVER'} • Rating {(escort.ratingAvg || 0).toFixed(1)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-brand-300">{getLeaderboardScore(escort)}</span>
                  <Link href={`/user/escorts/${escort.id}`} className="text-xs uppercase tracking-widest text-brand-300 hover:text-brand-200">
                    Detail
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
