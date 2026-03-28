'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { WelcomeTour } from '@/components/onboarding/welcome-tour';
import { Award, Calendar, Check, ClipboardList, Gem, Heart, Search, Sparkles, Star, Trophy, Unlock, User } from 'lucide-react';
import { Icon } from '@/components/ui/icon';

const statusConfig: Record<string, { label: string; variant: 'warning' | 'info' | 'brand' | 'success' | 'danger' }> = {
  PENDING: { label: 'Menunggu', variant: 'warning' },
  CONFIRMED: { label: 'Dikonfirmasi', variant: 'info' },
  ONGOING: { label: 'Berlangsung', variant: 'brand' },
  COMPLETED: { label: 'Selesai', variant: 'success' },
  CANCELLED: { label: 'Dibatalkan', variant: 'danger' },
};

const clientTiers = [
  { min: 0, name: 'Regular', color: 'text-dark-400 bg-dark-700/30 border-dark-600/30', icon: 'User' },
  { min: 5, name: 'Silver', color: 'text-slate-300 bg-slate-500/10 border-slate-400/20', icon: 'Award' },
  { min: 15, name: 'Gold', color: 'text-amber-400 bg-amber-500/10 border-amber-400/20', icon: 'Trophy' },
  { min: 30, name: 'Platinum', color: 'text-violet-400 bg-violet-500/10 border-violet-400/20', icon: 'Gem' },
];

function getClientTier(totalBookings: number) {
  for (let i = clientTiers.length - 1; i >= 0; i--) {
    if (totalBookings >= clientTiers[i].min) return clientTiers[i];
  }
  return clientTiers[0];
}

function getNextTier(totalBookings: number) {
  for (const tier of clientTiers) {
    if (totalBookings < tier.min) return tier;
  }
  return null;
}

interface BookingSummary {
  id: string;
  status: string;
  serviceType: string;
  startTime: string;
  totalAmount: number;
  escort?: { firstName?: string; lastName?: string };
}

