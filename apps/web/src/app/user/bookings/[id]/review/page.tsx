'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { Sparkles } from 'lucide-react';
import { WizardShell, WizardStep, StepIndicator, WizardNavigation } from '@/components/ui/wizard';

interface BookingInfo {
  id: string;
  escort?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
  serviceType: string;
  startTime: string;
  endTime: string;
}

const WIZARD_STEPS = [
  { label: 'Rating' },
  { label: 'Detail' },
  { label: 'Komentar' },
];

const categoryLabels: Record<string, { label: string; desc: string; emoji: string }> = {
  appearance: { label: 'Penampilan', desc: 'Tampil sesuai ekspektasi', emoji: '✨' },
  communication: { label: 'Komunikasi', desc: 'Kemampuan berkomunikasi', emoji: '💬' },
  punctuality: { label: 'Ketepatan Waktu', desc: 'Datang sesuai jadwal', emoji: '⏰' },
  professionalism: { label: 'Profesionalisme', desc: 'Sikap profesional', emoji: '👔' },
};

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState({
    appearance: 0,
    communication: 0,
    punctuality: 0,
    professionalism: 0,
  });

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const res = await api.get(`/bookings/${bookingId}`);
      const d = res.data?.data || res.data;
      setBooking(d);
    } catch {
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
        revieweeId: booking?.escort?.id,
        rating,
        comment: comment.trim().length >= 10 ? comment.trim() : undefined,
        attitudeScore: categories.appearance || undefined,
        punctualityScore: categories.punctuality || undefined,
        professionalismScore: categories.professionalism || undefined,
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
    const sizeClass = size === 'lg' ? 'h-10 w-10' : 'h-6 w-6';
    const displayValue = onHover ? (hoverRating || value) : value;

    return (
      <div className="flex items-center gap-1.5">
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
              className={`${sizeClass} ${star <= displayValue ? 'text-yellow-400' : 'text-dark-600'} transition-colors`}
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
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10">
          <Sparkles className="h-8 w-8 text-brand-400" />
        </div>
        <h2 className="mt-6 text-2xl font-light text-dark-100">Terima Kasih!</h2>
        <p className="mt-3 text-sm text-dark-400">
          Review Anda telah berhasil dikirim. Feedback Anda membantu meningkatkan kualitas layanan.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => router.push(`/user/bookings/${bookingId}`)}>Lihat Booking</Button>
          <Button onClick={() => router.push('/user/bookings')}>Booking Saya</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-light text-dark-100">Berikan Review</h1>
        <p className="mt-1 text-sm text-dark-400">Bagikan pengalaman Anda</p>
      </div>

      {/* Escort Info */}
      {booking && (
        <div className="mb-6 rounded-xl border border-dark-700/30 bg-dark-800/20 p-4">
          <div className="flex items-center gap-4">
            {booking.escort?.profilePhoto ? (
              <img src={booking.escort.profilePhoto} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-brand-400/20" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-400/10 ring-2 ring-brand-400/20">
                <span className="text-xl font-medium text-brand-400">{booking.escort?.firstName?.[0] || '?'}</span>
              </div>
            )}
            <div>
              <h3 className="font-medium text-dark-100">{booking.escort?.firstName} {booking.escort?.lastName}</h3>
              <p className="text-sm text-dark-400">{booking.serviceType}</p>
              <p className="text-xs text-dark-500">
                {new Date(booking.startTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}

      <WizardShell totalSteps={3}>
        {({ currentStep }) => (
          <>
            <StepIndicator steps={WIZARD_STEPS} current={currentStep} className="mb-8" />

            {/* Step 1: Overall Rating */}
            <WizardStep step={0}>
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-3xl mb-3">⭐</p>
                  <h2 className="text-xl font-light text-dark-100">Rating Keseluruhan</h2>
                  <p className="mt-1 text-sm text-dark-400">Bagaimana pengalaman Anda secara keseluruhan?</p>
                </div>

                <div className="flex flex-col items-center gap-4 py-6">
                  <StarRating value={rating} onChange={setRating} onHover={setHoverRating} size="lg" />
                  <p className="text-sm text-dark-400">
                    {rating === 0 && 'Pilih rating'}
                    {rating === 1 && '😞 Sangat Buruk'}
                    {rating === 2 && '😕 Buruk'}
                    {rating === 3 && '😐 Cukup'}
                    {rating === 4 && '😊 Baik'}
                    {rating === 5 && '🤩 Sangat Baik'}
                  </p>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
                )}

                <WizardNavigation nextDisabled={rating === 0} nextLabel="Lanjut →" showPrev={false} />
              </div>
            </WizardStep>

            {/* Step 2: Category Ratings */}
            <WizardStep step={1}>
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-3xl mb-3">📊</p>
                  <h2 className="text-xl font-light text-dark-100">Rating Detail</h2>
                  <p className="mt-1 text-sm text-dark-400">Berikan penilaian per kategori (opsional)</p>
                </div>

                <div className="space-y-4">
                  {Object.entries(categoryLabels).map(([key, { label, desc, emoji }]) => (
                    <div key={key} className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-dark-200">{emoji} {label}</p>
                          <p className="text-xs text-dark-500">{desc}</p>
                        </div>
                      </div>
                      <StarRating
                        value={categories[key as keyof typeof categories]}
                        onChange={(v) => setCategories((prev) => ({ ...prev, [key]: v }))}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>

                <WizardNavigation nextLabel="Lanjut →" />
              </div>
            </WizardStep>

            {/* Step 3: Comment & Submit */}
            <WizardStep step={2}>
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-3xl mb-3">💬</p>
                  <h2 className="text-xl font-light text-dark-100">Komentar</h2>
                  <p className="mt-1 text-sm text-dark-400">Ceritakan pengalaman Anda (opsional)</p>
                </div>

                <div>
                  <Textarea
                    placeholder="Ceritakan pengalaman Anda... (minimal 10 karakter)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={5}
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-dark-500">
                    {comment.length}/500 karakter
                    {comment.length > 0 && comment.length < 10 && (
                      <span className="text-amber-400 ml-2">(minimal 10 karakter)</span>
                    )}
                  </p>
                </div>

                {/* Summary */}
                <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-4 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-dark-500">Ringkasan Review</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-dark-400">Rating:</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <svg key={s} className={`h-4 w-4 ${s <= rating ? 'text-yellow-400' : 'text-dark-600'}`} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
                )}

                <WizardNavigation
                  nextLabel={submitting ? 'Mengirim...' : 'Kirim Review'}
                  nextDisabled={submitting}
                  onNext={() => { handleSubmit(); return false; }}
                />
              </div>
            </WizardStep>
          </>
        )}
      </WizardShell>
    </div>
  );
}
