'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import api from '@/lib/api';
import { AlertTriangle, Check, CheckCircle2, CircleDot, Clock, Map, MapPin, MessageCircle, Phone, ShieldAlert, Star, Timer } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import Link from 'next/link';

interface LocationPoint {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

interface TimelineEvent {
  time: string;
  event: string;
  type: string;
}

interface BookingDetail {
  id: string;
  status: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  location: string;
  locationLat: number | null;
  locationLng: number | null;
  specialRequests: string | null;
  totalAmount: number;
  checkinAt: string | null;
  checkoutAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  createdAt: string;
  client: {
    id: string; firstName: string; lastName: string; email: string; phone: string | null;
    profilePhoto: string | null; role: string; createdAt: string;
  };
  escort: {
    id: string; firstName: string; lastName: string; email: string; phone: string | null;
    profilePhoto: string | null; role: string; createdAt: string;
    escortProfile: {
      tier: string; hourlyRate: number; ratingAvg: number;
      totalBookings: number; totalReviews: number; isApproved: boolean;
    } | null;
  };
  payment: {
    id: string; status: string; amount: number; platformFee: number;
    escortPayout: number; tipAmount: number | null; method: string;
    paidAt: string | null; releasedAt: string | null; refundedAt: string | null;
  } | null;
  reviews: { id: string; rating: number; comment: string; reviewer: { firstName: string; lastName: string } }[];
  incidents: {
    id: string; type: string; description: string; severity: number;
    resolutionStatus: string; adminNotes: string | null; resolvedAt: string | null;
    createdAt: string; reporter: { firstName: string; lastName: string };
  }[];
  messages: { id: string; senderId: string; content: string; type: string; readAt: string | null; createdAt: string }[];
  tracking: {
    clientLocation: LocationPoint | null;
    escortLocation: LocationPoint | null;
    clientHistory: LocationPoint[];
    escortHistory: LocationPoint[];
    distanceBetween: number | null;
    bookingLocation: { lat: number | null; lng: number | null; address: string };
  };
  lateStatus: { type: string; minutes: number; severity: string } | null;
  timeline: TimelineEvent[];
}

const REFRESH_INTERVAL = 10000;

export default function MonitoringDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;