export default function ClientDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ total: 0, active: 0, reviews: 0, favorites: 0 });
  const [recentBookings, setRecentBookings] = useState<BookingSummary[]>([]);
  const [kycStatus, setKycStatus] = useState<string>('NONE');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [bookingsRes, favoritesRes, reviewsRes, kycRes] = await Promise.allSettled([
        api.get('/bookings', { params: { limit: 5 } }),
        api.get('/favorites'),
        api.get('/reviews/mine', { params: { limit: 1 } }).catch(() => ({ data: { data: { pagination: { total: 0 } } } })),
        api.get('/kyc/status'),
      ]);

      if (kycRes.status === 'fulfilled') {
        const kycData = kycRes.value.data?.data || kycRes.value.data;
        setKycStatus(kycData?.currentStatus || (kycData?.isVerified ? 'VERIFIED' : 'NONE'));
      }

      let allBookings: BookingSummary[] = [];
      let totalBookings = 0;
      let activeBookings = 0;

      if (bookingsRes.status === 'fulfilled') {
        const payload = bookingsRes.value.data?.data || bookingsRes.value.data;
        allBookings = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
        totalBookings = payload?.pagination?.total || payload?.total || allBookings.length;
        activeBookings = allBookings.filter(
          (b: BookingSummary) => ['PENDING', 'CONFIRMED', 'ONGOING'].includes(b.status)
        ).length;
        setRecentBookings(allBookings.slice(0, 5));
      }

      let favCount = 0;
      if (favoritesRes.status === 'fulfilled') {
        const favPayload = favoritesRes.value.data?.data || favoritesRes.value.data;
        if (favPayload?.pagination?.total != null) {
          favCount = favPayload.pagination.total;
        } else if (Array.isArray(favPayload?.data)) {
          favCount = favPayload.data.length;
        } else if (Array.isArray(favPayload)) {
          favCount = favPayload.length;
        }
      }

      let reviewCount = 0;
      if (reviewsRes.status === 'fulfilled') {
        const reviewPayload = reviewsRes.value.data?.data || reviewsRes.value.data;
        if (reviewPayload?.pagination?.total != null) {
          reviewCount = reviewPayload.pagination.total;
        } else if (reviewPayload?.total != null) {
          reviewCount = reviewPayload.total;
        } else if (Array.isArray(reviewPayload?.data)) {
          reviewCount = reviewPayload.data.length;
        } else if (Array.isArray(reviewPayload)) {
          reviewCount = reviewPayload.length;
        }
      }

      setStats({
        total: totalBookings,
        active: activeBookings,
        reviews: reviewCount,
        favorites: favCount,
      });
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    `Rp ${amount.toLocaleString('id-ID')}`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const currentTier = getClientTier(stats.total);
  const nextTier = getNextTier(stats.total);

  return (
    <div>
      <WelcomeTour />
      {/* Header with decorative elements */}
      <div className="relative mb-8 overflow-hidden">
        {/* Subtle background art */}
        <div className="absolute inset-0 art-deco-bg opacity-30" />
        <div className="absolute top-0 right-0 w-32 h-32 art-orb opacity-20" />
        
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest-2 text-brand-400/60 mb-1">Dashboard</p>
            <h1 className="font-display text-2xl font-light text-dark-100">
              Halo, <span className="text-brand-400">{user?.firstName || 'User'}</span>
            </h1>
            <p className="mt-1 text-sm text-dark-400">
              Selamat datang di dashboard Anda
            </p>
          </div>
          {!loading && (
            <div className="flex items-center gap-2">
              {user?.isVerified && (
                <span className="border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
                  <Check className="h-4 w-4 inline-block" /> Verified
                </span>
              )}
              <span className={`border px-3 py-1 text-xs font-medium ${currentTier.color}`}>
                <Icon name={currentTier.icon} className="h-4 w-4 inline-block" /> {currentTier.name}
              </span>
            </div>
          )}
        </div>
        {/* Gold line divider */}
        <div className="mt-4 h-px bg-gradient-to-r from-brand-400/30 via-brand-400/10 to-transparent" />
      </div>

      {/* Verification Banner */}
      {!loading && !user?.isVerified && kycStatus !== 'PENDING' && kycStatus !== 'IN_REVIEW' && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <Unlock className="h-6 w-6" />
            <div>
              <p className="text-sm font-medium text-dark-200">Akun Belum Terverifikasi</p>
              <p className="text-xs text-dark-500">Verifikasi identitas untuk akses penuh & keamanan akun</p>
            </div>
          </div>
          <Link href="/user/profile/verification">
            <Button size="sm">Verifikasi Sekarang</Button>
          </Link>
        </div>
      )}

      {!loading && (kycStatus === 'PENDING' || kycStatus === 'IN_REVIEW') && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-5 py-4">
          <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
          <div>
            <p className="text-sm font-medium text-dark-200">Verifikasi Sedang Diproses</p>
            <p className="text-xs text-dark-500">Dokumen Anda sedang direview, estimasi 1-24 jam kerja</p>
          </div>
        </div>
      )}

      {/* Client Tier Progress */}
      {!loading && nextTier && (
        <div className="mb-6 rounded-xl border border-dark-700/20 bg-dark-800/20 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-dark-400">Level selanjutnya:</span>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${nextTier.color}`}>
                <Icon name={nextTier.icon} className="h-4 w-4 inline-block" /> {nextTier.name}
              </span>
            </div>
            <span className="text-xs text-dark-500">{stats.total.toLocaleString('id-ID')}/{nextTier.min.toLocaleString('id-ID')} booking</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-dark-700/30">
            <div
              className="h-1.5 rounded-full bg-brand-400 transition-all"
              style={{ width: `${Math.min((stats.total / nextTier.min) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Booking', value: loading ? '—' : stats.total.toLocaleString('id-ID'), icon: 'ClipboardList', gradient: 'from-brand-400/10 to-amber-400/5', accent: 'bg-brand-400' },
          { label: 'Booking Aktif', value: loading ? '—' : stats.active.toLocaleString('id-ID'), icon: 'Sparkles', gradient: 'from-violet-400/10 to-blue-400/5', accent: 'bg-violet-400' },
          { label: 'Ulasan Diberikan', value: loading ? '—' : stats.reviews.toLocaleString('id-ID'), icon: 'Star', gradient: 'from-amber-400/10 to-orange-400/5', accent: 'bg-amber-400' },
          { label: 'Partner Favorit', value: loading ? '—' : stats.favorites.toLocaleString('id-ID'), icon: 'Heart', gradient: 'from-rose-400/10 to-pink-400/5', accent: 'bg-rose-400' },
        ].map((stat) => (
          <div key={stat.label} className="group relative overflow-hidden border border-dark-700/20 bg-dark-800/30 p-5 transition-all duration-500 hover:border-brand-400/15">
            {/* Background gradient art */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
            {/* Accent strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${stat.accent} opacity-40`} />
            {/* Decorative corner */}
            <div className="absolute top-2 right-2 w-3 h-3 border-r border-t border-brand-400/10 transition-all duration-500 group-hover:border-brand-400/25" />
            
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest-2 text-dark-500">
                  {stat.label}
                </p>
                <p className="mt-2 font-display text-3xl font-light text-gradient-gold">{stat.value}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center border border-dark-700/20 bg-dark-800/40 transition-all duration-500 group-hover:border-brand-400/15">
                <Icon name={stat.icon} className="h-5 w-5 text-brand-400/60 transition-colors group-hover:text-brand-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-lg font-light text-dark-200">Aksi Cepat</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-dark-700/30 to-transparent" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              href: '/user/escorts',
              icon: Search,
              title: 'Cari Partner',
              desc: 'Temukan pendamping profesional untuk kebutuhan Anda',
              image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=60&auto=format',
              gradient: 'from-brand-400/15 to-amber-500/10',
            },
            {
              href: '/user/bookings',
              icon: Calendar,
              title: 'Lihat Booking',
              desc: 'Kelola booking aktif dan riwayat booking Anda',
              image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=60&auto=format',
              gradient: 'from-violet-400/15 to-blue-500/10',
            },
            {
              href: '/user/favorites',
              icon: Heart,
              title: 'Favorit Saya',
              desc: 'Lihat daftar partner favorit pilihan Anda',
              image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=60&auto=format',
              gradient: 'from-rose-400/15 to-pink-500/10',
            },
          ].map((action) => (
            <Link key={action.href} href={action.href} className="group relative block overflow-hidden border border-dark-700/20 bg-dark-800/30 transition-all duration-500 hover:border-brand-400/20">
              {/* Background image — subtle */}
              <div className="absolute inset-0">
                <img src={action.image} alt="" className="h-full w-full object-cover opacity-[0.06] transition-opacity duration-700 group-hover:opacity-[0.12]" loading="lazy" />
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
              </div>
              
              {/* Corner ornament */}
              <div className="absolute top-2 right-2 w-4 h-4 border-r border-t border-brand-400/10 transition-all duration-500 group-hover:w-5 group-hover:h-5 group-hover:border-brand-400/25" />
              
              <div className="relative p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center border border-dark-700/30 bg-dark-900/50 transition-all duration-500 group-hover:border-brand-400/20">
                  <action.icon className="h-4 w-4 text-brand-400/60 transition-colors group-hover:text-brand-400" />
                </div>
                <h3 className="font-display text-sm font-medium text-dark-200 group-hover:text-brand-400 transition-colors duration-300">
                  {action.title}
                </h3>
                <p className="mt-1 text-xs text-dark-500">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-light text-dark-200">Booking Terbaru</h2>
            <div className="h-px w-12 bg-gradient-to-r from-dark-700/30 to-transparent" />
          </div>
          <Link href="/user/bookings">
            <Button variant="ghost" size="sm">
              Lihat Semua
            </Button>
          </Link>
        </div>
        {loading ? (
          <Card className="mt-4">
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
              </div>
            </CardContent>
          </Card>
        ) : recentBookings.length === 0 ? (
          <Card className="mt-4">
            <CardContent>
              <div className="py-8 text-center">
                <p className="text-sm text-dark-500">Belum ada booking.</p>
                <Link href="/user/escorts">
                  <Button variant="outline" size="sm" className="mt-3">
                    Cari Partner Sekarang
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {recentBookings.map((booking) => {
              const escortName = [booking.escort?.firstName, booking.escort?.lastName].filter(Boolean).join(' ') || 'Partner';
              const cfg = statusConfig[booking.status];
              return (
                <Link key={booking.id} href={`/user/bookings/${booking.id}`}>
                  <Card variant="outline" className="hover:border-dark-600/50 transition-all cursor-pointer">
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-dark-100">{escortName}</h3>
                            {cfg && <Badge variant={cfg.variant}>{cfg.label}</Badge>}
                          </div>
                          <p className="mt-1 text-xs text-dark-500">
                            {booking.serviceType} — {formatDate(booking.startTime)}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-brand-400">
                          {formatCurrency(Number(booking.totalAmount) || 0)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
