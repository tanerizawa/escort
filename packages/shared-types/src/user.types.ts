// ── User Types ──────────────────────────────

export type UserRole = 'CLIENT' | 'ESCORT' | 'ADMIN' | 'SUPER_ADMIN';
export type EscortTier = 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  profilePhoto?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EscortProfile {
  id: string;
  userId: string;
  user?: User;
  tier: EscortTier;
  languages: string[];
  skills: string[];
  hourlyRate: number;
  ratingAvg: number;
  totalBookings: number;
  totalReviews: number;
  bio?: string;
  portfolioUrls: string[];
  videoIntroUrl?: string;
  isApproved: boolean;
  approvedAt?: string;
  availabilitySchedule?: AvailabilitySchedule;
  certifications?: Certification[];
  createdAt: string;
  updatedAt: string;
}

export interface Certification {
  id: string;
  escortId: string;
  certType: string;
  certName: string;
  issuer: string;
  validUntil?: string;
  documentUrl: string;
  isVerified: boolean;
  createdAt: string;
}

export interface AvailabilitySchedule {
  monday?: TimeSlot[];
  tuesday?: TimeSlot[];
  wednesday?: TimeSlot[];
  thursday?: TimeSlot[];
  friday?: TimeSlot[];
  saturday?: TimeSlot[];
  sunday?: TimeSlot[];
  exceptions?: DateException[];
}

export interface TimeSlot {
  start: string; // HH:mm
  end: string;   // HH:mm
}

export interface DateException {
  date: string;      // YYYY-MM-DD
  available: boolean;
  slots?: TimeSlot[];
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'CLIENT' | 'ESCORT';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface EscortListItem {
  id: string;
  userId: string;
  tier: EscortTier;
  hourlyRate: number;
  ratingAvg: number;
  totalBookings: number;
  languages: string[];
  skills: string[];
  bio?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
}

export interface EscortSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  tier?: EscortTier;
  minRate?: number;
  maxRate?: number;
  language?: string;
  skill?: string;
  sortBy?: 'ratingAvg' | 'hourlyRate' | 'totalBookings';
  sortOrder?: 'asc' | 'desc';
}
