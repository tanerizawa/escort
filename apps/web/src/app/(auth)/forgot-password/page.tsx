'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-400/10">
          <svg className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-light text-dark-100">Email Terkirim</h2>
        <p className="mt-3 text-sm text-dark-400">
          Jika email Anda terdaftar, kami telah mengirimkan link untuk mereset password.
          Silakan cek inbox dan spam folder Anda.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-light text-dark-100">Lupa Password</h2>
      <p className="mt-2 text-sm text-dark-400">
        Masukkan email Anda dan kami akan mengirimkan link untuk mereset password.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dark-300">Email</label>
          <Input
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Mengirim...' : 'Kirim Link Reset'}
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
