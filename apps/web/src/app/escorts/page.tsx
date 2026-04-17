'use client';

import { useState, useEffect, useCallback } from 'react';
import { EscortCard } from '@/components/escort/escort-card';
import { useAuthStore } from '@/stores/auth.store';
import { MarketingPageHeader } from '@/components/layout/marketing-page-header';
import { RoseGlyph } from '@/components/brand/rose-glyph';
import api from '@/lib/api';

const tiers = [
  { value: '', label: 'Semua Tier' },
  { value: 'SILVER', label: 'Silver · Tea Rose' },
  { value: 'GOLD', label: 'Gold · Damask' },
  { value: 'PLATINUM', label: 'Platinum · Gallica' },
  { value: 'DIAMOND', label: 'Diamond · Rose Noir' },
];

const languages = [
  { value: '', label: 'Semua Bahasa' },
  { value: 'Indonesia', label: 'Indonesia' },
  { value: 'English', label: 'English' },
  { value: 'Mandarin', label: 'Mandarin' },
  { value: 'Japanese', label: 'Japanese' },
];

const sortOptions = [
  { value: 'rating', label: 'Rating Tertinggi' },
  { value: 'price_asc', label: 'Harga Terendah' },
  { value: 'price_desc', label: 'Harga Tertinggi' },
  { value: 'newest', label: 'Terbaru' },
];

export default function EscortBrowsePage() {
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [escorts, setEscorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const { isAuthenticated } = useAuthStore();

  const fetchEscorts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 12, sortBy };
      if (search) params.search = search;
      if (selectedTier) params.tier = selectedTier;
      if (selectedLanguage) params.language = selectedLanguage;

      const res = await api.get('/escorts', { params });
      const payload = res.data?.data || res.data;
      setEscorts(
        Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [],
      );
      setPagination(payload?.pagination || { page: 1, total: 0, totalPages: 0 });
    } catch (err) {
      console.error('Failed to fetch escorts', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedTier, selectedLanguage, sortBy]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchEscorts(1), 300);
    return () => clearTimeout(debounce);
  }, [fetchEscorts]);

  const activeFilterCount = [selectedTier, selectedLanguage].filter(Boolean).length;

  const selectClass =
    'cursor-pointer rounded-none border border-dark-700/40 bg-dark-900/60 px-4 py-3 text-[12px] uppercase tracking-widest text-dark-300 appearance-none transition-colors focus:border-rose-400/40 focus:outline-none';

  return (
    <div>
      <MarketingPageHeader
        mark="Katalog Companion"
        title="Setiap profil, sebuah"
        highlight="mawar terkurasi"
        description="Jelajahi koleksi pendamping profesional terverifikasi. Setiap companion melewati verifikasi identitas, wawancara personal, dan evaluasi berkelanjutan."
      />

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        {/* Filter bar */}
        <section className="mb-10 border border-dark-700/30 bg-dark-800/30 p-5 lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-5">
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Cari nama, keahlian, atau kota..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-none border border-dark-700/40 bg-dark-900/60 py-3 pl-11 pr-4 font-serif text-sm text-dark-100 placeholder:text-dark-600 transition-colors focus:border-rose-400/40 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className={selectClass}
              >
                {tiers.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className={selectClass}
              >
                {languages.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={selectClass}
              >
                {sortOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setSelectedTier('');
                    setSelectedLanguage('');
                  }}
                  className="text-[11px] uppercase tracking-widest text-rose-200 transition-colors hover:text-rose-100"
                >
                  Reset ({activeFilterCount})
                </button>
              )}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-400/30 border-t-rose-300" />
            <span className="mt-4 text-[11px] uppercase tracking-widest text-dark-600">
              Memuat companion...
            </span>
          </div>
        ) : escorts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 text-rose-300/70">
              <RoseGlyph className="h-14 w-14" strokeWidth={1.1} />
            </div>
            <h3 className="font-display text-xl font-medium text-dark-200">
              Tidak ada hasil
            </h3>
            <p className="mt-3 max-w-sm font-serif text-[15px] leading-relaxed text-dark-500">
              {search || selectedTier || selectedLanguage
                ? 'Tidak ada companion yang sesuai dengan filter. Coba ubah kriteria pencarian Anda.'
                : 'Companion akan muncul di sini setelah mendaftar dan diverifikasi tim kami.'}
            </p>
            {(search || selectedTier || selectedLanguage) && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedTier('');
                  setSelectedLanguage('');
                }}
                className="mt-6 rounded-none border border-rose-400/40 px-8 py-3 text-[11px] font-semibold uppercase tracking-widest-2 text-rose-200 transition-all hover:bg-rose-500/10"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-8 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-widest-2 text-dark-500">
                Menampilkan{' '}
                <span className="font-medium text-rose-200">{escorts.length}</span> dari{' '}
                <span className="font-medium text-rose-200">{pagination.total}</span>{' '}
                companion
              </p>
              <div className="gold-rose-line hidden flex-1 mx-6 sm:block" />
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {escorts.map((escort: any) => (
                <EscortCard
                  key={escort.id}
                  escort={escort}
                  isPublic={!isAuthenticated}
                />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="mt-14 flex items-center justify-center gap-6">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchEscorts(pagination.page - 1)}
                  className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-dark-400 transition-colors hover:text-rose-200 disabled:opacity-30 disabled:hover:text-dark-400"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Sebelumnya
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => fetchEscorts(page)}
                        className={`flex h-9 w-9 items-center justify-center text-[12px] transition-all ${
                          pagination.page === page
                            ? 'border border-rose-400/40 bg-rose-500/10 font-medium text-rose-200'
                            : 'text-dark-500 hover:text-rose-200'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  {pagination.totalPages > 5 && <span className="px-1 text-dark-600">...</span>}
                </div>

                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchEscorts(pagination.page + 1)}
                  className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-dark-400 transition-colors hover:text-rose-200 disabled:opacity-30 disabled:hover:text-dark-400"
                >
                  Selanjutnya
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
