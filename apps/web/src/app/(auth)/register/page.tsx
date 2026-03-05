'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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

      if (role === 'ESCORT') {
        router.push('/dashboard?onboarding=true');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.';
      setError(message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-light text-dark-100">Daftar</h2>
      <p className="mt-2 text-sm text-dark-400">
        Buat akun baru untuk memulai.
      </p>

      {/* Role Selector */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {([
          { value: 'CLIENT' as RoleType, label: 'Client', desc: 'Cari pendamping' },
          { value: 'ESCORT' as RoleType, label: 'Partner', desc: 'Daftar sebagai pendamping' },
        ]).map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRole(r.value)}
            className={`rounded-xl border p-4 text-left transition-all ${
              role === r.value
                ? 'border-brand-400/40 bg-brand-400/5'
                : 'border-dark-700/40 bg-dark-800/20 hover:border-dark-600/50'
            }`}
          >
            <p className={`text-sm font-medium ${role === r.value ? 'text-brand-400' : 'text-dark-200'}`}>
              {r.label}
            </p>
            <p className="mt-0.5 text-xs text-dark-500">{r.desc}</p>
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nama Depan"
            placeholder="John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            label="Nama Belakang"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <Input
          label="No. Telepon"
          type="tel"
          placeholder="+62 812 3456 7890"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          hint="Opsional, digunakan untuk verifikasi"
        />

        <Input
          label="Password"
          type="password"
          placeholder="Minimal 8 karakter"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />

        <Input
          label="Konfirmasi Password"
          type="password"
          placeholder="Ulangi password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />

        <label className="flex items-start gap-2 text-sm text-dark-400">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-dark-600/30 bg-dark-800 text-brand-400 focus:ring-brand-400/20"
          />
          <span>
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

        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
          {role === 'ESCORT' ? 'Daftar sebagai Partner' : 'Daftar'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-dark-400">
        Sudah punya akun?{' '}
        <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors">
          Masuk
        </Link>
      </p>
    </div>
  );
}
