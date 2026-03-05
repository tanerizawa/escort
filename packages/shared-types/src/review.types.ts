// ── Review Types ────────────────────────────

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  attitudeScore?: number;
  punctualityScore?: number;
  professionalismScore?: number;
  replyComment?: string;
  repliedAt?: string;
  isFlagged: boolean;
  createdAt: string;
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
}

export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  comment?: string;
  attitudeScore?: number;
  punctualityScore?: number;
  professionalismScore?: number;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  averageAttitude: number;
  averagePunctuality: number;
  averageProfessionalism: number;
  distribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}
