'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { getLeaderboardScore } from '@/lib/recommendation';
import { CONTESTS } from '@/lib/contest';

type EscortItem = {
  id: string;
  tier?: string;
  ratingAvg?: number;
  totalReviews?: number;
  totalBookings?: number;
  user?: {
    firstName?: string;
    lastName?: string;
    profilePhoto?: string;
  };
};

function displayName(escort: EscortItem) {
  const first = escort.user?.firstName || '';
  const last = escort.user?.lastName || '';
  return `${first} ${last}`.trim() || 'Companion';
}

export default function UserContestPage() {
  const [loading, setLoading] = useState(true);
  const [escorts, setEscorts] = useState<EscortItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadContestPreview = async () => {
      setLoading(true);
      try {
        const res = await api.get('/escorts', { params: { limit: 20, sortBy: 'bookings' } });
        const payload = res.data?.data || res.data;
        const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

        if (!cancelled) setEscorts(list);
      } catch {
        if (!cancelled) setEscorts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadContestPreview();

    return () => {
      cancelled = true;
    };
  }, []);

  const leaderboard = useMemo(
    () => [...escorts].sort((a, b) => getLeaderboardScore(b) - getLeaderboardScore(a)).slice(0, 8),
    [escorts],
  );

  const ongoing = CONTESTS.filter((contest) => contest.status === 'ONGOING');
  const upcoming = CONTESTS.filter((contest) => contest.status === 'UPCOMING');

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-dark-700/50 bg-[radial-gradient(circle_at_top_right,rgba(201,169,110,0.18),transparent_45%),linear-gradient(130deg,rgba(13,17,26,0.96),rgba(9,12,19,0.96))] p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-300/70">Contest Beta</p>
        <h1 className="mt-2 text-2xl font-light text-dark-100">Catalog Kompetisi Companion</h1>
        <p className="mt-2 max-w-2xl text-sm text-dark-400">
          Modul ini masih beta dan memakai scoring sementara dari sinyal yang sudah tersedia. Contest engine penuh akan mengikuti fase backend berikutnya.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/user/discover" className="rounded-lg border border-dark-600/60 px-4 py-2 text-xs uppercase tracking-widest text-dark-300 hover:border-dark-500/70">
            Kembali ke Discover
          </Link>
          <Link href="/user/hall-of-fame" className="rounded-lg border border-brand-400/35 bg-brand-400/10 px-4 py-2 text-xs uppercase tracking-widest text-brand-300 hover:bg-brand-400/20">
            Lihat Hall of Fame
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg text-dark-100">Ongoing Contest</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ongoing.map((contest) => (
            <article key={contest.id} className="rounded-xl border border-dark-700/50 bg-dark-800/35 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base text-dark-100">{contest.title}</h3>
                <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-green-300">
                  Live
                </span>
              </div>
              <p className="mt-2 text-xs uppercase tracking-widest text-brand-300/80">{contest.theme}</p>
              <p className="mt-2 text-sm text-dark-400">{contest.description}</p>
              <p className="mt-3 text-xs text-dark-500">{contest.periodLabel}</p>
              <Link href={`/user/contest/${contest.id}`} className="mt-3 inline-flex text-xs uppercase tracking-widest text-brand-300 hover:text-brand-200">
                Lihat Detail Contest
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg text-dark-100">Upcoming Contest</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {upcoming.map((contest) => (
            <article key={contest.id} className="rounded-xl border border-dark-700/50 bg-dark-800/35 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base text-dark-100">{contest.title}</h3>
                <span className="rounded-full border border-brand-400/30 bg-brand-400/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-300">
                  Soon
                </span>
              </div>
              <p className="mt-2 text-xs uppercase tracking-widest text-brand-300/80">{contest.theme}</p>
              <p className="mt-2 text-sm text-dark-400">{contest.description}</p>
              <p className="mt-3 text-xs text-dark-500">{contest.periodLabel}</p>
              <Link href={`/user/contest/${contest.id}`} className="mt-3 inline-flex text-xs uppercase tracking-widest text-brand-300 hover:text-brand-200">
                Lihat Detail Contest
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-dark-700/50 bg-dark-800/35 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg text-dark-100">Contest Leaderboard Preview</h2>
          <span className="rounded-full border border-brand-400/25 bg-brand-400/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-300">
            Beta Score
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-12 animate-pulse rounded-lg border border-dark-700/40 bg-dark-900/35" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-sm text-dark-500">Belum ada data leaderboard.</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((escort, idx) => (
              <div key={escort.id} className="flex items-center justify-between rounded-lg border border-dark-700/40 bg-dark-900/35 px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="w-8 text-sm text-dark-400">#{idx + 1}</span>
                  <div>
                    <p className="text-sm text-dark-100">{displayName(escort)}</p>
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
