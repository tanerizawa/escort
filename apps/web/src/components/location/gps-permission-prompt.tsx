'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Settings } from 'lucide-react';

type PermissionState = 'idle' | 'prompting' | 'granted' | 'denied' | 'dismissed';

/**
 * Prompts for GPS permission once after login.
 * Shows a banner if permission hasn't been granted yet.
 */
export function GpsPermissionPrompt() {
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<PermissionState>('idle');

  useEffect(() => {
    if (!user || !['CLIENT', 'ESCORT'].includes(user.role)) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    // Check if we already asked this session
    const asked = sessionStorage.getItem('gps_permission_asked');
    if (asked === 'true') {
      setStatus('dismissed');
      return;
    }

    // Check current permission via Permissions API (if available)
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          setStatus('granted');
          sessionStorage.setItem('gps_permission_asked', 'true');
        } else if (result.state === 'denied') {
          setStatus('denied');
          sessionStorage.setItem('gps_permission_asked', 'true');
        } else {
          // 'prompt' — show our prompt UI
          setStatus('prompting');
        }
      }).catch(() => {
        // Permissions API not supported, show prompt
        setStatus('prompting');
      });
    } else {
      setStatus('prompting');
    }
  }, [user?.id, user?.role]);

  const requestPermission = () => {
    navigator.geolocation.getCurrentPosition(
      () => {
        setStatus('granted');
        sessionStorage.setItem('gps_permission_asked', 'true');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied');
        } else {
          // Timeout or other — treat as granted attempt
          setStatus('dismissed');
        }
        sessionStorage.setItem('gps_permission_asked', 'true');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
    setStatus('idle'); // Hide banner while browser shows native prompt
  };

  const dismiss = () => {
    setStatus('dismissed');
    sessionStorage.setItem('gps_permission_asked', 'true');
  };

  // Don't render for granted, idle, or dismissed states
  if (status === 'idle' || status === 'granted' || status === 'dismissed') return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-xl border border-dark-700/50 bg-dark-800/95 p-4 shadow-2xl backdrop-blur-lg">
        {status === 'prompting' && (
          <>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-400/10">
                <svg className="h-5 w-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-dark-100">Aktifkan Lokasi GPS</h3>
                <p className="mt-1 text-xs text-dark-400">
                  ARETON membutuhkan akses lokasi untuk fitur keamanan, live tracking, dan check-in booking.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={dismiss}
                className="rounded-lg px-3 py-1.5 text-xs text-dark-400 hover:text-dark-200 transition-colors"
              >
                Nanti saja
              </button>
              <button
                onClick={requestPermission}
                className="rounded-lg bg-brand-400 px-4 py-1.5 text-xs font-medium text-dark-900 hover:bg-brand-300 transition-colors"
              >
                Izinkan Lokasi
              </button>
            </div>
          </>
        )}

        {status === 'denied' && (
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-500/10">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-400">Lokasi GPS Diblokir</h3>
              <p className="mt-1 text-xs text-dark-400">
                Izin lokasi ditolak. Untuk menggunakan fitur keamanan dan tracking, aktifkan di:
              </p>
              <p className="mt-1 text-xs text-dark-500">
                <Settings className="h-4 w-4 inline-block" /> Browser Settings → Site Settings → Location → Izinkan untuk areton.id
              </p>
              <button
                onClick={dismiss}
                className="mt-2 text-xs text-dark-400 hover:text-dark-200 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
