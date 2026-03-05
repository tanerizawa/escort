// ── Payment Types ───────────────────────────

export type PaymentStatus = 'PENDING' | 'ESCROW' | 'RELEASED' | 'REFUNDED' | 'FAILED';
export type PaymentMethod = 'VIRTUAL_ACCOUNT' | 'E_WALLET' | 'CREDIT_CARD' | 'BANK_TRANSFER';

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  platformFee: number;
  escortPayout: number;
  tipAmount?: number;
  paymentGatewayRef?: string;
  paidAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  bookingId: string;
  method: PaymentMethod;
}

export interface PaymentHistoryParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  from?: string;
  to?: string;
}

export interface EarningsSummary {
  totalEarnings: number;
  pendingPayout: number;
  totalBookings: number;
  averageRating: number;
  thisMonth: number;
  lastMonth: number;
}

export interface WithdrawRequest {
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}
