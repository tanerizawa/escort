'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { BudgetBucketId, getRecommendationBreakdown } from '@/lib/recommendation';

const QUICK_TIER_PREFERENCES = ['SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'] as const;
const QUICK_LANGUAGE_PREFERENCES = ['Indonesia', 'English', 'Mandarin', 'Japanese'] as const;

const PREFERENCE_STORAGE_KEY = 'discover:quick-preferences:v1';
const ADVANCED_PREFERENCE_STORAGE_KEY = 'discover:advanced-preferences:v1';

const BUDGET_BUCKETS: Array<{ id: BudgetBucketId; label: string }> = [
  { id: 'under-500', label: 'Di bawah 500k/jam' },
  { id: '500-1000', label: '500k - 1jt/jam' },
  { id: '1000-2500', label: '1jt - 2.5jt/jam' },
  { id: 'above-2500', label: 'Di atas 2.5jt/jam' },
];

type EscortItem = {
  id: string;
  tier?: string;
  ratingAvg?: number;
  totalReviews?: number;
  totalBookings?: number;
  hourlyRate?: number;
  languages?: string[];
  skills?: string[];
  bodyType?: string;
  basedIn?: string;
  travelScope?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    profilePhoto?: string;
  };
};

type ArticleItem = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  coverImage?: string | null;
  viewCount?: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function fullName(escort: EscortItem) {
  const first = escort.user?.firstName || '';
  const last = escort.user?.lastName || '';
  return `${first} ${last}`.trim() || 'Companion';
}

