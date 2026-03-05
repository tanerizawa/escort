'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  reply?: string;
  createdAt: string;
  client: {
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
}

export default function EscortReviewsPage() {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id) loadReviews();
  }, [user?.id]);

  const loadReviews = async () => {
    try {
      const res = await api.get(`/reviews/escort/${user!.id}`);
      const data = res.data;
      setReviews(data.reviews || data.data || []);
      setAverageRating(data.averageRating || 0);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/reviews/${reviewId}/reply`, { reply: replyText.trim() });
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, reply: replyText.trim() } : r))
      );
      setReplyingTo(null);
      setReplyText('');
    } catch (err) {
      console.error('Failed to reply', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => (
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

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-light text-dark-100">Ulasan Saya</h1>
        <p className="mt-1 text-sm text-dark-400">
          {reviews.length} ulasan • Rating rata-rata {averageRating.toFixed(1)}/5.0
        </p>
      </div>

      {/* Rating Summary */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 p-4 text-center">
          <p className="text-3xl font-light text-dark-100">{averageRating.toFixed(1)}</p>
          <div className="mt-1 flex justify-center">{renderStars(Math.round(averageRating))}</div>
          <p className="mt-1 text-xs text-dark-500">Rating Rata-rata</p>
        </div>
        <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 p-4 text-center">
          <p className="text-3xl font-light text-dark-100">{reviews.length}</p>
          <p className="mt-2 text-xs text-dark-500">Total Ulasan</p>
        </div>
        <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 p-4 text-center">
          <p className="text-3xl font-light text-dark-100">
            {reviews.filter((r) => r.rating >= 4).length}
          </p>
          <p className="mt-2 text-xs text-dark-500">Positif (4-5⭐)</p>
        </div>
        <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 p-4 text-center">
          <p className="text-3xl font-light text-dark-100">
            {reviews.filter((r) => r.reply).length}
          </p>
          <p className="mt-2 text-xs text-dark-500">Sudah Dibalas</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent>
            <div className="py-16 text-center">
              <div className="mb-4 text-4xl">⭐</div>
              <h3 className="text-lg font-light text-dark-200">Belum Ada Ulasan</h3>
              <p className="mt-2 text-sm text-dark-500">
                Ulasan akan muncul setelah booking selesai.
              </p>
            </div>
          </CardContent>
        </Card>
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

                  {/* Reply */}
                  {review.reply ? (
                    <div className="mt-3 rounded-lg border-l-2 border-brand-400/30 bg-dark-700/30 p-3">
                      <p className="text-xs font-medium text-brand-400">Balasan Anda</p>
                      <p className="mt-1 text-sm text-dark-300">{review.reply}</p>
                    </div>
                  ) : replyingTo === review.id ? (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        placeholder="Tulis balasan..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleReply(review.id)}
                          disabled={submitting || !replyText.trim()}
                        >
                          {submitting ? 'Mengirim...' : 'Kirim Balasan'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                        >
                          Batal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(review.id)}
                      className="mt-2 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      Balas ulasan
                    </button>
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
