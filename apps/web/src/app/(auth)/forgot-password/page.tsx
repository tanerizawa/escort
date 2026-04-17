'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { WizardShell, WizardStep, StepIndicator, WizardNavigation } from '@/components/ui/wizard';
import { RoseGlyph } from '@/components/brand/rose-glyph';

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
            <header className="mb-10 space-y-5">
              <div className="flex items-center gap-3">
                <div className="text-gradient-rose-gold">
                  <RoseGlyph className="h-8 w-8" strokeWidth={1.1} />
                </div>
                <div className="gold-rose-line flex-1" />
              </div>
              <p className="act-mark">Pemulihan Akun</p>
              <h1 className="font-display text-3xl font-medium leading-tight text-dark-100">
                Lupa{' '}
                <span className="italic text-gradient-rose-gold">password?</span>
              </h1>
              <p className="font-serif text-base leading-relaxed text-dark-400">
                Kami akan mengirimkan link reset ke email Anda — sub rosa, sub fide.
              </p>
            </header>

            <StepIndicator steps={STEPS} current={currentStep} className="mb-8" />

            <WizardStep step={0}>
              <div className="space-y-6">
                {notFound && (
                  <div className="border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    <p className="font-medium">Email tidak terdaftar</p>
                    <p className="mt-1 text-rose-200/80">
                      Email <strong>{email}</strong> belum terdaftar.{' '}
                      <Link href="/register" className="underline hover:text-rose-100">
                        Daftar sekarang
                      </Link>
                    </p>
                  </div>
                )}

                {error && (
                  <div className="border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {error}
                  </div>
                )}

                <Input
                  label="Email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />

                <WizardNavigation
                  nextLabel={isLoading ? 'Mengirim...' : 'Kirim Link Reset'}
                  nextDisabled={!email || isLoading}
                  onNext={() => {
                    handleSubmit();
                    return false;
                  }}
                  showPrev={false}
                />

                <p className="text-center text-sm text-dark-500">
                  Ingat password Anda?{' '}
                  <Link
                    href="/login"
                    className="text-rose-200 transition-colors hover:text-rose-100"
                  >
                    Masuk di sini
                  </Link>
                </p>
              </div>
            </WizardStep>

            <WizardStep step={1}>
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
                  <p className="act-mark !text-rose-200">Terkirim</p>
                  <h2 className="mt-3 font-display text-2xl font-medium text-dark-100">
                    Periksa inbox Anda
                  </h2>
                  <p className="mx-auto mt-4 max-w-md font-serif text-[15px] leading-relaxed text-dark-400">
                    Jika email Anda terdaftar, kami telah mengirimkan link untuk mereset
                    password. Silakan cek inbox dan spam folder.
                  </p>
                </div>

                <div className="border border-dark-700/30 bg-dark-800/40 px-4 py-3 text-left">
                  <p className="text-[10px] uppercase tracking-widest text-dark-500">
                    Dikirim ke
                  </p>
                  <p className="mt-1 font-display text-sm font-medium text-rose-200">
                    {email}
                  </p>
                </div>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-rose-200 transition-colors hover:text-rose-100"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
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
