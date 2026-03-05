'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, user, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        fetchProfile();
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, fetchProfile, router]);

  useEffect(() => {
    if (isAuthenticated && user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.push('/unauthorized');
    }
  }, [isAuthenticated, user, allowedRoles, router]);

  if (!isAuthenticated) {
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
