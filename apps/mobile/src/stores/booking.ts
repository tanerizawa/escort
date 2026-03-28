import { create } from 'zustand';
import api from '../lib/api';
import { Booking } from '../constants/types';

interface BookingState {
  activeBooking: Booking | null;
  activeBookings: Booking[];
  loading: boolean;
  lastChecked: number;

  checkActive: () => Promise<void>;
  clearActive: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  activeBooking: null,
  activeBookings: [],
  loading: false,
  lastChecked: 0,

  checkActive: async () => {
    const now = Date.now();
    if (now - get().lastChecked < 5000) return; // Cooldown
    set({ loading: true });
    try {
      const { data } = await api.get('/bookings/active');
      const bookings = data.data || [];
      set({
        activeBookings: bookings,
        activeBooking: bookings[0] || null,
        lastChecked: now,
      });
    } catch {
      // ignore polling errors
    } finally {
      set({ loading: false });
    }
  },

  clearActive: () => set({ activeBooking: null, activeBookings: [], lastChecked: 0 }),
}));