function toEscortList(payload: any): EscortItem[] {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function toArticleList(payload: any): ArticleItem[] {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

export default function UserDiscoverPage() {
  const [forYou, setForYou] = useState<EscortItem[]>([]);
  const [trendingNow, setTrendingNow] = useState<EscortItem[]>([]);
  const [hallOfFame, setHallOfFame] = useState<EscortItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedBasedIn, setSelectedBasedIn] = useState('');
  const [selectedTravelScope, setSelectedTravelScope] = useState('');
  const [selectedBodyType, setSelectedBodyType] = useState('');
  const [selectedBudgetBucket, setSelectedBudgetBucket] = useState<BudgetBucketId | ''>('');
  const [loading, setLoading] = useState(true);

  const selectedTierForApi = selectedTiers[0] || '';
  const selectedLanguageForApi = selectedLanguages[0] || '';
  const searchContextForApi = selectedBasedIn || selectedTravelScope || selectedBodyType || '';

  const escortListQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedTierForApi) params.set('tier', selectedTierForApi);
    if (selectedLanguageForApi) params.set('language', selectedLanguageForApi);
    if (searchContextForApi) params.set('search', searchContextForApi);
    params.set('sortBy', 'rating');
    return params.toString();
  }, [selectedTierForApi, selectedLanguageForApi, searchContextForApi]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(PREFERENCE_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        tiers?: string[];
        languages?: string[];
      };

      setSelectedTiers(Array.isArray(parsed.tiers) ? parsed.tiers : []);
      setSelectedLanguages(Array.isArray(parsed.languages) ? parsed.languages : []);
    } catch {
      setSelectedTiers([]);
      setSelectedLanguages([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(ADVANCED_PREFERENCE_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        basedIn?: string;
        travelScope?: string;
        bodyType?: string;
        budgetBucket?: BudgetBucketId;
      };

      if (typeof parsed.basedIn === 'string') setSelectedBasedIn(parsed.basedIn);
      if (typeof parsed.travelScope === 'string') setSelectedTravelScope(parsed.travelScope);
      if (typeof parsed.bodyType === 'string') setSelectedBodyType(parsed.bodyType);
      if (typeof parsed.budgetBucket === 'string') setSelectedBudgetBucket(parsed.budgetBucket);
    } catch {
      setSelectedBasedIn('');
      setSelectedTravelScope('');
      setSelectedBodyType('');
      setSelectedBudgetBucket('');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const payload = JSON.stringify({
      tiers: selectedTiers,
      languages: selectedLanguages,
    });

    window.localStorage.setItem(PREFERENCE_STORAGE_KEY, payload);
  }, [selectedTiers, selectedLanguages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const payload = JSON.stringify({
      basedIn: selectedBasedIn,
      travelScope: selectedTravelScope,
      bodyType: selectedBodyType,
      budgetBucket: selectedBudgetBucket,
    });

    window.localStorage.setItem(ADVANCED_PREFERENCE_STORAGE_KEY, payload);
  }, [selectedBasedIn, selectedTravelScope, selectedBodyType, selectedBudgetBucket]);

  useEffect(() => {
    let cancelled = false;

    const loadDiscover = async () => {
      setLoading(true);
      try {
        const [forYouRes, trendingRes, hallRes, articleRes] = await Promise.all([
          api.get('/escorts', {
            params: {
              limit: 8,
              sortBy: 'rating',
              ...(selectedTierForApi ? { tier: selectedTierForApi } : {}),
              ...(selectedLanguageForApi ? { language: selectedLanguageForApi } : {}),
              ...(searchContextForApi ? { search: searchContextForApi } : {}),
            },
          }),
          api.get('/escorts', {
            params: {
              limit: 8,
              sortBy: 'newest',
              ...(selectedTierForApi ? { tier: selectedTierForApi } : {}),
              ...(selectedLanguageForApi ? { language: selectedLanguageForApi } : {}),
              ...(searchContextForApi ? { search: searchContextForApi } : {}),
            },
          }),
          api.get('/escorts', {
            params: {
              limit: 5,
              sortBy: 'bookings',
              ...(selectedTierForApi ? { tier: selectedTierForApi } : {}),
              ...(selectedLanguageForApi ? { language: selectedLanguageForApi } : {}),
              ...(searchContextForApi ? { search: searchContextForApi } : {}),
            },
          }),
          fetch(`${API_URL}/articles?limit=6&page=1`),
        ]);

        if (cancelled) return;

        const forYouPayload = forYouRes.data?.data || forYouRes.data;
        const trendingPayload = trendingRes.data?.data || trendingRes.data;
        const hallPayload = hallRes.data?.data || hallRes.data;

        let articlePayload: any = [];
        if (articleRes.ok) {
          const json = await articleRes.json();
          articlePayload = json?.data || json;
        }

        setForYou(toEscortList(forYouPayload));
        setTrendingNow(toEscortList(trendingPayload));
        setHallOfFame(toEscortList(hallPayload));
        setArticles(toArticleList(articlePayload));
      } catch {
        if (!cancelled) {
          setForYou([]);
          setTrendingNow([]);
          setHallOfFame([]);
          setArticles([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDiscover();

    return () => {
      cancelled = true;
    };
  }, [selectedTierForApi, selectedLanguageForApi, searchContextForApi]);

  const basedInOptions = useMemo(
    () => Array.from(new Set(forYou.concat(trendingNow).map((escort) => escort.basedIn).filter(Boolean))).sort(),
    [forYou, trendingNow],
  );

  const travelScopeOptions = useMemo(
    () => Array.from(new Set(forYou.concat(trendingNow).map((escort) => escort.travelScope).filter(Boolean))).sort(),
    [forYou, trendingNow],
  );

  const bodyTypeOptions = useMemo(
    () => Array.from(new Set(forYou.concat(trendingNow).map((escort) => escort.bodyType).filter(Boolean))).sort(),
    [forYou, trendingNow],
  );

  const matchesQuickPreferences = (escort: EscortItem) => {
    const tierOk = selectedTiers.length === 0 || selectedTiers.includes((escort.tier || '').toUpperCase());
    const languageOk =
      selectedLanguages.length === 0 ||
      (escort.languages || []).some((lang) => selectedLanguages.includes(lang));

    return tierOk && languageOk;
  };

  const matchesAdvancedFilters = (escort: EscortItem) => {
    if (selectedBasedIn && escort.basedIn !== selectedBasedIn) return false;
    if (selectedTravelScope && escort.travelScope !== selectedTravelScope) return false;
    if (selectedBodyType && escort.bodyType !== selectedBodyType) return false;
    if (selectedBudgetBucket) {
      const rate = escort.hourlyRate || 0;
      if (selectedBudgetBucket === 'under-500' && rate >= 500000) return false;
      if (selectedBudgetBucket === '500-1000' && (rate < 500000 || rate >= 1000000)) return false;
      if (selectedBudgetBucket === '1000-2500' && (rate < 1000000 || rate >= 2500000)) return false;
      if (selectedBudgetBucket === 'above-2500' && rate < 2500000) return false;
    }
    return true;
  };

  const visibleForYou = useMemo(
    () => forYou.filter((escort) => matchesQuickPreferences(escort) && matchesAdvancedFilters(escort)),
    [forYou, selectedTiers, selectedLanguages, selectedBasedIn, selectedTravelScope, selectedBodyType, selectedBudgetBucket],
  );

  const visibleTrending = useMemo(
    () => trendingNow.filter((escort) => matchesQuickPreferences(escort) && matchesAdvancedFilters(escort)),
    [trendingNow, selectedTiers, selectedLanguages, selectedBasedIn, selectedTravelScope, selectedBodyType, selectedBudgetBucket],
  );

  const visibleHallOfFame = useMemo(
    () => hallOfFame.filter((escort) => matchesQuickPreferences(escort) && matchesAdvancedFilters(escort)),
    [hallOfFame, selectedTiers, selectedLanguages, selectedBasedIn, selectedTravelScope, selectedBodyType, selectedBudgetBucket],
  );

  const scoredForYou = useMemo(
    () =>
      visibleForYou
        .map((escort) => ({
          escort,
          recommendation: getRecommendationBreakdown(escort, {
            selectedTiers,
            selectedLanguages,
            selectedBasedIn,
            selectedTravelScope,
            selectedBodyType,
            selectedBudgetBucket,
          }),
        }))
        .sort((a, b) => b.recommendation.score - a.recommendation.score),
    [
      visibleForYou,
      selectedTiers,
      selectedLanguages,
      selectedBasedIn,
      selectedTravelScope,
      selectedBodyType,
      selectedBudgetBucket,
    ],
  );

  const topThree = useMemo(() => visibleHallOfFame.slice(0, 3), [visibleHallOfFame]);

  const toggleTierPreference = (value: string) => {
    setSelectedTiers((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const toggleLanguagePreference = (value: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const resetFilters = () => {
    setSelectedTiers([]);
    setSelectedLanguages([]);
    setSelectedBasedIn('');
    setSelectedTravelScope('');
    setSelectedBodyType('');
    setSelectedBudgetBucket('');
  };

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-dark-700/40 bg-[radial-gradient(circle_at_top_right,rgba(201,169,110,0.2),transparent_45%),linear-gradient(130deg,rgba(14,18,28,0.95),rgba(10,14,22,0.96))] p-6 lg:p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-300/80">Discover</p>
        <h1 className="mt-2 text-2xl font-light text-dark-100 lg:text-3xl">Eksplorasi companion dengan gaya yang lebih casual</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-dark-400">
          Halaman ini menggabungkan rekomendasi, ranking Hall of Fame beta, dan konten terbaru agar Anda bisa memilih lebih cepat sebelum booking.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/user/escorts" className="rounded-lg border border-brand-400/35 bg-brand-400/10 px-4 py-2 text-xs uppercase tracking-widest text-brand-300 transition-colors hover:bg-brand-400/20">
            Jelajah Semua Escort
          </Link>
          <Link href="/user/contest" className="rounded-lg border border-brand-400/35 bg-brand-400/10 px-4 py-2 text-xs uppercase tracking-widest text-brand-300 transition-colors hover:bg-brand-400/20">
            Contest Beta
          </Link>
          <Link href="/user/hall-of-fame" className="rounded-lg border border-brand-400/35 bg-brand-400/10 px-4 py-2 text-xs uppercase tracking-widest text-brand-300 transition-colors hover:bg-brand-400/20">
            Hall of Fame Beta
          </Link>
          <Link href="/user/preferences" className="rounded-lg border border-brand-400/35 bg-brand-400/10 px-4 py-2 text-xs uppercase tracking-widest text-brand-300 transition-colors hover:bg-brand-400/20">
            Atur Preferensi
          </Link>
          <Link href="/user/gallery" className="rounded-lg border border-brand-400/35 bg-brand-400/10 px-4 py-2 text-xs uppercase tracking-widest text-brand-300 transition-colors hover:bg-brand-400/20">
            Creator Gallery
          </Link>
          <Link href="/blog" className="rounded-lg border border-dark-600/50 px-4 py-2 text-xs uppercase tracking-widest text-dark-300 transition-colors hover:border-dark-500/60 hover:text-dark-100">
            Buka Blog
          </Link>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-dark-700/40 bg-dark-900/35 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-dark-500">Smart Matching Setup</p>
            <h2 className="mt-1 text-lg text-dark-100">Preferensi cepat untuk hasil yang lebih relevan</h2>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-dark-600/50 px-3 py-1.5 text-xs uppercase tracking-wider text-dark-300 hover:border-dark-500/70"
          >
            Reset
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-dark-500">Tier preference</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_TIER_PREFERENCES.map((tier) => {
              const active = selectedTiers.includes(tier);
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => toggleTierPreference(tier)}
                  className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wider transition-colors ${
                    active
                      ? 'border-brand-400/40 bg-brand-400/15 text-brand-300'
                      : 'border-dark-600/50 bg-dark-800/30 text-dark-400 hover:border-dark-500/70'
                  }`}
                >
                  {tier}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-dark-500">Language preference</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_LANGUAGE_PREFERENCES.map((language) => {
              const active = selectedLanguages.includes(language);
              return (
                <button
                  key={language}
                  type="button"
                  onClick={() => toggleLanguagePreference(language)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    active
                      ? 'border-brand-400/40 bg-brand-400/15 text-brand-300'
                      : 'border-dark-600/50 bg-dark-800/30 text-dark-400 hover:border-dark-500/70'
                  }`}
                >
                  {language}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="mb-1.5 text-xs uppercase tracking-widest text-dark-500">Based In</p>
            <select
              value={selectedBasedIn}
              onChange={(event) => setSelectedBasedIn(event.target.value)}
              className="w-full rounded-lg border border-dark-600/50 bg-dark-800/30 px-3 py-2 text-sm text-dark-200 focus:border-brand-400/40 focus:outline-none"
            >
              <option value="">Semua kota</option>
              {basedInOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1.5 text-xs uppercase tracking-widest text-dark-500">Travel Scope</p>
            <select
              value={selectedTravelScope}
              onChange={(event) => setSelectedTravelScope(event.target.value)}
              className="w-full rounded-lg border border-dark-600/50 bg-dark-800/30 px-3 py-2 text-sm text-dark-200 focus:border-brand-400/40 focus:outline-none"
            >
              <option value="">Semua cakupan</option>
              {travelScopeOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1.5 text-xs uppercase tracking-widest text-dark-500">Body Type</p>
            <select
              value={selectedBodyType}
              onChange={(event) => setSelectedBodyType(event.target.value)}
              className="w-full rounded-lg border border-dark-600/50 bg-dark-800/30 px-3 py-2 text-sm text-dark-200 focus:border-brand-400/40 focus:outline-none"
            >
              <option value="">Semua tipe</option>
              {bodyTypeOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1.5 text-xs uppercase tracking-widest text-dark-500">Budget</p>
            <select
              value={selectedBudgetBucket}
              onChange={(event) => setSelectedBudgetBucket(event.target.value as BudgetBucketId | '')}
              className="w-full rounded-lg border border-dark-600/50 bg-dark-800/30 px-3 py-2 text-sm text-dark-200 focus:border-brand-400/40 focus:outline-none"
            >
              <option value="">Semua budget</option>
              {BUDGET_BUCKETS.map((bucket) => (
                <option key={bucket.id} value={bucket.id}>{bucket.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-52 animate-pulse rounded-xl border border-dark-700/40 bg-dark-800/40" />
          ))}
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-dark-100">For You</h2>
              <Link href={`/user/escorts?${escortListQuery}`} className="text-xs uppercase tracking-widest text-brand-300 hover:text-brand-200">
                Lihat Semua
              </Link>
            </div>

            {scoredForYou.length === 0 ? (
              <div className="rounded-xl border border-dark-700/40 bg-dark-800/40 p-5 text-sm text-dark-500">Belum ada data rekomendasi untuk ditampilkan.</div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {scoredForYou.map(({ escort, recommendation }) => (
                  <div key={escort.id} className="min-w-[240px] max-w-[240px] rounded-xl border border-dark-700/50 bg-dark-800/45 p-3">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-dark-700">
                      <div className="absolute right-2 top-2 z-10 rounded-full border border-brand-400/35 bg-brand-400/20 px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-100">
                        Match {recommendation.score}
                      </div>
                      {escort.user?.profilePhoto ? (
                        <img src={escort.user.profilePhoto} alt={fullName(escort)} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl text-dark-500">{fullName(escort).charAt(0)}</div>
                      )}
                    </div>
                    <div className="mt-3 space-y-2">
                      <div>
                        <p className="text-sm text-dark-100">{fullName(escort)}</p>
                        <p className="text-xs text-dark-500">
                          Rating {(escort.ratingAvg || 0).toFixed(1)} • {escort.totalReviews || 0} ulasan
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recommendation.reasons.slice(0, 3).map((reason) => (
                          <span key={reason} className="rounded-full border border-brand-400/25 bg-brand-400/10 px-2 py-0.5 text-[10px] text-brand-300">
                            {reason}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] leading-relaxed text-dark-500">
                        Kenapa direkomendasikan: {recommendation.reasons.slice(0, 2).join(' • ')}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-dark-300">{formatCurrency(escort.hourlyRate || 0)} / jam</span>
                        <Link href={`/user/escorts/${escort.id}`} className="text-xs uppercase tracking-widest text-brand-300 hover:text-brand-200">
                          Detail
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-5">
            <div className="rounded-xl border border-dark-700/50 bg-dark-800/40 p-5 lg:col-span-3">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-dark-100">Hall of Fame Beta</h2>
                <span className="rounded-full border border-brand-400/25 bg-brand-400/10 px-2 py-1 text-[10px] uppercase tracking-widest text-brand-300">
                  Experimental
                </span>
              </div>

              {topThree.length === 0 ? (
                <p className="text-sm text-dark-500">Belum ada data ranking.</p>
              ) : (
                <div className="space-y-3">
                  {topThree.map((escort, index) => (
                    <div key={escort.id} className="flex items-center justify-between rounded-lg border border-dark-700/40 bg-dark-900/30 px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-400/30 bg-brand-400/10 text-xs text-brand-200">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="text-sm text-dark-100">{fullName(escort)}</p>
                          <p className="text-xs text-dark-500">{escort.totalBookings || 0} booking • {escort.totalReviews || 0} ulasan</p>
                        </div>
                      </div>
                      <p className="text-sm text-brand-300">{(escort.ratingAvg || 0).toFixed(1)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-dark-700/50 bg-dark-800/40 p-5 lg:col-span-2">
              <h2 className="text-lg font-medium text-dark-100">Trending Sekarang</h2>
              <div className="mt-4 space-y-2.5">
                {visibleTrending.slice(0, 4).map((escort) => (
                  <Link key={escort.id} href={`/user/escorts/${escort.id}`} className="block rounded-lg border border-dark-700/40 bg-dark-900/30 px-3 py-2.5 transition-colors hover:border-brand-400/30">
                    <p className="text-sm text-dark-100">{fullName(escort)}</p>
                    <p className="mt-0.5 text-xs text-dark-500">{(escort.languages || []).slice(0, 2).join(' • ') || 'General'} • {formatCurrency(escort.hourlyRate || 0)}/jam</p>
                  </Link>
                ))}
                {visibleTrending.length === 0 && (
                  <p className="text-sm text-dark-500">Belum ada data trending.</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-dark-700/50 bg-dark-800/35 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-medium text-dark-100">Contest Spotlight</h2>
                <p className="mt-1 text-sm text-dark-500">
                  Ikuti update kompetisi mingguan companion dan lihat kandidat teratas sebelum Anda booking.
                </p>
              </div>
              <Link href="/user/contest" className="rounded-lg border border-brand-400/35 bg-brand-400/10 px-4 py-2 text-xs uppercase tracking-widest text-brand-300 transition-colors hover:bg-brand-400/20">
                Buka Contest Catalog
              </Link>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-dark-700/40 bg-dark-900/30 p-3">
                <p className="text-[10px] uppercase tracking-widest text-brand-300/80">Live</p>
                <p className="mt-1 text-sm text-dark-100">Elegance Night April</p>
                <p className="mt-1 text-xs text-dark-500">Ranking berdasarkan booking, rating, dan kualitas ulasan.</p>
              </div>
              <div className="rounded-lg border border-dark-700/40 bg-dark-900/30 p-3">
                <p className="text-[10px] uppercase tracking-widest text-brand-300/80">Next</p>
                <p className="mt-1 text-sm text-dark-100">Travel Charm May</p>
                <p className="mt-1 text-xs text-dark-500">Fokus kompetisi pada travel scope dan service consistency.</p>
              </div>
              <div className="rounded-lg border border-dark-700/40 bg-dark-900/30 p-3">
                <p className="text-[10px] uppercase tracking-widest text-brand-300/80">Next</p>
                <p className="mt-1 text-sm text-dark-100">Host Master June</p>
                <p className="mt-1 text-xs text-dark-500">Penilaian untuk event host performance dan repeat booking.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-dark-100">Creator Highlights</h2>
              <Link href="/blog" className="text-xs uppercase tracking-widest text-brand-300 hover:text-brand-200">
                Lihat Semua Artikel
              </Link>
            </div>

            {articles.length === 0 ? (
              <div className="rounded-xl border border-dark-700/40 bg-dark-800/40 p-5 text-sm text-dark-500">Belum ada artikel terbaru.</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {articles.slice(0, 6).map((article) => (
                  <Link key={article.id} href={`/blog/${article.slug}`} className="group overflow-hidden rounded-xl border border-dark-700/50 bg-dark-800/40 transition-colors hover:border-brand-400/30">
                    <div className="aspect-[16/9] overflow-hidden bg-dark-700">
                      {article.coverImage ? (
                        <img src={article.coverImage} alt={article.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-dark-500">No Cover</div>
                      )}
                    </div>
                    <div className="space-y-2 p-4">
                      <p className="line-clamp-2 text-sm text-dark-100">{article.title}</p>
                      <p className="line-clamp-2 text-xs leading-relaxed text-dark-500">{article.excerpt || 'Buka artikel untuk melihat detail konten.'}</p>
                      <div className="flex items-center justify-between text-[11px] text-dark-500">
                        <span>{article.category || 'general'}</span>
                        <span>{(article.viewCount || 0).toLocaleString('id-ID')} views</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}