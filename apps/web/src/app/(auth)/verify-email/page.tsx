'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { WizardShell, WizardStep, StepIndicator, WizardNavigation } from '@/components/ui/wizard';
import api from '@/lib/api';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [goToSuccess, setGoToSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If token in URL, verify immediately
  useEffect(() => {
    if (token) {
      verifyWithToken(token);
    }
  }, [token]);

  const verifyWithToken = async (t: string) => {
    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-email', { token: t });
      setGoToSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.data?.message || err?.response?.data?.message || 'Token verifikasi tidak valid atau telah kadaluarsa.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
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
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);
    if (pasted.length >= 6) {
      inputRefs.current[5]?.focus();
    }
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
      // Get userId from localStorage (stored during registration)
      const storedUser = localStorage.getItem('pendingVerificationUserId');
      await api.post('/auth/verify-email', {
        code: fullCode,
        userId: storedUser,
      });
      setGoToSuccess(true);
      localStorage.removeItem('pendingVerificationUserId');
    } catch (err: any) {
      setError(err?.response?.data?.data?.message || err?.response?.data?.message || 'Kode verifikasi salah atau telah kadaluarsa.');
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
      setError(err?.response?.data?.data?.message || err?.response?.data?.message || 'Gagal mengirim ulang. Coba lagi nanti.');
    } finally {
      setResendLoading(false);
    }
  };

  if (isLoading && token) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-400/10">
          <svg className="h-8 w-8 text-brand-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-light text-dark-100">Memverifikasi Email...</h2>
        <p className="mt-3 text-sm text-dark-400">Tunggu sebentar, kami sedang memverifikasi email Anda.</p>
      </div>
    );
  }

  return (
    <div>
      <WizardShell totalSteps={2} initialStep={goToSuccess ? 1 : 0}>
        <StepIndicator labels={['Masukkan Kode', 'Verifikasi Berhasil']} />

        <WizardStep step={0}>
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-400/10">
              <span className="text-2xl">📧</span>
            </div>
            <h3 className="text-lg font-light text-dark-100">Verifikasi Email</h3>
            <p className="mt-1 text-sm text-dark-400">
              Masukkan 6 digit kode yang dikirim ke email Anda
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {resendSuccess && (
            <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {resendSuccess}
            </div>
          )}

          <div className="flex justify-center gap-3">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="h-14 w-12 rounded-lg border border-dark-700 bg-dark-800 text-center text-xl font-semibold text-dark-100 outline-none transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30"
              />
            ))}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-dark-500">
              Tidak menerima email?{' '}
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="text-brand-400 hover:text-brand-300 transition-colors disabled:opacity-50"
              >
                {resendLoading ? 'Mengirim...' : 'Kirim Ulang'}
              </button>
            </p>
          </div>

          <WizardNavigation
            nextLabel={isLoading ? 'Memverifikasi...' : 'Verifikasi Email'}
            nextDisabled={isLoading || code.join('').length !== 6}
            onNext={() => { handleSubmit(); return false; }}
            prevLabel="Login"
            onPrev={() => { window.location.href = '/login'; }}
          />
        </WizardStep>

        <WizardStep step={1}>
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-light text-dark-100">Email Terverifikasi!</h2>
            <p className="mt-3 text-sm text-dark-400">
              Email Anda telah berhasil diverifikasi. Sekarang Anda dapat menggunakan semua fitur ARETON.id.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-lg bg-brand-400 px-8 py-3 text-sm font-medium text-dark-900 hover:bg-brand-300 transition-colors"
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
