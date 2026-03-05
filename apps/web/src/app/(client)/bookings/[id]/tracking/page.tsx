'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface LocationPoint {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

interface TrackingData {
  bookingId: string;
  status: string;
  bookingLocation: { lat: number | null; lng: number | null; address: string };
  clientLocation: LocationPoint | null;
  escortLocation: LocationPoint | null;
}

export default function LiveTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [lastSent, setLastSent] = useState<Date | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadTracking();
    // Auto-refresh tracking data every 10s
    intervalRef.current = setInterval(loadTracking, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopSharing();
    };
  }, [bookingId]);

  const loadTracking = async () => {
    try {
      const res = await api.get(`/safety/tracking/${bookingId}`);
      setTracking(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data tracking');
    } finally {
      setLoading(false);
    }
  };

  const startSharing = () => {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung geolokasi');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        setSending(true);
        try {
          await api.post('/safety/location', {
            bookingId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
          setLastSent(new Date());
          loadTracking();
        } catch {
          // silent
        } finally {
          setSending(false);
        }
      },
      (err) => {
        setError(`Gagal mendapat lokasi: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      },
    );

    setWatchId(id);
  };

  const stopSharing = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 text-dark-400 hover:bg-dark-700 hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-white">Live Tracking</h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Location Sharing Control */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Bagikan Lokasi</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">
                {watchId !== null
                  ? 'Lokasi Anda sedang dibagikan secara real-time'
                  : 'Bagikan lokasi untuk keamanan booking'}
              </p>
              {lastSent && (
                <p className="text-xs text-gray-500 mt-1">
                  Terakhir dikirim: {lastSent.toLocaleTimeString('id-ID')}
                </p>
              )}
            </div>
            {watchId !== null ? (
              <Button variant="ghost" onClick={stopSharing}>
                Berhenti
              </Button>
            ) : (
              <Button onClick={startSharing} disabled={sending}>
                {sending ? 'Mengirim...' : 'Mulai Bagikan'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tracking Data */}
      {tracking && (
        <>
          {/* Booking Location */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Lokasi Booking</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-gray-300">{tracking.bookingLocation.address}</p>
                {tracking.bookingLocation.lat && tracking.bookingLocation.lng && (
                  <p className="text-xs text-gray-500 font-mono">
                    {tracking.bookingLocation.lat.toFixed(6)}, {tracking.bookingLocation.lng.toFixed(6)}
                  </p>
                )}
                <div className="inline-block rounded-full bg-dark-700 px-3 py-1 text-xs text-gray-400">
                  Status: <span className="text-brand-400 font-medium">{tracking.status}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participant Locations */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-white">📍 Lokasi Client</h2>
              </CardHeader>
              <CardContent>
                {tracking.clientLocation ? (
                  <div className="space-y-1">
                    <p className="font-mono text-sm text-brand-400">
                      {tracking.clientLocation.lat.toFixed(6)}, {tracking.clientLocation.lng.toFixed(6)}
                    </p>
                    {tracking.clientLocation.accuracy && (
                      <p className="text-xs text-gray-500">
                        Akurasi: {Math.round(tracking.clientLocation.accuracy)}m
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Update: {formatTime(tracking.clientLocation.timestamp)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Belum ada data lokasi</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-white">📍 Lokasi Escort</h2>
              </CardHeader>
              <CardContent>
                {tracking.escortLocation ? (
                  <div className="space-y-1">
                    <p className="font-mono text-sm text-brand-400">
                      {tracking.escortLocation.lat.toFixed(6)}, {tracking.escortLocation.lng.toFixed(6)}
                    </p>
                    {tracking.escortLocation.accuracy && (
                      <p className="text-xs text-gray-500">
                        Akurasi: {Math.round(tracking.escortLocation.accuracy)}m
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Update: {formatTime(tracking.escortLocation.timestamp)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Belum ada data lokasi</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
