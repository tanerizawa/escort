'use client';

import { useState, useEffect, useCallback } from 'react';
import { EscortCard } from '@/components/escort/escort-card';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';

const tiers = [
  { value: '', label: 'Semua Tier' },
  { value: 'SILVER', label: 'Silver' },
  { value: 'GOLD', label: 'Gold' },
  { value: 'PLATINUM', label: 'Platinum' },
  { value: 'DIAMOND', label: 'Diamond' },
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
      setEscorts(Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []);
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

  return (
    <div className="mx-auto max-w-7xl">
      {/* ── Editorial Header with visual art ── */}
      <section className="relative overflow-hidden border-b border-dark-700/30 px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        {/* Background art */}
        <div className="absolute inset-0 art-deco-bg opacity-40" />
        <div className="absolute right-0 top-0 w-72 h-72 art-orb opacity-15" />
        <div className="absolute -left-20 bottom-0 w-40 h-40 art-orb opacity-10" />
        
        <div className="relative">
          <div className="flex items-center gap-4 mb-2">
            <span className="h-px w-12 bg-gradient-to-r from-brand-400/50 to-transparent" />
            <p className="text-[11px] font-medium uppercase tracking-widest-2 text-brand-400">Katalog</p>
          </div>
          <h1 className="font-display text-display-sm font-medium text-dark-100">
            Temukan Companion
          </h1>
          <p className="mt-3 max-w-xl font-serif text-[15px] leading-relaxed text-dark-400">
            Jelajahi koleksi pendamping profesional terverifikasi kami. Setiap profil 
            melalui proses kurasi ketat untuk memastikan standar tertinggi.
          </p>
          {/* Decorative divider */}
          <div className="mt-6 flex items-center gap-2">
            <span className="h-px w-6 bg-brand-400/30" />
            <span className="h-1 w-1 bg-brand-400/40" />
            <span className="h-px w-6 bg-brand-400/30" />
          </div>
        </div>
      </section>

      {/* ── Filters — Editorial bar ── */}
      <section className="border-b border-dark-700/20 bg-dark-800/20 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari nama, keahlian, atau kota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-none border border-dark-700/30 bg-dark-900/50 py-3 pl-11 pr-4 font-serif text-sm text-dark-100 placeholder:text-dark-600 focus:border-brand-400/40 focus:outline-none transition-colors"
            />
          </div>

          {/* Filter selects */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="cursor-pointer rounded-none border border-dark-700/30 bg-dark-900/50 px-4 py-3 text-[12px] uppercase tracking-widest text-dark-300 focus:border-brand-400/40 focus:outline-none transition-colors appearance-none"
            >
              {tiers.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="cursor-pointer rounded-none border border-dark-700/30 bg-dark-900/50 px-4 py-3 text-[12px] uppercase tracking-widest text-dark-300 focus:border-brand-400/40 focus:outline-none transition-colors appearance-none"
            >
              {languages.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="cursor-pointer rounded-none border border-dark-700/30 bg-dark-900/50 px-4 py-3 text-[12px] uppercase tracking-widest text-dark-300 focus:border-brand-400/40 focus:outline-none transition-colors appearance-none"
            >
              {sortOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {activeFilterCount > 0 && (
              <button
                onClick={() => { setSelectedTier(''); setSelectedLanguage(''); }}
                className="text-[11px] uppercase tracking-widest text-brand-400 hover:text-brand-300 transition-colors"
              >
                Reset ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Results ── */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
            <span className="mt-4 text-[11px] uppercase tracking-widest text-dark-600">Memuat companion...</span>
          </div>
        ) : escorts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-dark-700/30 bg-dark-800/30">
              <svg className="h-8 w-8 text-dark-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="font-display text-xl font-medium text-dark-200">Tidak Ada Hasil</h3>
            <p className="mt-3 max-w-sm font-serif text-[15px] leading-relaxed text-dark-500">
              {search || selectedTier || selectedLanguage
                ? 'Tidak ada companion yang sesuai dengan filter. Coba ubah kriteria pencarian Anda.'
                : 'Companion akan muncul di sini setelah mendaftar dan diverifikasi oleh tim kami.'}
            </p>
            {(search || selectedTier || selectedLanguage) && (
              <button
                onClick={() => { setSearch(''); setSelectedTier(''); setSelectedLanguage(''); }}
                className="mt-6 rounded-none border border-brand-400/40 px-8 py-3 text-[11px] font-semibold uppercase tracking-widest-2 text-brand-400 transition-all hover:bg-brand-400/10"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-widest text-dark-500">
                Menampilkan <span className="font-medium text-dark-300">{escorts.length}</span> dari{' '}
                <span className="font-medium text-dark-300">{pagination.total}</span> companion
              </p>
              <div className="hidden h-px flex-1 bg-dark-700/20 mx-6 sm:block" />
            </div>

            {/* Grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {escorts.map((escort: any) => (
                <EscortCard key={escort.id} escort={escort} isPublic={!isAuthenticated} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-6">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchEscorts(pagination.page - 1)}
                  className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-dark-400 transition-colors hover:text-brand-400 disabled:opacity-30 disabled:hover:text-dark-400"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
                            ? 'border border-brand-400/40 bg-brand-400/10 font-medium text-brand-400'
                            : 'text-dark-500 hover:text-dark-200'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  {pagination.totalPages > 5 && (
                    <span className="px-1 text-dark-600">...</span>
                  )}
                </div>

                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchEscorts(pagination.page + 1)}
                  className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-dark-400 transition-colors hover:text-brand-400 disabled:opacity-30 disabled:hover:text-dark-400"
                >
                  Selanjutnya
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
