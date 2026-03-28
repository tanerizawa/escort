'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/admin-layout';
import api from '@/lib/api';
import { AlertTriangle, Check, CheckCircle2, X } from 'lucide-react';

interface KycDetail {
  id: string;
  userId: string;
  status: string;
  documentType: string;
  documentNumber: string | null;
  documentFrontUrl: string | null;
  documentBackUrl: string | null;
  selfieUrl: string | null;
  livenessScore: number | null;
  faceMatchScore: number | null;
  ocrData: Record<string, any> | null;
  providerRef: string | null;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  verifiedAt: string | null;
  expiresAt: string | null;
  attemptNumber: number;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    profilePhoto: string | null;
    role: string;
    isVerified: boolean;
    createdAt: string;
  };
  history?: Array<{
    id: string;
    status: string;
    documentType: string;
    attemptNumber: number;
    rejectionReason: string | null;
    createdAt: string;
  }>;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  IN_REVIEW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  VERIFIED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Menunggu Review',
  IN_REVIEW: 'Sedang Ditinjau',
  VERIFIED: 'Terverifikasi',
  REJECTED: 'Ditolak',
};

const docTypeLabels: Record<string, string> = {
  KTP: 'KTP (Kartu Tanda Penduduk)',
  PASSPORT: 'Passport',
  SIM: 'SIM (Surat Izin Mengemudi)',
  KITAS: 'KITAS (Kartu Izin Tinggal Terbatas)',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ScoreBar({ label, score, threshold = 80 }: { label: string; score: number | null; threshold?: number }) {
  if (score == null) return null;
  const passed = score >= threshold;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-dark-400">{label}</span>
        <span className={passed ? 'text-emerald-400' : 'text-amber-400'}>
          {score.toFixed(1)}% {passed ? <Check className="h-3 w-3 inline-block" /> : <AlertTriangle className="h-3 w-3 inline-block" />}
        </span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-dark-700/50">
        <div
          className={`h-2 rounded-full transition-all ${passed ? 'bg-emerald-500' : 'bg-amber-500'}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminKycDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kycId = params?.id as string;

  const [kyc, setKyc] = useState<KycDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/kyc/admin/${kycId}`);
      setKyc(data?.data || data);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat detail KYC');
    } finally {
      setLoading(false);
    }
  }, [kycId]);

  useEffect(() => {
    if (kycId) fetchDetail();
  }, [kycId, fetchDetail]);

  const handleApprove = async () => {
    if (!confirm('Yakin ingin meng-approve verifikasi KYC ini? User akan langsung terverifikasi.')) return;
    setActionLoading(true);
    try {
      await api.patch(`/kyc/admin/${kycId}/review`, { approved: true });
      await fetchDetail();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Alasan penolakan wajib diisi');
      return;
    }
    setActionLoading(true);
    try {
      await api.patch(`/kyc/admin/${kycId}/review`, {
        approved: false,
        rejectionReason: rejectReason.trim(),
      });
      setShowRejectForm(false);
      setRejectReason('');
      await fetchDetail();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal reject');
    } finally {
      setActionLoading(false);
    }
  };

  const isPending = kyc?.status === 'PENDING' || kyc?.status === 'IN_REVIEW';

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !kyc) {
    return (
      <AdminLayout>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <p className="text-red-400">{error || 'Data KYC tidak ditemukan'}</p>
          <Link href="/users?tab=kyc" className="mt-3 inline-block text-sm text-brand-400 hover:underline">
            ← Kembali ke daftar
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Fullscreen image modal */}
        {fullscreenImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/90 p-4"
            onClick={() => setFullscreenImage(null)}
          >
            <img
              src={fullscreenImage}
              alt="Document"
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            />
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute right-4 top-4 rounded-full bg-dark-800 p-2 text-dark-300 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/users?tab=kyc" className="text-xs text-dark-500 hover:text-brand-400">
              ← Kembali ke Verifikasi KYC
            </Link>
            <h1 className="mt-2 text-2xl font-light tracking-wide text-dark-100">
              Detail Verifikasi KYC
            </h1>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusColors[kyc.status]}`}>
            {statusLabels[kyc.status] || kyc.status}
          </span>
        </div>

        {/* User Info Card */}
        <div className="rounded-xl border border-dark-700/50 bg-dark-800/30 p-6">
          <div className="flex items-start gap-4">
            {kyc.user?.profilePhoto ? (
              <img
                src={kyc.user.profilePhoto}
                alt=""
                className="h-16 w-16 rounded-full object-cover ring-2 ring-dark-700/50"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dark-700/50 ring-2 ring-dark-700/50">
                <span className="text-2xl text-dark-400">{kyc.user?.firstName?.[0] || '?'}</span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-medium text-dark-100">
                {kyc.user?.firstName} {kyc.user?.lastName}
              </h2>
              <p className="text-sm text-dark-400">{kyc.user?.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded bg-dark-700/50 px-2 py-0.5 text-xs text-dark-300">
                  {kyc.user?.role}
                </span>
                {kyc.user?.phone && (
                  <span className="rounded bg-dark-700/50 px-2 py-0.5 text-xs text-dark-300">
                    {kyc.user.phone}
                  </span>
                )}
                <span className={`rounded px-2 py-0.5 text-xs ${
                  kyc.user?.isVerified
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {kyc.user?.isVerified ? <><CheckCircle2 className="h-3 w-3 inline-block" /> Terverifikasi</> : '○ Belum Verifikasi'}
                </span>
              </div>
              {kyc.user?.createdAt && (
                <p className="mt-1 text-xs text-dark-500">
                  Bergabung {formatDate(kyc.user.createdAt)}
                </p>
              )}
            </div>
            <Link
              href={`/users/${kyc.userId}`}
              className="rounded-lg border border-dark-700/30 px-3 py-1.5 text-xs text-dark-400 hover:text-brand-400"
            >
              Lihat Profil →
            </Link>
          </div>
        </div>

        {/* Verification Details Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Document Images */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-dark-300">Dokumen Identitas</h3>

            <div className="rounded-xl border border-dark-700/50 bg-dark-800/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-dark-400">Tipe Dokumen</span>
                <span className="text-sm text-dark-200">{docTypeLabels[kyc.documentType] || kyc.documentType}</span>
              </div>

              {kyc.documentNumber && (
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-dark-400">Nomor Dokumen</span>
                  <span className="font-mono text-sm text-dark-200">{kyc.documentNumber}</span>
                </div>
              )}

              {/* Document Front */}
              <div className="mt-4">
                <p className="mb-2 text-xs text-dark-500">Foto Dokumen (Depan)</p>
                {kyc.documentFrontUrl ? (
                  <button
                    onClick={() => setFullscreenImage(kyc.documentFrontUrl)}
                    className="relative w-full overflow-hidden rounded-lg border border-dark-700/50 transition-opacity hover:opacity-80"
                  >
                    <img
                      src={kyc.documentFrontUrl}
                      alt="Document Front"
                      className="w-full rounded-lg object-contain"
                      style={{ maxHeight: '300px' }}
                    />
                    <span className="absolute bottom-2 right-2 rounded bg-dark-900/80 px-2 py-0.5 text-2xs text-dark-300">
                      Klik untuk perbesar
                    </span>
                  </button>
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-lg bg-dark-700/30">
                    <span className="text-xs text-dark-500">Tidak ada foto</span>
                  </div>
                )}
              </div>

              {/* Document Back */}
              {kyc.documentBackUrl && (
                <div className="mt-4">
                  <p className="mb-2 text-xs text-dark-500">Foto Dokumen (Belakang)</p>
                  <button
                    onClick={() => setFullscreenImage(kyc.documentBackUrl!)}
                    className="relative w-full overflow-hidden rounded-lg border border-dark-700/50 transition-opacity hover:opacity-80"
                  >
                    <img
                      src={kyc.documentBackUrl}
                      alt="Document Back"
                      className="w-full rounded-lg object-contain"
                      style={{ maxHeight: '300px' }}
                    />
                    <span className="absolute bottom-2 right-2 rounded bg-dark-900/80 px-2 py-0.5 text-2xs text-dark-300">
                      Klik untuk perbesar
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Selfie */}
            <div className="rounded-xl border border-dark-700/50 bg-dark-800/30 p-4">
              <p className="mb-2 text-xs text-dark-500">Foto Selfie</p>
              {kyc.selfieUrl ? (
                <button
                  onClick={() => setFullscreenImage(kyc.selfieUrl!)}
                  className="relative w-full overflow-hidden rounded-lg border border-dark-700/50 transition-opacity hover:opacity-80"
                >
                  <img
                    src={kyc.selfieUrl}
                    alt="Selfie"
                    className="mx-auto max-h-64 rounded-lg object-contain"
                  />
                  <span className="absolute bottom-2 right-2 rounded bg-dark-900/80 px-2 py-0.5 text-2xs text-dark-300">
                    Klik untuk perbesar
                  </span>
                </button>
              ) : (
                <div className="flex h-32 items-center justify-center rounded-lg bg-dark-700/30">
                  <span className="text-xs text-dark-500">Tidak ada foto selfie</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Scores & Metadata */}
          <div className="space-y-4">
            {/* Verification Scores */}
            <h3 className="text-sm font-medium text-dark-300">Skor Verifikasi</h3>
            <div className="rounded-xl border border-dark-700/50 bg-dark-800/30 p-4 space-y-4">
              <ScoreBar label="Liveness Detection" score={kyc.livenessScore} />
              <ScoreBar label="Face Match" score={kyc.faceMatchScore} />

              {kyc.livenessScore == null && kyc.faceMatchScore == null && (
                <p className="text-center text-xs text-dark-500 py-4">
                  Skor verifikasi belum tersedia
                </p>
              )}

              {kyc.livenessScore != null && kyc.faceMatchScore != null && (
                <div className="border-t border-dark-700/30 pt-3">
                  <div className="flex items-center gap-2">
                    {kyc.livenessScore >= 80 && kyc.faceMatchScore >= 80 ? (
                      <>
                        <span className="text-emerald-400"><Check className="h-4 w-4" /></span>
                        <span className="text-xs text-emerald-400">Memenuhi threshold auto-approval (≥80%)</span>
                      </>
                    ) : (
                      <>
                        <span className="text-amber-400"><AlertTriangle className="h-4 w-4" /></span>
                        <span className="text-xs text-amber-400">Di bawah threshold auto-approval — perlu review manual</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* OCR Data */}
            {kyc.ocrData && Object.keys(kyc.ocrData).length > 0 && (
              <>
                <h3 className="text-sm font-medium text-dark-300">Data OCR (Extracted)</h3>
                <div className="rounded-xl border border-dark-700/50 bg-dark-800/30 p-4">
                  <div className="space-y-2">
                    {Object.entries(kyc.ocrData).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-dark-400 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-dark-200">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Metadata */}
            <h3 className="text-sm font-medium text-dark-300">Metadata</h3>
            <div className="rounded-xl border border-dark-700/50 bg-dark-800/30 p-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-dark-400">Percobaan Ke-</span>
                  <span className="text-dark-200">{kyc.attemptNumber}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-dark-400">Diajukan</span>
                  <span className="text-dark-200">{formatDate(kyc.createdAt)}</span>
                </div>
                {kyc.reviewedAt && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-dark-400">Ditinjau</span>
                    <span className="text-dark-200">{formatDate(kyc.reviewedAt)}</span>
                  </div>
                )}
                {kyc.verifiedAt && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-dark-400">Terverifikasi</span>
                    <span className="text-emerald-400">{formatDate(kyc.verifiedAt)}</span>
                  </div>
                )}
                {kyc.expiresAt && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-dark-400">Kedaluwarsa</span>
                    <span className="text-dark-200">{formatDate(kyc.expiresAt)}</span>
                  </div>
                )}
                {kyc.providerRef && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-dark-400">Provider Ref</span>
                    <span className="font-mono text-dark-200">{kyc.providerRef}</span>
                  </div>
                )}
                {kyc.ipAddress && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-dark-400">IP Address</span>
                    <span className="font-mono text-dark-200">{kyc.ipAddress}</span>
                  </div>
                )}
                {kyc.rejectionReason && (
                  <div className="border-t border-dark-700/30 pt-2">
                    <span className="text-xs text-dark-400">Alasan Ditolak</span>
                    <p className="mt-1 text-xs text-red-400">{kyc.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {isPending && (
              <>
                <h3 className="text-sm font-medium text-dark-300">Tindakan</h3>
                <div className="rounded-xl border border-dark-700/50 bg-dark-800/30 p-4 space-y-3">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="w-full rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {actionLoading ? 'Memproses...' : <><Check className="h-4 w-4 inline-block" /> Approve — Verifikasi User</>}
                  </button>

                  {!showRejectForm ? (
                    <button
                      onClick={() => setShowRejectForm(true)}
                      className="w-full rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/20"
                    >
                      <X className="h-4 w-4 inline-block" /> Tolak Verifikasi
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Alasan penolakan (wajib)..."
                        rows={3}
                        className="w-full rounded-lg border border-dark-700/30 bg-dark-800/50 px-3 py-2 text-sm text-dark-200 placeholder-dark-500 focus:border-red-500/50 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleReject}
                          disabled={actionLoading || !rejectReason.trim()}
                          className="flex-1 rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/30 disabled:opacity-50"
                        >
                          {actionLoading ? 'Memproses...' : 'Konfirmasi Tolak'}
                        </button>
                        <button
                          onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                          className="rounded-lg border border-dark-700/30 px-3 py-2 text-xs text-dark-400 hover:text-dark-200"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Already reviewed */}
            {kyc.status === 'VERIFIED' && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                <p className="text-sm text-emerald-400"><CheckCircle2 className="h-4 w-4 inline-block" /> KYC sudah terverifikasi</p>
                {kyc.verifiedAt && (
                  <p className="mt-1 text-xs text-dark-500">pada {formatDate(kyc.verifiedAt)}</p>
                )}
              </div>
            )}

            {kyc.status === 'REJECTED' && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                <p className="text-sm text-red-400"><X className="h-4 w-4 inline-block" /> KYC ditolak</p>
                {kyc.rejectionReason && (
                  <p className="mt-1 text-xs text-dark-400">"{kyc.rejectionReason}"</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* KYC History */}
        {kyc.history && kyc.history.length > 1 && (
          <div>
            <h3 className="mb-3 text-sm font-medium text-dark-300">Riwayat Verifikasi</h3>
            <div className="rounded-xl border border-dark-700/50 bg-dark-800/30 p-4">
              <div className="space-y-3">
                {kyc.history.map((h, i) => (
                  <div key={h.id} className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                      h.status === 'VERIFIED' ? 'bg-emerald-400'
                        : h.status === 'REJECTED' ? 'bg-red-400'
                        : 'bg-amber-400'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-dark-200">
                          Percobaan #{h.attemptNumber} — {statusLabels[h.status] || h.status}
                        </span>
                        <span className="text-2xs text-dark-500">
                          {docTypeLabels[h.documentType] || h.documentType}
                        </span>
                      </div>
                      {h.rejectionReason && (
                        <p className="mt-0.5 text-xs text-red-400">"{h.rejectionReason}"</p>
                      )}
                      <p className="text-2xs text-dark-500">{formatDate(h.createdAt)}</p>
                    </div>
                    {h.id === kyc.id && (
                      <span className="rounded bg-brand-400/10 px-1.5 py-0.5 text-2xs text-brand-400">
                        Current
                      </span>
                    )}
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
