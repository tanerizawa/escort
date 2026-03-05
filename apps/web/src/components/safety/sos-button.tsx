'use client';

import { useState, useEffect } from 'react';

interface SOSButtonProps {
  bookingId?: string;
  isVisible?: boolean;
}

export default function SOSButton({ bookingId, isVisible = true }: SOSButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!showConfirm) {
      setCountdown(5);
      return;
    }

    if (countdown <= 0) {
      handleSOS();
      return;
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [showConfirm, countdown]);

  const handleSOS = async () => {
    if (isSending || sent) return;
    try {
      setIsSending(true);

      // Get current location
      let latitude: number | undefined;
      let longitude: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch {
        // Location not available, proceed without it
      }

      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/incidents/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
        }),
      });

      setSent(true);
    } catch (err) {
      console.error('SOS failed:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setCountdown(5);
  };

  if (!isVisible) return null;

  if (sent) {
    return (
      <div className="fixed bottom-24 right-6 z-50">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-900/90 px-5 py-4 shadow-2xl backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
              <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-200">SOS Terkirim</p>
              <p className="text-xs text-emerald-400">Tim keamanan telah diberitahu</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showConfirm) {
    return (
      <div className="fixed bottom-24 right-6 z-50">
        <div className="w-72 rounded-2xl border border-red-500/30 bg-dark-800/95 p-5 shadow-2xl backdrop-blur-lg">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg shadow-red-500/30">
              <span className="text-2xl font-bold text-white">{countdown}</span>
            </div>
            <p className="mt-3 text-sm font-medium text-dark-100">Mengirim sinyal darurat...</p>
            <p className="mt-1 text-xs text-dark-400">
              Tekan batalkan jika tidak dalam bahaya
            </p>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 rounded-lg border border-dark-600/50 px-4 py-2.5 text-sm font-medium text-dark-200 transition-colors hover:bg-dark-700/50"
            >
              Batalkan
            </button>
            <button
              onClick={handleSOS}
              disabled={isSending}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
            >
              {isSending ? 'Mengirim...' : 'Kirim Sekarang'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 z-50">
      <button
        onClick={() => setShowConfirm(true)}
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-lg shadow-red-500/40 transition-all hover:scale-110 hover:shadow-xl hover:shadow-red-500/50 active:scale-95"
        title="Tombol Darurat"
      >
        <svg className="h-6 w-6 text-white transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </button>
    </div>
  );
}
