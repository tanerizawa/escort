import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import api from './api';
import { useBookingStore } from '../stores/booking';

const UPDATE_INTERVAL = 30000; // 30 seconds

export function useLocationTracker(enabled: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeBookings = useBookingStore((s) => s.activeBookings);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const sendLocation = async () => {
          try {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            const payload = {
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
              accuracy: loc.coords.accuracy,
            };

            // General GPS ping (no booking required)
            await api.post('/safety/location/ping', payload).catch(() => {});

            // Send per-booking location for active bookings
            const active = activeBookings.filter((b) =>
              ['CONFIRMED', 'ONGOING'].includes(b.status),
            );
            if (active.length > 0) {
              await Promise.allSettled(
                active.map((b) =>
                  api.post('/safety/location', { bookingId: b.id, ...payload }),
                ),
              );
            }
          } catch { /* ignore */ }
        };

        sendLocation(); // Initial send
        intervalRef.current = setInterval(sendLocation, UPDATE_INTERVAL);
      } catch { /* ignore permission errors on emulator */ }
    };

    startTracking();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, activeBookings]);
}
