'use client';

import { useState, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
      await api.post('/auth/reset-password', {
        token,
        newPassword: password,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Token tidak valid atau telah kadaluarsa.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-light text-dark-100">Token Tidak Ditemukan</h2>
        <p className="mt-3 text-sm text-dark-400">
          Link reset password tidak valid. Silakan minta ulang link baru.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
        >
          Minta Link Baru
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-light text-dark-100">Password Berhasil Direset</h2>
        <p className="mt-3 text-sm text-dark-400">
          Password Anda telah diperbarui. Silakan masuk dengan password baru.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-brand-400 px-8 py-3 text-sm font-medium text-dark-900 hover:bg-brand-300 transition-colors"
        >
          Masuk Sekarang
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-light text-dark-100">Reset Password</h2>
      <p className="mt-2 text-sm text-dark-400">
        Masukkan password baru untuk akun Anda.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dark-300">Password Baru</label>
          <Input
            type="password"
            placeholder="Minimal 8 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-dark-300">Konfirmasi Password</label>
          <Input
            type="password"
            placeholder="Ketik ulang password baru"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-dark-500">
        Ingat password Anda?{' '}
        <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center text-dark-400">Memuat...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
