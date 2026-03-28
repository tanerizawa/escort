'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { usePresenceStore } from '@/stores/presence.store';

// ─── Types ──────────────────────────────────────────────────────
interface EscortDetail {
  id: string;
  bio?: string;
  hourlyRate: number;
  ratingAvg: number;
  totalReviews: number;
  totalBookings: number;
  tier: string;
  languages: string[];
  skills: string[];
  portfolioUrls: string[];
  videoIntroUrl?: string;
  isApproved: boolean;
  createdAt: string;
  // Extended fields
  age?: string;
  height?: string;
  weight?: string;
  bodyType?: string;
  hairStyle?: string;
  eyeColor?: string;
  complexion?: string;
  nationality?: string;
  occupation?: string;
  fieldOfWork?: string;
  basedIn?: string;
  travelScope?: string;
  smoking?: string;
  tattooPiercing?: string;
  favourites?: Record<string, string>;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    isVerified: boolean;
  };
  certifications: Array<{
    id: string;
    certName: string;
    issuer: string;
    isVerified: boolean;
  }>;
}

interface Review {
  id: string;
  overallRating: number;
  comment?: string;
  createdAt: string;
  reviewer: {
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
  booking?: {
    serviceType?: string;
    startTime?: string;
  };
}

// ─── Constants ──────────────────────────────────────────────────
const TIER_LABEL: Record<string, string> = {
  SILVER: 'Silver',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
  DIAMOND: 'Diamond',
};

// ─── Star SVG (reusable) ────────────────────────────────────────
function Stars({ rating, count = 5 }: { rating: number; count?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className={`h-3.5 w-3.5 ${i < Math.round(rating) ? 'text-amber-400' : 'text-dark-700'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

// ─── Decorative divider ─────────────────────────────────────────
function Divider() {
  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-brand-400/30" />
      <span className="text-brand-400/40 text-[10px]">&#9670;</span>
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-brand-400/30" />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
export default function EscortDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const backPath = pathname?.startsWith('/user/') ? '/user/escorts' : '/escorts';
  const { isAuthenticated } = useAuthStore();
  const isPublic = !isAuthenticated && !pathname?.startsWith('/user/');

  const [escort, setEscort] = useState<EscortDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Gallery
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  // Bio expand
  const [bioExpanded, setBioExpanded] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // ─── Load ─────────────────────────────────────────────────────
  useEffect(() => { loadEscort(); }, [params?.id]);

  const loadEscort = async () => {
    try {
      const escortRes = await api.get(`/escorts/${params?.id}`);
      const d = escortRes.data?.data || escortRes.data;
      setEscort(d);
      if (!isPublic) {
        try {
          const reviewsRes = await api.get(`/reviews/escort/${params?.id}`);
          const rd = reviewsRes.data?.data;
          setReviews(Array.isArray(rd) ? rd : (rd?.data || []));
        } catch { /* reviews not available */ }
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  // ─── Gallery helpers ──────────────────────────────────────────
  const allPhotos = escort
    ? [escort.user?.profilePhoto, ...(escort.portfolioUrls || [])].filter(Boolean) as string[]
    : [];

  const openLightbox = useCallback((idx: number) => {
    setLightboxIdx(idx);
    setLightboxOpen(true);
  }, []);

  const lbPrev = useCallback(() => {
    setLightboxIdx((i) => (i - 1 + allPhotos.length) % allPhotos.length);
  }, [allPhotos.length]);

  const lbNext = useCallback(() => {
    setLightboxIdx((i) => (i + 1) % allPhotos.length);
  }, [allPhotos.length]);

  // Keyboard nav
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') lbPrev();
      if (e.key === 'ArrowRight') lbNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, lbPrev, lbNext]);

  // ─── Derived ──────────────────────────────────────────────────
  const memberSince = escort?.createdAt
    ? new Date(escort.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : '';
  const fullName = `${escort?.user?.firstName || ''} ${escort?.user?.lastName || ''}`.trim();
  const isOnline = usePresenceStore((s) => s.isOnline(escort?.user?.id || ''));
  const heroPhoto = escort?.user?.profilePhoto || (escort?.portfolioUrls?.[0] ?? null);
  const bioLines = escort?.bio?.split('\n').filter(Boolean) || [];
  const shortBio = bioLines.slice(0, 3).join('\n');
  const needsExpand = bioLines.length > 3;
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  // ─── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
          <span className="text-xs tracking-wider text-dark-500 uppercase">Memuat profil...</span>
        </div>
      </div>
    );
  }

  if (!escort) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="mb-4 font-serif text-6xl text-dark-700">404</p>
        <h2 className="font-serif text-2xl text-dark-100">Profil Tidak Ditemukan</h2>
        <p className="mt-2 text-sm text-dark-400">Escort yang Anda cari tidak tersedia atau sudah dihapus.</p>
        <Link href={backPath} className="mt-8 inline-flex items-center gap-2 border border-brand-400/30 px-6 py-2.5 text-xs uppercase tracking-widest text-brand-400 transition-all hover:bg-brand-400/5 hover:border-brand-400/50">
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">

      {/* ═══════════════════════════════════════════════════════════
          HERO — Single Primary Photo with Cinematic Overlay
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative">
        <div className="relative h-[60vh] min-h-[480px] max-h-[720px] overflow-hidden bg-dark-900">
          {/* Primary photo only — profile photo or first portfolio as fallback */}
          {heroPhoto ? (
            <img
              src={heroPhoto}
              alt={fullName}
              className={`h-full w-full object-cover object-top${isPublic ? ' scale-110' : ''}`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-dark-800 via-dark-850 to-dark-900">
              <div className="text-center">
                <span className="font-serif text-[120px] leading-none text-dark-700/50">{escort.user?.firstName?.[0] || '?'}</span>
                <p className="mt-4 text-xs uppercase tracking-[0.3em] text-dark-600">
                  {isPublic ? 'Masuk untuk melihat foto' : 'Foto Belum Tersedia'}
                </p>
              </div>
            </div>
          )}

          {/* Multi-layer cinematic gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/20 to-dark-900/5" />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" style={{ height: '50%', top: '50%' }} />
          <div className="absolute inset-0 bg-gradient-to-r from-dark-900/50 via-transparent to-dark-900/20" />
          {/* Subtle vignette */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)' }} />

          {/* Top navigation bar */}
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-4 sm:px-8 sm:py-6">
            <Link
              href={backPath}
              className="flex items-center gap-2 rounded-full bg-black/30 px-5 py-2.5 text-xs font-medium text-white/80 backdrop-blur-md transition-all hover:bg-black/50 hover:text-white border border-white/5"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Kembali
            </Link>

            {!isPublic && allPhotos.length > 1 && (
              <button
                onClick={() => openLightbox(0)}
                className="flex items-center gap-2 rounded-full bg-black/30 px-5 py-2.5 text-xs font-medium text-white/80 backdrop-blur-md transition-all hover:bg-black/50 hover:text-white border border-white/5"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {allPhotos.length} Foto
              </button>
            )}
          </div>

          {/* Bottom overlay — Name + Info */}
          <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-8 sm:px-8 sm:pb-10 lg:px-12">
            <div className="mx-auto max-w-5xl">
              {/* Tier label */}
              <div className="mb-3">
                <span className="inline-block border border-brand-400/30 bg-brand-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-brand-400 backdrop-blur-sm">
                  {TIER_LABEL[escort.tier] || escort.tier} Pendamping
                </span>
              </div>

              {/* Name */}
              <h1 className="font-serif text-4xl font-normal tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                {fullName}
              </h1>

              {/* Decorative line */}
              <div className="mt-4 h-px w-20 bg-gradient-to-r from-brand-400/60 to-transparent" />

              {/* Meta row */}
              <div className="mt-4 flex flex-wrap items-center gap-5 text-sm">
                {isOnline && (
                  <span className="flex items-center gap-1.5 text-green-400/90">
                    <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs uppercase tracking-wider">Online</span>
                  </span>
                )}
                {escort.user?.isVerified && (
                  <span className="flex items-center gap-1.5 text-green-400/90">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-xs uppercase tracking-wider">Terverifikasi</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-white/60">
                  <Stars rating={escort.ratingAvg || 0} />
                  <span className="font-medium text-white/90">{(escort.ratingAvg || 0).toFixed(1)}</span>
                  <span className="text-white/40">({(escort.totalReviews || 0).toLocaleString('id-ID')} ulasan)</span>
                </span>
                <span className="hidden items-center gap-1.5 text-white/50 sm:flex">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-xs">{(escort.totalBookings || 0).toLocaleString('id-ID')} pemesanan selesai</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CONTENT — Magazine layout
          ═══════════════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-5xl px-4 sm:px-8 lg:px-12">
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">

          {/* ── LEFT COLUMN (Editorial) ──────────────────────── */}
          <div className="space-y-12">

            {/* Featured Quote */}
            {escort.bio && (
              <div className="relative border-l-2 border-brand-400/30 pl-6 sm:pl-8">
                <span className="absolute -left-3 -top-2 font-serif text-5xl leading-none text-brand-400/20">&ldquo;</span>
                <p className="font-serif text-xl leading-relaxed text-dark-200 italic sm:text-2xl">
                  {escort.bio.length > 120 ? escort.bio.slice(0, 120).trim() + '...' : escort.bio}
                </p>
              </div>
            )}

            {/* ── ABOUT section ───────────────────────────────── */}
            {!isPublic && escort.bio && (
              <section>
                <h2 className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-dark-500">
                  Tentang
                </h2>
                <Divider />
                <div className="mt-6 space-y-4 text-[15px] leading-[1.8] text-dark-300">
                  {(bioExpanded ? bioLines : bioLines.slice(0, 3)).map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
                {needsExpand && (
                  <button
                    onClick={() => setBioExpanded(!bioExpanded)}
                    className="mt-4 text-xs uppercase tracking-widest text-brand-400 transition-colors hover:text-brand-300"
                  >
                    {bioExpanded ? '— Tampilkan lebih sedikit' : '+ Baca selengkapnya'}
                  </button>
                )}
              </section>
            )}

            {/* ── PROFILE details table ───────────────────────── */}
            <section>
              <h2 className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-dark-500">
                Profil
              </h2>
              <Divider />
              <div className="mt-6">
                <table className="w-full">
                  <tbody className="divide-y divide-dark-700/20">
                    <ProfileRow label="Tarif" value={formatCurrency(Number(escort.hourlyRate) || 0) + ' / jam'} highlight />
                    <ProfileRow label="Tier" value={TIER_LABEL[escort.tier] || escort.tier} />
                    {escort.basedIn && <ProfileRow label="Domisili" value={escort.basedIn} />}
                    {!isPublic && (
                      <>
                        {escort.age && <ProfileRow label="Usia" value={escort.age} />}
                        {escort.height && <ProfileRow label="Tinggi" value={escort.height} />}
                        {escort.weight && <ProfileRow label="Berat" value={escort.weight} />}
                        {escort.bodyType && <ProfileRow label="Tipe Tubuh" value={escort.bodyType} />}
                        {escort.hairStyle && <ProfileRow label="Rambut" value={escort.hairStyle} />}
                        {escort.eyeColor && <ProfileRow label="Warna Mata" value={escort.eyeColor} />}
                        {escort.complexion && <ProfileRow label="Kulit" value={escort.complexion} />}
                        {escort.nationality && <ProfileRow label="Kebangsaan" value={escort.nationality} />}
                        {escort.occupation && <ProfileRow label="Pekerjaan" value={escort.occupation} />}
                        {escort.fieldOfWork && <ProfileRow label="Bidang" value={escort.fieldOfWork} />}
                        {escort.travelScope && <ProfileRow label="Jangkauan Perjalanan" value={escort.travelScope} />}
                        {(escort.languages?.length ?? 0) > 0 && (
                          <ProfileRow label="Bahasa" value={escort.languages.join(', ')} />
                        )}
                        {(escort.skills?.length ?? 0) > 0 && (
                          <ProfileRow label="Keahlian" value={escort.skills.join(', ')} />
                        )}
                        {escort.smoking && <ProfileRow label="Merokok" value={escort.smoking} />}
                        {escort.tattooPiercing && <ProfileRow label="Tato/Piercing" value={escort.tattooPiercing} />}
                        <ProfileRow label="Pemesanan Selesai" value={(escort.totalBookings || 0).toLocaleString('id-ID')} />
                        <ProfileRow label="Penilaian" value={`${(escort.ratingAvg || 0).toFixed(1)} / 5.0 (${(escort.totalReviews || 0).toLocaleString('id-ID')} ulasan)`} />
                        {memberSince && <ProfileRow label="Bergabung" value={memberSince} />}
                        <ProfileRow
                          label="Status"
                          value={escort.isApproved ? 'Terverifikasi & Disetujui' : 'Menunggu Verifikasi'}
                          badge={escort.isApproved}
                        />
                      </>
                    )}
                  </tbody>
                </table>
              </div>
              {isPublic && (
                <p className="mt-4 text-center text-xs text-dark-500 italic">Masuk untuk melihat profil lengkap</p>
              )}
            </section>

            {/* ── FAVOURITES section ──────────────────────────── */}
            {!isPublic && escort.favourites && Object.values(escort.favourites).some(Boolean) && (
              <section>
                <h2 className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-dark-500">
                  Favorit
                </h2>
                <Divider />
                <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
                  {escort.favourites.books && (
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-dark-500">Buku</span>
                      <p className="mt-1 text-sm text-dark-200">{escort.favourites.books}</p>
                    </div>
                  )}
                  {escort.favourites.films && (
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-dark-500">Film</span>
                      <p className="mt-1 text-sm text-dark-200">{escort.favourites.films}</p>
                    </div>
                  )}
                  {escort.favourites.interests && (
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-dark-500">Minat & Hobi</span>
                      <p className="mt-1 text-sm text-dark-200">{escort.favourites.interests}</p>
                    </div>
                  )}
                  {escort.favourites.sports && (
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-dark-500">Olahraga</span>
                      <p className="mt-1 text-sm text-dark-200">{escort.favourites.sports}</p>
                    </div>
                  )}
                  {escort.favourites.cuisine && (
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-dark-500">Masakan</span>
                      <p className="mt-1 text-sm text-dark-200">{escort.favourites.cuisine}</p>
                    </div>
                  )}
                  {escort.favourites.drinks && (
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-dark-500">Minuman</span>
                      <p className="mt-1 text-sm text-dark-200">{escort.favourites.drinks}</p>
                    </div>
                  )}
                  {escort.favourites.perfume && (
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-dark-500">Parfum</span>
                      <p className="mt-1 text-sm text-dark-200">{escort.favourites.perfume}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ── SKILLS visual ────────────────────────────────── */}
            {!isPublic && (escort.skills?.length ?? 0) > 0 && (
              <section>
                <h2 className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-dark-500">
                  Keahlian & Bahasa
                </h2>
                <Divider />
                <div className="mt-6 flex flex-wrap gap-2">
                  {escort.skills.map((s) => (
                    <span key={s} className="border border-brand-400/20 bg-brand-400/5 px-4 py-1.5 text-xs tracking-wide text-brand-400">
                      {s}
                    </span>
                  ))}
                  {(escort.languages || []).map((l) => (
                    <span key={l} className="border border-dark-600/30 bg-dark-800/30 px-4 py-1.5 text-xs tracking-wide text-dark-300">
                      {l}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* ── GALLERY grid ────────────────────────────────── */}
            {isPublic ? (
              <section>
                <h2 className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-dark-500">
                  Galeri Foto
                </h2>
                <Divider />
                <div className="relative mt-6">
                  <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                    {allPhotos.length > 0 ? allPhotos.slice(0, 3).map((url, i) => (
                      <div key={i} className="relative aspect-[3/4] overflow-hidden bg-dark-800">
                        <img
                          src={url}
                          alt="Preview"
                          className="h-full w-full object-cover scale-110"
                        />
                        <div className="absolute inset-0 bg-dark-900/30" />
                      </div>
                    )) : Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="relative aspect-[3/4] overflow-hidden bg-dark-800">
                        <div className="h-full w-full bg-gradient-to-br from-dark-700/60 via-dark-800 to-dark-900" />
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <svg className="mb-3 h-8 w-8 text-brand-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <p className="text-sm font-medium text-dark-100">Masuk untuk melihat galeri foto</p>
                    <p className="mt-1 text-xs text-dark-500">Daftar atau masuk untuk akses galeri lengkap</p>
                    </div>
                  </div>
              </section>
            ) : allPhotos.length > 0 && (
              <section>
                <h2 className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-dark-500">
                  Galeri Foto
                </h2>
                <Divider />
                <div className="mt-6 grid grid-cols-2 gap-1 sm:grid-cols-3">
                  {allPhotos.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => openLightbox(i)}
                      className="group relative aspect-[3/4] overflow-hidden bg-dark-800"
                    >
                      <img
                        src={url}
                        alt={`${fullName} — foto ${i + 1}`}
                        className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-dark-900/0 transition-all duration-500 group-hover:bg-dark-900/20" />
                      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-gradient-to-t from-dark-900/60 to-transparent py-4 opacity-0 transition-opacity group-hover:opacity-100">
                        <svg className="h-5 w-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* ── VIDEO INTRO ─────────────────────────────────── */}
            {!isPublic && escort.videoIntroUrl && (
              <section>
                <h2 className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-dark-500">
                  Video Perkenalan
                </h2>
                <Divider />
                <div className="mt-6 overflow-hidden rounded-sm bg-dark-900">
                  <video
                    src={escort.videoIntroUrl}
                    controls
                    preload="metadata"
                    className="w-full"
                    style={{ maxHeight: '480px' }}
                  />
                </div>
              </section>
            )}

            {/* ── CERTIFICATIONS ──────────────────────────────── */}
            {!isPublic && (escort.certifications?.length ?? 0) > 0 && (
              <section>
                <h2 className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-dark-500">
                  Sertifikasi
                </h2>
                <Divider />
                <div className="mt-6 space-y-3">
                  {escort.certifications.map((cert) => (
                    <div key={cert.id} className="flex items-center gap-4 border-b border-dark-700/20 pb-3 last:border-0">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cert.isVerified ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
                        <svg className={`h-4 w-4 ${cert.isVerified ? 'text-green-400' : 'text-amber-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cert.isVerified ? "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"} />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm text-dark-200">{cert.certName}</span>
                        <span className="mx-2 text-dark-700">—</span>
                        <span className="text-sm text-dark-500">{cert.issuer}</span>
                      </div>
                      <span className={`text-[10px] uppercase tracking-wider ${cert.isVerified ? 'text-green-400' : 'text-amber-400'}`}>
                        {cert.isVerified ? 'Terverifikasi' : 'Menunggu'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── REVIEWS (Testimonials) ──────────────────────── */}
            {!isPublic ? (
            <section className="pb-8">
              <h2 className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-dark-500">
                Ulasan
                {(escort.totalReviews || 0) > 0 && (
                  <span className="ml-2 text-dark-600">({(escort.totalReviews || 0).toLocaleString('id-ID')})</span>
                )}
              </h2>
              <Divider />

              {reviews.length > 0 ? (
                <div className="mt-6 space-y-6">
                  {displayedReviews.map((review) => (
                    <div key={review.id} className="relative border-l border-dark-700/30 pl-6">
                      {/* Quote mark */}
                      <span className="absolute -left-2 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-dark-800 ring-1 ring-dark-700/50">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-400/50" />
                      </span>
                      {review.comment && (
                        <p className="text-sm leading-relaxed text-dark-300 italic">
                          &ldquo;{review.comment}&rdquo;
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-3">
                        {review.reviewer?.profilePhoto ? (
                          <img src={review.reviewer.profilePhoto} alt="" className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-dark-700 text-[10px] font-medium text-dark-400">
                            {review.reviewer?.firstName?.[0] || 'A'}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-dark-500">
                          <span className="font-medium text-dark-300">
                            {review.reviewer?.firstName} {review.reviewer?.lastName?.[0]}.
                          </span>
                          <Stars rating={review.overallRating} />
                          <span className="text-dark-600">
                            {new Date(review.createdAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {reviews.length > 3 && !showAllReviews && (
                    <button
                      onClick={() => setShowAllReviews(true)}
                      className="mt-2 text-xs uppercase tracking-widest text-brand-400 transition-colors hover:text-brand-300"
                    >
                      + Lihat semua {reviews.length} ulasan
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-6 text-center py-10 border border-dark-700/20">
                  <p className="font-serif text-lg text-dark-600 italic">Belum ada ulasan.</p>
                  <p className="mt-1 text-xs text-dark-600">Jadilah yang pertama memberikan ulasan.</p>
                </div>
              )}
            </section>
            ) : (
              /* ── PUBLIC LOGIN CTA ── */
              <section className="pb-8">
                <div className="relative overflow-hidden rounded-sm border border-brand-400/20 bg-gradient-to-br from-dark-800/60 via-dark-850/40 to-dark-900/60 p-8 sm:p-10 text-center">
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(201,169,110,0.3),_transparent_70%)]" />
                  </div>
                  <div className="relative z-10">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-brand-400/20 bg-brand-400/10">
                      <svg className="h-7 w-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                    <h3 className="font-serif text-xl text-dark-100 sm:text-2xl">
                      Lihat Profil Lengkap
                    </h3>
                    <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-dark-400">
                      Masuk atau daftar untuk melihat bio lengkap, galeri foto, ulasan, sertifikasi, dan melakukan pemesanan.
                    </p>
                    <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                      <Link
                        href="/login"
                        className="inline-flex items-center gap-2 rounded-none bg-brand-400 px-8 py-3 text-xs font-bold uppercase tracking-widest text-dark-900 transition-all hover:bg-brand-300"
                      >
                        Masuk
                      </Link>
                      <Link
                        href="/register"
                        className="inline-flex items-center gap-2 rounded-none border border-dark-500/30 px-8 py-3 text-xs font-medium uppercase tracking-widest text-dark-200 transition-all hover:border-brand-400/40 hover:text-brand-400"
                      >
                        Daftar Sekarang
                      </Link>
                    </div>
                    <p className="mt-5 text-[11px] text-dark-600">
                      Gratis &bull; Verifikasi cepat &bull; Akses penuh
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* ── RIGHT COLUMN (Sticky sidebar) ────────────────── */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Booking / Login card */}
              <div className="border border-dark-700/30 bg-dark-800/20 p-6">
                <p className="text-center text-[10px] uppercase tracking-[0.3em] text-dark-500">Tarif mulai dari</p>
                <p className="mt-2 text-center font-serif text-3xl text-brand-400">
                  {formatCurrency(Number(escort.hourlyRate) || 0)}
                </p>
                <p className="text-center text-xs text-dark-600">per jam</p>

                {isPublic ? (
                  <>
                    <Link
                      href="/login"
                      className="mt-6 flex w-full items-center justify-center rounded-none bg-brand-400 py-3 text-xs font-bold uppercase tracking-widest text-dark-900 transition-all hover:bg-brand-300"
                    >
                      Masuk untuk Memesan
                    </Link>
                    <Link
                      href="/register"
                      className="mt-2 flex w-full items-center justify-center rounded-none border border-dark-500/30 py-3 text-xs font-medium uppercase tracking-widest text-dark-200 transition-all hover:border-brand-400/40 hover:text-brand-400"
                    >
                      Daftar Gratis
                    </Link>
                  </>
                ) : (
                  <Button
                    className="mt-6 w-full rounded-none py-3 text-xs uppercase tracking-widest"
                    onClick={() => router.push(`/user/bookings/new?escortId=${escort.user?.id || escort.id}&profileId=${escort.id}`)}
                  >
                    Pesan Sekarang
                  </Button>
                )}

                <div className="mt-6 space-y-3 pt-4 border-t border-dark-700/30">
                  {[
                    { text: 'Identitas Terverifikasi', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                    { text: 'Pembayaran Aman', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
                    { text: 'Dukungan 24/7', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
                  ].map(({ text, icon }) => (
                    <div key={text} className="flex items-center gap-2.5 text-xs text-dark-500">
                      <svg className="h-3.5 w-3.5 text-green-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                      </svg>
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick profile card */}
              <div className="border border-dark-700/30 bg-dark-800/20 p-6">
                <h3 className="mb-4 text-[10px] uppercase tracking-[0.3em] text-dark-500">Detail Profil</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Tier', val: TIER_LABEL[escort.tier] || escort.tier },
                    { label: 'Penilaian', val: `${(escort.ratingAvg || 0).toFixed(1)} / 5.0` },
                    { label: 'Pemesanan', val: (escort.totalBookings || 0).toLocaleString('id-ID') },
                    ...(escort.basedIn ? [{ label: 'Domisili', val: escort.basedIn }] : []),
                    ...(!isPublic ? [
                      ...(escort.age ? [{ label: 'Usia', val: escort.age }] : []),
                      ...(escort.nationality ? [{ label: 'Kebangsaan', val: escort.nationality }] : []),
                      ...(escort.bodyType ? [{ label: 'Tipe Tubuh', val: escort.bodyType }] : []),
                      ...(escort.height ? [{ label: 'Tinggi', val: escort.height }] : []),
                      ...(escort.travelScope ? [{ label: 'Jangkauan', val: escort.travelScope }] : []),
                      ...(memberSince ? [{ label: 'Bergabung', val: memberSince }] : []),
                      ...((escort.languages?.length ?? 0) > 0 ? [{ label: 'Bahasa', val: escort.languages.join(', ') }] : []),
                    ] : []),
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between border-b border-dark-700/15 pb-2 last:border-0">
                      <span className="text-dark-500 text-xs uppercase tracking-wider">{label}</span>
                      <span className="text-dark-200 text-xs">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* ── Mobile Booking CTA (fixed bottom) ──────────────── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-dark-700/30 bg-dark-900/95 backdrop-blur-sm p-4 lg:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-4">
            <div className="flex-1">
              <p className="font-serif text-lg text-brand-400">{formatCurrency(Number(escort.hourlyRate) || 0)}</p>
              <p className="text-[10px] text-dark-500">per jam</p>
            </div>
            {isPublic ? (
              <Link
                href="/login"
                className="rounded-none bg-brand-400 px-8 py-3 text-xs font-bold uppercase tracking-widest text-dark-900 transition-all hover:bg-brand-300"
              >
                Masuk
              </Link>
            ) : (
            <Button
              className="rounded-none px-8 py-3 text-xs uppercase tracking-widest"
              onClick={() => router.push(`/user/bookings/new?escortId=${escort.user?.id || escort.id}&profileId=${escort.id}`)}
            >
              Pesan
            </Button>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          LIGHTBOX
          ═══════════════════════════════════════════════════════════ */}
      {!isPublic && lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 text-white/40 transition-colors hover:text-white sm:right-8 sm:top-6"
          >
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute left-4 top-4 text-xs tracking-wider text-white/40 sm:left-8 sm:top-6">
            {lightboxIdx + 1} / {allPhotos.length}
          </div>

          {/* Arrows */}
          {allPhotos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); lbPrev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-3 text-white/30 transition-colors hover:text-white sm:left-6"
              >
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); lbNext(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-white/30 transition-colors hover:text-white sm:right-6"
              >
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}

          {/* Image */}
          <img
            src={allPhotos[lightboxIdx]}
            alt={`${fullName} — foto ${lightboxIdx + 1}`}
            className="max-h-[90vh] max-w-[92vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// ─── Profile table row component ────────────────────────────────
function ProfileRow({ label, value, highlight, badge }: { label: string; value: string; highlight?: boolean; badge?: boolean }) {
  return (
    <tr>
      <td className="py-3 pr-4 text-xs uppercase tracking-wider text-dark-500 align-top whitespace-nowrap">{label}</td>
      <td className={`py-3 text-sm ${highlight ? 'font-medium text-brand-400' : 'text-dark-200'}`}>
        {badge !== undefined ? (
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${badge ? 'bg-green-400' : 'bg-amber-400'}`} />
            {value}
          </span>
        ) : value}
      </td>
    </tr>
  );
}
