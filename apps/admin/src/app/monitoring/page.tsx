'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '@/components/admin-layout';
import api from '@/lib/api';
import Link from 'next/link';
import { AlertTriangle, ArrowLeftRight, Calendar, Clock, DollarSign, MapPin, Monitor, Radio, ShieldAlert, Timer } from 'lucide-react';
import { Icon } from '@/components/ui/icon';

interface TrackingData {
  clientLocation: { lat: number; lng: number; accuracy?: number; timestamp: number } | null;
  escortLocation: { lat: number; lng: number; accuracy?: number; timestamp: number } | null;
  distanceBetween: number | null;
  clientGeofence: number | null;
  escortGeofence: number | null;
}

interface AlertData {
  lateStatus: { type: string; minutes: number; severity: string } | null;
  hasOpenIncidents: boolean;
  hasSOS: boolean;
  geofenceBreach: boolean;
}

interface ActiveBooking {
  id: string;
  status: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  location: string;
  locationLat: number | null;
  locationLng: number | null;
  checkinAt: string | null;
  checkoutAt: string | null;
  totalAmount: number;
  client: { id: string; firstName: string; lastName: string; profilePhoto: string | null; phone: string | null };
  escort: { id: string; firstName: string; lastName: string; profilePhoto: string | null; phone: string | null };
  payment: { status: string; amount: number; platformFee: number; escortPayout: number } | null;
  incidents: { id: string; type: string; severity: number; createdAt: string }[];
  tracking: TrackingData;
  alerts: AlertData;
}

interface MonitorSummary {
  total: number;
  ongoing: number;
  confirmed: number;
  withAlerts: number;
  withSOS: number;
}

const REFRESH_INTERVAL = 15000; // 15 seconds

