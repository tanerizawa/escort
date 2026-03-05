// ── Common Types ────────────────────────────

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[];
  timestamp: string;
  path: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'BOOKING' | 'PAYMENT' | 'CHAT' | 'SAFETY' | 'SYSTEM';
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface IncidentReport {
  id: string;
  bookingId: string;
  reporterId: string;
  type: 'SOS' | 'COMPLAINT' | 'FEEDBACK';
  description: string;
  severity: number;
  resolutionStatus: string;
  adminNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}
