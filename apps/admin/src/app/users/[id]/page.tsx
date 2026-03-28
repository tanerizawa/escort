'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import api from '@/lib/api';
import { Check, CheckCircle2, Clock, Lock, MapPin, Star, Unlock, X } from 'lucide-react';

interface UserDetail {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  profilePhoto: string | null;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  escortProfile: {
    id: string;
    tier: string;
    languages: string[];
    skills: string[];
    hourlyRate: number;
    ratingAvg: number;
    totalBookings: number;
    totalReviews: number;
    bio: string | null;
    isApproved: boolean;
    approvedAt: string | null;
    certifications: { id: string; certType: string; certName: string; issuer: string; isVerified: boolean }[];
  } | null;
  clientBookings: BookingRow[];
  escortBookings: BookingRow[];
  givenReviews: ReviewRow[];
  receivedReviews: ReviewRow[];
  incidentReports: IncidentRow[];
  stats: {
    totalBookings: number;
    completedBookings: number;
    totalSpent: number;
    totalEarned: number;
  };
}

interface BookingRow {
  id: string;
  serviceType: string;
  status: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  location: string;
  client?: { id: string; firstName: string; lastName: string };
  escort?: { id: string; firstName: string; lastName: string };
}

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface IncidentRow {
  id: string;
  type: string;
  severity: string;
  resolutionStatus: string;
  createdAt: string;
}

interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

interface ActiveBookingLocation {
  booking: {
    id: string;
    status: string;
    startTime: string;
    endTime: string;
    location: string;
    locationLat: number | null;
    locationLng: number | null;
    serviceType: string;
    client: { id: string; firstName: string; lastName: string };
    escort: { id: string; firstName: string; lastName: string };
  };
  currentLocation: LocationData | null;
  otherParticipantLocation: LocationData | null;
  locationHistory: LocationData[];
}

const roleColors: Record<string, string> = {
  CLIENT: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  ESCORT: 'bg-brand-400/10 text-brand-400 border-brand-400/30',
  ADMIN: 'bg-red-500/10 text-red-400 border-red-500/30',
  SUPER_ADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
};

const tierColors: Record<string, string> = {
  SILVER: 'text-gray-300',
  GOLD: 'text-yellow-400',
  PLATINUM: 'text-blue-300',
  DIAMOND: 'text-purple-300',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-400',
  CONFIRMED: 'bg-blue-500/10 text-blue-400',
  ONGOING: 'bg-purple-500/10 text-purple-400',
  COMPLETED: 'bg-emerald-500/10 text-emerald-400',
  CANCELLED: 'bg-red-500/10 text-red-400',
  DISPUTED: 'bg-orange-500/10 text-orange-400',
};

