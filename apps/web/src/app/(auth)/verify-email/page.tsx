'use client';

import { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { WizardShell, WizardStep, StepIndicator, WizardNavigation } from '@/components/ui/wizard';
import { RoseGlyph } from '@/components/brand/rose-glyph';
import api from '@/lib/api';

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

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [goToSuccess, setGoToSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const verifyWithToken = useCallback(async (t: string) => {
    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-email', { token: t });
      setGoToSuccess(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.data?.message ||
          err?.response?.data?.message ||
          'Token verifikasi tidak valid atau telah kadaluarsa.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) verifyWithToken(token);
  }, [token, verifyWithToken]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) newCode[i] = pasted[i];
    setCode(newCode);
    if (pasted.length >= 6) inputRefs.current[5]?.focus();
  };

  const handleSubmit = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Masukkan 6 digit kode verifikasi');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const storedUser = localStorage.getItem('pendingVerificationUserId');
      await api.post('/auth/verify-email', { code: fullCode, userId: storedUser });
      setGoToSuccess(true);
      localStorage.removeItem('pendingVerificationUserId');
    } catch (err: any) {
      setError(
        err?.response?.data?.data?.message ||
          err?.response?.data?.message ||
          'Kode verifikasi salah atau telah kadaluarsa.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendSuccess('');
    setError('');
    try {
      await api.post('/auth/resend-verification');
      setResendSuccess('Email verifikasi telah dikirim ulang. Periksa inbox Anda.');
    } catch (err: any) {
      setError(
        err?.response?.data?.data?.message ||
          err?.response?.data?.message ||
          'Gagal mengirim ulang. Coba lagi nanti.',
      );
    } finally {
      setResendLoading(false);
    }
  };

  if (isLoading && token) {
    return (
      <div>
        <PageHeader
          mark="Verifikasi Email"
          title="Sedang memverifikasi..."
          description="Tunggu sebentar, kami sedang memvalidasi token Anda."
        />
        <div className="mx-auto flex h-14 w-14 items-center justify-center border border-rose-400/30 text-rose-200">
          <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        mark="Verifikasi Email"
        title="Sampaikan 6 digit kode Anda"
        description="Kode telah kami kirim ke email Anda — periksa inbox dan folder spam."
      />

      <WizardShell totalSteps={2} initialStep={goToSuccess ? 1 : 0}>
        <StepIndicator labels={['Masukkan Kode', 'Selesai']} />

        <WizardStep step={0}>
          {error && (
            <div className="mb-5 border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}
          {resendSuccess && (
            <div className="mb-5 border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {resendSuccess}
            </div>
          )}

          <div className="flex justify-center gap-3">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="h-14 w-12 border border-dark-700/40 bg-dark-900/60 text-center font-display text-xl font-medium text-rose-200 outline-none transition-colors focus:border-rose-400/50 focus:ring-1 focus:ring-rose-400/20"
              />
            ))}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-dark-500">
              Tidak menerima email?{' '}
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="text-rose-200 transition-colors hover:text-rose-100 disabled:opacity-50"
              >
                {resendLoading ? 'Mengirim...' : 'Kirim Ulang'}
              </button>
            </p>
          </div>

          <div className="mt-8">
            <WizardNavigation
              nextLabel={isLoading ? 'Memverifikasi...' : 'Verifikasi Email'}
              nextDisabled={isLoading || code.join('').length !== 6}
              onNext={() => {
                handleSubmit();
                return false;
              }}
              prevLabel="Login"
              onPrev={() => {
                window.location.href = '/login';
              }}
            />
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
              <p className="act-mark !text-rose-200">Terverifikasi</p>
              <h2 className="mt-3 font-display text-2xl font-medium text-dark-100">
                Selamat datang di{' '}
                <span className="italic text-gradient-rose-gold">ARETON</span>
              </h2>
              <p className="mx-auto mt-4 max-w-md font-serif text-[15px] leading-relaxed text-dark-400">
                Email Anda telah diverifikasi. Sekarang Anda dapat menggunakan semua fitur
                platform.
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
      </WizardShell>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center text-dark-400">Memuat...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
