'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { WizardShell, WizardStep, StepIndicator, WizardNavigation } from '@/components/ui/wizard';
import api from '@/lib/api';
import Link from 'next/link';
import { Check, KeyRound, Lightbulb, Lock, X } from 'lucide-react';
import { Icon } from '@/components/ui/icon';

type KycStatus = 'NONE' | 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED';

interface KycInfo {
  status: KycStatus;
  documentType?: string;
  rejectionReason?: string;
  verifiedAt?: string;
  attemptNumber?: number;
  submittedAt?: string;
}

const statusConfig: Record<KycStatus, { label: string; color: string; icon: string; description: string }> = {
  NONE: {
    label: 'Belum Verifikasi',
    color: 'bg-dark-700/30 text-dark-400 border-dark-600/30',
    icon: 'Unlock',
    description: 'Akun Anda belum diverifikasi. Lengkapi verifikasi identitas untuk menggunakan semua fitur.',
  },
  PENDING: {
    label: 'Menunggu Review',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: 'Hourglass',
    description: 'Dokumen Anda sedang dalam antrian review. Proses ini biasanya memakan waktu 1-24 jam.',
  },
  IN_REVIEW: {
    label: 'Sedang Direview',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: 'Search',
    description: 'Tim kami sedang memeriksa dokumen Anda. Anda akan mendapat notifikasi setelah selesai.',
  },
  VERIFIED: {
    label: 'Terverifikasi',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: 'CheckCircle2',
    description: 'Identitas Anda telah diverifikasi. Anda memiliki akses penuh ke semua fitur platform.',
  },
  REJECTED: {
    label: 'Ditolak',
    color: 'bg-red-500/10 text-red-400 border-red-500/20',
    icon: 'XCircle',
    description: 'Verifikasi identitas Anda ditolak. Silakan ajukan ulang dengan dokumen yang valid.',
  },
};

const documentTypes = [
  { value: 'KTP', label: 'KTP (Kartu Tanda Penduduk)', emoji: '🪪' },
  { value: 'PASSPORT', label: 'Paspor', emoji: '📘' },
  { value: 'SIM', label: 'SIM (Surat Izin Mengemudi)', emoji: '🚗' },
  { value: 'KITAS', label: 'KITAS (Kartu Ijin Tinggal)', emoji: '🏠' },
];

