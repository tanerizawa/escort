'use client';

import { useState, useEffect, useCallback } from 'react';
import { EscortCard } from '@/components/escort/escort-card';
import api from '@/lib/api';
import { Search } from 'lucide-react';

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

export default function UserEscortBrowsePage() {
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [escorts, setEscorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

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
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-dark-100">Cari Pendamping</h1>
        <p className="mt-1 text-sm text-dark-400">
          Jelajahi companion profesional terverifikasi kami
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-dark-700/50 bg-dark-800/50 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari nama, keahlian, atau kota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-dark-600/50 bg-dark-900/50 py-2.5 pl-10 pr-4 text-sm text-dark-100 placeholder:text-dark-600 focus:border-brand-400/40 focus:outline-none transition-colors"
            />
          </div>

          {/* Filter selects */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="cursor-pointer rounded-lg border border-dark-600/50 bg-dark-900/50 px-3 py-2.5 text-sm text-dark-300 focus:border-brand-400/40 focus:outline-none transition-colors"
            >
              {tiers.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="cursor-pointer rounded-lg border border-dark-600/50 bg-dark-900/50 px-3 py-2.5 text-sm text-dark-300 focus:border-brand-400/40 focus:outline-none transition-colors"
            >
              {languages.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="cursor-pointer rounded-lg border border-dark-600/50 bg-dark-900/50 px-3 py-2.5 text-sm text-dark-300 focus:border-brand-400/40 focus:outline-none transition-colors"
            >
              {sortOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {activeFilterCount > 0 && (
              <button
                onClick={() => { setSelectedTier(''); setSelectedLanguage(''); }}
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                Reset ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
        </div>
      ) : escorts.length === 0 ? (
        <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 py-16 text-center">
          <div className="mb-4"><Search className="h-10 w-10" /></div>
          <h3 className="text-lg font-light text-dark-200">Tidak Ada Hasil</h3>
          <p className="mt-2 text-sm text-dark-500">
            {search || selectedTier || selectedLanguage
              ? 'Tidak ada companion yang sesuai dengan filter.'
              : 'Companion akan muncul di sini setelah diverifikasi.'}
          </p>
          {(search || selectedTier || selectedLanguage) && (
            <button
              onClick={() => { setSearch(''); setSelectedTier(''); setSelectedLanguage(''); }}
              className="mt-4 rounded-lg border border-dark-600/50 px-4 py-2 text-sm text-dark-300 hover:border-dark-500/50 transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-xs text-dark-500">
              Menampilkan <span className="text-dark-300">{escorts.length}</span> dari{' '}
              <span className="text-dark-300">{pagination.total}</span> companion
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {escorts.map((escort: any) => (
              <EscortCard key={escort.id} escort={escort} basePath="/user/escorts" />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => fetchEscorts(Math.max(1, pagination.page - 1))}
                disabled={pagination.page <= 1}
                className="rounded-lg border border-dark-600/50 px-3 py-2 text-sm text-dark-300 transition-colors hover:border-dark-500/50 disabled:opacity-30"
              >
                Sebelumnya
              </button>
              <span className="text-sm text-dark-400">
                Halaman {pagination.page} dari {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchEscorts(Math.min(pagination.totalPages, pagination.page + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="rounded-lg border border-dark-600/50 px-3 py-2 text-sm text-dark-300 transition-colors hover:border-dark-500/50 disabled:opacity-30"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
