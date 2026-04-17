'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin-layout';
import api from '@/lib/api';
import { ClipboardList, FileText, RefreshCw } from 'lucide-react';

/* ─── Types ───────────────────────────────────── */

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

interface PendingEscort {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  tier: string;
  submittedAt: string;
  skills: string[];
}

interface KycItem {
  id: string;
  userId: string;
  status: string;
  documentType: string;
  documentFrontUrl: string | null;
  selfieUrl: string | null;
  livenessScore: number | null;
  faceMatchScore: number | null;
  attemptNumber: number;
  rejectionReason: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string; phone: string | null; profilePhoto: string | null; role: string; isVerified: boolean };
}

interface KycStats {
  total: number; pending: number; inReview: number; verified: number; rejected: number;
  verifiedClients: number; totalClients: number; verificationRate: number;
}

type Tab = 'users' | 'escort-pending' | 'kyc';

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  IN_REVIEW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  VERIFIED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Menunggu Review', IN_REVIEW: 'Sedang Ditinjau', VERIFIED: 'Terverifikasi', REJECTED: 'Ditolak',
};

const docTypeLabels: Record<string, string> = { KTP: 'KTP', PASSPORT: 'Passport', SIM: 'SIM', KITAS: 'KITAS' };

/* ─── Component ───────────────────────────────── */

export default function AdminUsersPage() {
  return (
    <Suspense fallback={null}>
      <AdminUsersContent />
    </Suspense>
  );
}

function AdminUsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (['users', 'escort-pending', 'kyc'] as Tab[]).includes(searchParams?.get('tab') as Tab) ? searchParams?.get('tab') as Tab : 'users';

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  /* Users state */
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userTotal, setUserTotal] = useState(0);

  /* Escort Pending state */
  const [pendingList, setPendingList] = useState<PendingEscort[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingActionLoading, setPendingActionLoading] = useState<string | null>(null);

  /* KYC state */
  const [kycStats, setKycStats] = useState<KycStats | null>(null);
  const [kycItems, setKycItems] = useState<KycItem[]>([]);
  const [kycLoading, setKycLoading] = useState(true);
  const [kycFilter, setKycFilter] = useState<'all' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('all');
  const [kycPage, setKycPage] = useState(1);
  const [kycTotalPages, setKycTotalPages] = useState(1);
  const [kycActionLoading, setKycActionLoading] = useState<string | null>(null);

  const [error, setError] = useState('');

  /* ─── Users fetchers ─── */

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      let url = `/admin/users?page=${userPage}&limit=20`;
      if (roleFilter !== 'ALL') url += `&role=${roleFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const { data } = await api.get(url);
      const d = data?.data || data;
      setUsers(d.data || d.users || []);
      setUserTotal(d.pagination?.total ?? d.total ?? 0);
      setUserTotalPages(d.pagination?.totalPages ?? 1);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat data user');
    } finally {
      setUsersLoading(false);
    }
  }, [userPage, roleFilter, search]);

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { isActive: !isActive });
      fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal mengubah status');
    }
  };

  /* ─── Escort Pending fetchers ─── */

  const fetchPending = useCallback(async () => {
    try {
      setPendingLoading(true);
      const { data } = await api.get('/admin/escorts/pending');
      const d = data?.data || data;
      const list = (d.data || d || []).map((e: any) => ({
        id: e.id,
        userId: e.userId,
        fullName: e.user ? `${e.user.firstName} ${e.user.lastName}` : e.fullName || 'N/A',
        email: e.user?.email || e.email || '',
        tier: e.tier || 'SILVER',
        submittedAt: e.createdAt || e.submittedAt || '',
        skills: e.skills || [],
      }));
      setPendingList(list);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat data');
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const handleEscortApprove = async (id: string) => {
    setPendingActionLoading(id);
    try {
      await api.patch(`/admin/escorts/${id}/verify`, { approved: true });
      fetchPending();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal approve');
    } finally {
      setPendingActionLoading(null);
    }
  };

  const handleEscortReject = async (id: string) => {
    const reason = prompt('Alasan penolakan:');
    if (!reason) return;
    setPendingActionLoading(id);
    try {
      await api.patch(`/admin/escorts/${id}/verify`, { approved: false, reason });
      fetchPending();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal reject');
    } finally {
      setPendingActionLoading(null);
    }
  };

  /* ─── KYC fetchers ─── */

  const fetchKycStats = useCallback(async () => {
    try {
      const { data } = await api.get('/kyc/admin/stats');
      setKycStats(data?.data || data);
    } catch {}
  }, []);

  const fetchKycList = useCallback(async () => {
    try {
      setKycLoading(true);
      const statusParam = kycFilter !== 'all' ? `&status=${kycFilter}` : '';
      const { data } = await api.get(`/kyc/admin/list?page=${kycPage}&limit=20${statusParam}`);
      const d = data?.data || data;
      const list = d.items || d.data || d || [];
      setKycItems(Array.isArray(list) ? list : []);
      setKycTotalPages(d.meta?.totalPages || d.totalPages || 1);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat data KYC');
    } finally {
      setKycLoading(false);
    }
  }, [kycPage, kycFilter]);

  const handleKycApprove = async (id: string) => {
    if (!confirm('Approve verifikasi KYC ini?')) return;
    setKycActionLoading(id);
    try {
      await api.patch(`/kyc/admin/${id}/review`, { approved: true });
      fetchKycList();
      fetchKycStats();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal approve');
    } finally {
      setKycActionLoading(null);
    }
  };

  const handleKycReject = async (id: string) => {
    const reason = prompt('Alasan penolakan KYC:');
    if (!reason) return;
    setKycActionLoading(id);
    try {
      await api.patch(`/kyc/admin/${id}/review`, { approved: false, rejectionReason: reason });
      fetchKycList();
      fetchKycStats();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal reject');
    } finally {
      setKycActionLoading(null);
    }
  };

  /* ─── Effects ─── */

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, fetchUsers]);

  useEffect(() => {
    const timer = activeTab === 'users' ? setTimeout(() => fetchUsers(), 300) : undefined;
    return () => timer && clearTimeout(timer);
  }, [search, fetchUsers, activeTab]);

  useEffect(() => {
    if (activeTab === 'escort-pending') fetchPending();
  }, [activeTab, fetchPending]);

  useEffect(() => {
    if (activeTab === 'kyc') { fetchKycStats(); fetchKycList(); }
  }, [activeTab, fetchKycStats, fetchKycList]);

  /* ─── Tab config ─── */

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'users', label: 'Semua Users' },
    { id: 'escort-pending', label: 'Verifikasi Escort', badge: pendingList.length || undefined },
    { id: 'kyc', label: 'Verifikasi KYC', badge: kycStats?.pending || undefined },
  ];

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setError('');
  };

  /* ─── Render ─── */

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-wide text-dark-100">User Management</h1>
            <p className="mt-1 text-sm text-dark-400">
              {activeTab === 'users' && 'Kelola semua user terdaftar di platform'}
              {activeTab === 'escort-pending' && 'Review dan verifikasi pendaftaran escort partner baru'}
              {activeTab === 'kyc' && 'Review dan verifikasi identitas klien (Know Your Customer)'}
            </p>
          </div>
          {activeTab === 'users' && (
            <span className="rounded-full bg-dark-700/50 px-3 py-1 text-xs text-dark-300">Total: {userTotal}</span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-dark-700/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                activeTab === tab.id ? 'text-brand-400' : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-[10px] font-medium text-amber-400">
                  {tab.badge}
                </span>
              )}
              {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-400" />}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {/* ═══════ Tab: Semua Users ═══════ */}
        {activeTab === 'users' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setUserPage(1); }}
                className="rounded-lg border border-dark-700 bg-dark-800/50 px-4 py-2 text-sm text-dark-200 placeholder:text-dark-500 focus:border-brand-400/50 focus:outline-none"
              />
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setUserPage(1); }}
                className="rounded-lg border border-dark-700 bg-dark-800/50 px-4 py-2 text-sm text-dark-200 focus:border-brand-400/50 focus:outline-none"
              >
                <option value="ALL">Semua Role</option>
                <option value="CLIENT">Client</option>
                <option value="ESCORT">Escort</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-dark-700/50">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-dark-700/50 bg-dark-800/50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-dark-300">Nama</th>
                    <th className="px-4 py-3 font-medium text-dark-300">Email</th>
                    <th className="px-4 py-3 font-medium text-dark-300">Role</th>
                    <th className="px-4 py-3 font-medium text-dark-300">Status</th>
                    <th className="px-4 py-3 font-medium text-dark-300">Terdaftar</th>
                    <th className="px-4 py-3 font-medium text-dark-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-dark-700/30">
                        <td colSpan={6} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-dark-700/50" /></td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-dark-500">Tidak ada user ditemukan.</td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => router.push(`/users/${user.id}`)}
                        className="border-b border-dark-700/30 cursor-pointer hover:bg-dark-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 text-dark-200">
                          <div className="flex items-center gap-2">
                            <span>{user.firstName} {user.lastName}</span>
                            <svg className="h-3.5 w-3.5 text-dark-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-dark-300">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs ${
                            user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? 'bg-red-500/10 text-red-400' :
                            user.role === 'ESCORT' ? 'bg-brand-400/10 text-brand-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs ${user.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                            <span className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-dark-400">{new Date(user.createdAt).toLocaleDateString('id-ID')}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleUserStatus(user.id, user.isActive); }}
                            className={`text-xs ${user.isActive ? 'text-red-400 hover:text-red-300' : 'text-emerald-400 hover:text-emerald-300'}`}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {userTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setUserPage((p) => Math.max(1, p - 1))} disabled={userPage === 1} className="rounded-lg border border-dark-700 px-3 py-1.5 text-xs text-dark-300 disabled:opacity-30">Prev</button>
                <span className="text-xs text-dark-400">Page {userPage} / {userTotalPages}</span>
                <button onClick={() => setUserPage((p) => Math.min(userTotalPages, p + 1))} disabled={userPage === userTotalPages} className="rounded-lg border border-dark-700 px-3 py-1.5 text-xs text-dark-300 disabled:opacity-30">Next</button>
              </div>
            )}
          </>
        )}

        {/* ═══════ Tab: Verifikasi Escort ═══════ */}
        {activeTab === 'escort-pending' && (
          <>
            <div className="flex gap-4">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2">
                <span className="text-xs text-amber-400">Pending: {pendingList.length}</span>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {pendingLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-48 animate-pulse rounded-xl border border-dark-700/50 bg-dark-800/30" />
                ))
              ) : pendingList.length === 0 ? (
                <div className="col-span-2 rounded-xl border border-dark-700/30 bg-dark-800/20 p-12 text-center">
                  <p className="text-dark-400">Tidak ada escort yang menunggu verifikasi</p>
                </div>
              ) : (
                pendingList.map((escort) => (
                  <div key={escort.id} className="rounded-xl border border-dark-700/50 bg-dark-800/30 p-5 transition-colors hover:border-dark-600/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-dark-100">{escort.fullName}</h3>
                        <p className="mt-1 text-xs text-dark-400">{escort.email}</p>
                      </div>
                      <span className="rounded-full bg-brand-400/10 px-2 py-0.5 text-xs text-brand-400">{escort.tier}</span>
                    </div>
                    {escort.skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {escort.skills.map((skill, i) => (
                          <span key={i} className="rounded bg-dark-700/50 px-2 py-0.5 text-2xs text-dark-300">{skill}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex items-center gap-2">
                      <button onClick={() => handleEscortApprove(escort.id)} disabled={pendingActionLoading === escort.id} className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50">
                        {pendingActionLoading === escort.id ? '...' : 'Approve'}
                      </button>
                      <button onClick={() => handleEscortReject(escort.id)} disabled={pendingActionLoading === escort.id} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50">
                        Reject
                      </button>
                      <Link href={`/escorts/${escort.id}`} className="ml-auto text-xs text-brand-400 hover:text-brand-300">Detail</Link>
                    </div>
                    {escort.submittedAt && (
                      <p className="mt-3 text-2xs text-dark-500">Diajukan: {new Date(escort.submittedAt).toLocaleDateString('id-ID')}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ═══════ Tab: Verifikasi KYC ═══════ */}
        {activeTab === 'kyc' && (
          <>
            {/* KYC Stats */}
            {kycStats && (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-xl border border-dark-700/50 bg-dark-800/30 p-4">
                    <p className="text-2xl font-light text-dark-100">{kycStats.total}</p>
                    <p className="mt-1 text-xs text-dark-500">Total Submissions</p>
                  </div>
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="text-2xl font-light text-amber-400">{kycStats.pending}</p>
                    <p className="mt-1 text-xs text-dark-500">Menunggu Review</p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="text-2xl font-light text-emerald-400">{kycStats.verified}</p>
                    <p className="mt-1 text-xs text-dark-500">Terverifikasi</p>
                  </div>
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="text-2xl font-light text-red-400">{kycStats.rejected}</p>
                    <p className="mt-1 text-xs text-dark-500">Ditolak</p>
                  </div>
                </div>

                <div className="rounded-xl border border-dark-700/50 bg-dark-800/30 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-dark-400">Tingkat Verifikasi ({kycStats.verifiedClients || 0} / {kycStats.totalClients || 0} klien)</span>
                    <span className="text-sm font-medium text-brand-400">{kycStats.verificationRate}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-dark-700/50">
                    <div className="h-2 rounded-full bg-brand-400 transition-all" style={{ width: `${Math.min(kycStats.verificationRate || 0, 100)}%` }} />
                  </div>
                </div>
              </>
            )}

            {/* KYC Filter pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all' as const, label: 'Semua', count: kycStats?.total },
                { key: 'PENDING' as const, label: 'Menunggu Review', count: kycStats?.pending },
                { key: 'VERIFIED' as const, label: 'Terverifikasi', count: kycStats?.verified },
                { key: 'REJECTED' as const, label: 'Ditolak', count: kycStats?.rejected },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => { setKycFilter(f.key); setKycPage(1); }}
                  className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                    kycFilter === f.key
                      ? 'bg-brand-400/10 text-brand-400 border border-brand-400/20'
                      : 'bg-dark-800/30 text-dark-400 border border-dark-700/30 hover:text-dark-200'
                  }`}
                >
                  {f.label}{f.count != null ? ` (${f.count})` : ''}
                </button>
              ))}
            </div>

            {/* KYC List */}
            <div className="space-y-3">
              {kycLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl border border-dark-700/50 bg-dark-800/30" />
                ))
              ) : kycItems.length === 0 ? (
                <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-12 text-center">
                  <p className="text-4xl"><ClipboardList className="h-10 w-10 mx-auto text-dark-500" /></p>
                  <p className="mt-3 text-dark-400">
                    {kycFilter === 'PENDING' ? 'Tidak ada verifikasi KYC yang menunggu review' : 'Tidak ada data KYC ditemukan'}
                  </p>
                </div>
              ) : (
                kycItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-dark-700/50 bg-dark-800/30 p-5 transition-colors hover:border-dark-600/50">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {item.user?.profilePhoto ? (
                          <img src={item.user.profilePhoto} alt="" className="h-12 w-12 rounded-full object-cover ring-1 ring-dark-700/50" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dark-700/50 ring-1 ring-dark-700/50">
                            <span className="text-lg text-dark-400">{item.user?.firstName?.[0] || '?'}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-dark-100">{item.user?.firstName} {item.user?.lastName}</h3>
                          <span className={`rounded-full border px-2 py-0.5 text-2xs font-medium ${statusColors[item.status] || ''}`}>
                            {statusLabels[item.status] || item.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-dark-400">{item.user?.email}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-dark-500">
                          <span><FileText className="h-3 w-3 inline-block" /> {docTypeLabels[item.documentType] || item.documentType}</span>
                          <span><RefreshCw className="h-3 w-3 inline-block" /> Percobaan ke-{item.attemptNumber}</span>
                          {item.livenessScore != null && (
                            <span className={item.livenessScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}>Liveness: {item.livenessScore.toFixed(0)}%</span>
                          )}
                          {item.faceMatchScore != null && (
                            <span className={item.faceMatchScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}>Face Match: {item.faceMatchScore.toFixed(0)}%</span>
                          )}
                          <span>{new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {item.rejectionReason && (
                          <p className="mt-1.5 text-xs text-red-400">Alasan ditolak: {item.rejectionReason}</p>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        {(item.status === 'PENDING' || item.status === 'IN_REVIEW') && (
                          <>
                            <button onClick={() => handleKycApprove(item.id)} disabled={kycActionLoading === item.id} className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50">
                              {kycActionLoading === item.id ? '...' : 'Approve'}
                            </button>
                            <button onClick={() => handleKycReject(item.id)} disabled={kycActionLoading === item.id} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 disabled:opacity-50">
                              Reject
                            </button>
                          </>
                        )}
                        <Link href={`/users/kyc/${item.id}`} className="rounded-lg bg-dark-700/30 px-3 py-1.5 text-xs text-brand-400 hover:bg-dark-700/50">Detail →</Link>
                      </div>
                    </div>
                    {(item.documentFrontUrl || item.selfieUrl) && (
                      <div className="mt-3 flex gap-2 border-t border-dark-700/30 pt-3">
                        {item.documentFrontUrl && (
                          <div className="relative">
                            <img src={item.documentFrontUrl} alt="Document" className="h-16 w-24 rounded-lg border border-dark-700/50 object-cover" />
                            <span className="absolute bottom-0.5 left-0.5 rounded bg-dark-900/80 px-1 text-2xs text-dark-300">Dokumen</span>
                          </div>
                        )}
                        {item.selfieUrl && (
                          <div className="relative">
                            <img src={item.selfieUrl} alt="Selfie" className="h-16 w-16 rounded-lg border border-dark-700/50 object-cover" />
                            <span className="absolute bottom-0.5 left-0.5 rounded bg-dark-900/80 px-1 text-2xs text-dark-300">Selfie</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {kycTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setKycPage((p) => Math.max(1, p - 1))} disabled={kycPage <= 1} className="rounded-lg border border-dark-700/30 px-3 py-1.5 text-xs text-dark-400 hover:text-dark-200 disabled:opacity-30">← Prev</button>
                <span className="text-xs text-dark-500">Halaman {kycPage} dari {kycTotalPages}</span>
                <button onClick={() => setKycPage((p) => Math.min(kycTotalPages, p + 1))} disabled={kycPage >= kycTotalPages} className="rounded-lg border border-dark-700/30 px-3 py-1.5 text-xs text-dark-400 hover:text-dark-200 disabled:opacity-30">Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
