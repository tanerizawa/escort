'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Check, X } from 'lucide-react';
import { WizardShell, WizardStep, StepIndicator, WizardNavigation } from '@/components/ui/wizard';

// ─── Types ──────────────────────────────────────────────────────
interface FormData {
  // Step 1: Personal
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  // Step 2: Appearance & Background
  age: string;
  height: string;
  weight: string;
  bodyType: string;
  hairStyle: string;
  eyeColor: string;
  complexion: string;
  nationality: string;
  occupation: string;
  fieldOfWork: string;
  basedIn: string;
  travelScope: string;
  smoking: string;
  tattooPiercing: string;
  // Step 3: Professional
  bio: string;
  languages: string[];
  skills: string[];
  hourlyRate: string;
  tier: string;
  // Step 3 → Favourites
  favBooks: string;
  favFilms: string;
  favInterests: string;
  favSports: string;
  favCuisine: string;
  favDrinks: string;
  favPerfume: string;
  // Step 4: Documents
  ktpNumber: string;
  ktpPhoto: File | null;
  selfiePhoto: File | null;
  certificationNames: string[];
  portfolioFiles: File[];
  portfolioPreviews: string[];
  agreeTerms: boolean;
}

// ─── Options ────────────────────────────────────────────────────
const LANGUAGES = ['Indonesia', 'English', 'Mandarin', 'Japanese', 'Korean', 'French', 'German', 'Arabic', 'Spanish', 'Dutch'];
const SKILLS = [
  'Berbicara Publik', 'Networking', 'Manajemen Acara', 'Penerjemahan', 'Pemandu Wisata',
  'Fine Dining', 'Fotografi', 'Pertemuan Bisnis', 'Teman Perjalanan', 'Fashion',
  'Musik', 'Seni & Budaya', 'Olahraga', 'Kesehatan & Spa', 'Media Sosial',
  'Menari', 'Memasak', 'Wine Tasting', 'Yoga', 'Pijat',
];
const BODY_TYPES = ['Langsing', 'Ramping', 'Atletis', 'Sedang', 'Berisi', 'Mungil', 'Berotot'];
const EYE_COLORS = ['Hitam', 'Cokelat', 'Hazel', 'Hijau', 'Biru', 'Abu-abu'];
const COMPLEXIONS = ['Putih', 'Cerah', 'Sawo Matang', 'Zaitun', 'Kecokelatan', 'Gelap'];
const TRAVEL_SCOPES = ['Kota saja', 'Dalam provinsi', 'Nasional', 'Asia Tenggara', 'Internasional'];
const SMOKING_OPTIONS = ['Tidak', 'Ya', 'Sesekali'];
const AGE_RANGES = ['Awal 20-an', 'Pertengahan 20-an', 'Akhir 20-an', 'Awal 30-an', 'Pertengahan 30-an', 'Akhir 30-an', '40+'];

const STEPS = [
  { number: 1, title: 'Data Pribadi', desc: 'Informasi akun' },
  { number: 2, title: 'Profil & Penampilan', desc: 'Fisik & latar belakang' },
  { number: 3, title: 'Profesional', desc: 'Keahlian & tarif' },
  { number: 4, title: 'Dokumen', desc: 'Verifikasi & portfolio' },
];

// ─── Shared class names ─────────────────────────────────────────
const inputCls = 'w-full rounded-none border border-dark-700/30 bg-dark-800/50 px-4 py-3 text-sm text-dark-200 placeholder-dark-600 focus:border-brand-400/50 focus:outline-none focus:ring-1 focus:ring-brand-400/20 transition-colors';
const labelCls = 'mb-1.5 block text-[11px] uppercase tracking-[0.15em] text-dark-500';
const sectionCls = 'text-xs font-medium uppercase tracking-[0.2em] text-dark-500 border-b border-dark-700/20 pb-2 mb-5';

