'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If already logged in, redirect to dashboard
    const token = localStorage.getItem('admin_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login gagal');
        setLoading(false);
        return;
      }

      // Check if user is admin
      const user = data.data?.user;
      if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        setError('Akses ditolak — hanya untuk admin');
        setLoading(false);
        return;
      }

      // Store token and redirect
      localStorage.setItem('admin_token', data.data.accessToken);
      localStorage.setItem('admin_refresh', data.data.refreshToken);
      localStorage.setItem('admin_user', JSON.stringify(user));
      router.push('/dashboard');
    } catch (err) {
      setError('Gagal terhubung ke server');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-900">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-extralight tracking-widest text-dark-100">ARETON</span>
            <span className="text-2xl text-brand-400">.</span>
            <span className="text-2xl font-extralight tracking-widest text-brand-400">id</span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-dark-500">Admin Panel</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="rounded-xl border border-dark-700/50 bg-dark-800/40 p-6">
          <h2 className="mb-6 text-lg font-light text-dark-100">Sign In</h2>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-dark-400">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-dark-700/50 bg-dark-800 px-4 py-2.5 text-sm text-dark-100 placeholder-dark-500 outline-none transition-colors focus:border-brand-400/50"
                placeholder="admin@areton.id"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-dark-400">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-dark-700/50 bg-dark-800 px-4 py-2.5 text-sm text-dark-100 placeholder-dark-500 outline-none transition-colors focus:border-brand-400/50"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-400 py-2.5 text-sm font-medium text-dark-900 transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-dark-600">
          &copy; 2026 ARETON.id — Admin Access Only
        </p>
      </div>
    </div>
  );
}
