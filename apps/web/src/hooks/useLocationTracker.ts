'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface ActiveBooking {
  id: string;
  status: string;
}

interface TrackerState {
  isTracking: boolean;
  activeBookings: number;
  lastSent: Date | null;
  error: string | null;
  permissionDenied: boolean;
}

const GPS_PING_INTERVAL_MS = 30_000;  // Send general GPS ping every 30s
const BOOKING_SEND_MS = 15_000;       // Send booking GPS every 15s
const BOOKING_CHECK_MS = 60_000;      // Check for active bookings every 60s

export function useLocationTracker() {
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState<TrackerState>({
    isTracking: false,
    activeBookings: 0,
    lastSent: null,
    error: null,
    permissionDenied: false,
  });

  const watchIdRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bookingSendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bookingCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeBookingsRef = useRef<ActiveBooking[]>([]);
  const latestPositionRef = useRef<GeolocationPosition | null>(null);
  const isSendingRef = useRef(false);
  const mountedRef = useRef(true);
  const stoppedRef = useRef(false);

  // Helper: check if token exists
  const hasToken = () => typeof window !== 'undefined' && !!localStorage.getItem('accessToken');

  // Stop everything
  const stopAll = useCallback(() => {
    stoppedRef.current = true;
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (bookingSendIntervalRef.current) {
      clearInterval(bookingSendIntervalRef.current);
      bookingSendIntervalRef.current = null;
    }
    if (bookingCheckRef.current) {
      clearInterval(bookingCheckRef.current);
      bookingCheckRef.current = null;
    }
    latestPositionRef.current = null;
  }, []);

  // Fetch active bookings (CONFIRMED or ONGOING) — single API call
  const fetchActiveBookings = useCallback(async (): Promise<ActiveBooking[]> => {
    if (!user || stoppedRef.current) return [];
    if (!hasToken()) { stopAll(); return []; }

    try {
      const res = await api.get('/bookings', { params: { limit: 50 } });
      const payload = res.data?.data || res.data;
      const items = payload?.bookings || payload?.items || payload?.data || [];
      if (!Array.isArray(items)) return [];
      return items
        .filter((b: any) => ['CONFIRMED', 'ONGOING'].includes(b.status))
        .map((b: any) => ({ id: b.id, status: b.status }));
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.message === 'No refresh token') {
        stopAll();
      }
      return [];
    }
  }, [user, stopAll]);

  // Send general GPS ping (no booking required) — so admin can always see last known position
  const sendGeneralPing = useCallback(async () => {
    if (stoppedRef.current) return;
    const pos = latestPositionRef.current;
    if (!pos) return;
    if (!hasToken()) { stopAll(); return; }

    try {
      await api.post('/safety/location/ping', {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, lastSent: new Date(), error: null }));
      }
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.message === 'No refresh token') {
        stopAll();
      }
    }
  }, [stopAll]);

  // Send GPS for active bookings
  const sendBookingLocations = useCallback(async () => {
    const pos = latestPositionRef.current;
    const bookings = activeBookingsRef.current;

    if (!pos || bookings.length === 0 || isSendingRef.current) return;

    isSendingRef.current = true;

    const payload = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    };

    try {
      await Promise.allSettled(
        bookings.map((b) =>
          api.post('/safety/location', { bookingId: b.id, ...payload })
        )
      );
    } catch {
      // Non-critical
    } finally {
      isSendingRef.current = false;
    }
  }, []);

  // Start watching GPS position
  const startWatching = useCallback(() => {
    if (watchIdRef.current !== null) return;
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: 'Geolocation tidak didukung browser ini' }));
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        latestPositionRef.current = position;
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState((prev) => ({
            ...prev,
            permissionDenied: true,
            isTracking: false,
            error: 'Izin lokasi ditolak. Aktifkan di pengaturan browser.',
          }));
          stopAll();
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10_000,
        timeout: 15_000,
      },
    );

    watchIdRef.current = id;

    // Start general ping immediately, then every 30s
    setTimeout(sendGeneralPing, 2000);
    if (!pingIntervalRef.current) {
      pingIntervalRef.current = setInterval(sendGeneralPing, GPS_PING_INTERVAL_MS);
    }
  }, [sendGeneralPing, stopAll]);

  // Check bookings and manage booking-specific GPS sending
  const checkAndUpdate = useCallback(async () => {
    if (!user || stoppedRef.current) return;

    const bookings = await fetchActiveBookings();
    activeBookingsRef.current = bookings;

    if (!mountedRef.current) return;

    if (bookings.length > 0) {
      // Start booking-specific sending
      if (!bookingSendIntervalRef.current) {
        sendBookingLocations();
        bookingSendIntervalRef.current = setInterval(sendBookingLocations, BOOKING_SEND_MS);
      }
    } else {
      // Stop booking-specific sending
      if (bookingSendIntervalRef.current) {
        clearInterval(bookingSendIntervalRef.current);
        bookingSendIntervalRef.current = null;
      }
    }

    setState((prev) => ({
      ...prev,
      isTracking: true,
      activeBookings: bookings.length,
    }));
  }, [user, fetchActiveBookings, sendBookingLocations]);

  // Initialize on mount — always start GPS for CLIENT/ESCORT
  useEffect(() => {
    mountedRef.current = true;
    stoppedRef.current = false;

    if (!user) return;
    if (!['CLIENT', 'ESCORT'].includes(user.role)) return;

    // Start GPS watching immediately (for general ping)
    startWatching();

    // Check for active bookings
    checkAndUpdate();
    bookingCheckRef.current = setInterval(checkAndUpdate, BOOKING_CHECK_MS);

    return () => {
      mountedRef.current = false;
      stopAll();
      if (bookingCheckRef.current) {
        clearInterval(bookingCheckRef.current);
        bookingCheckRef.current = null;
      }
    };
  }, [user?.id, user?.role]);

  return state;
}
