'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { EscortCard } from '@/components/escort/escort-card';
import api from '@/lib/api';

export default function EscortBrowsePage() {
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
      setEscorts(res.data?.data || []);
      setPagination(res.data?.pagination || { page: 1, total: 0, totalPages: 0 });
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-light text-dark-100">Cari Partner</h1>
        <p className="mt-1 text-sm text-dark-400">
          Temukan pendamping profesional yang sesuai dengan kebutuhan Anda
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-dark-500">Pencarian</label>
              <Input
                placeholder="Cari berdasarkan nama, spesialisasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-40">
              <label className="mb-1 block text-xs text-dark-500">Tier</label>
              <Select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                placeholder="Semua Tier"
                options={[
                  { value: 'SILVER', label: 'Silver' },
                  { value: 'GOLD', label: 'Gold' },
                  { value: 'PLATINUM', label: 'Platinum' },
                  { value: 'DIAMOND', label: 'Diamond' },
                ]}
              />
            </div>
            <div className="w-40">
              <label className="mb-1 block text-xs text-dark-500">Bahasa</label>
              <Select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                placeholder="Semua Bahasa"
                options={[
                  { value: 'Indonesia', label: 'Indonesia' },
                  { value: 'English', label: 'English' },
                  { value: 'Mandarin', label: 'Mandarin' },
                  { value: 'Japanese', label: 'Japanese' },
                ]}
              />
            </div>
            <div className="w-44">
              <label className="mb-1 block text-xs text-dark-500">Urutkan</label>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'rating', label: 'Rating Tertinggi' },
                  { value: 'price_asc', label: 'Harga Terendah' },
                  { value: 'price_desc', label: 'Harga Tertinggi' },
                  { value: 'newest', label: 'Terbaru' },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
        </div>
      ) : escorts.length === 0 ? (
        <Card>
          <CardContent>
            <div className="py-16 text-center">
              <div className="mb-4 text-4xl">🔍</div>
              <h3 className="text-lg font-light text-dark-200">Belum Ada Partner</h3>
              <p className="mt-2 text-sm text-dark-500">
                {search || selectedTier || selectedLanguage
                  ? 'Tidak ada partner yang sesuai dengan filter. Coba ubah kriteria pencarian.'
                  : 'Data partner akan muncul setelah escort mendaftar dan diverifikasi.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="mb-4 text-sm text-dark-400">
            Menampilkan {escorts.length} dari {pagination.total} partner
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {escorts.map((escort: any) => (
              <EscortCard key={escort.id} escort={escort} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchEscorts(pagination.page - 1)}
              >
                Sebelumnya
              </Button>
              <span className="px-3 text-sm text-dark-400">
                Halaman {pagination.page} dari {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchEscorts(pagination.page + 1)}
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
