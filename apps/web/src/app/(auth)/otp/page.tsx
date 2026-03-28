'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { useI18n } from '@/i18n';
import { WizardShell, WizardStep, WizardNavigation } from '@/components/ui/wizard';
import api from '@/lib/api';

function OTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const phone = searchParams?.get('phone') || '';
  const purpose = searchParams?.get('purpose') || 'verify-phone';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [goToSuccess, setGoToSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData.length === 6) {
      setOtp(pasteData.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Masukkan kode OTP 6 digit');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/otp/verify', { phone, code, purpose });
      setSuccess('Verifikasi berhasil!');
      setGoToSuccess(true);
      setTimeout(() => {
        const user = useAuthStore.getState().user;
        if (user?.role === 'ESCORT') {
          router.push('/escort/dashboard');
        } else {
          router.push('/user/dashboard');
        }
      }, 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Kode OTP tidak valid';
      setError(msg);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    setError('');

    try {
      await api.post('/auth/otp/send', { phone, purpose });
      setCountdown(60);
      setSuccess('Kode OTP baru telah dikirim');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal mengirim ulang OTP');
    } finally {
      setResending(false);
    }
  };

  const maskedPhone = phone
    ? phone.replace(/(\d{4})(\d+)(\d{4})/, '$1****$3')
    : '****';

  return (
    <div>
      <WizardShell
        totalSteps={2}
        initialStep={goToSuccess ? 1 : 0}
        steps={[{ label: 'Masukkan OTP' }, { label: 'Berhasil' }]}
      >
        <WizardStep>
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-400/10">
              <span className="text-2xl">🔐</span>
            </div>
            <h3 className="text-lg font-light text-dark-100">Verifikasi OTP</h3>
            <p className="mt-1 text-sm text-dark-400">
              Masukkan kode 6 digit yang dikirim ke{' '}
              <span className="text-dark-200 font-medium">{maskedPhone}</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {success && !goToSuccess && (
            <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              {success}
            </div>
          )}

          {/* OTP Input Grid */}
          <div className="flex justify-center gap-3" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`h-14 w-12 rounded-xl border text-center text-xl font-medium transition-all focus:outline-none ${
                  digit
                    ? 'border-brand-400/50 bg-brand-400/5 text-brand-400'
                    : 'border-dark-600/30 bg-dark-800 text-dark-200'
                } focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20`}
              />
            ))}
          </div>

          {/* Countdown + Resend */}
          <div className="mt-6 text-center">
            {countdown > 0 ? (
              <p className="text-sm text-dark-500">
                Kirim ulang dalam{' '}
                <span className="font-medium text-brand-400">
                  {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                </span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-brand-400 hover:text-brand-300 transition-colors disabled:opacity-50"
              >
                {resending ? 'Mengirim...' : 'Kirim Ulang Kode'}
              </button>
            )}
          </div>

          <WizardNavigation
            nextLabel={loading ? 'Memverifikasi...' : 'Verifikasi'}
            nextDisabled={loading || otp.join('').length !== 6}
            onNext={() => { handleSubmit(); return false; }}
            prevLabel="Ubah Nomor"
            onPrev={() => { window.location.href = '/register'; }}
          />
        </WizardStep>

        <WizardStep>
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-light text-dark-100">Verifikasi Berhasil!</h2>
            <p className="mt-3 text-sm text-dark-400">
              Anda akan dialihkan ke dashboard dalam beberapa detik...
            </p>
          </div>
        </WizardStep>
      </WizardShell>
    </div>
  );
}

export default function OTPVerificationPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" /></div>}>
      <OTPContent />
    </Suspense>
  );
}
