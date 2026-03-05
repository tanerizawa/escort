'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reply?: string;
  client: {
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
}

interface ReviewListProps {
  escortId: string;
  showTitle?: boolean;
}

export function ReviewList({ escortId, showTitle = true }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    loadReviews();
  }, [escortId]);

  const loadReviews = async () => {
    try {
      const res = await api.get(`/reviews/escort/${escortId}`);
      const data = res.data;
      setReviews(data.reviews || data.data || []);
      setAverageRating(data.averageRating || 0);
      setTotalReviews(data.total || 0);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-yellow-400' : 'text-dark-600'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Distribution
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage: reviews.length > 0
      ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100
      : 0,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  return (
    <div>
      {showTitle && (
        <h2 className="mb-4 text-lg font-light text-dark-100">Ulasan</h2>
      )}

      {/* Summary */}
      {reviews.length > 0 && (
        <div className="mb-6 flex flex-col gap-6 rounded-xl border border-dark-700/50 bg-dark-800/50 p-6 sm:flex-row sm:items-center">
          {/* Average */}
          <div className="text-center sm:pr-6 sm:border-r sm:border-dark-700">
            <p className="text-4xl font-light text-dark-100">{averageRating.toFixed(1)}</p>
            <div className="mt-1 flex justify-center">{renderStars(Math.round(averageRating))}</div>
            <p className="mt-1 text-xs text-dark-500">{totalReviews} ulasan</p>
          </div>

          {/* Distribution */}
          <div className="flex-1 space-y-1.5">
            {distribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="w-3 text-xs text-dark-400">{star}</span>
                <svg className="h-3 w-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <div className="flex-1 h-2 rounded-full bg-dark-700">
                  <div
                    className="h-full rounded-full bg-yellow-400/70 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs text-dark-500">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 py-12 text-center">
          <div className="mb-3 text-3xl">⭐</div>
          <p className="text-sm text-dark-500">Belum ada ulasan</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-dark-700/50 bg-dark-800/50 p-5"
            >
              <div className="flex items-start gap-3">
                {review.client.profilePhoto ? (
                  <img
                    src={review.client.profilePhoto}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-400/10">
                    <span className="text-sm font-medium text-brand-400">
                      {review.client.firstName[0]}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-dark-200">
                      {review.client.firstName} {review.client.lastName[0]}.
                    </h4>
                    <span className="text-xs text-dark-500">{formatDate(review.createdAt)}</span>
                  </div>
                  <div className="mt-1">{renderStars(review.rating)}</div>
                  {review.comment && (
                    <p className="mt-2 text-sm leading-relaxed text-dark-300">{review.comment}</p>
                  )}
                  {review.reply && (
                    <div className="mt-3 rounded-lg border-l-2 border-brand-400/30 bg-dark-700/30 p-3">
                      <p className="text-xs font-medium text-brand-400">Balasan</p>
                      <p className="mt-1 text-sm text-dark-300">{review.reply}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
