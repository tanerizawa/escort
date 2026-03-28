'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Input } from '@/components/ui/input';
import { WizardShell, WizardStep, WizardNavigation } from '@/components/ui/wizard';

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
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-light text-dark-100">Daftar</h2>
              <p className="mt-2 text-sm text-dark-400">Pilih peran yang sesuai dengan kebutuhan Anda</p>
            </div>

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
                  className={`flex items-start gap-4 rounded-xl border p-5 text-left transition-all duration-200 ${
                    role === r.value
                      ? 'border-brand-400/40 bg-brand-400/5 ring-1 ring-brand-400/10'
                      : 'border-dark-700/40 bg-dark-800/20 hover:border-dark-600/50 hover:bg-dark-800/30'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    role === r.value ? 'bg-brand-400/15 text-brand-400' : 'bg-dark-700/40 text-dark-400'
                  }`}>
                    {r.icon}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${role === r.value ? 'text-brand-400' : 'text-dark-200'}`}>
                      {r.label}
                    </p>
                    <p className="mt-1 text-xs text-dark-500 leading-relaxed">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <WizardNavigation hideBack />

            <p className="text-center text-sm text-dark-400">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
                Masuk
              </Link>
            </p>
          </div>
        </WizardStep>

        {/* Step 2: Name */}
        <WizardStep>
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h2 className="text-xl font-light text-dark-100">Siapa nama Anda?</h2>
              <p className="mt-2 text-sm text-dark-400">Nama akan ditampilkan pada profil Anda</p>
            </div>

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
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="text-xl font-light text-dark-100">Informasi kontak</h2>
              <p className="mt-2 text-sm text-dark-400">Email digunakan untuk login dan notifikasi</p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
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
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h2 className="text-xl font-light text-dark-100">Buat password</h2>
              <p className="mt-2 text-sm text-dark-400">Minimal 8 karakter untuk keamanan akun</p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
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

              <label className="flex items-start gap-3 rounded-xl border border-dark-700/40 bg-dark-800/20 p-4 cursor-pointer transition-all hover:border-dark-600/50">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-dark-600/30 bg-dark-800 text-brand-400 focus:ring-brand-400/20"
                />
                <span className="text-sm text-dark-400 leading-relaxed">
                  Saya menyetujui{' '}
                  <Link href="/terms" className="text-brand-400/80 hover:text-brand-400">
                    Syarat & Ketentuan
                  </Link>{' '}
                  dan{' '}
                  <Link href="/privacy" className="text-brand-400/80 hover:text-brand-400">
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
