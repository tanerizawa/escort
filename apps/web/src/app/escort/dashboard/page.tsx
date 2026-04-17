'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import api from '@/lib/api';
import { Calendar, Check, ClipboardList, DollarSign, Lightbulb, MapPin, MessageCircle, Star, User, X, Zap } from 'lucide-react';
import { PanelHeader } from '@/components/layout/panel-header';

interface EscortProfile {
  tier: string;
  bio: string | null;
  hourlyRate: number;
  ratingAvg: number;
  totalBookings: number;
  totalReviews: number;
  languages: string[];
  skills: string[];
  portfolioUrls: string[];
  availabilitySchedule: any;
  isApproved: boolean;
  certifications: any[];
}

interface DashboardBooking {
  id: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  status: string;
  location?: string;
  createdAt?: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
}

interface EarningsSummary {
  totalEarnings: number;
  totalTips: number;
  pendingPayout: number;
  releasedPayout: number;
  completedBookings: number;
}

export default function EscortDashboard() {
  const { user } = useAuthStore();

  const [profile, setProfile] = useState<EscortProfile | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<DashboardBooking[]>([]);
  const [pendingRequests, setPendingRequests] = useState<DashboardBooking[]>([]);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [monthlyBookings, setMonthlyBookings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string>('');
  const [totalUnread, setTotalUnread] = useState(0);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, bookingsRes, earningsRes, chatsRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/bookings', { params: { limit: 50 } }),
        api.get('/payments/earnings/summary').catch(() => ({ data: { data: null } })),
        api.get('/chats').catch(() => ({ data: { data: [] } })),
      ]);

      // Profile data
      const userData = profileRes.data.data || profileRes.data;
      if (userData.escortProfile) {
        setProfile(userData.escortProfile);
      }

      // Bookings data — API returns { data: [...], pagination } wrapped in TransformInterceptor
      const bookingsPayload = bookingsRes.data?.data || bookingsRes.data;
      const allBookings = Array.isArray(bookingsPayload) ? bookingsPayload : (Array.isArray(bookingsPayload?.data) ? bookingsPayload.data : (Array.isArray(bookingsPayload?.bookings) ? bookingsPayload.bookings : []));

      // Ensure allBookings is always an array
      const safeBookings = Array.isArray(allBookings) ? allBookings : [];

      // Upcoming = CONFIRMED or ONGOING
      const upcoming = safeBookings
        .filter((b: any) => ['CONFIRMED', 'ONGOING'].includes(b.status))
        .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 5);
      setUpcomingBookings(upcoming);

      // Pending requests
      const pending = safeBookings
        .filter((b: any) => b.status === 'PENDING')
        .sort((a: any, b: any) => new Date(b.createdAt || b.startTime).getTime() - new Date(a.createdAt || a.startTime).getTime())
        .slice(0, 5);
      setPendingRequests(pending);

      // Monthly bookings count
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyCount = safeBookings.filter((b: any) => {
        const bDate = new Date(b.startTime);
        return bDate >= monthStart && ['CONFIRMED', 'ONGOING', 'COMPLETED'].includes(b.status);
      }).length;
      setMonthlyBookings(monthlyCount);

      // Earnings
      const earningsData = earningsRes.data.data || earningsRes.data;
      if (earningsData && typeof earningsData.totalEarnings !== 'undefined') {
        setEarnings(earningsData);
      }

      // Unread chats
      const chatRooms = chatsRes.data.data || chatsRes.data || [];
      const unread = Array.isArray(chatRooms)
        ? chatRooms.reduce((sum: number, r: any) => sum + (r.unreadCount || 0), 0)
        : 0;
      setTotalUnread(unread);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'default'> = {
      PENDING: 'warning',
      CONFIRMED: 'info',
      ONGOING: 'success',
      COMPLETED: 'success',
      CANCELLED: 'danger',
    };
    return map[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'Menunggu',
      CONFIRMED: 'Dikonfirmasi',
      ONGOING: 'Sedang Berlangsung',
      COMPLETED: 'Selesai',
      CANCELLED: 'Dibatalkan',
    };
    return map[status] || status;
  };

  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} hari lalu`;
  };

  // Accept booking
  const handleAccept = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/accept`);
      setPendingRequests((prev) => prev.filter((b) => b.id !== bookingId));
      const accepted = pendingRequests.find((b) => b.id === bookingId);
      if (accepted) {
        setUpcomingBookings((prev) =>
          [...prev, { ...accepted, status: 'CONFIRMED' }]
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
        );
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menerima booking');
    } finally {
      setActionLoading('');
    }
  };

  // Reject booking
  const handleReject = async (bookingId: string) => {
    if (!confirm('Yakin ingin menolak booking ini?')) return;
    setActionLoading(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/reject`);
      setPendingRequests((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menolak booking');
    } finally {
      setActionLoading('');
    }
  };

  // Check-in
  const handleCheckin = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/checkin`);
      setUpcomingBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'ONGOING' } : b)),
      );
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal check-in');
    } finally {
      setActionLoading('');
    }
  };

  // Checkout
  const handleCheckout = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/checkout`);
      setUpcomingBookings((prev) => prev.filter((b) => b.id !== bookingId));
      setMonthlyBookings((prev) => prev + 1);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal checkout');
    } finally {
      setActionLoading('');
    }
  };

  // Profile completion checks
  const profileChecks = profile
    ? [
        { label: 'Foto Profil', done: !!user?.profilePhoto, link: '/escort/profile' },
        { label: 'Bio & Deskripsi', done: !!profile.bio && profile.bio.length > 10, link: '/escort/profile' },
        { label: 'Spesialisasi / Skill', done: profile.skills.length > 0, link: '/escort/profile' },
        { label: 'Bahasa', done: profile.languages.length > 0, link: '/escort/profile' },
        { label: 'Tarif & Harga', done: profile.hourlyRate > 0, link: '/escort/profile' },
        { label: 'Jadwal Ketersediaan', done: !!profile.availabilitySchedule, link: '/escort/calendar' },
        { label: 'Verifikasi Admin', done: profile.isApproved, link: '' },
        { label: 'Sertifikasi', done: profile.certifications.length > 0, link: '/escort/profile' },
      ]
    : [];

  const completionPercent = profileChecks.length > 0
    ? Math.round((profileChecks.filter((c) => c.done).length / profileChecks.length) * 100)
    : 0;

  const tierLabel: Record<string, string> = {
    SILVER: 'Silver',
    GOLD: 'Gold',
    PLATINUM: 'Platinum',
    DIAMOND: 'Diamond',
  };

  const tierColor: Record<string, string> = {
    SILVER: 'text-gray-400',
    GOLD: 'text-brand-400',
    PLATINUM: 'text-blue-400',
    DIAMOND: 'text-purple-400',
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
          <p className="text-sm text-dark-500">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PanelHeader
        mark="Portal Partner"
        title={`Selamat datang, ${user?.firstName || 'Partner'}`}
        highlight={profile ? (tierLabel[profile.tier] || profile.tier) : undefined}
        description="Studio harian Anda — jadwal, tamu, dan earnings dalam satu atrium yang tenang."
        actions={
          <>
            {profile && !profile.isApproved && (
              <Badge variant="warning" size="sm">
                Menunggu Verifikasi
              </Badge>
            )}
            {profile?.isApproved && (
              <Badge variant="success" size="sm">
                <Check className="h-4 w-4 inline-block" /> Terverifikasi
              </Badge>
            )}
          </>
        }
      />

      {/* Urgent Alerts */}
      {pendingRequests.length > 0 && (
        <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <p className="text-sm font-medium text-yellow-300">
              {pendingRequests.length} request baru menunggu respon Anda
            </p>
            <Link href="/escort/requests" className="ml-auto">
              <Button variant="outline" size="sm" className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">
                Lihat Semua
              </Button>
            </Link>
          </div>
        </div>
      )}

      {totalUnread > 0 && (
        <div className="mb-6 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <p className="text-sm font-medium text-blue-300">
              {totalUnread} pesan belum dibaca
            </p>
            <Link href="/escort/chat" className="ml-auto">
              <Button variant="outline" size="sm" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                Buka Chat
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards — with visual art */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden border border-dark-700/20 bg-dark-800/30 p-5 transition-all duration-500 hover:border-brand-400/15">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-400/8 to-amber-400/4 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-brand-400 opacity-40" />
          <div className="absolute top-2 right-2 w-3 h-3 border-r border-t border-brand-400/10" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest-2 text-dark-500">
                Booking Bulan Ini
              </p>
              <p className="mt-2 font-display text-3xl font-light text-gradient-gold">{monthlyBookings}</p>
              <p className="mt-1 text-xs text-dark-500">
                {pendingRequests.length} request pending
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center border border-dark-700/20 bg-dark-800/40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-400/60" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden border border-dark-700/20 bg-dark-800/30 p-5 transition-all duration-500 hover:border-green-400/15">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/8 to-emerald-400/4 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-green-400 opacity-40" />
          <div className="absolute top-2 right-2 w-3 h-3 border-r border-t border-green-400/10" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest-2 text-dark-500">
                Pendapatan
              </p>
              <p className="mt-2 font-display text-3xl font-light text-gradient-gold">
                {earnings ? formatCurrency(earnings.totalEarnings + earnings.totalTips) : 'Rp 0'}
              </p>
              <p className="mt-1 text-xs text-dark-500">
                {earnings && earnings.pendingPayout > 0
                  ? `${formatCurrency(earnings.pendingPayout)} pending`
                  : 'Total keseluruhan'}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center border border-dark-700/20 bg-dark-800/40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400/60" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden border border-dark-700/20 bg-dark-800/30 p-5 transition-all duration-500 hover:border-yellow-400/15">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/8 to-orange-400/4 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-yellow-400 opacity-40" />
          <div className="absolute top-2 right-2 w-3 h-3 border-r border-t border-yellow-400/10" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest-2 text-dark-500">
                Rating
              </p>
              <p className="mt-2 font-display text-3xl font-light text-gradient-gold">
                {profile && profile.ratingAvg > 0
                  ? profile.ratingAvg.toFixed(1)
                  : '—'}
              </p>
              <p className="mt-1 text-xs text-dark-500">
                {profile && profile.totalReviews > 0
                  ? `${profile.totalReviews.toLocaleString('id-ID')} ulasan`
                  : 'Belum ada ulasan'}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center border border-dark-700/20 bg-dark-800/40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400/60" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden border border-dark-700/20 bg-dark-800/30 p-5 transition-all duration-500 hover:border-blue-400/15">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/8 to-indigo-400/4 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-400 opacity-40" />
          <div className="absolute top-2 right-2 w-3 h-3 border-r border-t border-blue-400/10" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest-2 text-dark-500">
                Total Booking
              </p>
              <p className="mt-2 font-display text-3xl font-light text-gradient-gold">
                {(profile?.totalBookings || 0).toLocaleString('id-ID')}
              </p>
              <p className="mt-1 text-xs text-dark-500">
                {(earnings?.completedBookings || 0).toLocaleString('id-ID')} selesai
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center border border-dark-700/20 bg-dark-800/40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400/60" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Left Column - Profile Completion + Quick Actions */}
        <div className="space-y-6 lg:col-span-1">
          {/* Profile Completion */}
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-dark-200">Kelengkapan Profil</h3>
                <span
                  className={`text-sm font-medium ${
                    completionPercent === 100 ? 'text-green-400' : completionPercent >= 50 ? 'text-brand-400' : 'text-red-400'
                  }`}
                >
                  {completionPercent}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-dark-700/50">
                <div
                  className={`h-full rounded-full transition-all ${
                    completionPercent === 100
                      ? 'bg-green-500'
                      : completionPercent >= 50
                      ? 'bg-brand-400'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <div className="mt-4 space-y-2.5">
                {profileChecks.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-dark-400">{item.label}</span>
                    {!item.done && item.link ? (
                      <Link href={item.link}>
                        <Badge variant="warning" size="sm" className="cursor-pointer hover:opacity-80">
                          Lengkapi →
                        </Badge>
                      </Link>
                    ) : (
                      <Badge variant={item.done ? 'success' : 'warning'} size="sm">
                        {item.done ? <Check className="h-3 w-3" /> : '—'}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              <Link href="/escort/profile">
                <Button variant="outline" size="sm" className="mt-4 w-full">
                  {completionPercent === 100 ? 'Lihat Profil' : 'Lengkapi Profil'}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent>
              <h3 className="text-sm font-medium text-dark-200">Aksi Cepat</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link href="/escort/calendar">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <Calendar className="h-4 w-4 inline-block" /> Jadwal
                  </Button>
                </Link>
                <Link href="/escort/earnings">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <DollarSign className="h-4 w-4 inline-block" /> Penarikan
                  </Button>
                </Link>
                <Link href="/escort/chat">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <MessageCircle className="h-4 w-4 inline-block" /> Pesan
                    {totalUnread > 0 && (
                      <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {totalUnread}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link href="/escort/reviews">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <Star className="h-4 w-4 inline-block" /> Ulasan
                  </Button>
                </Link>
                <Link href="/escort/requests">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <ClipboardList className="h-4 w-4 inline-block" /> Request
                  </Button>
                </Link>
                <Link href="/escort/profile">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <User className="h-4 w-4 inline-block" /> Profil
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Bookings */}
        <div className="space-y-6 lg:col-span-2">
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-dark-200">
                    Request Baru
                    <Badge variant="warning" size="sm" className="ml-2">
                      {pendingRequests.length}
                    </Badge>
                  </h3>
                  <Link href="/escort/requests">
                    <Button variant="ghost" size="sm">
                      Lihat Semua →
                    </Button>
                  </Link>
                </div>
                <div className="mt-4 space-y-3">
                  {pendingRequests.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {booking.client?.profilePhoto ? (
                            <img
                              src={booking.client.profilePhoto}
                              alt=""
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dark-700 text-sm font-medium text-dark-300">
                              {booking.client?.firstName?.[0] || '?'}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-dark-200">
                              {booking.client?.firstName} {booking.client?.lastName}
                            </p>
                            <p className="text-xs text-dark-500">
                              {booking.serviceType} • {formatDate(booking.startTime)}
                            </p>
                            {booking.location && (
                              <p className="mt-0.5 text-xs text-dark-600"><MapPin className="h-4 w-4 inline-block mr-1" /> {booking.location}</p>
                            )}
                            {booking.createdAt && (
                              <p className="mt-0.5 text-[10px] text-dark-600">
                                Diterima {getRelativeTime(booking.createdAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleAccept(booking.id)}
                            disabled={actionLoading === booking.id}
                            className="text-xs"
                          >
                            {actionLoading === booking.id ? '...' : <><Check className="h-4 w-4 inline-block" /> Terima</>}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(booking.id)}
                            disabled={actionLoading === booking.id}
                            className="text-xs text-red-400 border-red-500/20 hover:bg-red-500/10"
                          >
                            <X className="h-4 w-4 inline-block" /> Tolak
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Bookings */}
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-dark-200">Booking Mendatang</h3>
                <Link href="/escort/calendar">
                  <Button variant="ghost" size="sm">
                    Lihat Semua →
                  </Button>
                </Link>
              </div>
              <div className="mt-4">
                {upcomingBookings.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingBookings.map((booking) => (
                      <Link
                        key={booking.id}
                        href={`/escort/bookings/${booking.id}`}
                        className="block rounded-lg border border-dark-700/30 p-4 transition-colors hover:border-dark-600/50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {booking.client?.profilePhoto ? (
                              <img
                                src={booking.client.profilePhoto}
                                alt=""
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dark-700 text-sm font-medium text-dark-300">
                                {booking.client?.firstName?.[0] || '?'}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-dark-200">
                                {booking.client?.firstName} {booking.client?.lastName}
                              </p>
                              <p className="text-xs text-dark-500">
                                {booking.serviceType} • {formatDate(booking.startTime)}
                              </p>
                              {booking.location && (
                                <p className="mt-0.5 text-xs text-dark-600"><MapPin className="h-4 w-4 inline-block mr-1" /> {booking.location}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <Badge variant={getStatusColor(booking.status)} size="sm">
                              {getStatusLabel(booking.status)}
                            </Badge>
                            {booking.status === 'CONFIRMED' && (
                              <Button
                                size="sm"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCheckin(booking.id); }}
                                disabled={actionLoading === booking.id}
                                className="text-xs"
                              >
                                {actionLoading === booking.id ? '...' : <><MapPin className="h-4 w-4 inline-block" /> Check-in</>}
                              </Button>
                            )}
                            {booking.status === 'ONGOING' && (
                              <div className="flex gap-1.5">
                                <Link href={`/escort/chat/${booking.id}`}>
                                  <Button variant="outline" size="sm" className="text-xs">
                                    <MessageCircle className="h-4 w-4 inline-block" /> Chat
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCheckout(booking.id); }}
                                  disabled={actionLoading === booking.id}
                                  className="text-xs"
                                >
                                  {actionLoading === booking.id ? '...' : <><Check className="h-4 w-4 inline-block" /> Checkout</>}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-dark-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-dark-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm text-dark-500">Belum ada booking mendatang.</p>
                    <p className="mt-1 text-xs text-dark-600">
                      Lengkapi profil agar client menemukan Anda.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Earnings Summary */}
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-dark-200">Ringkasan Pendapatan</h3>
                <Link href="/escort/earnings">
                  <Button variant="ghost" size="sm">
                    Detail →
                  </Button>
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Total Pendapatan', value: earnings ? formatCurrency(earnings.totalEarnings) : 'Rp 0', color: 'text-dark-200', accent: 'from-brand-400/15' },
                  { label: 'Tips', value: earnings ? formatCurrency(earnings.totalTips) : 'Rp 0', color: 'text-dark-200', accent: 'from-violet-400/15' },
                  { label: 'Pending', value: earnings ? formatCurrency(earnings.pendingPayout) : 'Rp 0', color: 'text-yellow-400', accent: 'from-yellow-400/15' },
                  { label: 'Dicairkan', value: earnings ? formatCurrency(earnings.releasedPayout) : 'Rp 0', color: 'text-green-400', accent: 'from-green-400/15' },
                ].map((item) => (
                  <div key={item.label} className="relative overflow-hidden border border-dark-700/15 bg-dark-800/50 p-3 text-center">
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.accent} to-transparent opacity-30`} />
                    <div className="relative">
                      <p className="text-[10px] uppercase tracking-widest text-dark-500">{item.label}</p>
                      <p className={`mt-1 text-sm font-medium ${item.color}`}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tips for New Partners */}
      {completionPercent < 100 && (
        <Card className="mt-8" variant="outline">
          <CardContent>
            <h3 className="text-sm font-medium text-dark-200"><Lightbulb className="h-4 w-4 inline-block mr-1" /> Tips untuk Meningkatkan Profil</h3>
            <ul className="mt-3 space-y-2">
              {[
                ...(user?.profilePhoto
                  ? []
                  : ['Upload foto profil profesional berkualitas tinggi']),
                ...(profile?.bio
                  ? []
                  : ['Tulis bio yang menarik dan detail tentang layanan Anda']),
                ...(profile?.skills?.length
                  ? []
                  : ['Tambahkan spesialisasi/skill yang Anda kuasai']),
                ...(profile?.hourlyRate && profile.hourlyRate > 0
                  ? []
                  : ['Set tarif per jam yang kompetitif']),
                ...(profile?.availabilitySchedule
                  ? []
                  : ['Atur jadwal ketersediaan secara teratur']),
                ...(profile?.certifications?.length
                  ? []
                  : ['Upload sertifikasi untuk meningkatkan kepercayaan client']),
                'Respon booking dalam waktu maksimal 30 menit untuk rating lebih tinggi',
                'Jaga rating di atas 4.5 untuk maintain tier Anda',
              ]
                .slice(0, 5)
                .map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-dark-400">
                    <span className="mt-0.5 text-brand-400">▸</span>
                    {tip}
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
