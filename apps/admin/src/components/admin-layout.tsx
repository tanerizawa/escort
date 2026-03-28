'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from './admin-sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      // Redirect to login page root
      window.location.href = '/';
      return;
    }

    // Verify token by calling admin stats
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    fetch(`${API}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('admin_token');
          window.location.href = '/';
          return;
        }
        setIsAuthed(true);
      })
      .catch(() => {
        // Network error — still allow (offline mode)
        setIsAuthed(true);
      })
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-900">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
          <p className="mt-3 text-sm text-dark-400">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  if (!isAuthed) return null;

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
