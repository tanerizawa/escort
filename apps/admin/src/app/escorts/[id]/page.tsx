'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin-layout';
import api from '@/lib/api';
import { AlertTriangle, Check, User, X } from 'lucide-react';

interface EscortDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePhoto: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  escortProfile: {
    bio: string;
    tier: string;
    hourlyRate: number;
    ratingAvg: number;
    totalReviews: number;
    totalBookings: number;
    totalEarnings: number;
    languages: string[];
    specialties: string[];
    certifications: string[];
    portfolioPhotos: string[];
    verificationStatus: string;
    verificationNote: string | null;
    availabilitySchedule: Record<string, { start: string; end: string }> | null;
  } | null;
  recentBookings: {
    id: string;
    clientName: string;
    serviceType: string;
    status: string;
    startTime: string;
    totalAmount: number;
  }[];
  recentReviews: {
    id: string;
    reviewerName: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    isFlagged: boolean;
  }[];
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400',
  APPROVED: 'bg-emerald-500/10 text-emerald-400',
  REJECTED: 'bg-red-500/10 text-red-400',
  SUSPENDED: 'bg-orange-500/10 text-orange-400',
};

const bookingStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400',
  CONFIRMED: 'bg-blue-500/10 text-blue-400',
  ONGOING: 'bg-purple-500/10 text-purple-400',
  COMPLETED: 'bg-emerald-500/10 text-emerald-400',
  CANCELLED: 'bg-red-500/10 text-red-400',
  DISPUTED: 'bg-orange-500/10 text-orange-400',
};

const tierConfig: Record<string, { label: string; color: string }> = {
  SILVER: { label: 'Silver', color: 'text-gray-300 border-gray-500/30' },
  GOLD: { label: 'Gold', color: 'text-brand-400 border-brand-400/30' },
  PLATINUM: { label: 'Platinum', color: 'text-blue-300 border-blue-400/30' },
  DIAMOND: { label: 'Diamond', color: 'text-purple-300 border-purple-400/30' },
};

const dayLabels: Record<string, string> = {
  '0': 'Minggu', '1': 'Senin', '2': 'Selasa', '3': 'Rabu',
  '4': 'Kamis', '5': 'Jumat', '6': 'Sabtu',
};

