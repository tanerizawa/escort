'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Input } from '@/components/ui/input';
import { WizardShell, WizardStep, WizardNavigation } from '@/components/ui/wizard';
import { RoseGlyph } from '@/components/brand/rose-glyph';

function StepHeader({
  mark,
  title,
  description,
}: {
  mark: string;
  title: string;
  description: string;
}) {
  return (
    <header className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="text-gradient-rose-gold">
          <RoseGlyph className="h-8 w-8" strokeWidth={1.1} />
        </div>
        <div className="gold-rose-line flex-1" />
      </div>
      <p className="act-mark">{mark}</p>
      <h2 className="font-display text-3xl font-medium leading-tight text-dark-100">
        {title}
      </h2>
      <p className="font-serif text-base leading-relaxed text-dark-400">{description}</p>
    </header>
  );
}

type RoleType = 'CLIENT' | 'ESCORT';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();

  const [role, setRole] = useState<RoleType>('CLIENT');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.');
      return;
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }
    if (!agree) {
      setError('Anda harus menyetujui syarat dan ketentuan.');
      return;
    }

    try {
      await register({
        email,
        password,
        firstName,
        lastName,
        phone: phone || undefined,
        role,
      });
      router.push('/verify-email');
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.';
      setError(message);
    }
  };

  const steps = [
    { label: 'Pilih Peran' },
    { label: 'Nama Lengkap' },
    { label: 'Kontak' },
    { label: 'Password & Persetujuan' },
  ];

  return (
    <div>
      <WizardShell steps={steps}>
        {/* Step 1: Role Selection */}
        <WizardStep>
          <div className="space-y-8">
            <StepHeader
              mark="Langkah 01 · Peran"
              title="Siapa Anda di ARETON?"
              description="Pilih peran yang sesuai — keputusan ini bisa diubah melalui tim support."
            />

            <div className="grid grid-cols-1 gap-3">
              {([
                {
                  value: 'CLIENT' as RoleType,
                  label: 'Client',
                  desc: 'Cari dan booking pendamping profesional untuk acara Anda',
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  ),
                },
                {
                  value: 'ESCORT' as RoleType,
                  label: 'Partner',
                  desc: 'Daftar sebagai pendamping profesional dan mulai menerima booking',
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  ),
                },
              ]).map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`flex items-start gap-4 border p-5 text-left transition-all duration-300 ${
                    role === r.value
                      ? 'border-rose-400/40 bg-rose-500/10'
                      : 'border-dark-700/40 bg-dark-800/30 hover:border-rose-400/20 hover:bg-dark-800/50'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center border ${
                      role === r.value
                        ? 'border-rose-400/40 text-rose-200'
                        : 'border-dark-700/40 text-dark-400'
                    }`}
                  >
                    {r.icon}
                  </div>
                  <div>
                    <p
                      className={`font-display text-base font-medium ${
                        role === r.value ? 'text-rose-200' : 'text-dark-100'
                      }`}
                    >
                      {r.label}
                    </p>
                    <p className="mt-1 font-serif text-sm leading-relaxed text-dark-400">
                      {r.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <WizardNavigation hideBack />

            <p className="text-center text-sm text-dark-400">
              Sudah punya akun?{' '}
              <Link
                href="/login"
                className="text-rose-200 transition-colors hover:text-rose-100"
              >
                Masuk
              </Link>
            </p>
          </div>
        </WizardStep>

        {/* Step 2: Name */}
        <WizardStep>
          <div className="space-y-8">
            <StepHeader
              mark="Langkah 02 · Identitas"
              title="Siapa nama Anda?"
              description="Nama akan ditampilkan pada profil dan salam di setiap pertemuan."
            />

            <div className="space-y-4">
              <Input
                label="Nama Depan"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoFocus
                leftIcon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                }
              />
              <Input
                label="Nama Belakang"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <WizardNavigation nextDisabled={!firstName.trim() || !lastName.trim()} />
          </div>
        </WizardStep>

        {/* Step 3: Contact */}
        <WizardStep>
          <div className="space-y-8">
            <StepHeader
              mark="Langkah 03 · Kontak"
              title="Bagaimana kami menghubungi Anda?"
              description="Email digunakan untuk login dan notifikasi. Nomor telepon opsional."
            />

            {error && (
              <div className="border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                required
                autoComplete="email"
                autoFocus
                leftIcon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                }
              />
              <Input
                label="No. Telepon"
                type="tel"
                placeholder="+62 812 3456 7890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                hint="Opsional, digunakan untuk verifikasi"
                leftIcon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                }
              />
            </div>

            <WizardNavigation nextDisabled={!email.includes('@')} />
          </div>
        </WizardStep>

        {/* Step 4: Password & Terms */}
        <WizardStep>
          <div className="space-y-8">
            <StepHeader
              mark="Langkah 04 · Kunci"
              title="Buat password Anda"
              description="Minimal 8 karakter untuk keamanan akun — sub rosa, sub fide."
            />

            {error && (
              <div className="border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Password"
                type="password"
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                required
                autoComplete="new-password"
                autoFocus
                leftIcon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                }
              />

              {/* Password strength indicator */}
              {password && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          password.length >= level * 3
                            ? password.length >= 12 ? 'bg-emerald-400' : password.length >= 8 ? 'bg-brand-400' : 'bg-amber-400'
                            : 'bg-dark-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-dark-500">
                    {password.length < 8 ? 'Minimal 8 karakter' : password.length >= 12 ? 'Password kuat' : 'Password cukup kuat'}
                  </p>
                </div>
              )}

              <Input
                label="Konfirmasi Password"
                type="password"
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                required
                autoComplete="new-password"
                error={confirmPassword && password !== confirmPassword ? 'Password tidak cocok' : undefined}
              />

              <label className="flex cursor-pointer items-start gap-3 border border-dark-700/40 bg-dark-800/30 p-4 transition-all hover:border-rose-400/25">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-dark-600/30 bg-dark-800 text-rose-400 focus:ring-rose-400/20"
                />
                <span className="font-serif text-sm leading-relaxed text-dark-400">
                  Saya menyetujui{' '}
                  <Link href="/terms" className="text-rose-200 hover:text-rose-100">
                    Syarat &amp; Ketentuan
                  </Link>{' '}
                  dan{' '}
                  <Link href="/privacy" className="text-rose-200 hover:text-rose-100">
                    Kebijakan Privasi
                  </Link>
                </span>
              </label>
            </div>

            <WizardNavigation
              nextLabel={role === 'ESCORT' ? 'Daftar sebagai Partner' : 'Daftar Sekarang'}
              isLoading={isLoading}
              nextDisabled={!password || !confirmPassword || !agree || password !== confirmPassword || password.length < 8}
              onNext={() => { handleSubmit(); return false; }}
            />
          </div>
        </WizardStep>
      </WizardShell>
    </div>
  );
}
