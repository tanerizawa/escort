'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface FormData {
  // Step 1: Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  // Step 2: Professional Info
  bio: string;
  languages: string[];
  skills: string[];
  hourlyRate: string;
  tier: string;
  // Step 3: Documents
  ktpNumber: string;
  ktpPhoto: File | null;
  selfiePhoto: File | null;
  certificationNames: string[];
  portfolioUrls: string[];
  agreeTerms: boolean;
}

const LANGUAGES = ['Indonesia', 'English', 'Mandarin', 'Japanese', 'Korean', 'French', 'German', 'Arabic'];
const SKILLS = [
  'Public Speaking', 'Networking', 'Event Management', 'Translation', 'Tour Guide',
  'Fine Dining', 'Photography', 'Business Meeting', 'Travel', 'Fashion',
  'Music', 'Art & Culture', 'Sports', 'Wellness', 'Social Media',
];

const STEPS = [
  { number: 1, title: 'Data Pribadi', description: 'Informasi dasar akun' },
  { number: 2, title: 'Profil Profesional', description: 'Keahlian dan tarif' },
  { number: 3, title: 'Dokumen & Verifikasi', description: 'KTP, sertifikat, portfolio' },
];

export default function EscortRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    bio: '',
    languages: [],
    skills: [],
    hourlyRate: '',
    tier: 'SILVER',
    ktpNumber: '',
    ktpPhoto: null,
    selfiePhoto: null,
    certificationNames: [],
    portfolioUrls: [''],
    agreeTerms: false,
  });

  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const toggleArrayItem = (field: 'languages' | 'skills', item: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }));
  };

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!form.firstName.trim()) return 'Nama depan wajib diisi';
      if (!form.lastName.trim()) return 'Nama belakang wajib diisi';
      if (!form.email.includes('@')) return 'Email tidak valid';
      if (!form.phone.trim()) return 'Nomor telepon wajib diisi';
      if (form.password.length < 8) return 'Password minimal 8 karakter';
      if (form.password !== form.confirmPassword) return 'Password tidak cocok';
    }
    if (s === 2) {
      if (form.languages.length === 0) return 'Pilih minimal 1 bahasa';
      if (form.skills.length === 0) return 'Pilih minimal 1 keahlian';
      if (!form.hourlyRate || Number(form.hourlyRate) < 100000) return 'Tarif minimum Rp 100.000/jam';
      if (!form.bio || form.bio.length < 20) return 'Bio minimal 20 karakter';
    }
    if (s === 3) {
      if (!form.agreeTerms) return 'Anda harus menyetujui syarat & ketentuan';
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    const err = validateStep(3);
    if (err) {
      setError(err);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/auth/register', {
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
        portfolioUrls: form.portfolioUrls.filter(Boolean),
      });

      router.push('/login?registered=escort');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Pendaftaran gagal, coba lagi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-950 px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-light tracking-widest text-dark-100">
            ARETON<span className="text-brand-400">.id</span>
          </h1>
          <p className="mt-2 text-dark-400">Daftar sebagai Companion Professional</p>
        </div>

        {/* Step Indicator */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  step > s.number
                    ? 'bg-emerald-500 text-white'
                    : step === s.number
                    ? 'bg-brand-400 text-dark-900'
                    : 'bg-dark-800 text-dark-500'
                }`}
              >
                {step > s.number ? '✓' : s.number}
              </div>
              <span className={`hidden text-sm sm:block ${
                step >= s.number ? 'text-dark-200' : 'text-dark-600'
              }`}>
                {s.title}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 sm:w-12 ${step > s.number ? 'bg-emerald-500' : 'bg-dark-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Form Card */}
        <div className="mt-6 rounded-2xl border border-dark-700/30 bg-dark-800/20 p-6 sm:p-8">
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-medium text-dark-100">Informasi Pribadi</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-dark-400">Nama Depan</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => updateForm('firstName', e.target.value)}
                    className="w-full rounded-lg border border-dark-700/30 bg-dark-800/50 px-3 py-2.5 text-dark-200 placeholder-dark-500 focus:border-brand-400/50 focus:outline-none focus:ring-1 focus:ring-brand-400/30"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-dark-400">Nama Belakang</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => updateForm('lastName', e.target.value)}
                    className="w-full rounded-lg border border-dark-700/30 bg-dark-800/50 px-3 py-2.5 text-dark-200 placeholder-dark-500 focus:border-brand-400/50 focus:outline-none focus:ring-1 focus:ring-brand-400/30"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-dark-400">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  className="w-full rounded-lg border border-dark-700/30 bg-dark-800/50 px-3 py-2.5 text-dark-200 placeholder-dark-500 focus:border-brand-400/50 focus:outline-none focus:ring-1 focus:ring-brand-400/30"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-dark-400">Nomor Telepon</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                  className="w-full rounded-lg border border-dark-700/30 bg-dark-800/50 px-3 py-2.5 text-dark-200 placeholder-dark-500 focus:border-brand-400/50 focus:outline-none focus:ring-1 focus:ring-brand-400/30"
                  placeholder="+6281234567890"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-dark-400">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => updateForm('password', e.target.value)}
                  className="w-full rounded-lg border border-dark-700/30 bg-dark-800/50 px-3 py-2.5 text-dark-200 placeholder-dark-500 focus:border-brand-400/50 focus:outline-none focus:ring-1 focus:ring-brand-400/30"
                  placeholder="Min. 8 karakter"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-dark-400">Konfirmasi Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => updateForm('confirmPassword', e.target.value)}
                  className="w-full rounded-lg border border-dark-700/30 bg-dark-800/50 px-3 py-2.5 text-dark-200 placeholder-dark-500 focus:border-brand-400/50 focus:outline-none focus:ring-1 focus:ring-brand-400/30"
                  placeholder="Ulangi password"
                />
              </div>
            </div>
          )}

          {/* Step 2: Professional Info */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-medium text-dark-100">Profil Profesional</h2>

              <div>
                <label className="mb-1 block text-sm text-dark-400">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => updateForm('bio', e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-dark-700/30 bg-dark-800/50 px-3 py-2.5 text-dark-200 placeholder-dark-500 focus:border-brand-400/50 focus:outline-none focus:ring-1 focus:ring-brand-400/30"
                  placeholder="Ceritakan tentang diri Anda, pengalaman, dan keunikan Anda..."
                />
                <p className="mt-1 text-xs text-dark-500">{form.bio.length}/500</p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-dark-400">Bahasa ({form.languages.length} dipilih)</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleArrayItem('languages', lang)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        form.languages.includes(lang)
                          ? 'border-brand-400/30 bg-brand-400/10 text-brand-400'
                          : 'border-dark-700/30 bg-dark-800/30 text-dark-400 hover:text-dark-200'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-dark-400">Keahlian ({form.skills.length} dipilih)</label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleArrayItem('skills', skill)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        form.skills.includes(skill)
                          ? 'border-brand-400/30 bg-brand-400/10 text-brand-400'
                          : 'border-dark-700/30 bg-dark-800/30 text-dark-400 hover:text-dark-200'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-dark-400">Tarif per Jam (IDR)</label>
                  <input
                    type="number"
                    value={form.hourlyRate}
                    onChange={(e) => updateForm('hourlyRate', e.target.value)}
                    className="w-full rounded-lg border border-dark-700/30 bg-dark-800/50 px-3 py-2.5 text-dark-200 placeholder-dark-500 focus:border-brand-400/50 focus:outline-none focus:ring-1 focus:ring-brand-400/30"
                    placeholder="500000"
                    min={100000}
                    step={50000}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-dark-400">Tier</label>
                  <select
                    value={form.tier}
                    onChange={(e) => updateForm('tier', e.target.value)}
                    className="w-full rounded-lg border border-dark-700/30 bg-dark-800/50 px-3 py-2.5 text-dark-200 focus:border-brand-400/50 focus:outline-none focus:ring-1 focus:ring-brand-400/30"
                  >
                    <option value="SILVER">Silver</option>
                    <option value="GOLD">Gold</option>
                    <option value="PLATINUM">Platinum</option>
                    <option value="DIAMOND">Diamond</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-medium text-dark-100">Dokumen & Verifikasi</h2>

              <div>
                <label className="mb-1 block text-sm text-dark-400">Nomor KTP (opsional)</label>
                <input
                  type="text"
                  value={form.ktpNumber}
                  onChange={(e) => updateForm('ktpNumber', e.target.value)}
                  className="w-full rounded-lg border border-dark-700/30 bg-dark-800/50 px-3 py-2.5 text-dark-200 placeholder-dark-500 focus:border-brand-400/50 focus:outline-none focus:ring-1 focus:ring-brand-400/30"
                  placeholder="16 digit nomor KTP"
                  maxLength={16}
                />
                <p className="mt-1 text-xs text-dark-500">Untuk verifikasi identitas. Data dienkripsi.</p>
              </div>

              {/* Certifications */}
              <div>
                <label className="mb-2 block text-sm text-dark-400">Sertifikasi (opsional)</label>
                {form.certificationNames.map((cert, idx) => (
                  <div key={idx} className="mb-2 flex gap-2">
                    <input
                      type="text"
                      value={cert}
                      onChange={(e) => {
                        const updated = [...form.certificationNames];
                        updated[idx] = e.target.value;
                        updateForm('certificationNames', updated);
                      }}
                      className="flex-1 rounded-lg border border-dark-700/30 bg-dark-800/50 px-3 py-2 text-sm text-dark-200 placeholder-dark-500 focus:border-brand-400/50 focus:outline-none"
                      placeholder="Nama sertifikat"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateForm(
                          'certificationNames',
                          form.certificationNames.filter((_, i) => i !== idx),
                        )
                      }
                      className="rounded-lg px-3 text-dark-500 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateForm('certificationNames', [...form.certificationNames, ''])
                  }
                  className="text-sm text-brand-400 hover:underline"
                >
                  + Tambah Sertifikat
                </button>
              </div>

              {/* Portfolio URLs */}
              <div>
                <label className="mb-2 block text-sm text-dark-400">Portfolio URLs (opsional)</label>
                {form.portfolioUrls.map((url, idx) => (
                  <div key={idx} className="mb-2 flex gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                        const updated = [...form.portfolioUrls];
                        updated[idx] = e.target.value;
                        updateForm('portfolioUrls', updated);
                      }}
                      className="flex-1 rounded-lg border border-dark-700/30 bg-dark-800/50 px-3 py-2 text-sm text-dark-200 placeholder-dark-500 focus:border-brand-400/50 focus:outline-none"
                      placeholder="https://..."
                    />
                    {form.portfolioUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateForm(
                            'portfolioUrls',
                            form.portfolioUrls.filter((_, i) => i !== idx),
                          )
                        }
                        className="rounded-lg px-3 text-dark-500 hover:text-red-400"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateForm('portfolioUrls', [...form.portfolioUrls, ''])}
                  className="text-sm text-brand-400 hover:underline"
                >
                  + Tambah URL
                </button>
              </div>

              {/* Terms */}
              <div className="rounded-xl border border-dark-700/30 bg-dark-800/30 p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.agreeTerms}
                    onChange={(e) => updateForm('agreeTerms', e.target.checked)}
                    className="mt-0.5 rounded border-dark-600 bg-dark-800 text-brand-400 focus:ring-brand-400/30"
                  />
                  <span className="text-sm text-dark-300">
                    Saya telah membaca dan menyetujui{' '}
                    <a href="/terms" className="text-brand-400 hover:underline">Syarat & Ketentuan</a>,{' '}
                    <a href="/privacy" className="text-brand-400 hover:underline">Kebijakan Privasi</a>, dan{' '}
                    <a href="/safety" className="text-brand-400 hover:underline">Panduan Keamanan</a> ARETON.id.
                    Saya memahami bahwa akun akan melalui proses verifikasi sebelum dapat menerima booking.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={prevStep}
                className="rounded-lg border border-dark-700/30 px-5 py-2.5 text-sm text-dark-300 transition-colors hover:bg-dark-800"
              >
                Kembali
              </button>
            ) : (
              <a
                href="/register"
                className="rounded-lg border border-dark-700/30 px-5 py-2.5 text-sm text-dark-300 transition-colors hover:bg-dark-800"
              >
                Daftar sebagai Client
              </a>
            )}

            {step < 3 ? (
              <button
                onClick={nextStep}
                className="rounded-lg bg-brand-400 px-6 py-2.5 text-sm font-medium text-dark-900 transition-colors hover:bg-brand-300"
              >
                Lanjutkan
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg bg-brand-400 px-6 py-2.5 text-sm font-medium text-dark-900 transition-colors hover:bg-brand-300 disabled:opacity-50"
              >
                {submitting ? 'Mendaftar...' : 'Daftar Sekarang'}
              </button>
            )}
          </div>
        </div>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-dark-400">
          Sudah punya akun?{' '}
          <a href="/login" className="text-brand-400 hover:underline">Masuk di sini</a>
        </p>
      </div>
    </div>
  );
}