export default function AdminEscortDetailPage() {
  const params = useParams();
  const router = useRouter();
  const escortId = params.id as string;

  const [escort, setEscort] = useState<EscortDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings' | 'reviews'>('profile');

  const fetchEscortDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/escorts/${escortId}`);
      const payload = res.data?.data || res.data;
      setEscort(payload);
    } catch (err) {
      console.error('Failed to fetch escort detail:', err);
    } finally {
      setLoading(false);
    }
  }, [escortId]);

  useEffect(() => {
    fetchEscortDetail();
  }, [fetchEscortDetail]);

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await api.patch(`/admin/escorts/${escortId}/verify`, { approved: true });
      fetchEscortDetail();
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      setActionLoading(true);
      await api.patch(`/admin/escorts/${escortId}/verify`, { approved: false, reason: rejectReason });
      setShowRejectModal(false);
      setRejectReason('');
      fetchEscortDetail();
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim()) return;
    try {
      setActionLoading(true);
      // Use user status endpoint to deactivate (suspend)
      const userId = escort?.id;
      if (userId) {
        await api.patch(`/admin/users/${userId}/status`, { isActive: false, reason: suspendReason });
      }
      setShowSuspendModal(false);
      setSuspendReason('');
      fetchEscortDetail();
    } catch (err) {
      console.error('Suspend failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!escort) return;
    try {
      setActionLoading(true);
      await api.patch(`/admin/users/${escort.id}/status`, { isActive: !escort.isActive });
      fetchEscortDetail();
    } catch (err) {
      console.error('Toggle active failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (!escort) {
    return (
      <AdminLayout>
        <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-12 text-center">
          <p className="text-dark-400">Escort tidak ditemukan</p>
          <Link href="/users?tab=escort-pending" className="mt-4 inline-block text-sm text-brand-400 hover:underline">
            ← Kembali ke daftar
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const profile = escort.escortProfile;
  const verificationStatus = profile?.verificationStatus || 'PENDING';
  const tier = tierConfig[profile?.tier || 'SILVER'] || tierConfig.SILVER;

  return (
    <AdminLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-dark-400 hover:text-dark-200 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-light tracking-wide text-dark-100">
            {escort.firstName} {escort.lastName}
          </h1>
          <p className="mt-0.5 text-sm text-dark-400">{escort.email}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${tier.color}`}>
            {tier.label}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[verificationStatus]}`}>
            {verificationStatus}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-dark-700/30 bg-dark-800/20 p-4">
        {verificationStatus === 'PENDING' && (
          <>
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              <Check className="h-4 w-4 inline-block" /> Approve
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading}
              className="rounded-lg bg-red-600/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-50"
            >
              <X className="h-4 w-4 inline-block" /> Reject
            </button>
          </>
        )}
        {verificationStatus === 'APPROVED' && (
          <button
            onClick={() => setShowSuspendModal(true)}
            disabled={actionLoading}
            className="rounded-lg bg-orange-600/20 px-4 py-2 text-sm font-medium text-orange-400 transition-colors hover:bg-orange-600/30 disabled:opacity-50"
          >
            <AlertTriangle className="h-4 w-4 inline-block" /> Suspend
          </button>
        )}
        <button
          onClick={handleToggleActive}
          disabled={actionLoading}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            escort.isActive
              ? 'bg-dark-700/50 text-dark-300 hover:bg-dark-700/70'
              : 'bg-brand-400/20 text-brand-400 hover:bg-brand-400/30'
          }`}
        >
          {escort.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-dark-700/30">
        {(['profile', 'bookings', 'reviews'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-brand-400 text-brand-400'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            {tab === 'profile' ? 'Profil' : tab === 'bookings' ? 'Booking' : 'Review'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Photo & Basic Info */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-dark-700/30 bg-dark-800/20">
              <div className="aspect-[3/4] bg-dark-700/30">
                {escort.profilePhoto ? (
                  <img src={escort.profilePhoto} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <User className="h-10 w-10 text-dark-500" />
                  </div>
                )}
              </div>
              <div className="p-4 space-y-3">
                <InfoRow label="Telepon" value={escort.phone || '-'} />
                <InfoRow label="Bergabung" value={new Date(escort.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })} />
                <InfoRow label="Status" value={escort.isActive ? 'Aktif' : 'Nonaktif'} />
                <InfoRow label="Terverifikasi" value={escort.isVerified ? 'Ya' : 'Belum'} />
              </div>
            </div>
          </div>

          {/* Center: Profile Details */}
          <div className="space-y-4 lg:col-span-2">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Rating" value={profile?.ratingAvg?.toFixed(1) || '-'} sub={`${profile?.totalReviews || 0} review`} />
              <StatCard label="Total Booking" value={String(profile?.totalBookings || 0)} />
              <StatCard label="Pendapatan" value={`Rp ${(profile?.totalEarnings || 0).toLocaleString('id-ID')}`} />
              <StatCard label="Tarif/Jam" value={`Rp ${(profile?.hourlyRate || 0).toLocaleString('id-ID')}`} />
            </div>

            {/* Bio */}
            <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-5">
              <h3 className="text-sm font-medium text-dark-300">Bio</h3>
              <p className="mt-2 text-sm leading-relaxed text-dark-200">{profile?.bio || 'Belum diisi'}</p>
            </div>

            {/* Languages & Specialties */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-5">
                <h3 className="text-sm font-medium text-dark-300">Bahasa</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile?.languages?.length ? profile.languages.map((l, i) => (
                    <span key={i} className="rounded-full bg-dark-700/50 px-3 py-1 text-xs text-dark-200">{l}</span>
                  )) : <span className="text-xs text-dark-500">-</span>}
                </div>
              </div>
              <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-5">
                <h3 className="text-sm font-medium text-dark-300">Spesialisasi</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile?.specialties?.length ? profile.specialties.map((s, i) => (
                    <span key={i} className="rounded-full bg-brand-400/10 px-3 py-1 text-xs text-brand-400">{s}</span>
                  )) : <span className="text-xs text-dark-500">-</span>}
                </div>
              </div>
            </div>

            {/* Certifications */}
            {profile?.certifications?.length ? (
              <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-5">
                <h3 className="text-sm font-medium text-dark-300">Sertifikasi</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.certifications.map((c, i) => (
                    <span key={i} className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs text-emerald-400">{c}</span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Availability Schedule */}
            {profile?.availabilitySchedule && (
              <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-5">
                <h3 className="text-sm font-medium text-dark-300">Jadwal Ketersediaan</h3>
                <div className="mt-3 space-y-2">
                  {Object.entries(profile.availabilitySchedule).map(([day, time]) => (
                    <div key={day} className="flex items-center justify-between text-sm">
                      <span className="text-dark-400">{dayLabels[day] || `Hari ${day}`}</span>
                      <span className="text-dark-200">{time.start} - {time.end}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio */}
            {profile?.portfolioPhotos?.length ? (
              <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-5">
                <h3 className="text-sm font-medium text-dark-300">Portfolio ({profile.portfolioPhotos.length} foto)</h3>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {profile.portfolioPhotos.map((url, i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-lg bg-dark-700/30">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Verification Note */}
            {profile?.verificationNote && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                <h3 className="text-sm font-medium text-red-400">Catatan Verifikasi</h3>
                <p className="mt-2 text-sm text-red-300">{profile.verificationNote}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-3">
          {escort.recentBookings?.length ? (
            escort.recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-dark-700/30 bg-dark-800/20 p-4">
                <div>
                  <p className="text-sm font-medium text-dark-100">{b.clientName}</p>
                  <p className="mt-0.5 text-xs text-dark-400">
                    {b.serviceType} · {new Date(b.startTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-dark-200">Rp {b.totalAmount.toLocaleString('id-ID')}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${bookingStatusColors[b.status] || 'bg-dark-700/30 text-dark-400'}`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-12 text-center">
              <p className="text-dark-400">Belum ada data booking</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-3">
          {escort.recentReviews?.length ? (
            escort.recentReviews.map((r) => (
              <div key={r.id} className={`rounded-xl border p-4 ${r.isFlagged ? 'border-red-500/30 bg-red-500/5' : 'border-dark-700/30 bg-dark-800/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-dark-100">{r.reviewerName}</span>
                    {r.isFlagged && <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-2xs text-red-400">FLAGGED</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'text-brand-400' : 'text-dark-600'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                {r.comment && <p className="mt-2 text-sm text-dark-300">{r.comment}</p>}
                <p className="mt-2 text-xs text-dark-500">
                  {new Date(r.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-12 text-center">
              <p className="text-dark-400">Belum ada review</p>
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-dark-700/50 bg-dark-800 p-6">
            <h2 className="text-lg font-medium text-dark-100">Tolak Escort</h2>
            <p className="mt-1 text-sm text-dark-400">Berikan alasan penolakan verifikasi.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Alasan penolakan..."
              className="mt-4 w-full rounded-lg border border-dark-600/50 bg-dark-700/30 px-4 py-3 text-sm text-dark-100 placeholder:text-dark-500 focus:border-brand-400/50 focus:outline-none focus:ring-1 focus:ring-brand-400/30"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => { setShowRejectModal(false); setRejectReason(''); }} className="rounded-lg px-4 py-2 text-sm text-dark-400 hover:text-dark-200">
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-dark-700/50 bg-dark-800 p-6">
            <h2 className="text-lg font-medium text-dark-100">Suspend Escort</h2>
            <p className="mt-1 text-sm text-dark-400">Escort akan dinonaktifkan sementara.</p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={4}
              placeholder="Alasan suspend..."
              className="mt-4 w-full rounded-lg border border-dark-600/50 bg-dark-700/30 px-4 py-3 text-sm text-dark-100 placeholder:text-dark-500 focus:border-brand-400/50 focus:outline-none focus:ring-1 focus:ring-brand-400/30"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => { setShowSuspendModal(false); setSuspendReason(''); }} className="rounded-lg px-4 py-2 text-sm text-dark-400 hover:text-dark-200">
                Batal
              </button>
              <button
                onClick={handleSuspend}
                disabled={!suspendReason.trim() || actionLoading}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-dark-500">{label}</span>
      <span className="text-sm text-dark-200">{value}</span>
    </div>
  );
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
