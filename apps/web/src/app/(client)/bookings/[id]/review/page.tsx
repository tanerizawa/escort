'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';

interface BookingInfo {
  id: string;
  escort: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
  eventType: string;
  startTime: string;
  endTime: string;
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Category ratings
  const [categories, setCategories] = useState({
    appearance: 0,
    communication: 0,
    punctuality: 0,
    professionalism: 0,
  });

  const categoryLabels: Record<string, { label: string; desc: string }> = {
    appearance: { label: 'Penampilan', desc: 'Tampil sesuai ekspektasi' },
    communication: { label: 'Komunikasi', desc: 'Kemampuan berkomunikasi' },
    punctuality: { label: 'Ketepatan Waktu', desc: 'Datang sesuai jadwal' },
    professionalism: { label: 'Profesionalisme', desc: 'Sikap profesional' },
  };

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const res = await api.get(`/bookings/${bookingId}`);
      setBooking(res.data);
    } catch (err) {
      setError('Booking tidak ditemukan');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Silakan berikan rating keseluruhan');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/reviews', {
        bookingId,
        escortId: booking?.escort.id,
        rating,
        comment: comment.trim() || undefined,
        categories,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengirim review');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({
    value,
    onChange,
    onHover,
    size = 'lg',
  }: {
    value: number;
    onChange: (v: number) => void;
    onHover?: (v: number) => void;
    size?: 'sm' | 'lg';
  }) => {
    const sizeClass = size === 'lg' ? 'h-8 w-8' : 'h-5 w-5';
    const displayValue = onHover ? (hoverRating || value) : value;

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => onHover?.(star)}
            onMouseLeave={() => onHover?.(0)}
            className="transition-transform hover:scale-110"
          >
            <svg
              className={`${sizeClass} ${
                star <= displayValue ? 'text-yellow-400' : 'text-dark-600'
              } transition-colors`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mb-6 text-6xl">🌟</div>
        <h2 className="text-2xl font-light text-dark-100">Terima Kasih!</h2>
        <p className="mt-3 text-sm text-dark-400">
          Review Anda telah berhasil dikirim. Feedback Anda membantu meningkatkan kualitas layanan.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => router.push(`/bookings/${bookingId}`)}>
            Lihat Booking
          </Button>
          <Button onClick={() => router.push('/bookings')}>
            Booking Saya
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-light text-dark-100">Berikan Review</h1>
        <p className="mt-1 text-sm text-dark-400">
          Bagikan pengalaman Anda untuk membantu pengguna lain
        </p>
      </div>

      {/* Escort Info */}
      {booking && (
        <Card className="mb-6">
          <CardContent>
            <div className="flex items-center gap-4 py-2">
              {booking.escort.profilePhoto ? (
                <img
                  src={booking.escort.profilePhoto}
                  alt=""
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-400/10">
                  <span className="text-xl font-medium text-brand-400">
                    {booking.escort.firstName[0]}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-medium text-dark-100">
                  {booking.escort.firstName} {booking.escort.lastName}
                </h3>
                <p className="text-sm text-dark-400">{booking.eventType}</p>
                <p className="text-xs text-dark-500">
                  {new Date(booking.startTime).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Rating */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Rating Keseluruhan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-4">
            <StarRating
              value={rating}
              onChange={setRating}
              onHover={setHoverRating}
              size="lg"
            />
            <p className="text-sm text-dark-400">
              {rating === 0 && 'Pilih rating'}
              {rating === 1 && 'Sangat Buruk'}
              {rating === 2 && 'Buruk'}
              {rating === 3 && 'Cukup'}
              {rating === 4 && 'Baik'}
              {rating === 5 && 'Sangat Baik'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Category Ratings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Rating Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(categoryLabels).map(([key, { label, desc }]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-dark-200">{label}</p>
                  <p className="text-xs text-dark-500">{desc}</p>
                </div>
                <StarRating
                  value={categories[key as keyof typeof categories]}
                  onChange={(v) =>
                    setCategories((prev) => ({ ...prev, [key]: v }))
                  }
                  size="sm"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comment */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Komentar</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ceritakan pengalaman Anda... (opsional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
          <p className="mt-2 text-xs text-dark-500">{comment.length}/500 karakter</p>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
        <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
          {submitting ? 'Mengirim...' : 'Kirim Review'}
        </Button>
      </div>
    </div>
  );
}
