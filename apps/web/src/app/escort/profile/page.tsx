'use client';

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WizardShell, WizardStep, StepIndicator, WizardNavigation } from '@/components/ui/wizard';
import api from '@/lib/api';
import { Award, Camera, Check, Clapperboard, Crown, Gem, Hourglass, Lightbulb, Trophy } from 'lucide-react';
import { Icon } from '@/components/ui/icon';

// ─── Types ──────────────────────────────────────────────────────
interface EscortProfile {
  bio?: string;
  languages: string[];
  skills: string[];
  hourlyRate: number;
  portfolioUrls: string[];
  videoIntroUrl?: string;
  ratingAvg: number;
  totalReviews: number;
  totalBookings: number;
  tier: string;
  isApproved: boolean;
  certifications: Certification[];
  // New extended fields
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
}

interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  isVerified: boolean;
  documentUrl?: string;
}

// ─── Constants ──────────────────────────────────────────────────
const TIER_COLORS: Record<string, string> = {
  SILVER: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  GOLD: 'bg-amber-500/10 text-amber-400 border-amber-400/20',
  PLATINUM: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  DIAMOND: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const TIER_ICONS: Record<string, string> = {
  SILVER: 'Award',
  GOLD: 'Trophy',
  PLATINUM: 'Gem',
  DIAMOND: 'Crown',
};

const MAX_PORTFOLIO = 10;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

// Options matching registration form
const BODY_TYPES = ['Langsing', 'Ramping', 'Atletis', 'Sedang', 'Berisi', 'Mungil', 'Berotot'];
const EYE_COLORS = ['Hitam', 'Cokelat', 'Hazel', 'Hijau', 'Biru', 'Abu-abu'];
const COMPLEXIONS = ['Putih', 'Cerah', 'Sawo Matang', 'Zaitun', 'Kecokelatan', 'Gelap'];
const TRAVEL_SCOPES = ['Kota saja', 'Dalam provinsi', 'Nasional', 'Asia Tenggara', 'Internasional'];
const SMOKING_OPTIONS = ['Tidak', 'Ya', 'Sesekali'];
const AGE_RANGES = ['Awal 20-an', 'Pertengahan 20-an', 'Akhir 20-an', 'Awal 30-an', 'Pertengahan 30-an', 'Akhir 30-an', '40+'];

// ─── Component ──────────────────────────────────────────────────
export default function EscortProfilePage() {
  const { user, fetchProfile } = useAuthStore();

  // State
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<EscortProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [form, setForm] = useState({
    bio: '',
    languages: '',
    skills: '',
    hourlyRate: 0,
    // Extended fields
    age: '',
    height: '',
    weight: '',
    bodyType: '',
    hairStyle: '',
    eyeColor: '',
    complexion: '',
    nationality: '',
    occupation: '',
    fieldOfWork: '',
    basedIn: '',
    travelScope: '',
    smoking: '',
    tattooPiercing: '',
    // Favourites
    favBooks: '',
    favFilms: '',
    favInterests: '',
    favSports: '',
    favCuisine: '',
    favDrinks: '',
    favPerfume: '',
  });

  // Upload states
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([]);

  // Refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Certification
  const certDocInputRef = useRef<HTMLInputElement>(null);
  const [showCertForm, setShowCertForm] = useState(false);
  const [certForm, setCertForm] = useState({ name: '', issuingOrganization: '' });
  const [certDocFile, setCertDocFile] = useState<File | null>(null);
  const [certDocPreview, setCertDocPreview] = useState('');
  const [certSubmitting, setCertSubmitting] = useState(false);

  // Portfolio lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // ─── Effects ──────────────────────────────────────────────────
  useEffect(() => { loadProfile(); }, []);
  useEffect(() => {
    if (success || error) {
      const t = setTimeout(() => { setSuccess(''); setError(''); }, 5000);
      return () => clearTimeout(t);
    }
  }, [success, error]);

  // ─── Load ─────────────────────────────────────────────────────
  const loadProfile = async () => {
    try {
      const res = await api.get('/users/me');
      const userData = res.data?.data || res.data;
      const ep = userData?.escortProfile;
      if (ep) {
        setProfile(ep);
        const fav = ep.favourites || {};
        setForm({
          bio: ep.bio || '',
          languages: (ep.languages || []).join(', '),
          skills: (ep.skills || []).join(', '),
          hourlyRate: ep.hourlyRate || 0,
          age: ep.age || '',
          height: ep.height || '',
          weight: ep.weight || '',
          bodyType: ep.bodyType || '',
          hairStyle: ep.hairStyle || '',
          eyeColor: ep.eyeColor || '',
          complexion: ep.complexion || '',
          nationality: ep.nationality || '',
          occupation: ep.occupation || '',
          fieldOfWork: ep.fieldOfWork || '',
          basedIn: ep.basedIn || '',
          travelScope: ep.travelScope || '',
          smoking: ep.smoking || '',
          tattooPiercing: ep.tattooPiercing || '',
          favBooks: fav.books || '',
          favFilms: fav.films || '',
          favInterests: fav.interests || '',
          favSports: fav.sports || '',
          favCuisine: fav.cuisine || '',
          favDrinks: fav.drinks || '',
          favPerfume: fav.perfume || '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setProfileLoading(false);
    }
  };

  // ─── Flash message helper ─────────────────────────────────────
  const flash = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') { setSuccess(msg); setError(''); }
    else { setError(msg); setSuccess(''); }
  };

  // ─── Save Profile ─────────────────────────────────────────────
  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      const favourites: Record<string, string> = {};
      if (form.favBooks) favourites.books = form.favBooks;
      if (form.favFilms) favourites.films = form.favFilms;
      if (form.favInterests) favourites.interests = form.favInterests;
      if (form.favSports) favourites.sports = form.favSports;
      if (form.favCuisine) favourites.cuisine = form.favCuisine;
      if (form.favDrinks) favourites.drinks = form.favDrinks;
      if (form.favPerfume) favourites.perfume = form.favPerfume;

      await api.put('/escorts/me/profile', {
        bio: form.bio,
        languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        hourlyRate: Number(form.hourlyRate),
        age: form.age || undefined,
        height: form.height || undefined,
        weight: form.weight || undefined,
        bodyType: form.bodyType || undefined,
        hairStyle: form.hairStyle || undefined,
        eyeColor: form.eyeColor || undefined,
        complexion: form.complexion || undefined,
        nationality: form.nationality || undefined,
        occupation: form.occupation || undefined,
        fieldOfWork: form.fieldOfWork || undefined,
        basedIn: form.basedIn || undefined,
        travelScope: form.travelScope || undefined,
        smoking: form.smoking || undefined,
        tattooPiercing: form.tattooPiercing || undefined,
        favourites: Object.keys(favourites).length > 0 ? favourites : undefined,
      });
      await loadProfile();
      flash('success', 'Profil escort berhasil diperbarui');
      setIsEditing(false);
    } catch (err: any) {
      flash('error', err?.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  // ─── Avatar Upload ────────────────────────────────────────────
  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { flash('error', 'Format foto harus JPG, PNG, atau WebP'); return; }
    if (file.size > MAX_AVATAR_SIZE) { flash('error', 'Ukuran foto maksimal 5MB'); return; }

    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchProfile();
      flash('success', 'Foto profil berhasil diperbarui');
    } catch (err: any) {
      flash('error', err?.response?.data?.message || 'Gagal mengupload foto profil');
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // ─── Portfolio Upload ─────────────────────────────────────────
  const handlePortfolioUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const currentCount = profile?.portfolioUrls?.length || 0;
    if (currentCount + files.length > MAX_PORTFOLIO) {
      flash('error', `Maksimal ${MAX_PORTFOLIO} foto portfolio. Anda sudah memiliki ${currentCount} foto.`);
      return;
    }

    setPortfolioUploading(true);
    setError('');

    try {
      const fd = new FormData();
      const previews: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
          flash('error', `"${f.name}" bukan format yang didukung (JPG, PNG, WebP)`);
          setPortfolioUploading(false);
          return;
        }
        if (f.size > MAX_PHOTO_SIZE) {
          flash('error', `"${f.name}" terlalu besar. Maksimal 5MB`);
          setPortfolioUploading(false);
          return;
        }
        fd.append('files', f);
        previews.push(URL.createObjectURL(f));
      }
      setPortfolioPreviews(previews);

      await api.post('/escorts/me/portfolio', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPortfolioPreviews([]);
      await loadProfile();
      flash('success', `${files.length} foto berhasil diupload`);
    } catch (err: any) {
      flash('error', err?.response?.data?.message || 'Gagal mengupload portfolio');
    } finally {
      setPortfolioUploading(false);
      if (portfolioInputRef.current) portfolioInputRef.current.value = '';
    }
  };

  const handleRemovePortfolio = async (url: string) => {
    if (!confirm('Hapus foto portfolio ini?')) return;
    try {
      await api.delete('/escorts/me/portfolio', { data: { url } });
      await loadProfile();
      flash('success', 'Foto portfolio berhasil dihapus');
    } catch (err: any) {
      flash('error', err?.response?.data?.message || 'Gagal menghapus portfolio');
    }
  };

  // ─── Video Intro Upload ───────────────────────────────────────
  const handleVideoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      flash('error', 'Format video harus MP4, WebM, atau MOV');
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      flash('error', 'Ukuran video maksimal 50MB');
      return;
    }

    setVideoUploading(true);
    setVideoProgress(0);

    try {
      const fd = new FormData();
      fd.append('video', file);
      await api.post('/escorts/me/video-intro', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (p) => {
          if (p.total) setVideoProgress(Math.round((p.loaded / p.total) * 100));
        },
      });
      await loadProfile();
      flash('success', 'Video intro berhasil diupload');
    } catch (err: any) {
      flash('error', err?.response?.data?.message || 'Gagal mengupload video');
    } finally {
      setVideoUploading(false);
      setVideoProgress(0);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleRemoveVideo = async () => {
    if (!confirm('Hapus video intro?')) return;
    try {
      await api.delete('/escorts/me/video-intro');
      await loadProfile();
      flash('success', 'Video intro berhasil dihapus');
    } catch (err: any) {
      flash('error', err?.response?.data?.message || 'Gagal menghapus video');
    }
  };

  // ─── Certification ────────────────────────────────────────────
  const handleCertDocSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) { flash('error', 'Format dokumen harus JPG, PNG, WebP, atau PDF'); return; }
    if (file.size > 10 * 1024 * 1024) { flash('error', 'Ukuran dokumen maksimal 10MB'); return; }
    setCertDocFile(file);
    setCertDocPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : 'pdf');
  };

  const handleAddCert = async (e: FormEvent) => {
    e.preventDefault();
    if (!certDocFile) { flash('error', 'Upload dokumen sertifikasi terlebih dahulu'); return; }
    setCertSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('document', certDocFile);
      fd.append('certName', certForm.name);
      fd.append('issuer', certForm.issuingOrganization);
      await api.post('/escorts/me/certifications/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await loadProfile();
      setShowCertForm(false);
      setCertForm({ name: '', issuingOrganization: '' });
      setCertDocFile(null);
      setCertDocPreview('');
      flash('success', 'Sertifikasi berhasil ditambahkan');
    } catch (err: any) {
      flash('error', err?.response?.data?.message || 'Gagal menambahkan sertifikasi');
    } finally {
      setCertSubmitting(false);
    }
  };

  const handleDeleteCert = async (certId: string) => {
    if (!confirm('Hapus sertifikasi ini?')) return;
    try {
      await api.delete(`/escorts/me/certifications/${certId}`);
      await loadProfile();
      flash('success', 'Sertifikasi berhasil dihapus');
    } catch (err: any) {
      flash('error', err?.response?.data?.message || 'Gagal menghapus sertifikasi');
    }
  };

  // ─── Render helpers ───────────────────────────────────────────
  const formatCurrency = (n: number) => `Rp ${Number(n).toLocaleString('id-ID')}`;

  // ─── Loading ──────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-dark-100">Profil Escort</h1>
        <p className="mt-1 text-sm text-dark-400">Kelola profil, portfolio, dan sertifikasi Anda</p>
      </div>

      {/* Flash Messages */}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
          {error}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          SECTION 1: Profile Card with Avatar Upload
          ══════════════════════════════════════════════════════════ */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            {/* Avatar with Upload */}
            <div className="relative group">
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
              {user?.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt="Avatar"
                  className="h-24 w-24 rounded-2xl object-cover ring-2 ring-brand-400/30 transition-all group-hover:ring-brand-400/60"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-brand-400/10 ring-2 ring-brand-400/30">
                  <span className="text-3xl font-medium text-brand-400">{user?.firstName?.[0] || 'E'}</span>
                </div>
              )}
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-400 text-dark-900 shadow-lg transition-transform hover:scale-110 disabled:opacity-50"
                title="Ganti foto profil"
              >
                {avatarUploading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-dark-900/30 border-t-dark-900" />
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                <h2 className="text-xl font-medium text-dark-100">
                  {user?.firstName} {user?.lastName}
                </h2>
                <div className="mt-1 flex items-center justify-center gap-2 sm:mt-0">
                  {profile?.tier && (
                    <Badge className={TIER_COLORS[profile.tier] || ''}>
                      <Icon name={TIER_ICONS[profile.tier] || 'Award'} className="h-4 w-4 inline-block" /> {profile.tier}
                    </Badge>
                  )}
                  <Badge className={profile?.isApproved
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  }>
                    {profile?.isApproved ? <><Check className="h-4 w-4 inline-block" /> Terverifikasi</> : <><Hourglass className="h-4 w-4 inline-block" /> Menunggu Verifikasi</>}
                  </Badge>
                </div>
              </div>
              <p className="mt-1 text-sm text-dark-400">{user?.email}</p>

              {/* Stats */}
              <div className="mt-4 flex items-center justify-center gap-6 sm:justify-start">
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-1">
                    <svg className="h-4 w-4 text-brand-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-lg font-semibold text-dark-100">{profile?.ratingAvg?.toFixed(1) || '0.0'}</span>
                  </div>
                  <p className="text-xs text-dark-500">{(profile?.totalReviews || 0).toLocaleString('id-ID')} ulasan</p>
                </div>
                <div className="h-8 w-px bg-dark-700/50" />
                <div className="text-center sm:text-left">
                  <p className="text-lg font-semibold text-dark-100">{(profile?.totalBookings || 0).toLocaleString('id-ID')}</p>
                  <p className="text-xs text-dark-500">pemesanan</p>
                </div>
                <div className="h-8 w-px bg-dark-700/50" />
                <div className="text-center sm:text-left">
                  <p className="text-lg font-semibold text-brand-400">{formatCurrency(profile?.hourlyRate || 0)}</p>
                  <p className="text-xs text-dark-500">per jam</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2: Detail Layanan (Bio, Skills, etc.)
          ══════════════════════════════════════════════════════════ */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-dark-100">Detail Layanan</h3>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <svg className="mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <WizardShell totalSteps={5}>
              {({ currentStep, next, prev, direction }) => (
                <div>
                  <StepIndicator currentStep={currentStep} totalSteps={5} labels={['Bio & Layanan', 'Penampilan', 'Profil', 'Favorit', 'Review']} />

                  {/* Step 0: Bio & Layanan */}
                  <WizardStep step={0} currentStep={currentStep} direction={direction}>
                    <div className="space-y-5">
                      <div className="text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10">
                          <span className="text-3xl">📝</span>
                        </div>
                        <h4 className="text-xl font-light text-dark-100">Bio & Layanan</h4>
                        <p className="mt-1 text-sm text-dark-400">Informasi dasar dan layanan yang Anda tawarkan</p>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-dark-300">Bio</label>
                        <Textarea
                          value={form.bio}
                          onChange={(e) => setForm({ ...form, bio: e.target.value })}
                          rows={4}
                          placeholder="Ceritakan tentang diri Anda dan layanan yang ditawarkan..."
                          maxLength={500}
                        />
                        <p className="mt-1 text-xs text-dark-600">{form.bio.length}/500 karakter</p>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-dark-300">💰 Tarif Per Jam (Rp)</label>
                        <Input
                          type="number"
                          value={form.hourlyRate}
                          onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })}
                          min={100000}
                          step={50000}
                        />
                        <p className="mt-1 text-xs text-dark-600">Minimum Rp 100.000</p>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-dark-300">🗣️ Bahasa (pisahkan dengan koma)</label>
                        <Input
                          value={form.languages}
                          onChange={(e) => setForm({ ...form, languages: e.target.value })}
                          placeholder="Indonesia, English, Mandarin"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-dark-300">⭐ Keahlian (pisahkan dengan koma)</label>
                        <Input
                          value={form.skills}
                          onChange={(e) => setForm({ ...form, skills: e.target.value })}
                          placeholder="Berbicara Publik, Networking, Wine Tasting"
                        />
                      </div>

                      <WizardNavigation currentStep={0} totalSteps={5} onNext={next} onPrev={() => setIsEditing(false)} prevLabel="Batal" />
                    </div>
                  </WizardStep>

                  {/* Step 1: Penampilan Fisik */}
                  <WizardStep step={1} currentStep={currentStep} direction={direction}>
                    <div className="space-y-5">
                      <div className="text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10">
                          <span className="text-3xl">✨</span>
                        </div>
                        <h4 className="text-xl font-light text-dark-100">Penampilan Fisik</h4>
                        <p className="mt-1 text-sm text-dark-400">Detail fisik untuk profil Anda</p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-dark-300">Usia</label>
                          <select value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="w-full rounded-lg border border-dark-700/30 bg-dark-800/50 px-3 py-2 text-sm text-dark-200 focus:border-brand-400/50 focus:outline-none">
                            <option value="">Pilih...</option>
                            {AGE_RANGES.map((a) => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-dark-300">Tinggi Badan</label>
                          <Input value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} placeholder="170cm" />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-dark-300">Berat Badan</label>
                          <Input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="55kg" />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-dark-300">Tipe Tubuh</label>
                        <div className="flex flex-wrap gap-1.5">
                          {BODY_TYPES.map((bt) => (
                            <button key={bt} type="button" onClick={() => setForm({ ...form, bodyType: form.bodyType === bt ? '' : bt })}
                              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${form.bodyType === bt ? 'border-brand-400/40 bg-brand-400/10 text-brand-400' : 'border-dark-700/30 text-dark-500 hover:text-dark-300'}`}>
                              {bt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-dark-300">Warna Mata</label>
                          <div className="flex flex-wrap gap-1.5">
                            {EYE_COLORS.map((ec) => (
                              <button key={ec} type="button" onClick={() => setForm({ ...form, eyeColor: form.eyeColor === ec ? '' : ec })}
                                className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${form.eyeColor === ec ? 'border-brand-400/40 bg-brand-400/10 text-brand-400' : 'border-dark-700/30 text-dark-500 hover:text-dark-300'}`}>
                                {ec}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-dark-300">Warna Kulit</label>
                          <div className="flex flex-wrap gap-1.5">
                            {COMPLEXIONS.map((c) => (
                              <button key={c} type="button" onClick={() => setForm({ ...form, complexion: form.complexion === c ? '' : c })}
                                className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${form.complexion === c ? 'border-brand-400/40 bg-brand-400/10 text-brand-400' : 'border-dark-700/30 text-dark-500 hover:text-dark-300'}`}>
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-dark-300">Gaya Rambut</label>
                        <Input value={form.hairStyle} onChange={(e) => setForm({ ...form, hairStyle: e.target.value })} placeholder="Panjang & lurus" />
                      </div>

                      <WizardNavigation currentStep={1} totalSteps={5} onNext={next} onPrev={prev} />
                    </div>
                  </WizardStep>

                  {/* Step 2: Latar Belakang & Gaya Hidup */}
                  <WizardStep step={2} currentStep={currentStep} direction={direction}>
                    <div className="space-y-5">
                      <div className="text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10">
                          <span className="text-3xl">🌍</span>
                        </div>
                        <h4 className="text-xl font-light text-dark-100">Profil & Gaya Hidup</h4>
                        <p className="mt-1 text-sm text-dark-400">Latar belakang dan gaya hidup Anda</p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-dark-300">🌐 Kewarganegaraan</label>
                          <Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} placeholder="Indonesian" />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-dark-300">📍 Domisili</label>
                          <Input value={form.basedIn} onChange={(e) => setForm({ ...form, basedIn: e.target.value })} placeholder="Jakarta" />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-dark-300">💼 Pekerjaan</label>
                          <Input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} placeholder="Model, Mahasiswa, dll" />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-dark-300">🎓 Bidang Pekerjaan/Studi</label>
                          <Input value={form.fieldOfWork} onChange={(e) => setForm({ ...form, fieldOfWork: e.target.value })} placeholder="Fashion, Finance, dll" />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-dark-300">✈️ Jangkauan Perjalanan</label>
                        <div className="flex flex-wrap gap-1.5">
                          {TRAVEL_SCOPES.map((ts) => (
                            <button key={ts} type="button" onClick={() => setForm({ ...form, travelScope: form.travelScope === ts ? '' : ts })}
                              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${form.travelScope === ts ? 'border-brand-400/40 bg-brand-400/10 text-brand-400' : 'border-dark-700/30 text-dark-500 hover:text-dark-300'}`}>
                              {ts}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-dark-300">🚬 Merokok</label>
                          <div className="flex gap-1.5">
                            {SMOKING_OPTIONS.map((so) => (
                              <button key={so} type="button" onClick={() => setForm({ ...form, smoking: form.smoking === so ? '' : so })}
                                className={`rounded-lg border px-4 py-1.5 text-xs transition-colors ${form.smoking === so ? 'border-brand-400/40 bg-brand-400/10 text-brand-400' : 'border-dark-700/30 text-dark-500 hover:text-dark-300'}`}>
                                {so}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-dark-300">Tato & Piercing</label>
                          <Input value={form.tattooPiercing} onChange={(e) => setForm({ ...form, tattooPiercing: e.target.value })} placeholder="Tidak ada, atau jelaskan..." />
                        </div>
                      </div>

                      <WizardNavigation currentStep={2} totalSteps={5} onNext={next} onPrev={prev} />
                    </div>
                  </WizardStep>

                  {/* Step 3: Favorit */}
                  <WizardStep step={3} currentStep={currentStep} direction={direction}>
                    <div className="space-y-5">
                      <div className="text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10">
                          <span className="text-3xl">❤️</span>
                        </div>
                        <h4 className="text-xl font-light text-dark-100">Favorit Anda</h4>
                        <p className="mt-1 text-sm text-dark-400">Klien menyukai pendamping dengan kepribadian menarik</p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-dark-300">📚 Buku Favorit</label>
                          <Input value={form.favBooks} onChange={(e) => setForm({ ...form, favBooks: e.target.value })} placeholder="Judul buku favorit..." />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-dark-300">🎬 Film Favorit</label>
                          <Input value={form.favFilms} onChange={(e) => setForm({ ...form, favFilms: e.target.value })} placeholder="Film favorit..." />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-dark-300">🎯 Minat & Hobi</label>
                          <Input value={form.favInterests} onChange={(e) => setForm({ ...form, favInterests: e.target.value })} placeholder="Menari, membaca, memasak..." />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-dark-300">🏃 Olahraga</label>
                          <Input value={form.favSports} onChange={(e) => setForm({ ...form, favSports: e.target.value })} placeholder="Yoga, renang, lari..." />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-dark-300">🍽️ Masakan</label>
                          <Input value={form.favCuisine} onChange={(e) => setForm({ ...form, favCuisine: e.target.value })} placeholder="Italian, Japanese..." />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-dark-300">🍷 Minuman</label>
                          <Input value={form.favDrinks} onChange={(e) => setForm({ ...form, favDrinks: e.target.value })} placeholder="Wine, coffee..." />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-dark-300">🌸 Parfum</label>
                          <Input value={form.favPerfume} onChange={(e) => setForm({ ...form, favPerfume: e.target.value })} placeholder="Brand & nama..." />
                        </div>
                      </div>

                      <WizardNavigation currentStep={3} totalSteps={5} onNext={next} onPrev={prev} />
                    </div>
                  </WizardStep>

                  {/* Step 4: Review & Save */}
                  <WizardStep step={4} currentStep={currentStep} direction={direction}>
                    <div className="space-y-5">
                      <div className="text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10">
                          <span className="text-3xl">📋</span>
                        </div>
                        <h4 className="text-xl font-light text-dark-100">Review & Simpan</h4>
                        <p className="mt-1 text-sm text-dark-400">Periksa perubahan sebelum menyimpan</p>
                      </div>

                      <div className="space-y-4 rounded-lg bg-dark-800/30 p-4">
                        {form.bio && (
                          <div>
                            <span className="text-xs text-dark-500">Bio</span>
                            <p className="mt-0.5 text-sm text-dark-200 line-clamp-2">{form.bio}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          {form.hourlyRate > 0 && (
                            <div><span className="text-xs text-dark-500">Tarif</span><p className="text-sm text-brand-400">Rp {Number(form.hourlyRate).toLocaleString('id-ID')}/jam</p></div>
                          )}
                          {form.languages && <div><span className="text-xs text-dark-500">Bahasa</span><p className="text-sm text-dark-200">{form.languages}</p></div>}
                          {form.skills && <div><span className="text-xs text-dark-500">Keahlian</span><p className="text-sm text-dark-200">{form.skills}</p></div>}
                          {form.age && <div><span className="text-xs text-dark-500">Usia</span><p className="text-sm text-dark-200">{form.age}</p></div>}
                          {form.bodyType && <div><span className="text-xs text-dark-500">Tipe Tubuh</span><p className="text-sm text-dark-200">{form.bodyType}</p></div>}
                          {form.height && <div><span className="text-xs text-dark-500">Tinggi</span><p className="text-sm text-dark-200">{form.height}</p></div>}
                          {form.nationality && <div><span className="text-xs text-dark-500">Kebangsaan</span><p className="text-sm text-dark-200">{form.nationality}</p></div>}
                          {form.basedIn && <div><span className="text-xs text-dark-500">Domisili</span><p className="text-sm text-dark-200">{form.basedIn}</p></div>}
                          {form.travelScope && <div><span className="text-xs text-dark-500">Jangkauan</span><p className="text-sm text-dark-200">{form.travelScope}</p></div>}
                        </div>
                      </div>

                      <WizardNavigation
                        currentStep={4}
                        totalSteps={5}
                        onNext={() => { handleSubmit(); return false; }}
                        onPrev={prev}
                        nextLabel={saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
                        nextDisabled={saving}
                        isLoading={saving}
                      />
                    </div>
                  </WizardStep>
                </div>
              )}
            </WizardShell>
          ) : (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-dark-500">Bio</span>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-dark-200">
                  {profile?.bio || <span className="italic text-dark-600">Belum diisi</span>}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-dark-500">Bahasa</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {(profile?.languages || []).map((lang) => (
                      <Badge key={lang} className="bg-dark-700/50 text-dark-200 border-dark-600/30">{lang}</Badge>
                    ))}
                    {!profile?.languages?.length && <span className="text-sm italic text-dark-600">Belum diisi</span>}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-dark-500">Keahlian</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {(profile?.skills || []).map((skill) => (
                      <Badge key={skill} className="bg-brand-400/10 text-brand-400 border-brand-400/20">{skill}</Badge>
                    ))}
                    {!profile?.skills?.length && <span className="text-sm italic text-dark-600">Belum diisi</span>}
                  </div>
                </div>
              </div>

              {/* ── Penampilan Fisik (view) ── */}
              {(profile?.age || profile?.height || profile?.weight || profile?.bodyType || profile?.hairStyle || profile?.eyeColor || profile?.complexion) && (
                <div className="border-t border-dark-700/30 pt-4">
                  <h4 className="mb-3 text-xs font-medium uppercase tracking-widest text-dark-500">Penampilan Fisik</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                    {profile?.age && <div><span className="text-[11px] text-dark-500">Usia</span><p className="text-sm text-dark-200">{profile.age}</p></div>}
                    {profile?.height && <div><span className="text-[11px] text-dark-500">Tinggi</span><p className="text-sm text-dark-200">{profile.height}</p></div>}
                    {profile?.weight && <div><span className="text-[11px] text-dark-500">Berat</span><p className="text-sm text-dark-200">{profile.weight}</p></div>}
                    {profile?.bodyType && <div><span className="text-[11px] text-dark-500">Tipe Tubuh</span><p className="text-sm text-dark-200">{profile.bodyType}</p></div>}
                    {profile?.hairStyle && <div><span className="text-[11px] text-dark-500">Rambut</span><p className="text-sm text-dark-200">{profile.hairStyle}</p></div>}
                    {profile?.eyeColor && <div><span className="text-[11px] text-dark-500">Mata</span><p className="text-sm text-dark-200">{profile.eyeColor}</p></div>}
                    {profile?.complexion && <div><span className="text-[11px] text-dark-500">Kulit</span><p className="text-sm text-dark-200">{profile.complexion}</p></div>}
                  </div>
                </div>
              )}

              {/* ── Latar Belakang (view) ── */}
              {(profile?.nationality || profile?.basedIn || profile?.occupation || profile?.fieldOfWork || profile?.travelScope) && (
                <div className="border-t border-dark-700/30 pt-4">
                  <h4 className="mb-3 text-xs font-medium uppercase tracking-widest text-dark-500">Latar Belakang</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                    {profile?.nationality && <div><span className="text-[11px] text-dark-500">Kebangsaan</span><p className="text-sm text-dark-200">{profile.nationality}</p></div>}
                    {profile?.basedIn && <div><span className="text-[11px] text-dark-500">Domisili</span><p className="text-sm text-dark-200">{profile.basedIn}</p></div>}
                    {profile?.occupation && <div><span className="text-[11px] text-dark-500">Pekerjaan</span><p className="text-sm text-dark-200">{profile.occupation}</p></div>}
                    {profile?.fieldOfWork && <div><span className="text-[11px] text-dark-500">Bidang</span><p className="text-sm text-dark-200">{profile.fieldOfWork}</p></div>}
                    {profile?.travelScope && <div><span className="text-[11px] text-dark-500">Jangkauan Perjalanan</span><p className="text-sm text-dark-200">{profile.travelScope}</p></div>}
                  </div>
                </div>
              )}

              {/* ── Gaya Hidup (view) ── */}
              {(profile?.smoking || profile?.tattooPiercing) && (
                <div className="border-t border-dark-700/30 pt-4">
                  <h4 className="mb-3 text-xs font-medium uppercase tracking-widest text-dark-500">Gaya Hidup</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {profile?.smoking && <div><span className="text-[11px] text-dark-500">Merokok</span><p className="text-sm text-dark-200">{profile.smoking}</p></div>}
                    {profile?.tattooPiercing && <div><span className="text-[11px] text-dark-500">Tato & Piercing</span><p className="text-sm text-dark-200">{profile.tattooPiercing}</p></div>}
                  </div>
                </div>
              )}

              {/* ── Favorit (view) ── */}
              {profile?.favourites && Object.keys(profile.favourites).length > 0 && (
                <div className="border-t border-dark-700/30 pt-4">
                  <h4 className="mb-3 text-xs font-medium uppercase tracking-widest text-dark-500">Favorit</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                    {profile.favourites.books && <div><span className="text-[11px] text-dark-500">Buku</span><p className="text-sm text-dark-200">{profile.favourites.books}</p></div>}
                    {profile.favourites.films && <div><span className="text-[11px] text-dark-500">Film</span><p className="text-sm text-dark-200">{profile.favourites.films}</p></div>}
                    {profile.favourites.interests && <div><span className="text-[11px] text-dark-500">Minat</span><p className="text-sm text-dark-200">{profile.favourites.interests}</p></div>}
                    {profile.favourites.sports && <div><span className="text-[11px] text-dark-500">Olahraga</span><p className="text-sm text-dark-200">{profile.favourites.sports}</p></div>}
                    {profile.favourites.cuisine && <div><span className="text-[11px] text-dark-500">Masakan</span><p className="text-sm text-dark-200">{profile.favourites.cuisine}</p></div>}
                    {profile.favourites.drinks && <div><span className="text-[11px] text-dark-500">Minuman</span><p className="text-sm text-dark-200">{profile.favourites.drinks}</p></div>}
                    {profile.favourites.perfume && <div><span className="text-[11px] text-dark-500">Parfum</span><p className="text-sm text-dark-200">{profile.favourites.perfume}</p></div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3: Portfolio Gallery
          ══════════════════════════════════════════════════════════ */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-dark-100"><Camera className="h-4 w-4 inline-block mr-1" /> Portfolio</h3>
              <p className="mt-0.5 text-xs text-dark-500">Tampilkan foto terbaik Anda untuk menarik klien</p>
            </div>
            <span className="rounded-full bg-dark-700/50 px-2.5 py-0.5 text-xs font-medium text-dark-300">
              {profile?.portfolioUrls?.length || 0} / {MAX_PORTFOLIO}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {/* Hidden input */}
          <input
            ref={portfolioInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handlePortfolioUpload(e.target.files)}
          />

          {/* Upload Button */}
          {(profile?.portfolioUrls?.length || 0) < MAX_PORTFOLIO && (
            <button
              type="button"
              onClick={() => portfolioInputRef.current?.click()}
              disabled={portfolioUploading}
              className="mb-4 w-full rounded-xl border-2 border-dashed border-dark-700/50 bg-dark-800/20 p-8 text-center transition-all hover:border-brand-400/30 hover:bg-dark-800/40 disabled:opacity-50"
            >
              {portfolioUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
                  <span className="text-sm text-dark-400">Mengupload foto...</span>
                </div>
              ) : (
                <>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-400/10">
                    <svg className="h-6 w-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-dark-300">Upload Foto Portfolio</p>
                  <p className="mt-1 text-xs text-dark-600">JPG, PNG, WebP • Maks 5MB • Bisa pilih beberapa file sekaligus</p>
                </>
              )}
            </button>
          )}

          {/* Upload Previews */}
          {portfolioPreviews.length > 0 && (
            <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {portfolioPreviews.map((preview, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-dark-700 ring-2 ring-brand-400/40">
                  <img src={preview} alt="Preview" className="h-full w-full object-cover opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Gallery Grid */}
          {(profile?.portfolioUrls?.length || 0) > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {(profile?.portfolioUrls || []).map((url, i) => (
                <div
                  key={i}
                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-dark-700"
                  onClick={() => setLightboxUrl(url)}
                >
                  <img
                    src={url}
                    alt={`Portfolio ${i + 1}`}
                    className="h-full w-full object-cover transition-all duration-300 group-hover:scale-105 group-hover:opacity-80"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-dark-900/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex w-full items-center justify-between p-2">
                      <span className="rounded bg-dark-900/60 px-1.5 py-0.5 text-[10px] text-dark-300">{i + 1}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemovePortfolio(url); }}
                        className="rounded-full bg-red-500/80 p-1.5 text-white transition-colors hover:bg-red-500"
                        title="Hapus foto"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !portfolioPreviews.length && (
            <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 py-8 text-center">
              <div className="mb-2"><Camera className="h-8 w-8" /></div>
              <p className="text-sm text-dark-400">Belum ada foto portfolio</p>
              <p className="mt-1 text-xs text-dark-600">Upload foto untuk menampilkan portfolio Anda kepada calon klien</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════
          SECTION 4: Video Intro Upload
          ══════════════════════════════════════════════════════════ */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-dark-100"><Clapperboard className="h-4 w-4 inline-block mr-1" /> Video Intro</h3>
              <p className="mt-0.5 text-xs text-dark-500">Video perkenalan singkat untuk meningkatkan daya tarik profil Anda</p>
            </div>
            {profile?.videoIntroUrl && (
              <button
                onClick={handleRemoveVideo}
                className="rounded-lg px-2.5 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
              >
                Hapus Video
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            className="hidden"
            onChange={handleVideoUpload}
          />

          {profile?.videoIntroUrl ? (
            /* Video Player */
            <div className="overflow-hidden rounded-xl bg-dark-900">
              <video
                src={profile.videoIntroUrl}
                controls
                preload="metadata"
                className="w-full rounded-xl"
                style={{ maxHeight: '400px' }}
              >
                Browser Anda tidak mendukung pemutar video.
              </video>
              <div className="flex items-center justify-between border-t border-dark-700/50 px-4 py-2.5">
                <span className="flex items-center gap-1.5 text-xs text-dark-400">
                  <svg className="h-3.5 w-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Video berhasil diupload
                </span>
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="text-xs text-brand-400 transition-colors hover:text-brand-300"
                >
                  Ganti Video
                </button>
              </div>
            </div>
          ) : (
            /* Upload Area */
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={videoUploading}
              className="w-full rounded-xl border-2 border-dashed border-dark-700/50 bg-dark-800/20 p-10 text-center transition-all hover:border-brand-400/30 hover:bg-dark-800/40 disabled:opacity-50"
            >
              {videoUploading ? (
                <div className="space-y-3">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-brand-400/30 border-t-brand-400" />
                  <p className="text-sm font-medium text-dark-300">Mengupload video... {videoProgress}%</p>
                  <div className="mx-auto h-1.5 w-48 overflow-hidden rounded-full bg-dark-700/50">
                    <div
                      className="h-full rounded-full bg-brand-400 transition-all"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-dark-600">Mohon tunggu, jangan tutup halaman ini</p>
                </div>
              ) : (
                <>
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-400/10">
                    <svg className="h-7 w-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-dark-300">Upload Video Intro</p>
                  <p className="mt-1 text-xs text-dark-600">MP4, WebM, MOV • Maksimal 50MB</p>
                  <p className="mt-2 text-xs text-dark-600">
                    <Lightbulb className="h-4 w-4 inline-block" /> <span className="text-dark-400">Tips:</span> Video berdurasi 30-60 detik, perkenalkan diri Anda dan layanan yang ditawarkan
                  </p>
                </>
              )}
            </button>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════
          SECTION 5: Sertifikasi
          ══════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-dark-100"><Award className="h-4 w-4 inline-block mr-1" /> Sertifikasi</h3>
              <p className="mt-0.5 text-xs text-dark-500">Bukti keahlian profesional untuk meningkatkan kepercayaan klien</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowCertForm(!showCertForm)}>
              {showCertForm ? 'Batal' : '+ Tambah'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Certification Form */}
          {showCertForm && (
            <form onSubmit={handleAddCert} className="mb-6 space-y-3 rounded-xl border border-brand-400/20 bg-brand-400/5 p-4">
              <h4 className="text-sm font-medium text-dark-200">Tambah Sertifikasi Baru</h4>
              <div>
                <label className="mb-1 block text-sm font-medium text-dark-300">Nama Sertifikasi</label>
                <Input
                  value={certForm.name}
                  onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                  placeholder="Pertolongan Pertama, Pelatihan Etiket, dll."
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-dark-300">Institusi Penerbit</label>
                <Input
                  value={certForm.issuingOrganization}
                  onChange={(e) => setCertForm({ ...certForm, issuingOrganization: e.target.value })}
                  placeholder="Palang Merah Indonesia, Institut Etiket Swiss, dll."
                  required
                />
              </div>

              {/* Document Upload */}
              <div>
                <label className="mb-1 block text-sm font-medium text-dark-300">Dokumen Sertifikat</label>
                <input
                  ref={certDocInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => handleCertDocSelect(e.target.files)}
                />
                {certDocFile ? (
                  <div className="flex items-center gap-3 rounded-lg border border-dark-700/50 bg-dark-800/30 p-3">
                    {certDocPreview === 'pdf' ? (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
                        <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                    ) : (
                      <img src={certDocPreview} alt="Preview" className="h-12 w-12 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm text-dark-200">{certDocFile.name}</p>
                      <p className="text-xs text-dark-500">{(certDocFile.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button type="button" onClick={() => { setCertDocFile(null); setCertDocPreview(''); }} className="rounded p-1 text-dark-500 hover:text-red-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => certDocInputRef.current?.click()}
                    className="w-full rounded-lg border-2 border-dashed border-dark-700/50 bg-dark-800/20 p-4 text-center transition-colors hover:border-brand-400/30"
                  >
                    <svg className="mx-auto h-6 w-6 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-1 text-xs text-dark-500">Upload dokumen (JPG, PNG, PDF • Maks 10MB)</p>
                  </button>
                )}
              </div>

              <Button type="submit" size="sm" disabled={certSubmitting}>
                {certSubmitting ? 'Mengupload...' : 'Tambah Sertifikasi'}
              </Button>
            </form>
          )}

          {/* Certification List */}
          {profile?.certifications?.length ? (
            <div className="space-y-3">
              {profile.certifications.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between rounded-xl border border-dark-700/50 bg-dark-800/30 p-4 transition-colors hover:border-dark-600/50">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cert.isVerified ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                      {cert.isVerified ? (
                        <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      ) : (
                        <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-200">{cert.name}</p>
                      <p className="text-xs text-dark-400">{cert.issuingOrganization}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cert.isVerified
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }>
                      {cert.isVerified ? <><Check className="h-4 w-4 inline-block" /> Terverifikasi</> : <><Hourglass className="h-4 w-4 inline-block" /> Menunggu</>}
                    </Badge>
                    <button
                      onClick={() => handleDeleteCert(cert.id)}
                      className="rounded-lg p-1.5 text-dark-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      title="Hapus sertifikasi"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 py-8 text-center">
              <div className="mb-2"><Trophy className="h-8 w-8" /></div>
              <p className="text-sm text-dark-400">Belum ada sertifikasi</p>
              <p className="mt-1 text-xs text-dark-600">Tambahkan sertifikasi untuk meningkatkan kepercayaan klien</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════
          Lightbox Modal
          ══════════════════════════════════════════════════════════ */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/90 p-4 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 rounded-full bg-dark-800/80 p-2 text-dark-300 transition-colors hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxUrl}
            alt="Portfolio"
            className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
