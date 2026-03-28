import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import api from './api';

const UPDATE_INTERVAL = 30000; // 30 seconds

export function useLocationTracker(enabled: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
            await api.post('/safety/location', {
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
            });
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
  }, [enabled]);
}
