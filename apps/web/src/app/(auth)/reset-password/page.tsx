'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { WizardShell, WizardStep, StepIndicator, WizardNavigation } from '@/components/ui/wizard';
import { RoseGlyph } from '@/components/brand/rose-glyph';

const STEPS = [{ label: 'Password' }, { label: 'Konfirmasi' }, { label: 'Selesai' }];

function PageHeader({ mark, title, description }: { mark: string; title: string; description: string }) {
  return (
    <header className="mb-10 space-y-5">
      <div className="flex items-center gap-3">
        <div className="text-gradient-rose-gold">
          <RoseGlyph className="h-8 w-8" strokeWidth={1.1} />
        </div>
        <div className="gold-rose-line flex-1" />
      </div>
      <p className="act-mark">{mark}</p>
      <h1 className="font-display text-3xl font-medium leading-tight text-dark-100">
        {title}
      </h1>
      <p className="font-serif text-base leading-relaxed text-dark-400">{description}</p>
    </header>
  );
}

function ResetPasswordContent() {
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

  const strengthColors = ['bg-rose-500', 'bg-amber-400', 'bg-brand-400', 'bg-emerald-400'];
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
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Token tidak valid atau telah kadaluarsa.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div>
        <PageHeader
          mark="Pemulihan Akun"
          title="Token tidak ditemukan"
          description="Link reset password tidak valid. Silakan minta link baru lewat halaman lupa password."
        />
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 text-sm text-rose-200 transition-colors hover:text-rose-100"
        >
          Minta Link Baru →
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
            <PageHeader
              mark="Pemulihan Akun"
              title="Reset password Anda"
              description="Buat password baru dan kembali masuk ke ruang Anda."
            />

            <StepIndicator steps={STEPS} current={currentStep} className="mb-8" />

            <WizardStep step={0}>
              <div className="space-y-6">
                <Input
                  label="Password Baru"
                  type="password"
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                {password.length > 0 && (
                  <div>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 transition-all ${
                            i < passwordStrength
                              ? strengthColors[passwordStrength - 1]
                              : 'bg-dark-700/50'
                          }`}
                        />
                      ))}
                    </div>
                    <p
                      className={`mt-1 text-xs ${
                        passwordStrength >= 3
                          ? 'text-emerald-400'
                          : passwordStrength >= 2
                          ? 'text-rose-200'
                          : 'text-amber-400'
                      }`}
                    >
                      {strengthLabels[passwordStrength - 1] || 'Sangat Lemah'}
                    </p>
                  </div>
                )}

                <WizardNavigation
                  nextDisabled={password.length < 8}
                  nextLabel="Lanjut"
                  showPrev={false}
                />
              </div>
            </WizardStep>

            <WizardStep step={1}>
              <div className="space-y-6">
                {error && (
                  <div className="border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {error}
                  </div>
                )}

                <Input
                  label="Konfirmasi Password"
                  type="password"
                  placeholder="Ketik ulang password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={
                    confirmPassword && confirmPassword !== password
                      ? 'Password tidak cocok'
                      : undefined
                  }
                  autoFocus
                />

                <WizardNavigation
                  nextLabel={isLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
                  nextDisabled={!confirmPassword || confirmPassword !== password || isLoading}
                  onNext={() => {
                    handleSubmit();
                    return false;
                  }}
                />
              </div>
            </WizardStep>

            <WizardStep step={2}>
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center border border-rose-400/30 text-rose-200">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="act-mark !text-rose-200">Selesai</p>
                  <h2 className="mt-3 font-display text-2xl font-medium text-dark-100">
                    Password Anda telah{' '}
                    <span className="italic text-gradient-rose-gold">diperbarui</span>
                  </h2>
                  <p className="mx-auto mt-4 max-w-md font-serif text-[15px] leading-relaxed text-dark-400">
                    Silakan masuk kembali dengan password baru.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="inline-block rounded-none bg-brand-400 px-10 py-4 text-[12px] font-bold uppercase tracking-widest-2 text-dark-900 transition-all hover:bg-brand-300"
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
