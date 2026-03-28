'use client';

import { useLocationTracker } from '@/hooks/useLocationTracker';
import { useState } from 'react';

export function LocationTracker() {
  const { isTracking, activeBookings, lastSent, error, permissionDenied } = useLocationTracker();
  const [expanded, setExpanded] = useState(false);

  // Don't render anything if not tracking and no permission issues
  if (!isTracking && !permissionDenied) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {/* Expanded info card */}
      {expanded && (
        <div className="mb-2 w-64 rounded-xl border border-dark-700/50 bg-dark-800/95 p-4 shadow-2xl backdrop-blur-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-dark-300 uppercase tracking-wider">
              GPS Tracking
            </span>
            <button
              onClick={() => setExpanded(false)}
              className="text-dark-500 hover:text-dark-300 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-400">
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-xs">{error}</span>
              </div>
              {permissionDenied && (
                <p className="text-2xs text-dark-500">
                  Buka Settings &gt; Site Settings &gt; Location untuk mengizinkan.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs text-emerald-400">Lokasi aktif dikirim</span>
              </div>
              <div className="space-y-1 text-2xs text-dark-400">
                <p>{activeBookings} booking aktif</p>
                {lastSent && (
                  <p>
                    Terakhir kirim:{' '}
                    {lastSent.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                )}
                <p className="text-dark-500">Auto-update setiap 15 detik</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating indicator button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`group flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 ${
          error || permissionDenied
            ? 'bg-red-500/20 border border-red-500/40 text-red-400'
            : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
        }`}
        title={isTracking ? `GPS aktif — ${activeBookings} booking` : 'GPS error'}
      >
        {error || permissionDenied ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ) : (
          <div className="relative">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>
        )}
      </button>
    </div>
  );
}
