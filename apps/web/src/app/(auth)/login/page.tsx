'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { WizardShell, WizardStep, WizardNavigation, useWizard } from '@/components/ui/wizard';
import { useI18n } from '@/i18n';

function EmailStep({ email, setEmail, error }: { email: string; setEmail: (v: string) => void; error: string }) {
  const { t } = useI18n();

  return (
    <WizardStep>
      <div className="space-y-6">
        {/* Welcome Illustration */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h2 className="text-2xl font-light text-dark-100">{t('auth.loginTitle')}</h2>
          <p className="mt-2 text-sm text-dark-400">{t('auth.loginSubtitle')}</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <Input
          label={t('common.email')}
          type="email"
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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

        <WizardNavigation
          nextLabel="Lanjutkan"
          nextDisabled={!email.includes('@')}
          hideBack
        />

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-dark-700/50" />
          <span className="text-xs text-dark-500">{t('common.or')}</span>
          <div className="h-px flex-1 bg-dark-700/50" />
        </div>

        {/* OAuth */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="w-full"
            type="button"
            onClick={() => {
              const apiUrl = process.env.NEXT_PUBLIC_API_URL;
              if (!apiUrl) return;
              window.location.href = `${apiUrl}/auth/google`;
            }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </Button>
          <Button variant="outline" className="w-full" type="button">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.18 0-.36-.02-.53-.06-.01-.18-.04-.56-.04-.95 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.44zm2.68 17.38c-.26.4-.68.9-1.17 1.34-.56.5-1.13.85-1.85.85-.5 0-.83-.15-1.22-.32-.43-.19-.92-.4-1.8-.4s-1.4.22-1.85.41c-.38.16-.7.31-1.19.33-.8.02-1.41-.43-2.02-.98-.65-.58-1.23-1.4-1.69-2.33C5.2 15.46 4.85 13.2 5.28 11.46c.32-1.3 1.05-2.4 2.04-3.13.94-.69 2.05-1.04 3.13-1.04.76 0 1.35.18 1.85.34.42.13.77.24 1.15.24.34 0 .65-.1 1.04-.23.58-.2 1.3-.44 2.25-.38 1.33.08 2.37.63 3.05 1.59-1.06.69-1.9 1.83-1.78 3.48.13 1.82 1.24 2.97 2.34 3.44-.19.57-.42 1.13-.69 1.63z" />
            </svg>
            Apple
          </Button>
        </div>

        <p className="text-center text-sm text-dark-400">
          {t('auth.noAccount')}{' '}
          <Link href="/register" className="text-brand-400 hover:text-brand-300 transition-colors">
            {t('auth.registerNow')}
          </Link>
        </p>
      </div>
    </WizardStep>
  );
}

function PasswordStep({
  email,
  password,
  setPassword,
  error,
  isLoading,
  onSubmit,
}: {
  email: string;
  password: string;
  setPassword: (v: string) => void;
  error: string;
  isLoading: boolean;
  onSubmit: () => void;
}) {
  const { t } = useI18n();

  return (
    <WizardStep>
      <div className="space-y-6">
        {/* User context */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-xl font-light text-dark-100">Masukkan Password</h2>
          <div className="mt-2 flex items-center gap-2 rounded-full bg-dark-800 border border-dark-700/50 px-3 py-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-brand-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <span className="text-xs text-dark-300">{email}</span>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <Input
          label={t('common.password')}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          autoFocus
          leftIcon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          }
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-dark-400">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-dark-600/30 bg-dark-800 text-brand-400 focus:ring-brand-400/20"
            />
            {t('common.rememberMe')}
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-brand-400/80 hover:text-brand-400 transition-colors"
          >
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <WizardNavigation
          nextLabel={t('common.login')}
          isLoading={isLoading}
          nextDisabled={!password}
          onNext={() => { onSubmit(); return false; }}
        />
      </div>
    </WizardStep>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const { t } = useI18n();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
        window.location.href = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.areton.id';
      } else if (user?.role === 'ESCORT') {
        router.push('/escort/dashboard');
      } else {
        router.push('/user/dashboard');
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || t('auth.loginError');
      setError(message);
    }
  };

  const steps = [
    { label: 'Alamat Email' },
    { label: 'Password' },
  ];

  return (
    <WizardShell steps={steps}>
      <EmailStep email={email} setEmail={setEmail} error={error} />
      <PasswordStep
        email={email}
        password={password}
        setPassword={setPassword}
        error={error}
        isLoading={isLoading}
        onSubmit={handleSubmit}
      />
    </WizardShell>
  );
}