export default function VerificationPage() {
  const { user, fetchProfile } = useAuthStore();
  const [kycInfo, setKycInfo] = useState<KycInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form
  const [documentType, setDocumentType] = useState('KTP');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentFront, setDocumentFront] = useState<File | null>(null);
  const [documentBack, setDocumentBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadKycStatus();
  }, []);

  const loadKycStatus = async () => {
    try {
      const res = await api.get('/kyc/status');
      const data = res.data?.data || res.data;
      setKycInfo({
        status: data?.currentStatus || (data?.isVerified ? 'VERIFIED' : 'NONE'),
        documentType: data?.latestVerification?.documentType,
        rejectionReason: data?.latestVerification?.rejectionReason,
        verifiedAt: data?.latestVerification?.verifiedAt || data?.latestVerification?.reviewedAt,
        attemptNumber: data?.totalAttempts,
        submittedAt: data?.latestVerification?.submittedAt || data?.latestVerification?.createdAt,
      });
    } catch {
      setKycInfo({ status: user?.isVerified ? 'VERIFIED' : 'NONE' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!documentFront || !selfie) {
      setError('Foto dokumen depan dan selfie wajib diupload');
      return;
    }
    if (documentType === 'KTP' && !documentBack) {
      setError('Foto KTP bagian belakang wajib diupload');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('documentType', documentType);
      if (documentNumber) formData.append('documentNumber', documentNumber);
      formData.append('documentFront', documentFront);
      if (documentBack) formData.append('documentBack', documentBack);
      formData.append('selfie', selfie);

      await api.post('/kyc/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess('Dokumen berhasil dikirim! Tim kami akan mereview dalam 1-24 jam.');
      await loadKycStatus();
      await fetchProfile();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal mengirim dokumen verifikasi');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFilePreview = (file: File | null) => {
    if (!file) return null;
    return (
      <div className="mt-2 flex items-center gap-2 rounded-lg bg-dark-700/30 px-3 py-2">
        <Check className="h-4 w-4 text-emerald-400" />
        <span className="text-xs text-dark-300 truncate">{file.name}</span>
        <span className="text-xs text-dark-500">({(file.size / 1024).toFixed(0)} KB)</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  const currentStatus = kycInfo?.status || 'NONE';
  const config = statusConfig[currentStatus];
  const canSubmit = currentStatus === 'NONE' || currentStatus === 'REJECTED';
  const stepLabels = ['Dokumen', 'Upload Foto', 'Selfie', 'Review'];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <Link href="/user/profile" className="text-sm text-dark-500 hover:text-dark-300 transition-colors">
          ← Kembali ke Profil
        </Link>
        <h1 className="mt-3 text-2xl font-light text-dark-100">Verifikasi Identitas</h1>
        <p className="mt-1 text-sm text-dark-400">
          Verifikasi identitas Anda untuk keamanan dan akses penuh ke fitur platform
        </p>
      </div>

      {success && (
        <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Current Status Card */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl"><Icon name={config.icon} className="h-8 w-8" /></span>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-medium text-dark-100">Status Verifikasi</h3>
                <span className={`rounded-full border px-3 py-0.5 text-xs font-medium ${config.color}`}>
                  {config.label}
                </span>
              </div>
              <p className="mt-2 text-sm text-dark-400">{config.description}</p>

              {currentStatus === 'REJECTED' && kycInfo?.rejectionReason && (
                <div className="mt-3 rounded-lg bg-red-500/5 border border-red-500/10 px-4 py-3">
                  <p className="text-xs font-medium text-red-400">Alasan Penolakan:</p>
                  <p className="mt-1 text-sm text-dark-300">{kycInfo.rejectionReason}</p>
                </div>
              )}

              {currentStatus === 'VERIFIED' && kycInfo?.verifiedAt && (
                <p className="mt-2 text-xs text-dark-500">
                  Diverifikasi pada: {new Date(kycInfo.verifiedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}

              {(currentStatus === 'PENDING' || currentStatus === 'IN_REVIEW') && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                  <span className="text-xs text-dark-500">Estimasi waktu: 1-24 jam kerja</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Benefits */}
      {currentStatus !== 'VERIFIED' && (
        <Card className="mb-6">
          <CardHeader>
            <h3 className="text-sm font-medium text-dark-200">Mengapa Perlu Verifikasi?</h3>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: 'Shield', emoji: '🛡️', title: 'Keamanan Akun', desc: 'Lindungi akun dari penyalahgunaan' },
                { icon: 'Sparkles', emoji: '✨', title: 'Akses Premium', desc: 'Booking partner tier tinggi' },
                { icon: 'MessageCircle', emoji: '💬', title: 'Kepercayaan', desc: 'Badge verified saat booking' },
                { icon: 'Zap', emoji: '⚡', title: 'Prioritas', desc: 'Konfirmasi booking lebih cepat' },
              ].map((b) => (
                <div key={b.title} className="flex items-start gap-3 rounded-lg bg-dark-800/30 p-3">
                  <span className="text-lg">{b.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-dark-200">{b.title}</p>
                    <p className="text-xs text-dark-500">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wizard Form */}
      {canSubmit && (
        <WizardShell totalSteps={4}>
          {({ currentStep, next, prev, direction }) => (
            <div className="rounded-2xl border border-dark-700/30 bg-dark-900/80 p-6">
              <div className="mb-6 text-center">
                <h3 className="text-lg font-medium text-dark-100">
                  {currentStatus === 'REJECTED' ? 'Ajukan Ulang Verifikasi' : 'Mulai Verifikasi'}
                </h3>
                <p className="mt-1 text-sm text-dark-400">Siapkan dokumen identitas dan foto selfie Anda</p>
              </div>

              <StepIndicator currentStep={currentStep} totalSteps={4} labels={stepLabels} />

              {/* Step 1: Document Type */}
              <WizardStep step={0} currentStep={currentStep} direction={direction}>
                <div className="mx-auto max-w-md space-y-5">
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10">
                      <span className="text-3xl">🪪</span>
                    </div>
                    <h4 className="text-xl font-light text-dark-100">Pilih Jenis Dokumen</h4>
                    <p className="mt-1 text-sm text-dark-400">Dokumen resmi yang akan digunakan untuk verifikasi</p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {documentTypes.map((dt) => (
                      <button
                        type="button"
                        key={dt.value}
                        onClick={() => setDocumentType(dt.value)}
                        className={`rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                          documentType === dt.value
                            ? 'border-brand-400/50 bg-brand-400/5 text-brand-400 ring-1 ring-brand-400/20'
                            : 'border-dark-700/30 bg-dark-800/20 text-dark-300 hover:border-dark-600/50'
                        }`}
                      >
                        <span className="mr-2">{dt.emoji}</span>
                        {dt.label}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-dark-300">
                      Nomor Dokumen <span className="text-dark-600">(opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder={documentType === 'KTP' ? 'Nomor NIK' : 'Nomor dokumen'}
                      className="w-full rounded-lg border border-dark-700/30 bg-dark-800/30 px-4 py-2.5 text-sm text-dark-200 placeholder-dark-600 outline-none focus:border-brand-400/50 focus:ring-1 focus:ring-brand-400/20"
                    />
                    <p className="mt-1 flex items-center gap-1 text-xs text-dark-600">
                      <Lock className="h-3 w-3" /> Nomor dokumen dienkripsi dan dilindungi
                    </p>
                  </div>

                  <WizardNavigation currentStep={0} totalSteps={4} onNext={next} onPrev={prev} />
                </div>
              </WizardStep>

              {/* Step 2: Document Photos */}
              <WizardStep step={1} currentStep={currentStep} direction={direction}>
                <div className="mx-auto max-w-md space-y-5">
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10">
                      <span className="text-3xl">📸</span>
                    </div>
                    <h4 className="text-xl font-light text-dark-100">Upload Foto Dokumen</h4>
                    <p className="mt-1 text-sm text-dark-400">Pastikan foto jelas dan tidak terpotong</p>
                  </div>

                  {/* Front */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-dark-300">
                      Foto Dokumen (Depan) <span className="text-red-400">*</span>
                    </label>
                    <input
                      ref={frontRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setDocumentFront(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => frontRef.current?.click()}
                      className={`flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-sm transition-colors ${
                        documentFront
                          ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
                          : 'border-dark-700/50 bg-dark-800/20 text-dark-400 hover:border-brand-400/30 hover:text-dark-300'
                      }`}
                    >
                      <span className="text-xl">{documentFront ? '✅' : '🖼️'}</span>
                      {documentFront ? 'Ganti foto' : 'Pilih foto dokumen depan'}
                    </button>
                    {renderFilePreview(documentFront)}
                    <p className="mt-1 text-xs text-dark-600">Format: JPG, PNG, atau WebP. Maks 5MB</p>
                  </div>

                  {/* Back (required for KTP) */}
                  {documentType === 'KTP' && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-dark-300">
                        Foto Dokumen (Belakang) <span className="text-red-400">*</span>
                      </label>
                      <input
                        ref={backRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => setDocumentBack(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => backRef.current?.click()}
                        className={`flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-sm transition-colors ${
                          documentBack
                            ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
                            : 'border-dark-700/50 bg-dark-800/20 text-dark-400 hover:border-brand-400/30 hover:text-dark-300'
                        }`}
                      >
                        <span className="text-xl">{documentBack ? '✅' : '🖼️'}</span>
                        {documentBack ? 'Ganti foto' : 'Pilih foto dokumen belakang'}
                      </button>
                      {renderFilePreview(documentBack)}
                    </div>
                  )}

                  <WizardNavigation
                    currentStep={1}
                    totalSteps={4}
                    onNext={() => {
                      if (!documentFront) {
                        setError('Upload foto dokumen depan terlebih dahulu');
                        return false;
                      }
                      if (documentType === 'KTP' && !documentBack) {
                        setError('Upload foto KTP belakang terlebih dahulu');
                        return false;
                      }
                      setError('');
                      next();
                    }}
                    onPrev={prev}
                    nextDisabled={!documentFront || (documentType === 'KTP' && !documentBack)}
                  />
                </div>
              </WizardStep>

              {/* Step 3: Selfie */}
              <WizardStep step={2} currentStep={currentStep} direction={direction}>
                <div className="mx-auto max-w-md space-y-5">
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10">
                      <span className="text-3xl">🤳</span>
                    </div>
                    <h4 className="text-xl font-light text-dark-100">Foto Selfie</h4>
                    <p className="mt-1 text-sm text-dark-400">Verifikasi bahwa Anda pemilik dokumen</p>
                  </div>

                  <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 px-4 py-3">
                    <p className="text-sm text-blue-400 font-medium">
                      <Lightbulb className="h-4 w-4 inline-block mr-1" /> Tips Selfie yang Baik
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-dark-400">
                      <li>• Pastikan wajah terlihat jelas dan tidak terhalang</li>
                      <li>• Gunakan pencahayaan yang cukup</li>
                      <li>• Jangan menggunakan filter atau efek</li>
                      <li>• Foto harus terbaru (bukan foto lama)</li>
                    </ul>
                  </div>

                  <div>
                    <input
                      ref={selfieRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setSelfie(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => selfieRef.current?.click()}
                      className={`flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 text-sm transition-colors ${
                        selfie
                          ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
                          : 'border-dark-700/50 bg-dark-800/20 text-dark-400 hover:border-brand-400/30 hover:text-dark-300'
                      }`}
                    >
                      <span className="text-2xl">{selfie ? '✅' : '📷'}</span>
                      {selfie ? 'Ganti selfie' : 'Ambil foto selfie'}
                    </button>
                    {renderFilePreview(selfie)}
                  </div>

                  <WizardNavigation
                    currentStep={2}
                    totalSteps={4}
                    onNext={next}
                    onPrev={prev}
                    nextDisabled={!selfie}
                  />
                </div>
              </WizardStep>

              {/* Step 4: Review & Submit */}
              <WizardStep step={3} currentStep={currentStep} direction={direction}>
                <div className="mx-auto max-w-md space-y-5">
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10">
                      <span className="text-3xl">📋</span>
                    </div>
                    <h4 className="text-xl font-light text-dark-100">Review & Kirim</h4>
                    <p className="mt-1 text-sm text-dark-400">Periksa kembali sebelum mengirim</p>
                  </div>

                  <div className="space-y-3 rounded-lg bg-dark-800/30 p-4">
                    <div className="flex items-center justify-between border-b border-dark-700/20 pb-2">
                      <span className="text-xs text-dark-500">Jenis Dokumen</span>
                      <span className="text-sm text-dark-200">
                        {documentTypes.find(d => d.value === documentType)?.emoji}{' '}
                        {documentTypes.find(d => d.value === documentType)?.label}
                      </span>
                    </div>
                    {documentNumber && (
                      <div className="flex items-center justify-between border-b border-dark-700/20 pb-2">
                        <span className="text-xs text-dark-500">Nomor Dokumen</span>
                        <span className="text-sm text-dark-200">****{documentNumber.slice(-4)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-b border-dark-700/20 pb-2">
                      <span className="text-xs text-dark-500">Foto Depan</span>
                      <span className={documentFront ? 'text-emerald-400' : 'text-red-400'}>
                        {documentFront ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </span>
                    </div>
                    {documentType === 'KTP' && (
                      <div className="flex items-center justify-between border-b border-dark-700/20 pb-2">
                        <span className="text-xs text-dark-500">Foto Belakang</span>
                        <span className={documentBack ? 'text-emerald-400' : 'text-red-400'}>
                          {documentBack ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-dark-500">Foto Selfie</span>
                      <span className={selfie ? 'text-emerald-400' : 'text-red-400'}>
                        {selfie ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-brand-400/5 border border-brand-400/10 px-4 py-3">
                    <p className="text-xs text-dark-400">
                      <Lock className="h-3 w-3 inline-block mr-1 text-brand-400" />
                      Dengan mengirim, Anda menyetujui bahwa data akan diproses sesuai kebijakan privasi kami.
                    </p>
                  </div>

                  <WizardNavigation
                    currentStep={3}
                    totalSteps={4}
                    onNext={() => { handleSubmit(); return false; }}
                    onPrev={prev}
                    nextLabel={submitting ? 'Mengirim...' : '🔒 Kirim untuk Verifikasi'}
                    nextDisabled={submitting || !documentFront || !selfie}
                    isLoading={submitting}
                  />
                </div>
              </WizardStep>
            </div>
          )}
        </WizardShell>
      )}

      {/* Security Info */}
      <div className="mt-6 rounded-lg border border-dark-700/20 bg-dark-800/10 px-4 py-3">
        <div className="flex items-start gap-2">
          <KeyRound className="h-4 w-4 text-dark-500" />
          <div>
            <p className="text-xs font-medium text-dark-400">Keamanan Data</p>
            <p className="mt-0.5 text-xs text-dark-600">
              Dokumen Anda dienkripsi (AES-256) dan hanya digunakan untuk verifikasi identitas.
              Data akan dihapus setelah proses verifikasi selesai sesuai kebijakan privasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