  const [data, setData] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'chat' | 'incidents' | 'timeline'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await api.get(`/admin/bookings/${bookingId}/monitor`);
      const d = res.data?.data || res.data;
      setData(d);
      setLastRefresh(new Date());
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat data booking');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (autoRefresh && (activeTab === 'overview' || activeTab === 'map')) {
      intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, activeTab, fetchData]);

  useEffect(() => {
    if (activeTab === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTab, data?.messages]);

  const resolveIncident = async (incidentId: string) => {
    if (!resolveNotes.trim()) return;
    try {
      await api.patch(`/admin/incidents/${incidentId}/resolve`, { adminNotes: resolveNotes });
      setResolveId(null);
      setResolveNotes('');
      fetchData();
    } catch {}
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-dark-800/30" />)}
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-red-400">{error || 'Data tidak ditemukan'}</p>
          <button onClick={() => router.push('/monitoring')} className="mt-4 text-sm text-brand-400">← Kembali</button>
        </div>
      </AdminLayout>
    );
  }

  const formatDate = (d: string) => new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatCurrency = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;
  const isActive = ['CONFIRMED', 'ONGOING'].includes(data.status);

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-500/20 text-amber-400', CONFIRMED: 'bg-blue-500/20 text-blue-400',
    ONGOING: 'bg-emerald-500/20 text-emerald-400', COMPLETED: 'bg-green-500/20 text-green-400',
    CANCELLED: 'bg-red-500/20 text-red-400', DISPUTED: 'bg-orange-500/20 text-orange-400',
  };

  const getLocationAge = (ts: number | undefined) => {
    if (!ts) return 'N/A';
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return `${sec}d lalu`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m lalu`;
    return `${Math.floor(sec / 3600)}j lalu`;
  };

  const timelineTypeColor = (type: string) => {
    switch (type) {
      case 'CRITICAL': return 'border-red-500 bg-red-500';
      case 'DANGER': return 'border-red-500 bg-red-400';
      case 'WARNING': return 'border-amber-500 bg-amber-400';
      case 'SUCCESS': return 'border-emerald-500 bg-emerald-400';
      default: return 'border-blue-500 bg-blue-400';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/monitoring')} className="rounded-lg border border-dark-700 p-2 text-dark-400 hover:text-dark-200">
              ←
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-light tracking-wide text-dark-100">Detail Monitoring</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[data.status] || ''}`}>
                  {data.status}
                </span>
                {data.lateStatus && (
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    data.lateStatus.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {data.lateStatus.type === 'LATE_CHECKIN' ? <><Clock className="h-3 w-3 inline-block" /> Terlambat</> : <><Timer className="h-3 w-3 inline-block" /> Overtime</>} {data.lateStatus.minutes}m
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-dark-500">#{data.id} · {data.serviceType} · {formatDate(data.startTime)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isActive && (
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                  autoRefresh ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-dark-800/50 text-dark-400 border border-dark-700'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${autoRefresh ? 'animate-pulse bg-emerald-400' : 'bg-dark-500'}`} />
                {autoRefresh ? 'LIVE' : 'PAUSED'}
              </button>
            )}
            <span className="text-2xs text-dark-500">{lastRefresh.toLocaleTimeString('id-ID')}</span>
          </div>
        </div>

        {/* SOS Banner */}
        {data.incidents.some(i => i.type === 'SOS' && i.resolutionStatus === 'OPEN') && (
          <div className="rounded-xl border-2 border-red-500/50 bg-red-500/10 p-4 text-center animate-pulse">
            <p className="text-lg font-medium text-red-400"><ShieldAlert className="h-5 w-5 inline-block mr-1" /> SOS ALERT AKTIF — Segera Tindak Lanjuti!</p>
            <p className="mt-1 text-sm text-red-400/70">
              Dilaporkan oleh: {data.incidents.find(i => i.type === 'SOS')?.reporter?.firstName}
            </p>
          </div>
        )}

        {/* Participant Cards */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Client */}
          <div className="rounded-xl border border-dark-700/50 bg-dark-800/30 p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-xl bg-dark-700">
                {data.client.profilePhoto ? (
                  <img src={data.client.profilePhoto} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-medium text-dark-400">{data.client.firstName[0]}</div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-dark-100">{data.client.firstName} {data.client.lastName}</p>
                  <span className="rounded bg-dark-700/50 px-1.5 py-0.5 text-2xs text-dark-400">CLIENT</span>
                </div>
                <p className="text-xs text-dark-400">{data.client.email}</p>
                {data.client.phone && <p className="text-xs text-dark-400"><Phone className="h-3 w-3 inline-block mr-0.5" /> {data.client.phone}</p>}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${data.tracking.clientLocation ? 'bg-emerald-400' : 'bg-dark-600'}`} />
                  <span className="text-xs text-dark-400">{data.tracking.clientLocation ? getLocationAge(data.tracking.clientLocation.timestamp) : 'Offline'}</span>
                </div>
                {data.tracking.clientLocation && (
                  <p className="mt-1 text-2xs text-dark-500">{data.tracking.clientLocation.lat.toFixed(4)}, {data.tracking.clientLocation.lng.toFixed(4)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Escort */}
          <div className="rounded-xl border border-dark-700/50 bg-dark-800/30 p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-xl bg-dark-700">
                {data.escort.profilePhoto ? (
                  <img src={data.escort.profilePhoto} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-medium text-dark-400">{data.escort.firstName[0]}</div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-dark-100">{data.escort.firstName} {data.escort.lastName}</p>
                  <span className="rounded bg-brand-400/10 px-1.5 py-0.5 text-2xs text-brand-400">ESCORT</span>
                  {data.escort.escortProfile && (
                    <span className="rounded bg-dark-700/50 px-1.5 py-0.5 text-2xs text-dark-400">{data.escort.escortProfile.tier}</span>
                  )}
                </div>
                <p className="text-xs text-dark-400">{data.escort.email}</p>
                {data.escort.phone && <p className="text-xs text-dark-400"><Phone className="h-3 w-3 inline-block mr-0.5" /> {data.escort.phone}</p>}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${data.tracking.escortLocation ? 'bg-emerald-400' : 'bg-dark-600'}`} />
                  <span className="text-xs text-dark-400">{data.tracking.escortLocation ? getLocationAge(data.tracking.escortLocation.timestamp) : 'Offline'}</span>
                </div>
                {data.escort.escortProfile && (
                  <p className="mt-1 text-2xs text-dark-500"><Star className="h-3 w-3 inline-block fill-current text-amber-400" /> {Number(data.escort.escortProfile.ratingAvg).toFixed(1)} · {data.escort.escortProfile.totalBookings} booking</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Distance Indicator */}
        {isActive && (
          <div className="flex items-center justify-center gap-4 rounded-xl border border-dark-700/50 bg-dark-800/20 p-3">
            <span className="text-xs text-dark-400">Jarak Antar Peserta:</span>
            {data.tracking.distanceBetween != null ? (
              <span className={`text-lg font-light ${
                data.tracking.distanceBetween < 1 ? 'text-emerald-400' :
                data.tracking.distanceBetween < 5 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {data.tracking.distanceBetween < 1
                  ? `${Math.round(data.tracking.distanceBetween * 1000)} meter`
                  : `${data.tracking.distanceBetween.toFixed(1)} km`
                }
              </span>
            ) : (
              <span className="text-dark-500">Data lokasi belum tersedia</span>
            )}
            {data.tracking.distanceBetween != null && data.tracking.distanceBetween < 0.1 && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400"><Check className="h-3 w-3 inline-block" /> Di lokasi yang sama</span>
            )}
            {data.tracking.distanceBetween != null && data.tracking.distanceBetween > 5 && (
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400"><AlertTriangle className="h-3 w-3 inline-block" /> Terlalu jauh</span>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-dark-800/50 p-1">
          {(
            [
              { key: 'overview', label: 'Ringkasan', icon: 'LayoutDashboard' },
              { key: 'map', label: 'Peta & Lokasi', icon: 'MapPin' },
              { key: 'chat', label: `Chat (${data.messages.length})`, icon: 'MessageCircle' },
              { key: 'incidents', label: `Insiden (${data.incidents.length})`, icon: 'AlertTriangle' },
              { key: 'timeline', label: 'Timeline', icon: 'Clock' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 flex-1 justify-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-dark-700 text-dark-100 shadow-sm' : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              <Icon name={tab.icon} className="h-3.5 w-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        {/* === OVERVIEW TAB === */}
        {activeTab === 'overview' && (
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Booking Details */}
            <div className="rounded-xl border border-dark-700/50 bg-dark-800/20 p-5">
              <h3 className="text-sm font-medium text-dark-200 mb-3">Detail Booking</h3>
              <div className="space-y-2.5 text-sm">
                {[
                  { label: 'Tipe Layanan', value: data.serviceType },
                  { label: 'Lokasi', value: data.location || '-' },
                  { label: 'Koordinat', value: data.locationLat ? `${data.locationLat.toFixed(5)}, ${data.locationLng?.toFixed(5)}` : '-' },
                  { label: 'Mulai', value: formatDate(data.startTime) },
                  { label: 'Selesai', value: formatDate(data.endTime) },
                  { label: 'Durasi', value: `${Math.round((new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / 3600000)} jam` },
                  { label: 'Check-in', value: data.checkinAt ? formatDate(data.checkinAt) : '—' },
                  { label: 'Check-out', value: data.checkoutAt ? formatDate(data.checkoutAt) : '—' },
                  { label: 'Request Khusus', value: data.specialRequests || '—' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-dark-400">{row.label}</span>
                    <span className="text-dark-200 text-right max-w-[60%]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Details */}
            <div className="rounded-xl border border-dark-700/50 bg-dark-800/20 p-5">
              <h3 className="text-sm font-medium text-dark-200 mb-3">Detail Pembayaran</h3>
              {data.payment ? (
                <div className="space-y-2.5 text-sm">
                  {[
                    { label: 'Status', value: data.payment.status, highlight: true },
                    { label: 'Total', value: formatCurrency(data.payment.amount) },
                    { label: 'Platform Fee (20%)', value: formatCurrency(data.payment.platformFee) },
                    { label: 'Escort Payout', value: formatCurrency(data.payment.escortPayout) },
                    { label: 'Tip', value: data.payment.tipAmount ? formatCurrency(data.payment.tipAmount) : '—' },
                    { label: 'Metode', value: data.payment.method },
                    { label: 'Dibayar', value: data.payment.paidAt ? formatDate(data.payment.paidAt) : '—' },
                    { label: 'Dirilis', value: data.payment.releasedAt ? formatDate(data.payment.releasedAt) : '—' },
                    { label: 'Refund', value: data.payment.refundedAt ? formatDate(data.payment.refundedAt) : '—' },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between">
                      <span className="text-dark-400">{row.label}</span>
                      <span className={row.highlight ? `rounded-full px-2 py-0.5 text-xs ${
                        row.value === 'ESCROW' ? 'bg-emerald-500/10 text-emerald-400' :
                        row.value === 'RELEASED' ? 'bg-green-500/10 text-green-400' :
                        row.value === 'REFUNDED' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-dark-700/50 text-dark-400'
                      }` : 'text-dark-200'}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-dark-500">Belum ada data pembayaran</p>
              )}
            </div>

            {/* Reviews */}
            {data.reviews.length > 0 && (
              <div className="lg:col-span-2 rounded-xl border border-dark-700/50 bg-dark-800/20 p-5">
                <h3 className="text-sm font-medium text-dark-200 mb-3">Review</h3>
                <div className="space-y-3">
                  {data.reviews.map((rev) => (
                    <div key={rev.id} className="rounded-lg bg-dark-800/50 p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 flex items-center gap-0.5">{Array.from({length: rev.rating}).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}{Array.from({length: 5 - rev.rating}).map((_, i) => <Star key={`e${i}`} className="h-3.5 w-3.5" />)}</span>
                        <span className="text-xs text-dark-400">oleh {rev.reviewer.firstName} {rev.reviewer.lastName}</span>
                      </div>
                      {rev.comment && <p className="mt-1 text-sm text-dark-300">{rev.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancellation */}
            {data.cancelledAt && (
              <div className="lg:col-span-2 rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                <h3 className="text-sm font-medium text-red-400 mb-2">Pembatalan</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-dark-300">Dibatalkan: {formatDate(data.cancelledAt)}</p>
                  <p className="text-dark-300">Oleh: {data.cancelledBy || '-'}</p>
                  <p className="text-dark-300">Alasan: {data.cancelReason || '-'}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === MAP TAB === */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            {/* Map Container */}
            <div className="rounded-xl border border-dark-700/50 bg-dark-800/20 overflow-hidden">
              <div className="relative h-[480px] bg-dark-900">
                {(data.tracking.bookingLocation.lat && data.tracking.bookingLocation.lng) || data.tracking.clientLocation || data.tracking.escortLocation ? (
                  <iframe
                    className="h-full w-full border-0"
                    src={(() => {
                      // Use OpenStreetMap embed centered on booking or participant location
                      const lat = data.tracking.clientLocation?.lat || data.tracking.escortLocation?.lat || data.tracking.bookingLocation.lat || -6.2;
                      const lng = data.tracking.clientLocation?.lng || data.tracking.escortLocation?.lng || data.tracking.bookingLocation.lng || 106.8;
                      const markers: string[] = [];
                      if (data.tracking.bookingLocation.lat && data.tracking.bookingLocation.lng) {
                        markers.push(`${data.tracking.bookingLocation.lat},${data.tracking.bookingLocation.lng},Lokasi Booking`);
                      }
                      if (data.tracking.clientLocation) {
                        markers.push(`${data.tracking.clientLocation.lat},${data.tracking.clientLocation.lng},Client`);
                      }
                      if (data.tracking.escortLocation) {
                        markers.push(`${data.tracking.escortLocation.lat},${data.tracking.escortLocation.lng},Escort`);
                      }
                      return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02}%2C${lat - 0.015}%2C${lng + 0.02}%2C${lat + 0.015}&layer=mapnik&marker=${lat}%2C${lng}`;
                    })()}
                    title="Tracking Map"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-dark-500">
                    <div className="text-center">
                      <Map className="h-10 w-10 text-dark-500 mb-3" />
                      <p>Data lokasi belum tersedia</p>
                      <p className="text-xs mt-1">Peserta belum mengirimkan lokasi GPS mereka</p>
                    </div>
                  </div>
                )}

                {/* Map Overlay - Location Info */}
                <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                  {data.tracking.bookingLocation.lat && (
                    <div className="rounded-lg bg-dark-900/90 backdrop-blur-sm px-3 py-2 text-xs">
                      <span className="text-dark-400"><MapPin className="h-3 w-3 inline-block" /> Titik Temu: </span>
                      <span className="text-dark-200">{data.tracking.bookingLocation.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Location Details Grid */}
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Booking Location */}
              <div className="rounded-xl border border-dark-700/50 bg-dark-800/20 p-4">
                <h4 className="text-xs font-medium uppercase tracking-wider text-dark-400 mb-3"><MapPin className="h-3 w-3 inline-block" /> Lokasi Booking</h4>
                <p className="text-sm text-dark-200">{data.tracking.bookingLocation.address || '-'}</p>
                {data.tracking.bookingLocation.lat && (
                  <p className="mt-1 text-xs text-dark-500">
                    {data.tracking.bookingLocation.lat.toFixed(6)}, {data.tracking.bookingLocation.lng?.toFixed(6)}
                  </p>
                )}
              </div>

              {/* Client Location */}
              <div className={`rounded-xl border p-4 ${
                data.tracking.clientLocation ? 'border-blue-500/30 bg-blue-500/5' : 'border-dark-700/50 bg-dark-800/20'
              }`}>
                <h4 className="text-xs font-medium uppercase tracking-wider text-dark-400 mb-3"><CircleDot className="h-3 w-3 inline-block text-blue-400" /> Lokasi Client</h4>
                {data.tracking.clientLocation ? (
                  <>
                    <p className="text-sm text-dark-200">
                      {data.tracking.clientLocation.lat.toFixed(6)}, {data.tracking.clientLocation.lng.toFixed(6)}
                    </p>
                    <p className="mt-1 text-xs text-dark-500">
                      Akurasi: {data.tracking.clientLocation.accuracy ? `${Math.round(data.tracking.clientLocation.accuracy)}m` : 'N/A'}
                    </p>
                    <p className="text-xs text-dark-500">Update: {getLocationAge(data.tracking.clientLocation.timestamp)}</p>
                    <p className="mt-1 text-xs text-dark-500">Riwayat: {data.tracking.clientHistory.length} titik</p>
                  </>
                ) : (
                  <p className="text-sm text-dark-500">Offline / belum mengirim lokasi</p>
                )}
              </div>

              {/* Escort Location */}
              <div className={`rounded-xl border p-4 ${
                data.tracking.escortLocation ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-dark-700/50 bg-dark-800/20'
              }`}>
                <h4 className="text-xs font-medium uppercase tracking-wider text-dark-400 mb-3"><CircleDot className="h-3 w-3 inline-block text-emerald-400" /> Lokasi Escort</h4>
                {data.tracking.escortLocation ? (
                  <>
                    <p className="text-sm text-dark-200">
                      {data.tracking.escortLocation.lat.toFixed(6)}, {data.tracking.escortLocation.lng.toFixed(6)}
                    </p>
                    <p className="mt-1 text-xs text-dark-500">
                      Akurasi: {data.tracking.escortLocation.accuracy ? `${Math.round(data.tracking.escortLocation.accuracy)}m` : 'N/A'}
                    </p>
                    <p className="text-xs text-dark-500">Update: {getLocationAge(data.tracking.escortLocation.timestamp)}</p>
                    <p className="mt-1 text-xs text-dark-500">Riwayat: {data.tracking.escortHistory.length} titik</p>
                  </>
                ) : (
                  <p className="text-sm text-dark-500">Offline / belum mengirim lokasi</p>
                )}
              </div>
            </div>

            {/* Location History */}
            {(data.tracking.clientHistory.length > 0 || data.tracking.escortHistory.length > 0) && (
              <div className="rounded-xl border border-dark-700/50 bg-dark-800/20 p-5">
                <h3 className="text-sm font-medium text-dark-200 mb-3">Riwayat Pergerakan</h3>
                <div className="grid gap-4 lg:grid-cols-2">
                  {[
                    { label: 'Client', history: data.tracking.clientHistory, color: 'blue' },
                    { label: 'Escort', history: data.tracking.escortHistory, color: 'emerald' },
                  ].map((side) => (
                    <div key={side.label}>
                      <h4 className={`text-xs font-medium text-${side.color}-400 mb-2`}>{side.label} ({side.history.length} titik)</h4>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {side.history.slice(0, 20).map((loc, i) => (
                          <div key={i} className="flex items-center gap-2 text-2xs text-dark-400">
                            <span className={`h-1.5 w-1.5 rounded-full bg-${side.color}-400`} />
                            <span>{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</span>
                            <span className="text-dark-600">|</span>
                            <span>{new Date(loc.timestamp).toLocaleTimeString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === CHAT TAB === */}
        {activeTab === 'chat' && (
          <div className="rounded-xl border border-dark-700/50 bg-dark-800/20 overflow-hidden">
            <div className="border-b border-dark-700/50 px-5 py-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-dark-200">Riwayat Chat</h3>
              <span className="text-xs text-dark-500">{data.messages.length} pesan</span>
            </div>
            <div className="max-h-[600px] overflow-y-auto p-5 space-y-3">
              {data.messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-dark-500">Belum ada percakapan</p>
              ) : (
                data.messages.map((msg) => {
                  const isClient = msg.senderId === data.client.id;
                  const senderName = isClient ? data.client.firstName : data.escort.firstName;
                  return (
                    <div key={msg.id} className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[65%] rounded-xl px-4 py-2.5 ${
                        msg.type === 'SYSTEM'
                          ? 'bg-dark-700/30 text-dark-400 text-center mx-auto text-xs'
                          : isClient
                          ? 'bg-dark-700/50 text-dark-200'
                          : 'bg-brand-400/10 text-dark-200'
                      }`}>
                        {msg.type !== 'SYSTEM' && (
                          <p className={`text-2xs font-medium mb-0.5 ${isClient ? 'text-blue-400' : 'text-brand-400'}`}>
                            {senderName} ({isClient ? 'Client' : 'Escort'})
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <span className="text-2xs text-dark-500">
                            {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.readAt && <span className="text-2xs text-emerald-500"><Check className="h-2.5 w-2.5 inline-block" /><Check className="h-2.5 w-2.5 inline-block -ml-1" /></span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
        )}

        {/* === INCIDENTS TAB === */}
        {activeTab === 'incidents' && (
          <div className="space-y-4">
            {data.incidents.length === 0 ? (
              <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-12 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                <p className="mt-3 text-dark-400">Tidak ada insiden dilaporkan</p>
              </div>
            ) : (
              data.incidents.map((inc) => (
                <div
                  key={inc.id}
                  className={`rounded-xl border p-5 ${
                    inc.type === 'SOS' && inc.resolutionStatus === 'OPEN'
                      ? 'border-red-500/50 bg-red-500/5'
                      : inc.resolutionStatus === 'OPEN'
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-dark-700/50 bg-dark-800/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          inc.type === 'SOS' ? 'bg-red-500/20 text-red-400' :
                          inc.type === 'COMPLAINT' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {inc.type}
                        </span>
                        <span className="text-xs text-dark-400">Severity: {inc.severity}/5</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                          inc.resolutionStatus === 'OPEN' ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'
                        }`}>
                          {inc.resolutionStatus}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-dark-200">{inc.description}</p>
                      <p className="mt-1 text-xs text-dark-500">
                        Oleh: {inc.reporter.firstName} {inc.reporter.lastName} · {formatDate(inc.createdAt)}
                      </p>
                      {inc.adminNotes && (
                        <div className="mt-2 rounded-lg bg-dark-800/50 p-2">
                          <p className="text-xs text-dark-400">Admin: {inc.adminNotes}</p>
                          {inc.resolvedAt && <p className="text-2xs text-dark-500 mt-0.5">Resolved: {formatDate(inc.resolvedAt)}</p>}
                        </div>
                      )}
                    </div>

                    {inc.resolutionStatus === 'OPEN' && (
                      <div>
                        {resolveId === inc.id ? (
                          <div className="flex flex-col gap-2 ml-4">
                            <textarea
                              value={resolveNotes}
                              onChange={(e) => setResolveNotes(e.target.value)}
                              placeholder="Catatan resolusi..."
                              className="w-60 rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-xs text-dark-200 placeholder-dark-500 focus:border-brand-400/50 focus:outline-none"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => resolveIncident(inc.id)}
                                className="flex-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/30"
                              >
                                Resolve
                              </button>
                              <button
                                onClick={() => { setResolveId(null); setResolveNotes(''); }}
                                className="rounded-lg bg-dark-700/50 px-3 py-1.5 text-xs text-dark-400 hover:text-dark-200"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setResolveId(inc.id)}
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/20"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* === TIMELINE TAB === */}
        {activeTab === 'timeline' && (
          <div className="rounded-xl border border-dark-700/50 bg-dark-800/20 p-5">
            <h3 className="text-sm font-medium text-dark-200 mb-5">Kronologi Booking</h3>
            <div className="relative pl-6">
              {/* Vertical Line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-dark-700/50" />
              
              <div className="space-y-4">
                {data.timeline.map((event, i) => (
                  <div key={i} className="relative flex gap-3">
                    {/* Dot */}
                    <div className={`absolute -left-[17px] top-1.5 h-3 w-3 rounded-full border-2 ${timelineTypeColor(event.type)}`} />
                    <div className="flex-1">
                      <p className="text-sm text-dark-200">{event.event}</p>
                      <p className="text-xs text-dark-500">{formatDate(event.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
