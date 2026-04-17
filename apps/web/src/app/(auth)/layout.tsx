'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RoseGlyph } from '@/components/brand/rose-glyph';
import { useI18n } from '@/i18n';

/**
 * Auth layout — rose-inspired editorial shell.
 *
 * The left stage plays the hero role (rose monogram + manifesto),
 * while the right stage hosts the actual form. A small contextual
 * "portal" mark at the top of each panel makes the user-facing login
 * and the partner-facing login feel like two distinct doors to the
 * same house.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();

  const isEscortPortal =
    pathname?.startsWith('/login/escort') || pathname?.startsWith('/register/escort');

  const portalMark = isEscortPortal ? t('auth.portalEscort') : t('auth.portalClient');

  return (
    <div className="relative flex min-h-screen bg-dark-900 text-dark-100">
      {/* Back-to-home pill — sits above the stage on every auth screen */}
      <Link
        href="/"
        className="absolute left-6 top-6 z-20 flex items-center gap-2 text-[11px] uppercase tracking-widest-2 text-dark-400 transition-colors hover:text-brand-400 lg:left-10 lg:top-8"
      >
        <svg
          className="h-3 w-3"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path d="M12 15l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t('auth.backToHome')}
      </Link>

      {/* ── Left stage — manifesto ────────────────────────────────────────── */}
      <aside className="relative hidden w-1/2 overflow-hidden velvet-stage lg:block">
        <RoseGlyph className="rose-watermark h-[44rem] w-[44rem] -left-32 top-1/2 -translate-y-1/2 animate-petal-drift" />
        <RoseGlyph
          className="rose-watermark h-[24rem] w-[24rem] -right-8 bottom-10 animate-petal-drift"
          style={{ animationDelay: '5s' }}
        />

        {/* Thin gold hairline frame */}
        <div className="pointer-events-none absolute inset-10 border border-brand-400/15" />

        <div className="relative z-10 flex h-full flex-col justify-between p-16">
          <div>
            <Link href="/" className="inline-flex items-baseline gap-0.5">
              <span className="font-display text-2xl font-medium tracking-wide text-dark-100">
                ARETON
              </span>
              <span className="font-display text-2xl text-brand-400">.</span>
              <span className="text-xs font-medium uppercase tracking-widest-2 text-brand-400/70">
                id
              </span>
            </Link>
          </div>

          <div className="max-w-md">
            <div className="mb-6 flex items-center gap-4">
              <span className="gold-rose-line w-12" />
              <p className="act-mark !text-rose-300/80">{portalMark}</p>
            </div>

            <h1 className="font-display text-4xl font-medium leading-[1.1] text-dark-100 sm:text-5xl">
              {isEscortPortal ? (
                <>
                  Studio untuk{' '}
                  <span className="italic text-gradient-rose-gold">companion terverifikasi</span>
                </>
              ) : (
                <>
                  Atrium bagi{' '}
                  <span className="italic text-gradient-rose-gold">pertemuan yang pantas diingat</span>
                </>
              )}
            </h1>

            <p className="mt-6 font-serif text-lg leading-relaxed text-dark-300">
              {isEscortPortal ? t('auth.escortLoginSubtitle') : t('auth.clientLoginSubtitle')}
            </p>

            <div className="mt-10 flex items-center gap-4">
              <div className="text-rose-300/70">
                <RoseGlyph className="h-10 w-10" strokeWidth={1.1} />
              </div>
              <p className="font-display text-sm italic text-rose-200/80">
                {t('auth.adab')}
              </p>
            </div>
          </div>

          <p className="text-[10px] uppercase tracking-widest-3 text-dark-600">
            &copy; {new Date().getFullYear()} ARETON.id — All rights reserved
          </p>
        </div>
      </aside>

      {/* ── Right stage — form ────────────────────────────────────────────── */}
      <main className="relative flex w-full items-center justify-center px-6 py-16 lg:w-1/2 lg:px-14">
        {/* Ambient glow behind the form on desktop */}
        <div className="art-orb h-[24rem] w-[24rem] right-1/2 top-1/4 translate-x-1/2 lg:translate-x-0" />

        {/* Mobile: compact rose + portal mark */}
        <div className="absolute left-0 right-0 top-20 flex flex-col items-center gap-2 lg:hidden">
          <div className="text-gradient-rose-gold">
            <RoseGlyph className="h-10 w-10" strokeWidth={1.1} />
          </div>
          <p className="act-mark !text-rose-300/80">{portalMark}</p>
        </div>

        <div className="relative z-10 w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