const incidentStatusColors: Record<string, string> = {
  OPEN: 'bg-red-500/10 text-red-400',
  INVESTIGATING: 'bg-yellow-500/10 text-yellow-400',
  RESOLVED: 'bg-emerald-500/10 text-emerald-400',
  DISMISSED: 'bg-dark-600/50 text-dark-400',
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'reviews' | 'incidents' | 'location'>('overview');
  const [actionLoading, setActionLoading] = useState(false);

  // Location tracking state
  const [locationData, setLocationData] = useState<{
    activeBookings: ActiveBookingLocation[];
    userName: string;
    role: string;
    lastKnownLocation: LocationData | null;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/users/${userId}`);
      const payload = res.data?.data || res.data;
      setUser(payload);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat data user');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const fetchLocation = useCallback(async () => {
    try {
      setLocationLoading(true);
      const res = await api.get(`/admin/users/${userId}/location`);
      const payload = res.data?.data || res.data;
      setLocationData(payload);
      setLocationError('');
    } catch (err: any) {
      setLocationError(err?.response?.data?.message || 'Gagal memuat data lokasi');
    } finally {
      setLocationLoading(false);
    }
  }, [userId]);

  // Auto-refresh location every 30 seconds when on location tab
  useEffect(() => {
    if (activeTab === 'location') {
      fetchLocation();
      locationIntervalRef.current = setInterval(fetchLocation, 30000);
      return () => {
        if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
      };
    } else {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    }
  }, [activeTab, fetchLocation]);

  // Initialize Leaflet map
  useEffect(() => {
    if (activeTab !== 'location' || !mapRef.current) return;

    const initMap = async () => {
      if (mapInstanceRef.current) return;

      // Load Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load Leaflet JS
      const L = await import('leaflet');

      const map = L.map(mapRef.current!, {
        center: [-6.2088, 106.8456], // Jakarta default
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Force resize after render
      setTimeout(() => map.invalidateSize(), 200);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeTab]);

  // Update map markers when location data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !locationData) return;

    const updateMarkers = async () => {
      const L = await import('leaflet');

      // Clear old markers and polylines
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      polylinesRef.current.forEach((p) => p.remove());
      polylinesRef.current = [];

      const bounds: [number, number][] = [];

      locationData.activeBookings.forEach((item) => {
        const { currentLocation, otherParticipantLocation, locationHistory, booking } = item;

        // Booking meeting point marker
        if (booking.locationLat && booking.locationLng) {
          const meetingIcon = L.divIcon({
            html: `<div style="background:#f59e0b;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
            className: '',
          });
          const marker = L.marker([booking.locationLat, booking.locationLng], { icon: meetingIcon })
            .addTo(mapInstanceRef.current!)
            .bindPopup(`<div style="font-size:12px"><b>Titik Temu</b><br/>${booking.location}<br/><span style="color:#666">${booking.serviceType}</span></div>`);
          markersRef.current.push(marker);
          bounds.push([booking.locationLat, booking.locationLng]);
        }

        // Current location marker
        if (currentLocation) {
          const age = Date.now() - currentLocation.timestamp;
          const isRecent = age < 300000; // < 5 min
          const color = isRecent ? '#10b981' : '#ef4444';
          const pulseClass = isRecent ? 'animate-pulse' : '';

          const userIcon = L.divIcon({
            html: `<div style="position:relative">
              <div style="background:${color};width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>
              ${isRecent ? `<div style="position:absolute;top:-4px;left:-4px;width:26px;height:26px;border-radius:50%;border:2px solid ${color};opacity:0.5;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
            </div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
            className: '',
          });

          const timeAgo = formatTimeAgo(currentLocation.timestamp);
          const marker = L.marker([currentLocation.lat, currentLocation.lng], { icon: userIcon })
            .addTo(mapInstanceRef.current!)
            .bindPopup(`<div style="font-size:12px">
              <b>${locationData.userName}</b><br/>
              <span style="color:${isRecent ? '#10b981' : '#ef4444'}">${isRecent ? '● Online' : '● Offline'}</span><br/>
              Akurasi: ${currentLocation.accuracy ? `${Math.round(currentLocation.accuracy)}m` : '-'}<br/>
              Update: ${timeAgo}<br/>
              <span style="color:#666">Booking: ${booking.id.slice(0, 8)}</span>
            </div>`);
          markersRef.current.push(marker);
          bounds.push([currentLocation.lat, currentLocation.lng]);
        }

        // Other participant location marker (blue)
        if (otherParticipantLocation) {
          const otherAge = Date.now() - otherParticipantLocation.timestamp;
          const otherIsRecent = otherAge < 300000;
          const otherColor = otherIsRecent ? '#3b82f6' : '#6b7280';
          const otherName = locationData.role === 'ESCORT'
            ? `${booking.client.firstName} ${booking.client.lastName}`
            : `${booking.escort.firstName} ${booking.escort.lastName}`;
          const otherRole = locationData.role === 'ESCORT' ? 'Client' : 'Escort';

          const otherIcon = L.divIcon({
            html: `<div style="position:relative">
              <div style="background:${otherColor};width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>
              ${otherIsRecent ? `<div style="position:absolute;top:-3px;left:-3px;width:22px;height:22px;border-radius:50%;border:2px solid ${otherColor};opacity:0.4;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
            </div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
            className: '',
          });

          const otherTimeAgo = formatTimeAgo(otherParticipantLocation.timestamp);
          const otherMarker = L.marker([otherParticipantLocation.lat, otherParticipantLocation.lng], { icon: otherIcon })
            .addTo(mapInstanceRef.current!)
            .bindPopup(`<div style="font-size:12px">
              <b>${otherName}</b> <span style="color:#888">(${otherRole})</span><br/>
              <span style="color:${otherIsRecent ? '#3b82f6' : '#6b7280'}">${otherIsRecent ? '● Online' : '● Offline'}</span><br/>
              Akurasi: ${otherParticipantLocation.accuracy ? `${Math.round(otherParticipantLocation.accuracy)}m` : '-'}<br/>
              Update: ${otherTimeAgo}
            </div>`);
          markersRef.current.push(otherMarker);
          bounds.push([otherParticipantLocation.lat, otherParticipantLocation.lng]);
        }

        // Location history trail
        if (locationHistory.length > 1) {
          const historyCoords: [number, number][] = locationHistory
            .filter((l) => l.lat && l.lng)
            .map((l) => [l.lat, l.lng]);

          if (historyCoords.length > 1) {
            const polyline = L.polyline(historyCoords, {
              color: '#8b5cf6',
              weight: 3,
              opacity: 0.6,
              dashArray: '8, 4',
            }).addTo(mapInstanceRef.current!);
            polylinesRef.current.push(polyline);
          }
        }
      });

      // General last-known location (from GPS ping, independent of bookings)
      if (locationData.lastKnownLocation) {
        const lkl = locationData.lastKnownLocation;
        const age = Date.now() - lkl.timestamp;
        const isRecent = age < 300000; // < 5 min
        const color = isRecent ? '#10b981' : '#f59e0b';
        // Only show if we don't already have a booking-specific location for this user
        const hasBookingLocation = locationData.activeBookings.some(b => b.currentLocation != null);

        const lklIcon = L.divIcon({
          html: `<div style="position:relative">
            <div style="background:${color};width:20px;height:20px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.5);"></div>
            ${isRecent ? `<div style="position:absolute;top:-5px;left:-5px;width:30px;height:30px;border-radius:50%;border:2px solid ${color};opacity:0.5;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
          </div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          className: '',
        });

        const lklTimeAgo = formatTimeAgo(lkl.timestamp);
        const marker = L.marker([lkl.lat, lkl.lng], { icon: lklIcon })
          .addTo(mapInstanceRef.current!)
          .bindPopup(`<div style="font-size:12px">
            <b>${locationData.userName}</b> ${hasBookingLocation ? '(GPS Ping)' : ''}<br/>
            <span style="color:${isRecent ? '#10b981' : '#f59e0b'}">${isRecent ? '● Online — GPS aktif' : '● Terakhir terlihat'}</span><br/>
            Koordinat: ${lkl.lat.toFixed(6)}, ${lkl.lng.toFixed(6)}<br/>
            Akurasi: ${lkl.accuracy ? `±${Math.round(lkl.accuracy)}m` : '-'}<br/>
            Update: ${lklTimeAgo}
          </div>`);
        markersRef.current.push(marker);
        bounds.push([lkl.lat, lkl.lng]);

        // Open popup by default if this is the only location source
        if (!hasBookingLocation) {
          setTimeout(() => marker.openPopup(), 500);
        }
      }

      // Fit bounds
      if (bounds.length > 0) {
        try {
          mapInstanceRef.current!.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        } catch {}
      }
    };

    updateMarkers();
  }, [locationData]);

  const handleToggleStatus = async () => {
    if (!user) return;
    try {
      setActionLoading(true);
      await api.patch(`/admin/users/${userId}/status`, { isActive: !user.isActive });
      fetchUser();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal mengubah status');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !user) {
    return (
      <AdminLayout>
        <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-12 text-center">
          <p className="text-dark-400">{error || 'User tidak ditemukan'}</p>
          <button onClick={() => router.push('/users')} className="mt-4 text-sm text-brand-400 hover:underline">
            ← Kembali ke Users
          </button>
        </div>
      </AdminLayout>
    );
  }

  const profile = user.escortProfile;
  const bookings = user.role === 'ESCORT' ? user.escortBookings : user.clientBookings;
  const reviews = user.role === 'ESCORT' ? user.receivedReviews : user.givenReviews;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-5">
          <button onClick={() => router.push('/users')} className="mt-1 text-dark-400 hover:text-dark-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>

          <div className="flex items-center gap-4 flex-1">
            {/* Avatar */}
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-dark-700/50 ring-2 ring-dark-600/50">
              {user.profilePhoto ? (
                <img src={user.profilePhoto} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl text-dark-400">{user.firstName.charAt(0)}{user.lastName.charAt(0)}</span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-light tracking-wide text-dark-100">
                  {user.firstName} {user.lastName}
                </h1>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleColors[user.role] || 'bg-dark-700 text-dark-400'}`}>
                  {user.role}
                </span>
                {profile && (
                  <span className={`text-sm font-medium ${tierColors[profile.tier] || 'text-dark-400'}`}>
                    <Star className="h-3.5 w-3.5 inline-block fill-current" /> {profile.tier}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-dark-400">{user.email}</p>
              {user.phone && <p className="text-xs text-dark-500">{user.phone}</p>}
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${user.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                <span className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={handleToggleStatus}
                disabled={actionLoading}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                  user.isActive
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                {user.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Booking" value={String(user.stats.totalBookings)} />
          <StatCard label="Completed" value={String(user.stats.completedBookings)} />
          {user.role === 'CLIENT' && (
            <StatCard label="Total Spent" value={`Rp ${user.stats.totalSpent.toLocaleString('id-ID')}`} />
          )}
          {user.role === 'ESCORT' && (
            <>
              <StatCard label="Total Earned" value={`Rp ${user.stats.totalEarned.toLocaleString('id-ID')}`} />
              <StatCard label="Rating" value={profile?.ratingAvg?.toFixed(1) || '-'} sub={`${profile?.totalReviews || 0} review`} />
            </>
          )}
          {user.role !== 'ESCORT' && (
            <StatCard label="Verified" value={user.isVerified ? 'Ya' : 'Belum'} />
          )}
        </div>

        {/* Info Row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <InfoCard label="Bergabung" value={formatDate(user.createdAt)} />
          <InfoCard label="Login Terakhir" value={user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Belum pernah'} />
          <InfoCard label="2FA" value={user.twoFactorEnabled ? <><Check className="h-3 w-3 inline-block" /> Aktif</> : <><X className="h-3 w-3 inline-block" /> Nonaktif</>} />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-700/30">
          {(['overview', 'bookings', 'reviews', 'incidents', 'location'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-brand-400 text-brand-400'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              {tab === 'overview' ? 'Profil' : tab === 'location' ? 'Lokasi Live' : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Escort Profile */}
            {profile && (
              <div className="space-y-4">
                <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-5">
                  <h3 className="text-sm font-medium text-dark-300">Bio</h3>
                  <p className="mt-2 text-sm leading-relaxed text-dark-200">{profile.bio || 'Belum diisi'}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-5">
                    <h3 className="text-sm font-medium text-dark-300">Bahasa</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile.languages?.length ? profile.languages.map((l, i) => (
                        <span key={i} className="rounded-full bg-dark-700/50 px-3 py-1 text-xs text-dark-200">{l}</span>
                      )) : <span className="text-xs text-dark-500">-</span>}
                    </div>
                  </div>
                  <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-5">
                    <h3 className="text-sm font-medium text-dark-300">Skills</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile.skills?.length ? profile.skills.map((s, i) => (
                        <span key={i} className="rounded-full bg-brand-400/10 px-3 py-1 text-xs text-brand-400">{s}</span>
                      )) : <span className="text-xs text-dark-500">-</span>}
                    </div>
                  </div>
                </div>

                {/* Certifications */}
                {profile.certifications?.length > 0 && (
                  <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-5">
                    <h3 className="text-sm font-medium text-dark-300">Sertifikasi ({profile.certifications.length})</h3>
                    <div className="mt-3 space-y-2">
                      {profile.certifications.map((cert) => (
                        <div key={cert.id} className="flex items-center justify-between rounded-lg bg-dark-700/20 px-3 py-2">
                          <div className="flex-1">
                            <p className="text-sm text-dark-200">{cert.certName}</p>
                            <p className="text-xs text-dark-500">{cert.certType} · {cert.issuer}</p>
                          </div>
                          {cert.isVerified ? (
                            <span className="text-xs text-emerald-400"><CheckCircle2 className="h-3 w-3 inline-block" /> Verified</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-amber-400"><Clock className="h-3 w-3 inline-block" /> Pending</span>
                              <button
                                onClick={async () => {
                                  if (!confirm('Setujui sertifikasi ini?')) return;
                                  try {
                                    await api.patch(`/admin/certifications/${cert.id}/verify`, { approved: true });
                                    fetchUser();
                                  } catch {}
                                }}
                                className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400 hover:bg-emerald-500/30"
                              >
                                Approve
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm('Tolak & hapus sertifikasi ini?')) return;
                                  try {
                                    await api.patch(`/admin/certifications/${cert.id}/verify`, { approved: false });
                                    fetchUser();
                                  } catch {}
                                }}
                                className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-400 hover:bg-red-500/30"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Escort Key Info */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <InfoCard label="Tarif/Jam" value={`Rp ${Number(profile.hourlyRate).toLocaleString('id-ID')}`} />
                  <InfoCard label="Tier" value={profile.tier} />
                  <InfoCard label="Approved" value={profile.isApproved ? 'Ya' : 'Belum'} />
                  <InfoCard label="Approved At" value={profile.approvedAt ? formatDate(profile.approvedAt) : '-'} />
                </div>
              </div>
            )}

            {/* Non-escort user profile (CLIENT / ADMIN / etc.) */}
            {!profile && (
              <div className="space-y-4">
                {/* Account Info Card */}
                <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-5">
                  <h3 className="text-sm font-medium text-dark-300">Informasi Akun</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-dark-500">Email</p>
                        <p className="mt-0.5 text-sm text-dark-200">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-dark-500">Telepon</p>
                        <p className="mt-0.5 text-sm text-dark-200">{user.phone || 'Belum diisi'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-dark-500">Role</p>
                        <span className={`mt-0.5 inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleColors[user.role] || 'bg-dark-700/30 text-dark-400 border-dark-600/30'}`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-dark-500">Status Verifikasi</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${user.isVerified ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          <span className="text-sm text-dark-200">{user.isVerified ? 'Terverifikasi' : 'Belum Verifikasi'}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-dark-500">Status Akun</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <span className="text-sm text-dark-200">{user.isActive ? 'Aktif' : 'Nonaktif'}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-dark-500">Keamanan (2FA)</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className={`text-sm ${user.twoFactorEnabled ? 'text-emerald-400' : 'text-dark-400'}`}>
                            {user.twoFactorEnabled ? <><Lock className="h-3.5 w-3.5 inline-block" /> Aktif</> : <><Unlock className="h-3.5 w-3.5 inline-block" /> Nonaktif</>}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Summary */}
                <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-5">
                  <h3 className="text-sm font-medium text-dark-300">Ringkasan Aktivitas</h3>
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-lg bg-dark-700/20 p-3 text-center">
                      <p className="text-lg font-semibold text-dark-100">{user.stats.totalBookings}</p>
                      <p className="text-xs text-dark-500">Total Booking</p>
                    </div>
                    <div className="rounded-lg bg-dark-700/20 p-3 text-center">
                      <p className="text-lg font-semibold text-dark-100">{user.stats.completedBookings}</p>
                      <p className="text-xs text-dark-500">Selesai</p>
                    </div>
                    <div className="rounded-lg bg-dark-700/20 p-3 text-center">
                      <p className="text-lg font-semibold text-dark-100">
                        {user.stats.totalBookings > 0
                          ? `${Math.round((user.stats.completedBookings / user.stats.totalBookings) * 100)}%`
                          : '-'}
                      </p>
                      <p className="text-xs text-dark-500">Tingkat Selesai</p>
                    </div>
                    <div className="rounded-lg bg-dark-700/20 p-3 text-center">
                      <p className="text-lg font-semibold text-dark-100">{reviews.length}</p>
                      <p className="text-xs text-dark-500">Review Diberikan</p>
                    </div>
                  </div>
                  {user.role === 'CLIENT' && user.stats.totalSpent > 0 && (
                    <div className="mt-4 flex items-center justify-between rounded-lg bg-brand-400/5 px-4 py-3">
                      <span className="text-sm text-dark-400">Total Pengeluaran</span>
                      <span className="text-sm font-semibold text-brand-400">Rp {user.stats.totalSpent.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {user.stats.totalBookings > 0 && user.stats.totalSpent > 0 && (
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-dark-700/20 px-4 py-3">
                      <span className="text-sm text-dark-400">Rata-rata per Booking</span>
                      <span className="text-sm font-medium text-dark-200">
                        Rp {Math.round(user.stats.totalSpent / user.stats.totalBookings).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-5">
                  <h3 className="text-sm font-medium text-dark-300">Timeline</h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
                      <div>
                        <p className="text-sm text-dark-200">Akun dibuat</p>
                        <p className="text-xs text-dark-500">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                    {user.lastLoginAt && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-blue-400 ring-2 ring-blue-400/20" />
                        <div>
                          <p className="text-sm text-dark-200">Login terakhir</p>
                          <p className="text-xs text-dark-500">{formatDate(user.lastLoginAt)}</p>
                        </div>
                      </div>
                    )}
                    {user.stats.totalBookings > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-brand-400 ring-2 ring-brand-400/20" />
                        <div>
                          <p className="text-sm text-dark-200">Booking pertama</p>
                          <p className="text-xs text-dark-500">
                            {bookings.length > 0
                              ? formatDate(bookings[bookings.length - 1]?.startTime)
                              : 'Data tidak tersedia'}
                          </p>
                        </div>
                      </div>
                    )}
                    {user.incidentReports.length > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-red-400 ring-2 ring-red-400/20" />
                        <div>
                          <p className="text-sm text-dark-200">{user.incidentReports.length} laporan insiden</p>
                          <p className="text-xs text-dark-500">Terakhir: {formatDate(user.incidentReports[0]?.createdAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-3">
            {bookings.length > 0 ? (
              bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border border-dark-700/30 bg-dark-800/20 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusColors[b.status] || 'bg-dark-700/30 text-dark-400'}`}>
                        {b.status}
                      </span>
                      <span className="text-xs text-dark-500">{b.serviceType}</span>
                      <span className="font-mono text-xs text-dark-500">#{b.id.slice(0, 8)}</span>
                    </div>
                    <p className="mt-1 text-sm text-dark-200">{b.location}</p>
                    <div className="mt-1 flex gap-3 text-xs text-dark-400">
                      {b.client && <span>Client: {b.client.firstName} {b.client.lastName}</span>}
                      {b.escort && <span>Escort: {b.escort.firstName} {b.escort.lastName}</span>}
                      <span>{formatDate(b.startTime)}</span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-dark-200">
                    Rp {Number(b.totalAmount).toLocaleString('id-ID')}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-12 text-center">
                <p className="text-dark-400">Belum ada booking</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-3">
            {reviews.length > 0 ? (
              reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'text-brand-400' : 'text-dark-600'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-1 text-xs text-dark-400">{r.rating}/5</span>
                    </div>
                    <span className="text-xs text-dark-500">{formatDate(r.createdAt)}</span>
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-dark-300">{r.comment}</p>}
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-12 text-center">
                <p className="text-dark-400">Belum ada review</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="space-y-3">
            {user.incidentReports.length > 0 ? (
              user.incidentReports.map((inc) => (
                <div key={inc.id} className="flex items-center justify-between rounded-xl border border-dark-700/30 bg-dark-800/20 p-4">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${incidentStatusColors[inc.resolutionStatus] || 'bg-dark-700/30 text-dark-400'}`}>
                      {inc.resolutionStatus}
                    </span>
                    <span className="text-sm text-dark-200">{inc.type}</span>
                    <span className={`text-xs ${inc.severity === 'CRITICAL' ? 'text-red-400' : inc.severity === 'HIGH' ? 'text-orange-400' : 'text-dark-400'}`}>
                      {inc.severity}
                    </span>
                  </div>
                  <span className="text-xs text-dark-500">{formatDate(inc.createdAt)}</span>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-12 text-center">
                <p className="text-dark-400">Tidak ada laporan insiden</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'location' && (
          <div className="space-y-4">
            {/* Location Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-dark-200">Live GPS Tracking</h3>
                <p className="text-xs text-dark-500">
                  {locationData?.activeBookings?.length
                    ? `${locationData.activeBookings.length} booking aktif ditemukan`
                    : locationData?.lastKnownLocation
                      ? 'GPS ping aktif (tanpa booking)'
                      : 'Tidak ada data lokasi'}
                  {' · '}Auto-refresh setiap 30 detik
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-dark-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  Live
                </span>
                <button
                  onClick={fetchLocation}
                  disabled={locationLoading}
                  className="rounded-lg bg-dark-700/50 px-3 py-1.5 text-xs text-dark-300 hover:bg-dark-700/70 disabled:opacity-50"
                >
                  {locationLoading ? 'Loading...' : '↻ Refresh'}
                </button>
              </div>
            </div>

            {locationError && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {locationError}
              </div>
            )}

            {/* Map */}
            <div className="overflow-hidden rounded-xl border border-dark-700/30">
              <div ref={mapRef} className="h-[500px] w-full bg-dark-800/50" />
            </div>

            {/* Map Legend */}
            <div className="flex flex-wrap gap-4 rounded-lg border border-dark-700/30 bg-dark-800/20 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-dark-400">
                <span className="h-3 w-3 rounded-full bg-emerald-500" /> Lokasi user (online)
              </div>
              <div className="flex items-center gap-2 text-xs text-dark-400">
                <span className="h-3 w-3 rounded-full bg-red-500" /> Lokasi user (offline)
              </div>
              <div className="flex items-center gap-2 text-xs text-dark-400">
                <span className="h-3 w-3 rounded-full bg-blue-500" /> Peserta lain (online)
              </div>
              <div className="flex items-center gap-2 text-xs text-dark-400">
                <span className="h-3 w-3 rounded-full bg-amber-500" /> Titik temu booking
              </div>
              <div className="flex items-center gap-2 text-xs text-dark-400">
                <span className="h-4 w-6 border-b-2 border-dashed border-purple-500" /> Riwayat pergerakan
              </div>
              {locationData?.lastKnownLocation && (
                <div className="flex items-center gap-2 text-xs text-dark-400">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 shadow" /> GPS Ping (terakhir)
                </div>
              )}
            </div>

            {/* Active Booking Details */}
            {locationData?.activeBookings?.map((item) => (
              <div key={item.booking.id} className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusColors[item.booking.status] || 'bg-dark-700/30 text-dark-400'}`}>
                        {item.booking.status}
                      </span>
                      <span className="text-xs text-dark-500">{item.booking.serviceType}</span>
                      <span className="font-mono text-xs text-dark-500">#{item.booking.id.slice(0, 8)}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-dark-200">{item.booking.location}</p>
                    <div className="mt-1 flex gap-4 text-xs text-dark-400">
                      <span>Client: {item.booking.client.firstName} {item.booking.client.lastName}</span>
                      <span>Escort: {item.booking.escort.firstName} {item.booking.escort.lastName}</span>
                    </div>
                    <div className="mt-1 text-xs text-dark-500">
                      {formatDate(item.booking.startTime)} → {formatDate(item.booking.endTime)}
                    </div>
                  </div>

                  {/* Current Location Info */}
                  <div className="text-right">
                    {item.currentLocation ? (
                      <div>
                        <p className="text-xs text-dark-400">GPS Terakhir</p>
                        <p className="text-sm font-mono text-dark-200">
                          {item.currentLocation.lat.toFixed(6)}, {item.currentLocation.lng.toFixed(6)}
                        </p>
                        <p className="text-xs text-dark-500">
                          {formatTimeAgo(item.currentLocation.timestamp)}
                          {item.currentLocation.accuracy && ` · ±${Math.round(item.currentLocation.accuracy)}m`}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-dark-500">Belum ada data GPS</p>
                        <p className="text-2xs text-dark-600">User belum mengirim lokasi</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* History count */}
                {item.locationHistory.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 border-t border-dark-700/20 pt-3">
                    <span className="text-xs text-dark-500">
                      <MapPin className="h-3.5 w-3.5 inline-block" /> {item.locationHistory.length} titik riwayat lokasi tersimpan
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* No active bookings */}
            {locationData && locationData.activeBookings.length === 0 && (
              <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-8">
                {locationData.lastKnownLocation ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                        <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-dark-200">Lokasi Terakhir (GPS Ping)</h4>
                        <p className="text-xs text-dark-500">User mengirim lokasi melalui browser — tidak ada booking aktif</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg bg-dark-700/20 p-3">
                        <p className="text-2xs uppercase tracking-wider text-dark-500">Koordinat</p>
                        <p className="mt-1 font-mono text-sm text-dark-200">
                          {locationData.lastKnownLocation.lat.toFixed(6)}, {locationData.lastKnownLocation.lng.toFixed(6)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-dark-700/20 p-3">
                        <p className="text-2xs uppercase tracking-wider text-dark-500">Akurasi</p>
                        <p className="mt-1 text-sm text-dark-200">
                          {locationData.lastKnownLocation.accuracy ? `±${Math.round(locationData.lastKnownLocation.accuracy)} meter` : '-'}
                        </p>
                      </div>
                      <div className="rounded-lg bg-dark-700/20 p-3">
                        <p className="text-2xs uppercase tracking-wider text-dark-500">Terakhir Update</p>
                        <p className="mt-1 text-sm text-dark-200">
                          {formatTimeAgo(locationData.lastKnownLocation.timestamp)}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${locationData.lastKnownLocation.lat},${locationData.lastKnownLocation.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:underline"
                    >
                      Buka di Google Maps →
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <svg className="mx-auto h-12 w-12 text-dark-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <p className="mt-3 text-dark-400">Belum ada data lokasi dari user ini</p>
                    <p className="mt-1 text-xs text-dark-500">
                      User belum mengizinkan GPS atau belum login via browser sejak fitur ini aktif.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds} detik lalu`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-4 text-center">
      <p className="text-xl font-semibold text-dark-100">{value}</p>
      <p className="mt-1 text-xs text-dark-400">{label}</p>
      {sub && <p className="text-2xs text-dark-500">{sub}</p>}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-dark-500">{label}</p>
      <p className="mt-1 text-sm text-dark-200">{value}</p>
    </div>
  );
}
