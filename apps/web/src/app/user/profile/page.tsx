'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { WizardShell, WizardStep, StepIndicator, WizardNavigation } from '@/components/ui/wizard';
import api from '@/lib/api';
import Link from 'next/link';
import { Check, CheckCircle2, Lock, Shield } from 'lucide-react';

export default function ClientProfilePage() {
  const { user, fetchProfile } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [kycStatus, setKycStatus] = useState<string>('NONE');
  const avatarRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: (user as any).phone || '',
      });
    }
  }, [user]);

  useEffect(() => {
    api.get('/kyc/status')
      .then(res => {
        const data = res.data?.data || res.data;
        setKycStatus(data?.currentStatus || (data?.isVerified ? 'VERIFIED' : 'NONE'));
      })
      .catch(() => {
        // Fallback: if KYC endpoint fails, use user.isVerified from auth store
        if (user?.isVerified) setKycStatus('VERIFIED');
      });
  }, [user?.isVerified]);

  const handleAvatarUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Format file harus JPG, PNG, atau WebP');
      return;
    }

    setUploadingAvatar(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchProfile();
      setSuccess('Foto profil berhasil diperbarui');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal mengupload foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.patch('/users/me', form);
      await fetchProfile();
      setSuccess('Profil berhasil diperbarui');
      setIsEditing(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setIsLoading(false);
    }
  };

  const kycConfig: Record<string, { label: string; color: string; action?: string }> = {
    NONE: { label: 'Belum Verifikasi', color: 'bg-dark-700/30 text-dark-400 border-dark-600/30', action: 'Verifikasi Sekarang' },
    PENDING: { label: 'Menunggu Review', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    IN_REVIEW: { label: 'Sedang Direview', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    VERIFIED: { label: 'Terverifikasi', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    REJECTED: { label: 'Ditolak', color: 'bg-red-500/10 text-red-400 border-red-500/20', action: 'Ajukan Ulang' },
  };
  const kyc = kycConfig[kycStatus] || kycConfig.NONE;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-light text-dark-100">Profil Saya</h1>
        <p className="mt-1 text-sm text-dark-400">Kelola informasi akun Anda</p>
      </div>

      {success && (
        <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Avatar Section */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              {user?.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt="Profile"
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-brand-400/30"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-400/10 ring-2 ring-brand-400/30">
                  <span className="text-2xl font-medium text-brand-400">
                    {user?.firstName?.[0] || 'U'}
                  </span>
                </div>
              )}
              <input
                ref={avatarRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                  e.target.value = '';
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => avatarRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
              >
                {uploadingAvatar ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-dark-100">
                  {user?.firstName} {user?.lastName}
                </h3>
                {user?.isVerified && (
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    <Check className="h-4 w-4 inline-block" /> Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-dark-400">{user?.email}</p>
              <p className="mt-1 text-xs text-dark-500">
                {user?.role === 'CLIENT' ? 'Client' : user?.role}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KYC Verification Status */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {kycStatus === 'VERIFIED' ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <Shield className="h-5 w-5 text-dark-400" />}
              <div>
                <p className="text-sm font-medium text-dark-200">Verifikasi Identitas (KYC)</p>
                <span className={`mt-0.5 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${kyc.color}`}>
                  {kyc.label}
                </span>
              </div>
            </div>
            {kyc.action && (
              <Link href="/user/profile/verification">
                <Button size="sm" variant="outline">{kyc.action}</Button>
              </Link>
            )}
            {kycStatus === 'VERIFIED' && (
              <Link href="/user/profile/verification" className="text-xs text-dark-500 hover:text-dark-300">
                Lihat Detail →
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-dark-100">Informasi Personal</h3>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit Profil
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <WizardShell totalSteps={2}>
              <StepIndicator labels={['Edit Info', 'Review & Simpan']} />

              <WizardStep step={0}>
                <div className="text-center mb-6">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-400/10">
                    <span className="text-2xl">✏️</span>
                  </div>
                  <h3 className="text-lg font-light text-dark-100">Informasi Pribadi</h3>
                  <p className="mt-1 text-sm text-dark-400">Perbarui nama dan nomor telepon Anda</p>
                </div>

                <div className="mx-auto max-w-md space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-dark-300">Nama Depan</label>
                    <Input
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-dark-300">Nama Belakang</label>
                    <Input
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-dark-300">No. Telepon</label>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+6281234567890"
                    />
                  </div>
                </div>

                <WizardNavigation
                  prevLabel="Batal"
                  onPrev={() => { setIsEditing(false); setError(''); }}
                  onNext={() => {
                    if (!form.firstName.trim() || !form.lastName.trim()) {
                      setError('Nama depan dan belakang harus diisi');
                      return false;
                    }
                    setError('');
                  }}
                />
              </WizardStep>

              <WizardStep step={1}>
                <div className="text-center mb-6">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-400/10">
                    <span className="text-2xl">📋</span>
                  </div>
                  <h3 className="text-lg font-light text-dark-100">Review & Simpan</h3>
                  <p className="mt-1 text-sm text-dark-400">Pastikan data Anda sudah benar</p>
                </div>

                <div className="mx-auto max-w-md space-y-3">
                  {[
                    { label: 'Nama Depan', value: form.firstName },
                    { label: 'Nama Belakang', value: form.lastName },
                    { label: 'No. Telepon', value: form.phone || '-' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg border border-dark-700/30 bg-dark-800/20 px-4 py-3">
                      <span className="text-sm text-dark-400">{item.label}</span>
                      <span className="text-sm font-medium text-dark-200">{item.value}</span>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="mx-auto mt-4 max-w-md rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <WizardNavigation
                  nextLabel={isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  nextDisabled={isLoading}
                  onNext={() => { handleSubmit(); return false; }}
                />
              </WizardStep>
            </WizardShell>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Nama Depan', value: user?.firstName },
                { label: 'Nama Belakang', value: user?.lastName },
                { label: 'Email', value: user?.email },
                { label: 'Telepon', value: (user as any)?.phone || '-' },
                { label: 'Role', value: user?.role },
                { label: 'Status Verifikasi', value: user?.isVerified ? 'Terverifikasi' : 'Belum Terverifikasi' },
              ].map((field) => (
                <div key={field.label} className="flex items-center justify-between border-b border-dark-700/50 pb-3 last:border-0">
                  <span className="text-sm text-dark-400">{field.label}</span>
                  <span className="text-sm font-medium text-dark-200">{field.value || '-'}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href="/user/profile/security">
          <Card variant="outline" className="group cursor-pointer transition-all hover:border-brand-400/30">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium text-dark-200 group-hover:text-brand-400 transition-colors">Keamanan Akun</p>
                  <p className="text-xs text-dark-500">2FA, password, sesi aktif</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/user/profile/verification">
          <Card variant="outline" className="group cursor-pointer transition-all hover:border-brand-400/30">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium text-dark-200 group-hover:text-brand-400 transition-colors">Verifikasi Identitas</p>
                  <p className="text-xs text-dark-500">KYC, upload dokumen, status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
