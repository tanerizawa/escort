'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { WizardShell, WizardStep, StepIndicator, WizardNavigation } from '@/components/ui/wizard';

const STEPS = [{ label: 'Email' }, { label: 'Terkirim' }];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [goToSent, setGoToSent] = useState<(() => void) | null>(null);

  const handleSubmit = async () => {
    setError('');
    setNotFound(false);
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      goToSent?.();
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || '';
      if (status === 404) {
        setNotFound(true);
      } else {
        setError(message || 'Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WizardShell totalSteps={2}>
      {({ currentStep, next }) => {
        if (!goToSent) setGoToSent(() => next);
        return (
          <>
            <StepIndicator steps={STEPS} current={currentStep} className="mb-8" />

            {/* Step 1: Enter email */}
            <WizardStep step={0}>
              <div className="space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10">
                  <svg className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-light text-dark-100">Lupa Password</h2>
                  <p className="mt-1 text-sm text-dark-400">
                    Masukkan email Anda dan kami akan mengirimkan link reset
                  </p>
                </div>

                {notFound && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                    <p className="font-medium">Email tidak terdaftar</p>
                    <p className="mt-1 text-amber-400/80">
                      Email <strong>{email}</strong> belum terdaftar.{' '}
                      <Link href="/register" className="underline hover:text-amber-300">Daftar sekarang</Link>
                    </p>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark-300">Email</label>
                  <Input
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>

                <WizardNavigation
                  nextLabel={isLoading ? 'Mengirim...' : 'Kirim Link Reset'}
                  nextDisabled={!email || isLoading}
                  onNext={() => { handleSubmit(); return false; }}
                  showPrev={false}
                />

                <p className="text-center text-sm text-dark-500">
                  Ingat password Anda?{' '}
                  <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
                    Masuk di sini
                  </Link>
                </p>
              </div>
            </WizardStep>

            {/* Step 2: Success confirmation */}
            <WizardStep step={1}>
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-light text-dark-100">Email Terkirim</h2>
                  <p className="mt-2 text-sm text-dark-400">
                    Jika email Anda terdaftar, kami telah mengirimkan link untuk mereset password.
                    Silakan cek inbox dan spam folder Anda.
                  </p>
                </div>

                <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 px-4 py-3">
                  <p className="text-xs text-dark-500">Dikirim ke</p>
                  <p className="mt-1 text-sm font-medium text-dark-200">{email}</p>
                </div>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Kembali ke Login
                </Link>
              </div>
            </WizardStep>
          </>
        );
      }}
    </WizardShell>
  );
}
