'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';

interface EscortDetail {
  id: string;
  bio?: string;
  hourlyRate: number;
  ratingAvg: number;
  totalReviews: number;
  tier: string;
  languages: string[];
  skills: string[];
  portfolioUrls: string[];
  videoIntroUrl?: string;
  experienceYears: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    isVerified: boolean;
  };
  certifications: Array<{
    id: string;
    name: string;
    issuingOrganization: string;
    isVerified: boolean;
  }>;
}

interface Review {
  id: string;
  overallRating: number;
  comment?: string;
  createdAt: string;
  client: {
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
}

const tierConfig: Record<string, { color: string; bg: string }> = {
  SILVER: { color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
  GOLD: { color: 'text-brand-400', bg: 'bg-brand-400/10 border-brand-400/20' },
  PLATINUM: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  DIAMOND: { color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
};

export default function EscortDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [escort, setEscort] = useState<EscortDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    loadEscort();
  }, [params.id]);

  const loadEscort = async () => {
    try {
      const [escortRes, reviewsRes] = await Promise.all([
        api.get(`/escorts/${params.id}`),
        api.get(`/reviews/escort/${params.id}`).catch(() => ({ data: { data: [] } })),
      ]);
      setEscort(escortRes.data);
      setReviews(reviewsRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load escort', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  if (!escort) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-light text-dark-100">Escort Tidak Ditemukan</h2>
        <p className="mt-2 text-sm text-dark-400">Profil yang Anda cari tidak tersedia.</p>
        <Link href="/escorts" className="mt-4 inline-block text-sm text-brand-400 hover:text-brand-300">
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  const tier = tierConfig[escort.tier] || tierConfig.SILVER;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-dark-500">
        <Link href="/escorts" className="hover:text-brand-400 transition-colors">Escorts</Link>
        <span className="mx-2">/</span>
        <span className="text-dark-300">{escort.user.firstName} {escort.user.lastName}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero */}
          <Card>
            <CardContent className="py-6">
              <div className="flex items-start gap-6">
                <div className="relative shrink-0">
                  {escort.user.profilePhoto ? (
                    <img
                      src={escort.user.profilePhoto}
                      alt={escort.user.firstName}
                      className="h-24 w-24 rounded-xl object-cover ring-2 ring-brand-400/20"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-brand-400/10 ring-2 ring-brand-400/20">
                      <span className="text-3xl font-light text-brand-400">{escort.user.firstName[0]}</span>
                    </div>
                  )}
                  {escort.user.isVerified && (
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 ring-2 ring-dark-800">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-light text-dark-100">
                      {escort.user.firstName} {escort.user.lastName}
                    </h1>
                    <Badge className={tier.bg}>{escort.tier}</Badge>
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <svg className="h-4 w-4 text-brand-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-medium text-dark-100">{escort.ratingAvg?.toFixed(1)}</span>
                      <span className="text-dark-400">({escort.totalReviews} ulasan)</span>
                    </div>
                    {escort.experienceYears > 0 && (
                      <span className="text-dark-400">{escort.experienceYears} tahun pengalaman</span>
                    )}
                  </div>

                  {escort.bio && (
                    <p className="mt-3 text-sm leading-relaxed text-dark-300">{escort.bio}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills & Languages */}
          <Card>
            <CardContent className="py-6">
              <h3 className="mb-4 text-lg font-medium text-dark-100">Keahlian & Bahasa</h3>

              {escort.skills?.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-sm text-dark-400">Keahlian</p>
                  <div className="flex flex-wrap gap-2">
                    {escort.skills.map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {escort.languages?.length > 0 && (
                <div>
                  <p className="mb-2 text-sm text-dark-400">Bahasa</p>
                  <div className="flex flex-wrap gap-2">
                    {escort.languages.map((lang) => (
                      <Badge key={lang}>{lang}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Portfolio */}
          {escort.portfolioUrls?.length > 0 && (
            <Card>
              <CardContent className="py-6">
                <h3 className="mb-4 text-lg font-medium text-dark-100">Portfolio</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {escort.portfolioUrls.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPhoto(url)}
                      className="aspect-square overflow-hidden rounded-lg bg-dark-700 transition-opacity hover:opacity-80"
                    >
                      <img src={url} alt={`Portfolio ${i + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certifications */}
          {escort.certifications?.length > 0 && (
            <Card>
              <CardContent className="py-6">
                <h3 className="mb-4 text-lg font-medium text-dark-100">Sertifikasi</h3>
                <div className="space-y-3">
                  {escort.certifications.map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between rounded-lg border border-dark-700/50 bg-dark-800/30 p-3">
                      <div>
                        <p className="text-sm font-medium text-dark-200">{cert.name}</p>
                        <p className="text-xs text-dark-400">{cert.issuingOrganization}</p>
                      </div>
                      {cert.isVerified && (
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Verified</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <Card>
            <CardContent className="py-6">
              <h3 className="mb-4 text-lg font-medium text-dark-100">
                Ulasan ({escort.totalReviews})
              </h3>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-dark-700/50 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dark-700">
                          <span className="text-xs font-medium text-dark-300">
                            {review.client?.firstName?.[0] || 'C'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-dark-200">
                            {review.client?.firstName} {review.client?.lastName?.[0]}.
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={`h-3 w-3 ${star <= review.overallRating ? 'text-brand-400' : 'text-dark-600'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-xs text-dark-500">
                              {new Date(review.createdAt).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-2 pl-11 text-sm text-dark-400">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-dark-500 py-4">Belum ada ulasan</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — Booking CTA */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card>
              <CardContent className="py-6">
                <div className="text-center">
                  <p className="text-sm text-dark-400">Mulai dari</p>
                  <p className="mt-1 text-3xl font-light text-brand-400">
                    {formatCurrency(escort.hourlyRate)}
                  </p>
                  <p className="text-sm text-dark-500">per jam</p>
                </div>

                <Button
                  className="mt-6 w-full"
                  onClick={() => router.push(`/bookings/new?escortId=${escort.id}`)}
                >
                  Booking Sekarang
                </Button>

                <div className="mt-4 space-y-2 text-xs text-dark-500">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Identitas Terverifikasi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Pembayaran Aman (Escrow)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>Dukungan 24/7</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute right-4 top-4 text-dark-400 hover:text-white"
            onClick={() => setSelectedPhoto(null)}
          >
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={selectedPhoto}
            alt="Portfolio"
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
