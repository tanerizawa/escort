import { create } from 'zustand';
import api from '@/lib/api';

export interface ActiveBookingPartner {
  id: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  isVerified?: boolean;
  phone?: string;
  escortProfile?: {
    tier: string;
    ratingAvg: number;
    totalReviews: number;
  };
}

export interface ActiveBookingPayment {
  id: string;
  status: string;
  amount: number;
  chargeAmount?: number;
  platformFee: number;
  escortPayout: number;
  tipAmount?: number;
  paymentType?: string;
  method?: string;
  paidAt?: string;
}

export interface ActiveBookingMessage {
  id: string;
  senderId: string;
  content: string;
  type?: 'TEXT' | 'IMAGE';
  imageUrl?: string;
  createdAt: string;
}

export interface ActiveBooking {
  id: string;
  status: string;
  startTime: string;
  endTime: string;
  serviceType: string;
  location: string;
  locationLat?: number;
  locationLng?: number;
  specialRequests?: string;
  totalAmount: number;
  checkinAt?: string;
  checkoutAt?: string;
  createdAt: string;
  client: ActiveBookingPartner;
  escort: ActiveBookingPartner;
  payment?: ActiveBookingPayment;
  messages: ActiveBookingMessage[];
}

type Phase = 'READY_CHECKIN' | 'ONGOING' | null;

interface ActiveBookingState {
  isLocked: boolean;
  booking: ActiveBooking | null;
  bookings: ActiveBooking[];
  totalActive: number;
  selectedIndex: number;
  phase: Phase;
  loading: boolean;
  error: string | null;
  lastChecked: number;

  checkActive: () => Promise<void>;
  clearActive: () => void;
  refreshBooking: () => Promise<void>;
  selectBooking: (index: number) => void;
}

const POLL_COOLDOWN_MS = 5000; // minimum ms between checks

export const useActiveBookingStore = create<ActiveBookingState>()((set, get) => ({
  isLocked: false,
  booking: null,
  bookings: [],
  totalActive: 0,
  selectedIndex: 0,
  phase: null,
  loading: false,
  error: null,
  lastChecked: 0,

  checkActive: async () => {
    const now = Date.now();
    if (now - get().lastChecked < POLL_COOLDOWN_MS) return;
    if (get().loading) return;

    set({ loading: true, lastChecked: now });

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        set({ isLocked: false, booking: null, bookings: [], totalActive: 0, selectedIndex: 0, phase: null, loading: false });
        return;
      }

      const res = await api.get('/bookings/active');
      const data = res.data?.data || res.data;

      if (data?.active && data?.bookings?.length > 0) {
        const allBookings = data.bookings as ActiveBooking[];
        const idx = Math.min(get().selectedIndex, allBookings.length - 1);
        const selected = allBookings[idx];
        set({
          isLocked: true,
          booking: selected,
          bookings: allBookings,
          totalActive: data.totalActive || allBookings.length,
          selectedIndex: idx,
          phase: (selected as any).phase || (selected.status === 'ONGOING' ? 'ONGOING' : 'READY_CHECKIN'),
          loading: false,
          error: null,
        });
      } else {
        set({
          isLocked: false,
          booking: null,
          bookings: [],
          totalActive: 0,
          selectedIndex: 0,
          phase: null,
          loading: false,
          error: null,
        });
      }
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.message === 'No refresh token') {
        set({ isLocked: false, booking: null, bookings: [], totalActive: 0, selectedIndex: 0, phase: null, loading: false, error: null });
        return;
      }
      set({ loading: false, error: 'Gagal memeriksa booking aktif' });
    }
  },

  selectBooking: (index: number) => {
    const bookings = get().bookings;
    if (index < 0 || index >= bookings.length) return;
    const selected = bookings[index];
    set({
      selectedIndex: index,
      booking: selected,
      phase: (selected as any).phase || (selected.status === 'ONGOING' ? 'ONGOING' : 'READY_CHECKIN'),
    });
  },

  refreshBooking: async () => {
    // Force refresh ignoring cooldown
    set({ lastChecked: 0 });
    await get().checkActive();
  },

  clearActive: () => {
    set({ isLocked: false, booking: null, bookings: [], totalActive: 0, selectedIndex: 0, phase: null, error: null });
  },
}));
