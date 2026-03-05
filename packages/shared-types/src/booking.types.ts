// ── Booking Types ───────────────────────────

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

export type ServiceType = 'MEETING' | 'DINNER' | 'EVENT' | 'BUSINESS_ASSISTANT';

export interface Booking {
  id: string;
  clientId: string;
  escortId: string;
  serviceType: ServiceType;
  status: BookingStatus;
  startTime: string;
  endTime: string;
  location: string;
  locationLat?: number;
  locationLng?: number;
  specialRequests?: string;
  totalAmount: number;
  checkinAt?: string;
  checkoutAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingWithRelations extends Booking {
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
  escort?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
  payment?: import('./payment.types').Payment;
}

export interface CreateBookingRequest {
  escortId: string;
  serviceType: ServiceType;
  startTime: string;
  endTime: string;
  location: string;
  locationLat?: number;
  locationLng?: number;
  specialRequests?: string;
}

export interface BookingListParams {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  from?: string;
  to?: string;
}

// Valid state transitions
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ONGOING', 'CANCELLED'],
  ONGOING: ['COMPLETED', 'DISPUTED'],
  COMPLETED: ['DISPUTED'],
  CANCELLED: [],
  DISPUTED: ['COMPLETED', 'CANCELLED'],
};
