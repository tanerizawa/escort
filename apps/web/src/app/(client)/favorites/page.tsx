'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface FavoriteEscort {
  id: string;
  addedAt: string;
  escort: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto: string | null;
    escortProfile: {
      tier: string;
      hourlyRate: number;
      ratingAvg: number;
      totalBookings: number;
      languages: string[];
      skills: string[];
    } | null;
  };
}

interface RecentEscort {
  escort: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto: string | null;
    escortProfile: {
      tier: string;
      hourlyRate: number;
      ratingAvg: number;
    } | null;
  };
  lastBooking: {
    id: string;
    serviceType: string;
    location: string;
    date: string;
    amount: number;
  };
}

const TIER_COLORS: Record<string, string> = {
  SILVER: 'border-gray-400/30 text-gray-400',
  GOLD: 'border-brand-400/30 text-brand-400',
  PLATINUM: 'border-purple-400/30 text-purple-400',
  DIAMOND: 'border-cyan-400/30 text-cyan-400',
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteEscort[]>([]);
  const [recentEscorts, setRecentEscorts] = useState<RecentEscort[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'favorites' | 'recent'>('favorites');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [favRes, recentRes] = await Promise.all([
          api.get('/favorites'),
          api.get('/bookings/recent-escorts'),
        ]);
        setFavorites(favRes.data.data || []);
        setRecentEscorts(recentRes.data || []);
      } catch {
        /* silently */
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const removeFavorite = async (escortId: string) => {
    try {
      await api.delete(`/favorites/${escortId}`);
      setFavorites((prev) => prev.filter((f) => f.escort.id !== escortId));
    } catch {
      /* silently */
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-dark-800/30" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-light tracking-wide text-dark-100">Favorit & Riwayat</h1>
        <p className="mt-1 text-sm text-dark-400">
          Akses cepat ke companion favorit Anda
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-xl bg-dark-800/50 p-1">
        {([
          { key: 'favorites', label: `Favorit (${favorites.length})` },
          { key: 'recent', label: `Riwayat (${recentEscorts.length})` },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-dark-700 text-dark-100 shadow-sm'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Favorites Tab */}
      {activeTab === 'favorites' && (
        <div className="mt-6 space-y-3">
          {favorites.length === 0 ? (
            <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-12 text-center">
              <span className="text-4xl">💝</span>
              <p className="mt-3 text-dark-400">Belum ada escort favorit</p>
              <Link
                href="/escorts"
                className="mt-4 inline-block rounded-lg bg-brand-400/10 px-4 py-2 text-sm font-medium text-brand-400 transition-colors hover:bg-brand-400/20"
              >
                Jelajahi Escorts
              </Link>
            </div>
          ) : (
            favorites.map((fav) => (
              <div
                key={fav.id}
                className="flex items-center gap-4 rounded-xl border border-dark-700/30 bg-dark-800/20 p-4 transition-colors hover:border-dark-600/50"
              >
                {/* Avatar */}
                <Link href={`/escorts/${fav.escort.id}`} className="flex-shrink-0">
                  <div className="h-16 w-16 overflow-hidden rounded-xl bg-dark-700">
                    {fav.escort.profilePhoto ? (
                      <img
                        src={fav.escort.profilePhoto}
                        alt={fav.escort.firstName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-dark-400">
                        {fav.escort.firstName[0]}
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/escorts/${fav.escort.id}`}
                      className="font-medium text-dark-100 hover:text-brand-400"
                    >
                      {fav.escort.firstName} {fav.escort.lastName}
                    </Link>
                    {fav.escort.escortProfile && (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                          TIER_COLORS[fav.escort.escortProfile.tier] || TIER_COLORS.SILVER
                        }`}
                      >
                        {fav.escort.escortProfile.tier}
                      </span>
                    )}
                  </div>
                  {fav.escort.escortProfile && (
                    <div className="mt-1 flex items-center gap-3 text-xs text-dark-400">
                      <span className="flex items-center gap-1">
                        ⭐ {fav.escort.escortProfile.ratingAvg.toFixed(1)}
                      </span>
                      <span>{fav.escort.escortProfile.totalBookings} booking</span>
                      <span>{formatCurrency(Number(fav.escort.escortProfile.hourlyRate))}/jam</span>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-dark-500">
                    Ditambahkan {formatDate(fav.addedAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/bookings/new?escortId=${fav.escort.id}`}
                    className="rounded-lg bg-brand-400/10 px-3 py-2 text-sm font-medium text-brand-400 transition-colors hover:bg-brand-400/20"
                  >
                    Booking
                  </Link>
                  <button
                    onClick={() => removeFavorite(fav.escort.id)}
                    className="rounded-lg p-2 text-dark-500 transition-colors hover:bg-dark-800 hover:text-red-400"
                    title="Hapus dari favorit"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Recent / Quick Re-book Tab */}
      {activeTab === 'recent' && (
        <div className="mt-6 space-y-3">
          {recentEscorts.length === 0 ? (
            <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-12 text-center">
              <span className="text-4xl">📋</span>
              <p className="mt-3 text-dark-400">Belum ada riwayat booking</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-dark-400">
                Booking ulang dengan escort yang pernah Anda gunakan sebelumnya
              </p>
              {recentEscorts.map((item) => (
                <div
                  key={item.lastBooking.id}
                  className="flex items-center gap-4 rounded-xl border border-dark-700/30 bg-dark-800/20 p-4 transition-colors hover:border-dark-600/50"
                >
                  {/* Avatar */}
                  <Link href={`/escorts/${item.escort.id}`} className="flex-shrink-0">
                    <div className="h-16 w-16 overflow-hidden rounded-xl bg-dark-700">
                      {item.escort.profilePhoto ? (
                        <img
                          src={item.escort.profilePhoto}
                          alt={item.escort.firstName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-dark-400">
                          {item.escort.firstName[0]}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/escorts/${item.escort.id}`}
                        className="font-medium text-dark-100 hover:text-brand-400"
                      >
                        {item.escort.firstName} {item.escort.lastName}
                      </Link>
                      {item.escort.escortProfile && (
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                            TIER_COLORS[item.escort.escortProfile.tier] || TIER_COLORS.SILVER
                          }`}
                        >
                          {item.escort.escortProfile.tier}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-dark-400">
                      <span>{item.lastBooking.serviceType}</span>
                      {item.lastBooking.location && (
                        <span> • {item.lastBooking.location}</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-dark-500">
                      Terakhir: {formatDate(item.lastBooking.date)} • {formatCurrency(Number(item.lastBooking.amount))}
                    </p>
                  </div>

                  {/* Actions */}
                  <Link
                    href={`/bookings/new?escortId=${item.escort.id}&serviceType=${item.lastBooking.serviceType}`}
                    className="flex items-center gap-2 rounded-lg bg-brand-400/10 px-4 py-2.5 text-sm font-medium text-brand-400 transition-colors hover:bg-brand-400/20"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.182-3.182" />
                    </svg>
                    Re-book
                  </Link>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
