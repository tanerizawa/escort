'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, user, fetchProfile } = useAuthStore();
  const checking = useRef(false);
  const [validated, setValidated] = useState(false);

  // Always validate the token on mount — persisted state might have stale tokens
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      // No token at all — go to login
      useAuthStore.getState().setUser(null);
      router.push('/login');
      return;
    }

    if (!checking.current) {
      checking.current = true;
      fetchProfile()
        .then(() => setValidated(true))
        .catch(() => {
          // Token invalid/expired and refresh failed
          router.push('/login');
        })
        .finally(() => {
          checking.current = false;
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAuthenticated && user && allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to the correct dashboard based on role
      if (user.role === 'ESCORT') {
        router.push('/escort/dashboard');
      } else if (user.role === 'CLIENT') {
        router.push('/user/dashboard');
      } else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        window.location.href = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.areton.id';
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, user, allowedRoles, router]);

  // Show loading until token is validated against the server
  if (!validated || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-brand-400" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-dark-500">Memuat...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
