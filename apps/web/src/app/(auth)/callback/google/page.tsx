'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { AlertTriangle } from 'lucide-react';

function GoogleCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const accessToken = searchParams?.get('accessToken');
    const refreshToken = searchParams?.get('refreshToken');
    const errorMsg = searchParams?.get('error');

    if (errorMsg) {
      setError(errorMsg);
      setTimeout(() => router.push('/login'), 3000);
      return;
    }

    if (accessToken && refreshToken) {
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Fetch user profile and update store
      const init = async () => {
        try {
          const { fetchProfile } = useAuthStore.getState();
          await fetchProfile();
          const user = useAuthStore.getState().user;
          if (user?.role === 'ESCORT') {
            router.push('/escort/dashboard');
          } else {
            router.push('/user/dashboard');
          }
        } catch {
          router.push('/user/dashboard');
        }
      };
      init();
    } else {
      setError('Login gagal. Token tidak ditemukan.');
      setTimeout(() => router.push('/login'), 3000);
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4"><AlertTriangle className="h-10 w-10" /></div>
          <p className="text-sm text-red-400">{error}</p>
          <p className="mt-2 text-xs text-dark-500">Mengalihkan ke halaman login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
        <p className="text-sm text-dark-400">Memproses login Google...</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" /></div>}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