export default function MonitoringPage() {
  const [bookings, setBookings] = useState<ActiveBooking[]>([]);
  const [summary, setSummary] = useState<MonitorSummary>({ total: 0, ongoing: 0, confirmed: 0, withAlerts: 0, withSOS: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ALERTS' | 'SOS' | 'ONGOING' | 'CONFIRMED'>('ALL');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/bookings/monitor');
      const d = data?.data || data;
      setBookings(d.data || []);
      setSummary(d.summary || { total: 0, ongoing: 0, confirmed: 0, withAlerts: 0, withSOS: 0 });
      setLastRefresh(new Date());
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat data monitoring');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchData]);

  const filtered = bookings.filter((b) => {
    if (filter === 'ALL') return true;
    if (filter === 'ALERTS') return b.alerts.hasOpenIncidents || b.alerts.lateStatus || b.alerts.geofenceBreach;
    if (filter === 'SOS') return b.alerts.hasSOS;
    if (filter === 'ONGOING') return b.status === 'ONGOING';
    if (filter === 'CONFIRMED') return b.status === 'CONFIRMED';
    return true;
  });

  const formatTime = (d: string) => new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const formatCurrency = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'WARNING': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getDistanceLabel = (km: number | null) => {
    if (km == null) return { text: 'N/A', color: 'text-dark-500' };
    if (km < 0.1) return { text: `${Math.round(km * 1000)}m`, color: 'text-emerald-400' };
    if (km < 1) return { text: `${Math.round(km * 1000)}m`, color: 'text-emerald-400' };
    if (km < 5) return { text: `${km.toFixed(1)}km`, color: 'text-amber-400' };
    return { text: `${km.toFixed(1)}km`, color: 'text-red-400' };
  };

  const getLocationAge = (timestamp: number | undefined) => {
    if (!timestamp) return 'offline';
    const ageSec = Math.floor((Date.now() - timestamp) / 1000);
    if (ageSec < 60) return `${ageSec}d lalu`;
    if (ageSec < 3600) return `${Math.floor(ageSec / 60)}m lalu`;
    return `${Math.floor(ageSec / 3600)}j lalu`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-wide text-dark-100">
              <span className="mr-2"><Monitor className="h-5 w-5 inline-block" /></span>Monitoring Kegiatan
            </h1>
            <p className="mt-1 text-sm text-dark-400">
              Pemantauan real-time booking aktif, lokasi, dan insiden
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                autoRefresh
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-dark-800/50 text-dark-400 border border-dark-700'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${autoRefresh ? 'animate-pulse bg-emerald-400' : 'bg-dark-500'}`} />
              {autoRefresh ? 'LIVE' : 'PAUSED'}
            </button>
            <button
              onClick={fetchData}
              className="rounded-lg border border-dark-700 bg-dark-800/50 px-3 py-2 text-xs text-dark-300 transition-colors hover:text-dark-100"
            >
              ↻ Refresh
            </button>
            <span className="text-2xs text-dark-500">
              Update: {lastRefresh.toLocaleTimeString('id-ID')}
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {/* Summary Cards */}
        <div className="grid gap-3 sm:grid-cols-5">
          {[
            { label: 'Total Aktif', value: summary.total, color: 'text-dark-100', icon: 'Radio' },
            { label: 'Berlangsung', value: summary.ongoing, color: 'text-emerald-400', icon: 'CircleDot' },
            { label: 'Dikonfirmasi', value: summary.confirmed, color: 'text-blue-400', icon: 'CheckCircle2' },
            { label: 'Peringatan', value: summary.withAlerts, color: 'text-amber-400', icon: 'AlertTriangle' },
            { label: 'SOS Aktif', value: summary.withSOS, color: 'text-red-400', icon: 'ShieldAlert' },
          ].map((card) => (
            <div
              key={card.label}
              className={`rounded-xl border ${card.value > 0 && card.label === 'SOS Aktif' ? 'border-red-500/50 bg-red-500/5 animate-pulse' : 'border-dark-700/50 bg-dark-800/40'} p-4`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm"><Icon name={card.icon} className="h-4 w-4" /></span>
                <span className="text-2xs font-medium uppercase tracking-wider text-dark-400">{card.label}</span>
              </div>
              <p className={`mt-1 text-2xl font-light ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(
            [
              { key: 'ALL', label: 'Semua' },
              { key: 'ONGOING', label: 'Berlangsung' },
              { key: 'CONFIRMED', label: 'Dikonfirmasi' },
              { key: 'ALERTS', label: 'Peringatan' },
              { key: 'SOS', label: 'SOS' },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                filter === f.key
                  ? 'bg-brand-400/20 text-brand-400'
                  : 'bg-dark-800/50 text-dark-400 hover:text-dark-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Booking Cards */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-dark-800/30" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-16 text-center">
            <span className="text-4xl"><Radio className="h-10 w-10 mx-auto text-dark-500" /></span>
            <p className="mt-3 text-dark-400">Tidak ada booking aktif{filter !== 'ALL' ? ' dengan filter ini' : ''}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((booking) => {
              const dist = getDistanceLabel(booking.tracking.distanceBetween);
              const hasAlert = booking.alerts.hasOpenIncidents || booking.alerts.lateStatus || booking.alerts.geofenceBreach;
              const isSOS = booking.alerts.hasSOS;

              return (
                <Link
                  key={booking.id}
                  href={`/monitoring/${booking.id}`}
                  className={`block rounded-xl border p-5 transition-all hover:border-dark-600/50 ${
                    isSOS
                      ? 'border-red-500/50 bg-red-500/5'
                      : hasAlert
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-dark-700/50 bg-dark-800/20'
                  }`}
                >
                  <div className="flex items-start gap-5">
                    {/* Status Indicator */}
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <span className={`h-3 w-3 rounded-full ${
                        isSOS ? 'animate-ping bg-red-400' :
                        booking.status === 'ONGOING' ? 'animate-pulse bg-emerald-400' : 'bg-blue-400'
                      }`} />
                      <span className="text-2xs text-dark-500">{booking.status}</span>
                    </div>

                    {/* Participants */}
                    <div className="flex-1">
                      <div className="flex items-center gap-6">
                        {/* Client */}
                        <div className="flex items-center gap-2">
                          <div className="h-9 w-9 overflow-hidden rounded-lg bg-dark-700">
                            {booking.client.profilePhoto ? (
                              <img src={booking.client.profilePhoto} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-medium text-dark-400">
                                {booking.client.firstName[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-dark-200">{booking.client.firstName} {booking.client.lastName}</p>
                            <div className="flex items-center gap-1">
                              <span className={`h-1.5 w-1.5 rounded-full ${booking.tracking.clientLocation ? 'bg-emerald-400' : 'bg-dark-600'}`} />
                              <span className="text-2xs text-dark-500">
                                {booking.tracking.clientLocation ? getLocationAge(booking.tracking.clientLocation.timestamp) : 'offline'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Distance */}
                        <div className="flex flex-col items-center">
                          <span className="text-dark-600"><ArrowLeftRight className="h-3.5 w-3.5" /></span>
                          <span className={`text-xs font-medium ${dist.color}`}>{dist.text}</span>
                        </div>

                        {/* Escort */}
                        <div className="flex items-center gap-2">
                          <div className="h-9 w-9 overflow-hidden rounded-lg bg-dark-700">
                            {booking.escort.profilePhoto ? (
                              <img src={booking.escort.profilePhoto} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-medium text-dark-400">
                                {booking.escort.firstName[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-dark-200">{booking.escort.firstName} {booking.escort.lastName}</p>
                            <div className="flex items-center gap-1">
                              <span className={`h-1.5 w-1.5 rounded-full ${booking.tracking.escortLocation ? 'bg-emerald-400' : 'bg-dark-600'}`} />
                              <span className="text-2xs text-dark-500">
                                {booking.tracking.escortLocation ? getLocationAge(booking.tracking.escortLocation.timestamp) : 'offline'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Booking Info Row */}
                      <div className="mt-3 flex items-center gap-4 text-xs text-dark-400">
                        <span><MapPin className="h-3 w-3 inline-block" /> {booking.location || '-'}</span>
                        <span><Clock className="h-3 w-3 inline-block" /> {formatTime(booking.startTime)} – {formatTime(booking.endTime)}</span>
                        <span><DollarSign className="h-3 w-3 inline-block" /> {formatCurrency(booking.totalAmount)}</span>
                        <span className="text-dark-600">#{booking.id.slice(0, 8)}</span>
                      </div>
                    </div>

                    {/* Right: Alerts & Payment */}
                    <div className="flex flex-col items-end gap-2">
                      {isSOS && (
                        <span className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                          <ShieldAlert className="h-3.5 w-3.5 inline-block" /> SOS AKTIF
                        </span>
                      )}
                      {booking.alerts.lateStatus && (
                        <span className={`rounded-full border px-2 py-0.5 text-xs ${getSeverityColor(booking.alerts.lateStatus.severity)}`}>
                          {booking.alerts.lateStatus.type === 'LATE_CHECKIN' ? <><Clock className="h-3 w-3 inline-block" /> Terlambat</> : <><Timer className="h-3 w-3 inline-block" /> Overtime</>}{' '}
                          {booking.alerts.lateStatus.minutes}m
                        </span>
                      )}
                      {booking.alerts.geofenceBreach && (
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                          <MapPin className="h-3 w-3 inline-block" /> Geofence
                        </span>
                      )}
                      {booking.incidents.length > 0 && !isSOS && (
                        <span className="rounded-full border border-orange-500/30 bg-orange-500/20 px-2 py-0.5 text-xs text-orange-400">
                          <AlertTriangle className="h-3 w-3 inline-block" /> {booking.incidents.length} Insiden
                        </span>
                      )}
                      {booking.payment && (
                        <span className={`rounded-full px-2 py-0.5 text-2xs ${
                          booking.payment.status === 'ESCROW' ? 'bg-emerald-500/10 text-emerald-400' :
                          booking.payment.status === 'RELEASED' ? 'bg-green-500/10 text-green-400' :
                          'bg-dark-700/50 text-dark-400'
                        }`}>
                          {booking.payment.status}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