export default function EscortRegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const ktpInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '',
    age: '', height: '', weight: '', bodyType: '', hairStyle: '',
    eyeColor: '', complexion: '', nationality: '', occupation: '',
    fieldOfWork: '', basedIn: '', travelScope: '', smoking: '', tattooPiercing: '',
    bio: '', languages: [], skills: [], hourlyRate: '', tier: 'SILVER',
    favBooks: '', favFilms: '', favInterests: '', favSports: '',
    favCuisine: '', favDrinks: '', favPerfume: '',
    ktpNumber: '', ktpPhoto: null, selfiePhoto: null,
    certificationNames: [], portfolioFiles: [], portfolioPreviews: [], agreeTerms: false,
  });

  const u = (field: string, value: any) => {
    setForm((p) => ({ ...p, [field]: value }));
    setError('');
  };

  const toggle = (field: 'languages' | 'skills', item: string) => {
    setForm((p) => ({
      ...p,
      [field]: p[field].includes(item) ? p[field].filter((i) => i !== item) : [...p[field], item],
    }));
  };

  // ─── Validation ─────────────────────────────────────────────
  const validate = (s: number): string | null => {
    if (s === 1) {
      if (!form.firstName.trim()) return 'Nama depan wajib diisi';
      if (!form.lastName.trim()) return 'Nama belakang wajib diisi';
      if (!form.email.includes('@')) return 'Email tidak valid';
      if (!form.phone.trim()) return 'Nomor telepon wajib diisi';
      if (form.password.length < 8) return 'Password minimal 8 karakter';
      if (form.password !== form.confirmPassword) return 'Password tidak cocok';
    }
    if (s === 3) {
      if (form.languages.length === 0) return 'Pilih minimal 1 bahasa';
      if (form.skills.length === 0) return 'Pilih minimal 1 keahlian';
      if (!form.hourlyRate || Number(form.hourlyRate) < 100000) return 'Tarif minimum Rp 100.000/jam';
      if (!form.bio || form.bio.length < 20) return 'Bio minimal 20 karakter';
    }
    if (s === 4) {
      if (!form.agreeTerms) return 'Anda harus menyetujui syarat & ketentuan';
    }
    return null;
  };



  // ─── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validate(4);
    if (err) { setError(err); return; }
    setSubmitting(true);
    setError('');

    const favourites: Record<string, string> = {};
    if (form.favBooks) favourites.books = form.favBooks;
    if (form.favFilms) favourites.films = form.favFilms;
    if (form.favInterests) favourites.interests = form.favInterests;
    if (form.favSports) favourites.sports = form.favSports;
    if (form.favCuisine) favourites.cuisine = form.favCuisine;
    if (form.favDrinks) favourites.drinks = form.favDrinks;
    if (form.favPerfume) favourites.perfume = form.favPerfume;

    try {
      const res = await api.post('/auth/register', {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        role: 'ESCORT',
        bio: form.bio,
        languages: form.languages,
        skills: form.skills,
        hourlyRate: Number(form.hourlyRate),
        tier: form.tier,
        certificationNames: form.certificationNames.filter(Boolean),
        portfolioUrls: [],
      });

      const token = res.data?.data?.accessToken || res.data?.accessToken;
      const userId = res.data?.data?.user?.id;
      if (userId) localStorage.setItem('pendingVerificationUserId', userId);

      if (token) {
        // Update extended profile
        try {
          await api.put('/escorts/me/profile', {
            bio: form.bio,
            languages: form.languages,
            skills: form.skills,
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
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch { /* profile update failed, not critical */ }

        // Upload portfolio
        if (form.portfolioFiles.length > 0) {
          try {
            const fd = new FormData();
            form.portfolioFiles.forEach((f) => fd.append('files', f));
            await api.post('/escorts/me/portfolio', fd, {
              headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
            });
          } catch { /* portfolio upload failed */ }
        }
      }

      router.push('/verify-email');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Pendaftaran gagal, coba lagi');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Portfolio helpers ──────────────────────────────────────
  const handlePortfolioSelect = (files: FileList | null) => {
    if (!files) return;
    const nf: File[] = []; const np: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) continue;
      if (f.size > 5 * 1024 * 1024) continue;
      if (form.portfolioFiles.length + nf.length >= 10) break;
      nf.push(f); np.push(URL.createObjectURL(f));
    }
    setForm((p) => ({
      ...p,
      portfolioFiles: [...p.portfolioFiles, ...nf],
      portfolioPreviews: [...p.portfolioPreviews, ...np],
    }));
  };

  const removePortfolio = (idx: number) => {
    URL.revokeObjectURL(form.portfolioPreviews[idx]);
    setForm((p) => ({
      ...p,
      portfolioFiles: p.portfolioFiles.filter((_, i) => i !== idx),
      portfolioPreviews: p.portfolioPreviews.filter((_, i) => i !== idx),
    }));
  };

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-950 px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-serif text-3xl tracking-wide text-dark-100">
            ARETON<span className="text-brand-400">.id</span>
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-dark-500">Pendaftaran Pendamping Profesional</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-5 border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <WizardShell totalSteps={4}>
          {({ currentStep, next, prev, direction }) => (
        <div className="mt-5 border border-dark-700/20 bg-dark-800/10 p-6 sm:p-8">

          <StepIndicator currentStep={currentStep} totalSteps={4} labels={['Data Pribadi', 'Penampilan', 'Profesional', 'Dokumen']} />

          {/* ═══ STEP 1: Data Pribadi ═══ */}
          <WizardStep step={0} currentStep={currentStep} direction={direction}>
            <div className="space-y-5">
              <h2 className={sectionCls}>Informasi Pribadi</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nama Depan *</label>
                  <input type="text" value={form.firstName} onChange={(e) => u('firstName', e.target.value)} className={inputCls} placeholder="John" />
                </div>
                <div>
                  <label className={labelCls}>Nama Belakang *</label>
                  <input type="text" value={form.lastName} onChange={(e) => u('lastName', e.target.value)} className={inputCls} placeholder="Doe" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Email *</label>
                <input type="email" value={form.email} onChange={(e) => u('email', e.target.value)} className={inputCls} placeholder="john@example.com" />
              </div>

              <div>
                <label className={labelCls}>Nomor Telepon *</label>
                <input type="tel" value={form.phone} onChange={(e) => u('phone', e.target.value)} className={inputCls} placeholder="+6281234567890" />
              </div>

              <div>
                <label className={labelCls}>Password *</label>
                <input type="password" value={form.password} onChange={(e) => u('password', e.target.value)} className={inputCls} placeholder="Min. 8 karakter" />
              </div>

              <div>
                <label className={labelCls}>Konfirmasi Password *</label>
                <input type="password" value={form.confirmPassword} onChange={(e) => u('confirmPassword', e.target.value)} className={inputCls} placeholder="Ulangi password" />
              </div>

              <WizardNavigation currentStep={0} totalSteps={4} onNext={() => { const err = validate(1); if (err) { setError(err); return false; } setError(''); next(); }} onPrev={() => { window.location.href = '/register'; }} prevLabel="Daftar Klien" />
            </div>
          </WizardStep>

          {/* ═══ STEP 2: Profil & Penampilan ═══ */}
          <WizardStep step={1} currentStep={currentStep} direction={direction}>
            <div className="space-y-6">
              <h2 className={sectionCls}>Penampilan Fisik</h2>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>Usia</label>
                  <select value={form.age} onChange={(e) => u('age', e.target.value)} className={inputCls}>
                    <option value="">Pilih...</option>
                    {AGE_RANGES.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Tinggi Badan</label>
                  <input type="text" value={form.height} onChange={(e) => u('height', e.target.value)} className={inputCls} placeholder="170cm" />
                </div>
                <div>
                  <label className={labelCls}>Berat Badan</label>
                  <input type="text" value={form.weight} onChange={(e) => u('weight', e.target.value)} className={inputCls} placeholder="55kg" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Tipe Tubuh</label>
                  <div className="flex flex-wrap gap-1.5">
                    {BODY_TYPES.map((bt) => (
                      <button key={bt} type="button" onClick={() => u('bodyType', form.bodyType === bt ? '' : bt)}
                        className={`border px-3 py-1.5 text-xs transition-colors ${form.bodyType === bt ? 'border-brand-400/40 bg-brand-400/10 text-brand-400' : 'border-dark-700/20 text-dark-500 hover:text-dark-300'}`}>
                        {bt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Warna Mata</label>
                  <div className="flex flex-wrap gap-1.5">
                    {EYE_COLORS.map((ec) => (
                      <button key={ec} type="button" onClick={() => u('eyeColor', form.eyeColor === ec ? '' : ec)}
                        className={`border px-3 py-1.5 text-xs transition-colors ${form.eyeColor === ec ? 'border-brand-400/40 bg-brand-400/10 text-brand-400' : 'border-dark-700/20 text-dark-500 hover:text-dark-300'}`}>
                        {ec}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Gaya Rambut</label>
                  <input type="text" value={form.hairStyle} onChange={(e) => u('hairStyle', e.target.value)} className={inputCls} placeholder="Panjang & lurus" />
                </div>
                <div>
                  <label className={labelCls}>Warna Kulit</label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMPLEXIONS.map((c) => (
                      <button key={c} type="button" onClick={() => u('complexion', form.complexion === c ? '' : c)}
                        className={`border px-3 py-1.5 text-xs transition-colors ${form.complexion === c ? 'border-brand-400/40 bg-brand-400/10 text-brand-400' : 'border-dark-700/20 text-dark-500 hover:text-dark-300'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <h2 className={sectionCls}>Latar Belakang</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Kewarganegaraan</label>
                  <input type="text" value={form.nationality} onChange={(e) => u('nationality', e.target.value)} className={inputCls} placeholder="Indonesia" />
                </div>
                <div>
                  <label className={labelCls}>Domisili</label>
                  <input type="text" value={form.basedIn} onChange={(e) => u('basedIn', e.target.value)} className={inputCls} placeholder="Jakarta" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Pekerjaan</label>
                  <input type="text" value={form.occupation} onChange={(e) => u('occupation', e.target.value)} className={inputCls} placeholder="Model, mahasiswa, dll." />
                </div>
                <div>
                  <label className={labelCls}>Bidang Pekerjaan/Studi</label>
                  <input type="text" value={form.fieldOfWork} onChange={(e) => u('fieldOfWork', e.target.value)} className={inputCls} placeholder="Fashion, keuangan, dll." />
                </div>
              </div>

              <div>
                <label className={labelCls}>Jangkauan Perjalanan</label>
                <div className="flex flex-wrap gap-1.5">
                  {TRAVEL_SCOPES.map((ts) => (
                    <button key={ts} type="button" onClick={() => u('travelScope', form.travelScope === ts ? '' : ts)}
                      className={`border px-3 py-1.5 text-xs transition-colors ${form.travelScope === ts ? 'border-brand-400/40 bg-brand-400/10 text-brand-400' : 'border-dark-700/20 text-dark-500 hover:text-dark-300'}`}>
                      {ts}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <h2 className={sectionCls}>Gaya Hidup</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Merokok</label>
                  <div className="flex gap-1.5">
                    {SMOKING_OPTIONS.map((so) => (
                      <button key={so} type="button" onClick={() => u('smoking', form.smoking === so ? '' : so)}
                        className={`border px-4 py-1.5 text-xs transition-colors ${form.smoking === so ? 'border-brand-400/40 bg-brand-400/10 text-brand-400' : 'border-dark-700/20 text-dark-500 hover:text-dark-300'}`}>
                        {so}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Tato & Piercing</label>
                  <input type="text" value={form.tattooPiercing} onChange={(e) => u('tattooPiercing', e.target.value)} className={inputCls} placeholder="Tidak ada, atau jelaskan..." />
                </div>
              </div>

              <WizardNavigation currentStep={1} totalSteps={4} onNext={next} onPrev={prev} />
            </div>
          </WizardStep>

          {/* ═══ STEP 3: Professional ═══ */}
          <WizardStep step={2} currentStep={currentStep} direction={direction}>
            <div className="space-y-6">
              <h2 className={sectionCls}>Tentang Anda</h2>

              <div>
                <label className={labelCls}>Tentang Saya *</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => u('bio', e.target.value)}
                  rows={5}
                  className={inputCls}
                  placeholder="Ceritakan tentang diri Anda — kepribadian, minat, pengalaman, dan apa yang membuat Anda unik sebagai pendamping..."
                />
                <div className="mt-1 flex justify-between text-[10px] text-dark-600">
                  <span>Min 20 karakter</span>
                  <span>{form.bio.length}/1000</span>
                </div>
              </div>

              <div>
                <label className={labelCls}>Bahasa ({form.languages.length} dipilih) *</label>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGES.map((lang) => (
                    <button key={lang} type="button" onClick={() => toggle('languages', lang)}
                      className={`border px-3 py-1.5 text-xs transition-colors ${form.languages.includes(lang) ? 'border-brand-400/40 bg-brand-400/10 text-brand-400' : 'border-dark-700/20 text-dark-500 hover:text-dark-300'}`}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Keahlian & Layanan ({form.skills.length} dipilih) *</label>
                <div className="flex flex-wrap gap-1.5">
                  {SKILLS.map((skill) => (
                    <button key={skill} type="button" onClick={() => toggle('skills', skill)}
                      className={`border px-3 py-1.5 text-xs transition-colors ${form.skills.includes(skill) ? 'border-brand-400/40 bg-brand-400/10 text-brand-400' : 'border-dark-700/20 text-dark-500 hover:text-dark-300'}`}>
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Tarif per Jam (Rp) *</label>
                  <input type="number" value={form.hourlyRate} onChange={(e) => u('hourlyRate', e.target.value)} className={inputCls} placeholder="500000" min={100000} step={50000} />
                </div>
                <div>
                  <label className={labelCls}>Tier</label>
                  <select value={form.tier} onChange={(e) => u('tier', e.target.value)} className={inputCls}>
                    <option value="SILVER">Silver</option>
                    <option value="GOLD">Gold</option>
                    <option value="PLATINUM">Platinum</option>
                    <option value="DIAMOND">Diamond</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <h2 className={sectionCls}>Favorit (Opsional)</h2>
                <p className="mb-4 -mt-3 text-[11px] text-dark-600">Klien menyukai pendamping dengan kepribadian yang menarik. Bagikan minat Anda.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Buku Favorit</label>
                  <input type="text" value={form.favBooks} onChange={(e) => u('favBooks', e.target.value)} className={inputCls} placeholder="Judul buku favorit..." />
                </div>
                <div>
                  <label className={labelCls}>Film Favorit</label>
                  <input type="text" value={form.favFilms} onChange={(e) => u('favFilms', e.target.value)} className={inputCls} placeholder="Film favorit..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Minat & Hobi</label>
                  <input type="text" value={form.favInterests} onChange={(e) => u('favInterests', e.target.value)} className={inputCls} placeholder="Menari, membaca, memasak..." />
                </div>
                <div>
                  <label className={labelCls}>Olahraga</label>
                  <input type="text" value={form.favSports} onChange={(e) => u('favSports', e.target.value)} className={inputCls} placeholder="Yoga, renang, lari..." />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Masakan Favorit</label>
                  <input type="text" value={form.favCuisine} onChange={(e) => u('favCuisine', e.target.value)} className={inputCls} placeholder="Italia, Jepang..." />
                </div>
                <div>
                  <label className={labelCls}>Minuman Favorit</label>
                  <input type="text" value={form.favDrinks} onChange={(e) => u('favDrinks', e.target.value)} className={inputCls} placeholder="Wine, kopi..." />
                </div>
                <div>
                  <label className={labelCls}>Parfum</label>
                  <input type="text" value={form.favPerfume} onChange={(e) => u('favPerfume', e.target.value)} className={inputCls} placeholder="Merek & nama..." />
                </div>
              </div>

              <WizardNavigation currentStep={2} totalSteps={4} onNext={() => { const err = validate(3); if (err) { setError(err); return false; } setError(''); next(); }} onPrev={prev} />
            </div>
          </WizardStep>

          {/* ═══ STEP 4: Documents ═══ */}
          <WizardStep step={3} currentStep={currentStep} direction={direction}>
            <div className="space-y-5">
              <h2 className={sectionCls}>Dokumen & Verifikasi</h2>

              <div>
                <label className={labelCls}>Nomor KTP (opsional)</label>
                <input type="text" value={form.ktpNumber} onChange={(e) => u('ktpNumber', e.target.value)} className={inputCls} placeholder="16 digit nomor KTP" maxLength={16} />
                <p className="mt-1 text-[10px] text-dark-600">Untuk verifikasi identitas. Data dienkripsi.</p>
              </div>

              {/* KTP Photo */}
              <div>
                <label className={labelCls}>Foto KTP (opsional)</label>
                <input ref={ktpInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) u('ktpPhoto', f); }} />
                {form.ktpPhoto ? (
                  <div className="flex items-center gap-3 border border-dark-700/20 bg-dark-800/20 p-3">
                    <img src={URL.createObjectURL(form.ktpPhoto)} alt="KTP" className="h-12 w-18 object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs text-dark-300">{form.ktpPhoto.name}</p>
                      <p className="text-[10px] text-dark-600">{(form.ktpPhoto.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button type="button" onClick={() => u('ktpPhoto', null)} className="text-dark-600 hover:text-red-400 text-xs"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => ktpInputRef.current?.click()} className="w-full border border-dashed border-dark-700/30 bg-dark-800/10 p-5 text-center transition-colors hover:border-brand-400/30">
                    <svg className="mx-auto h-5 w-5 text-dark-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" /></svg>
                    <p className="mt-1 text-[10px] text-dark-600">Upload foto KTP (JPG, PNG)</p>
                  </button>
                )}
              </div>

              {/* Selfie */}
              <div>
                <label className={labelCls}>Foto Selfie dengan KTP (opsional)</label>
                <input ref={selfieInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) u('selfiePhoto', f); }} />
                {form.selfiePhoto ? (
                  <div className="flex items-center gap-3 border border-dark-700/20 bg-dark-800/20 p-3">
                    <img src={URL.createObjectURL(form.selfiePhoto)} alt="Selfie" className="h-12 w-12 object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs text-dark-300">{form.selfiePhoto.name}</p>
                      <p className="text-[10px] text-dark-600">{(form.selfiePhoto.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button type="button" onClick={() => u('selfiePhoto', null)} className="text-dark-600 hover:text-red-400 text-xs"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => selfieInputRef.current?.click()} className="w-full border border-dashed border-dark-700/30 bg-dark-800/10 p-5 text-center transition-colors hover:border-brand-400/30">
                    <svg className="mx-auto h-5 w-5 text-dark-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <p className="mt-1 text-[10px] text-dark-600">Upload selfie sambil memegang KTP</p>
                  </button>
                )}
              </div>

              {/* Certifications */}
              <div>
                <label className={labelCls}>Sertifikasi (opsional)</label>
                {form.certificationNames.map((cert, idx) => (
                  <div key={idx} className="mb-2 flex gap-2">
                    <input type="text" value={cert} onChange={(e) => { const up = [...form.certificationNames]; up[idx] = e.target.value; u('certificationNames', up); }} className={`flex-1 ${inputCls}`} placeholder="Nama sertifikat" />
                    <button type="button" onClick={() => u('certificationNames', form.certificationNames.filter((_, i) => i !== idx))} className="px-3 text-dark-600 hover:text-red-400 text-xs"><X className="h-4 w-4" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => u('certificationNames', [...form.certificationNames, ''])} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                  + Tambah Sertifikat
                </button>
              </div>

              {/* Portfolio */}
              <div>
                <label className={labelCls}>Foto Portfolio ({form.portfolioFiles.length}/10)</label>
                <input ref={portfolioInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => handlePortfolioSelect(e.target.files)} />

                {form.portfolioPreviews.length > 0 && (
                  <div className="mb-3 grid grid-cols-5 gap-1">
                    {form.portfolioPreviews.map((preview, idx) => (
                      <div key={idx} className="group relative aspect-[3/4] overflow-hidden bg-dark-800">
                        <img src={preview} alt="" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => removePortfolio(idx)} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-dark-900/80 text-[10px] text-dark-400 opacity-0 transition-opacity hover:bg-red-500/80 hover:text-white group-hover:opacity-100"><X className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                )}

                {form.portfolioFiles.length < 10 && (
                  <button type="button" onClick={() => portfolioInputRef.current?.click()} className="w-full border border-dashed border-dark-700/30 bg-dark-800/10 p-5 text-center transition-colors hover:border-brand-400/30">
                    <svg className="mx-auto h-5 w-5 text-dark-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="mt-1 text-[10px] text-dark-600">Upload foto portfolio (JPG, PNG, WebP — Maks 5MB)</p>
                  </button>
                )}
              </div>

              {/* Terms */}
              <div className="border border-dark-700/20 bg-dark-800/20 p-4">
                <label className="flex items-start gap-3">
                  <input type="checkbox" checked={form.agreeTerms} onChange={(e) => u('agreeTerms', e.target.checked)} className="mt-0.5 rounded-none border-dark-600 bg-dark-800 text-brand-400 focus:ring-brand-400/30" />
                  <span className="text-xs leading-relaxed text-dark-400">
                    Saya telah membaca dan menyetujui{' '}
                    <a href="/terms" className="text-brand-400 hover:underline">Syarat & Ketentuan</a>,{' '}
                    <a href="/privacy" className="text-brand-400 hover:underline">Kebijakan Privasi</a>, dan{' '}
                    <a href="/safety" className="text-brand-400 hover:underline">Panduan Keamanan</a> ARETON.id.
                    Saya memahami bahwa akun akan melalui proses verifikasi sebelum dapat menerima booking.
                  </span>
                </label>
              </div>

              <WizardNavigation
                currentStep={3}
                totalSteps={4}
                onNext={() => { const err = validate(4); if (err) { setError(err); return false; } setError(''); handleSubmit(); return false; }}
                onPrev={prev}
                nextLabel={submitting ? 'Mendaftar...' : '🚀 Daftar Sekarang'}
                nextDisabled={submitting}
                isLoading={submitting}
              />
            </div>
          </WizardStep>
        </div>
          )}
        </WizardShell>

        {/* Login link */}
        <p className="mt-5 text-center text-xs text-dark-500">
          Sudah punya akun?{' '}
          <a href="/login" className="text-brand-400 hover:underline">Masuk di sini</a>
        </p>
      </div>
    </div>
  );
}
