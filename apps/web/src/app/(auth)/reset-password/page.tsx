'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { WizardShell, WizardStep, StepIndicator, WizardNavigation } from '@/components/ui/wizard';

const STEPS = [{ label: 'Password' }, { label: 'Konfirmasi' }, { label: 'Selesai' }];

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [goToSuccess, setGoToSuccess] = useState<(() => void) | null>(null);

  const passwordStrength = (() => {
    if (password.length === 0) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthColors = ['bg-red-500', 'bg-amber-500', 'bg-brand-400', 'bg-emerald-500'];
  const strengthLabels = ['Lemah', 'Cukup', 'Baik', 'Kuat'];

  const handleSubmit = async () => {
    setError('');
    if (password !== confirmPassword) {
      setError('Password tidak cocok.');
      return;
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      goToSuccess?.();
      goToSuccess?.();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Token tidak valid atau telah kadaluarsa.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-light text-dark-100">Token Tidak Ditemukan</h2>
        <p className="text-sm text-dark-400">Link reset password tidak valid. Silakan minta ulang link baru.</p>
        <Link href="/forgot-password" className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors">
          Minta Link Baru
        </Link>
      </div>
    );
  }

  return (
    <WizardShell totalSteps={3}>
      {({ currentStep, next }) => {
        if (!goToSuccess) setGoToSuccess(() => next);
        return (
          <>
            <StepIndicator steps={STEPS} current={currentStep} className="mb-8" />

            {/* Step 1: New password */}
            <WizardStep step={0}>
              <div className="space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10">
                  <svg className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-light text-dark-100">Password Baru</h2>
                  <p className="mt-1 text-sm text-dark-400">Buat password baru yang kuat untuk akun Anda</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark-300">Password Baru</label>
                  <Input
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                  {password.length > 0 && (
                    <div className="mt-3">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-dark-700/50'}`} />
                        ))}
                      </div>
                      <p className={`mt-1 text-xs ${passwordStrength >= 3 ? 'text-emerald-400' : passwordStrength >= 2 ? 'text-brand-400' : 'text-amber-400'}`}>
                        {strengthLabels[passwordStrength - 1] || 'Sangat Lemah'}
                      </p>
                    </div>
                  )}
                </div>

                <WizardNavigation nextDisabled={password.length < 8} nextLabel="Lanjut →" showPrev={false} />
              </div>
            </WizardStep>

            {/* Step 2: Confirm password */}
            <WizardStep step={1}>
              <div className="space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10">
                  <svg className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-light text-dark-100">Konfirmasi Password</h2>
                  <p className="mt-1 text-sm text-dark-400">Ketik ulang password baru Anda</p>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark-300">Konfirmasi Password</label>
                  <Input
                    type="password"
                    placeholder="Ketik ulang password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoFocus
                  />
                  {confirmPassword && confirmPassword !== password && (
                    <p className="mt-1 text-xs text-red-400">Password tidak cocok</p>
                  )}
                </div>

                <WizardNavigation
                  nextLabel={isLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
                  nextDisabled={!confirmPassword || confirmPassword !== password || isLoading}
                  onNext={() => { handleSubmit(); return false; }}
                />
              </div>
            </WizardStep>

            {/* Step 3: Success */}
            <WizardStep step={2}>
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-light text-dark-100">Password Berhasil Direset</h2>
                  <p className="mt-2 text-sm text-dark-400">
                    Password Anda telah diperbarui. Silakan masuk dengan password baru.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="inline-block rounded-lg bg-brand-400 px-8 py-3 text-sm font-medium text-dark-900 hover:bg-brand-300 transition-colors"
                >
                  Masuk Sekarang
                </Link>
              </div>
            </WizardStep>
          </>
        );
      }}
    </WizardShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center text-dark-400">Memuat...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
