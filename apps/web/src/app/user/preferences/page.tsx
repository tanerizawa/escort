'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const QUICK_TIER_PREFERENCES = ['SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'] as const;
const QUICK_LANGUAGE_PREFERENCES = ['Indonesia', 'English', 'Mandarin', 'Japanese'] as const;

const QUICK_PREFERENCE_STORAGE_KEY = 'discover:quick-preferences:v1';
const ADVANCED_PREFERENCE_STORAGE_KEY = 'discover:advanced-preferences:v1';

const BUDGET_BUCKETS = [
  { id: 'under-500', label: 'Di bawah 500k/jam', min: 0, max: 500000 },
  { id: '500-1000', label: '500k - 1jt/jam', min: 500000, max: 1000000 },
  { id: '1000-2500', label: '1jt - 2.5jt/jam', min: 1000000, max: 2500000 },
  { id: 'above-2500', label: 'Di atas 2.5jt/jam', min: 2500000, max: null },
] as const;

export default function UserPreferencesPage() {
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [basedIn, setBasedIn] = useState('');
  const [travelScope, setTravelScope] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [budgetBucket, setBudgetBucket] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const quickRaw = window.localStorage.getItem(QUICK_PREFERENCE_STORAGE_KEY);
      if (quickRaw) {
        const quickParsed = JSON.parse(quickRaw) as { tiers?: string[]; languages?: string[] };
        setSelectedTiers(Array.isArray(quickParsed.tiers) ? quickParsed.tiers : []);
        setSelectedLanguages(Array.isArray(quickParsed.languages) ? quickParsed.languages : []);
      }

      const advancedRaw = window.localStorage.getItem(ADVANCED_PREFERENCE_STORAGE_KEY);
      if (advancedRaw) {
        const advancedParsed = JSON.parse(advancedRaw) as {
          basedIn?: string;
          travelScope?: string;
          bodyType?: string;
          budgetBucket?: string;
        };
        setBasedIn(advancedParsed.basedIn || '');
        setTravelScope(advancedParsed.travelScope || '');
        setBodyType(advancedParsed.bodyType || '');
        setBudgetBucket(advancedParsed.budgetBucket || '');
      }
    } catch {
      setSelectedTiers([]);
      setSelectedLanguages([]);
      setBasedIn('');
      setTravelScope('');
      setBodyType('');
      setBudgetBucket('');
    }
  }, []);

  const hasAnyPreference = useMemo(
    () =>
      selectedTiers.length > 0 ||
      selectedLanguages.length > 0 ||
      Boolean(basedIn || travelScope || bodyType || budgetBucket),
    [selectedTiers, selectedLanguages, basedIn, travelScope, bodyType, budgetBucket],
  );

  const toggleTier = (value: string) => {
    setSelectedTiers((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const toggleLanguage = (value: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const savePreferences = () => {
    if (typeof window === 'undefined') return;

    const quickPayload = JSON.stringify({
      tiers: selectedTiers,
      languages: selectedLanguages,
    });

    const advancedPayload = JSON.stringify({
      basedIn,
      travelScope,
      bodyType,
      budgetBucket,
    });

    window.localStorage.setItem(QUICK_PREFERENCE_STORAGE_KEY, quickPayload);
    window.localStorage.setItem(ADVANCED_PREFERENCE_STORAGE_KEY, advancedPayload);

    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const resetPreferences = () => {
    setSelectedTiers([]);
    setSelectedLanguages([]);
    setBasedIn('');
    setTravelScope('');
    setBodyType('');
    setBudgetBucket('');
    setSaved(false);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(QUICK_PREFERENCE_STORAGE_KEY);
      window.localStorage.removeItem(ADVANCED_PREFERENCE_STORAGE_KEY);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-dark-700/50 bg-[radial-gradient(circle_at_top_left,rgba(201,169,110,0.18),transparent_45%),linear-gradient(135deg,rgba(12,16,24,0.95),rgba(9,12,20,0.96))] p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-300/70">Smart Matching</p>
        <h1 className="mt-2 text-2xl font-light text-dark-100">User Preferences Studio</h1>
        <p className="mt-2 max-w-2xl text-sm text-dark-400">
          Atur preferensi personal Anda untuk meningkatkan relevansi rail For You, ranking, dan spotlight contest.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/user/discover" className="rounded-lg border border-brand-400/35 bg-brand-400/10 px-4 py-2 text-xs uppercase tracking-widest text-brand-300 hover:bg-brand-400/20">
            Kembali ke Discover
          </Link>
          <Link href="/user/escorts" className="rounded-lg border border-dark-600/60 px-4 py-2 text-xs uppercase tracking-widest text-dark-300 hover:border-dark-500/70">
            Jelajah Escorts
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-dark-700/50 bg-dark-800/35 p-5 space-y-4">
        <h2 className="text-lg text-dark-100">Tier & Language Preference</h2>

        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-dark-500">Preferred tier</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_TIER_PREFERENCES.map((tier) => {
              const active = selectedTiers.includes(tier);
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => toggleTier(tier)}
                  className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wider ${
                    active
                      ? 'border-brand-400/40 bg-brand-400/15 text-brand-300'
                      : 'border-dark-600/50 text-dark-400 hover:border-dark-500/70'
                  }`}
                >
                  {tier}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-dark-500">Preferred language</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_LANGUAGE_PREFERENCES.map((language) => {
              const active = selectedLanguages.includes(language);
              return (
                <button
                  key={language}
                  type="button"
                  onClick={() => toggleLanguage(language)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    active
                      ? 'border-brand-400/40 bg-brand-400/15 text-brand-300'
                      : 'border-dark-600/50 text-dark-400 hover:border-dark-500/70'
                  }`}
                >
                  {language}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-dark-700/50 bg-dark-800/35 p-5 space-y-4">
        <h2 className="text-lg text-dark-100">Context Preference</h2>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-xs uppercase tracking-widest text-dark-500">Based In</span>
            <input
              value={basedIn}
              onChange={(event) => setBasedIn(event.target.value)}
              placeholder="Jakarta"
              className="w-full rounded-lg border border-dark-600/50 bg-dark-900/30 px-3 py-2 text-sm text-dark-200 focus:border-brand-400/40 focus:outline-none"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs uppercase tracking-widest text-dark-500">Travel Scope</span>
            <input
              value={travelScope}
              onChange={(event) => setTravelScope(event.target.value)}
              placeholder="City / Nationwide"
              className="w-full rounded-lg border border-dark-600/50 bg-dark-900/30 px-3 py-2 text-sm text-dark-200 focus:border-brand-400/40 focus:outline-none"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs uppercase tracking-widest text-dark-500">Body Type</span>
            <input
              value={bodyType}
              onChange={(event) => setBodyType(event.target.value)}
              placeholder="Slim / Athletic"
              className="w-full rounded-lg border border-dark-600/50 bg-dark-900/30 px-3 py-2 text-sm text-dark-200 focus:border-brand-400/40 focus:outline-none"
            />
          </label>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-dark-500">Budget range preference</p>
          <div className="grid gap-2 md:grid-cols-2">
            {BUDGET_BUCKETS.map((bucket) => {
              const active = budgetBucket === bucket.id;
              return (
                <button
                  key={bucket.id}
                  type="button"
                  onClick={() => setBudgetBucket(active ? '' : bucket.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm ${
                    active
                      ? 'border-brand-400/40 bg-brand-400/15 text-brand-200'
                      : 'border-dark-600/50 bg-dark-900/30 text-dark-400 hover:border-dark-500/70'
                  }`}
                >
                  {bucket.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-dark-700/50 bg-dark-800/35 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-dark-400">
            {hasAnyPreference
              ? 'Preferensi siap disimpan dan dipakai untuk personalisasi Discover.'
              : 'Belum ada preferensi aktif. Anda tetap bisa gunakan rekomendasi default.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetPreferences}
              className="rounded-lg border border-dark-600/50 px-4 py-2 text-xs uppercase tracking-widest text-dark-300 hover:border-dark-500/70"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={savePreferences}
              className="rounded-lg border border-brand-400/35 bg-brand-400/10 px-4 py-2 text-xs uppercase tracking-widest text-brand-300 hover:bg-brand-400/20"
            >
              Simpan Preferensi
            </button>
          </div>
        </div>

        {saved && (
          <p className="mt-3 text-xs text-green-400">Preferensi berhasil disimpan. Buka Discover untuk melihat hasil terbaru.</p>
        )}
      </section>
    </div>
  );
}
