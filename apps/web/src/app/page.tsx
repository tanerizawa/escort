'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { RoseGlyph } from '@/components/brand/rose-glyph';

/**
 * ARETON.id — homepage
 *
 * Designed as a six-act editorial piece built around the rose, ARETON's
 * primary emblem. Each section draws on how the rose has been read across
 * history — Roman sub rosa secrecy, Persian ghazal longing, medieval quest
 * poetry, Shakespearean essence-over-label, Victorian floriography, and
 * Art Deco rose-gold geometry. The platform is framed as three essences —
 * Standing (Kemapanan), Beauty (Keindahan), and Fulfilment (Kepuasan) —
 * threaded through all six acts.
 */
export default function HomePage() {
  const { t } = useI18n();

  const essences = ['kemapanan', 'keindahan', 'kepuasan'] as const;

  const services = [
    { key: 'meeting', numeral: 'I' },
    { key: 'dinner', numeral: 'II' },
    { key: 'event', numeral: 'III' },
    { key: 'business', numeral: 'IV' },
  ] as const;

  const tiers = [
    {
      key: 'silver',
      label: 'Silver',
      accent: 'text-slate-300',
      border: 'border-slate-400/20',
      bg: 'bg-slate-400/[0.04]',
    },
    {
      key: 'gold',
      label: 'Gold',
      accent: 'text-brand-400',
      border: 'border-brand-400/25',
      bg: 'bg-brand-400/[0.06]',
    },
    {
      key: 'platinum',
      label: 'Platinum',
      accent: 'text-rose-200',
      border: 'border-rose-300/25',
      bg: 'bg-rose-400/[0.05]',
    },
    {
      key: 'diamond',
      label: 'Diamond',
      accent: 'text-rose-300',
      border: 'border-rose-400/30',
      bg: 'bg-rose-500/[0.08]',
    },
  ] as const;

  const thorns = ['petal1', 'petal2', 'petal3', 'petal4'] as const;

  return (
    <div className="min-h-screen bg-dark-900 text-dark-100">
      <Navbar />

      {/* ──────────────── HERO / PROLOGUE ──────────────── */}
      <section
        className="relative flex items-center justify-center overflow-hidden pt-24 pb-20"
        style={{ minHeight: 'min(100vh, 960px)' }}
      >
        {/* Deep velvet stage backdrop */}
        <div className="absolute inset-0 velvet-stage" />

        {/* Soft orbs of gold + claret light */}
        <div className="art-orb h-[32rem] w-[32rem] -top-40 left-1/2 -translate-x-1/2" />
        <div
          className="art-orb h-[28rem] w-[28rem] bottom-0 -right-24"
          style={{
            background:
              'radial-gradient(circle, rgba(176,74,85,0.18), transparent 70%)',
          }}
        />

        {/* Watermark roses */}
        <RoseGlyph className="rose-watermark h-[40rem] w-[40rem] -left-40 top-20 animate-petal-drift" />
        <RoseGlyph
          className="rose-watermark h-[32rem] w-[32rem] -right-32 bottom-10 animate-petal-drift"
          style={{ animationDelay: '4s' }}
        />

        {/* Thin gold + rose frame */}
        <div className="pointer-events-none absolute inset-x-6 top-24 bottom-10 border border-brand-400/15 lg:inset-x-14" />

        <div className="relative z-10 mx-auto w-full max-w-5xl px-6 text-center">
          {/* Prologue mark */}
          <div className="mb-10 flex items-center justify-center gap-4">
            <span className="gold-rose-line w-12" />
            <p className="act-mark">{t('landing.prologueMark')}</p>
            <span className="gold-rose-line w-12" />
          </div>

          {/* Rose monogram */}
          <div className="mb-8 flex justify-center">
            <div className="rose-monogram text-gradient-rose-gold animate-rose-bloom">
              <RoseGlyph className="h-16 w-16 sm:h-20 sm:w-20" strokeWidth={1.1} />
            </div>
          </div>

          <p className="mx-auto mb-6 max-w-xl font-sans text-[12px] uppercase tracking-widest-3 text-dark-300">
            {t('landing.heroEyebrow')}
          </p>

          <h1 className="font-display text-5xl font-medium leading-[1.02] tracking-tight text-dark-100 sm:text-display-lg lg:text-display-xl">
            {t('landing.heroTitle')}{' '}
            <span className="italic text-gradient-rose-gold">
              {t('landing.heroHighlight')}
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl font-serif text-lg leading-relaxed text-dark-300 sm:text-xl">
            {t('landing.heroDesc')}
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/register"
              className="group relative overflow-hidden rounded-none bg-brand-400 px-10 py-4 text-[12px] font-bold uppercase tracking-widest-2 text-dark-900 transition-all hover:bg-brand-300"
            >
              <span className="relative z-10">{t('landing.ctaStart')}</span>
            </Link>
            <Link
              href="/register?role=escort"
              className="rounded-none border border-dark-500/30 px-10 py-4 text-[12px] font-medium uppercase tracking-widest-2 text-dark-200 transition-all hover:border-rose-400/40 hover:text-rose-200"
            >
              {t('landing.ctaPartner')}
            </Link>
          </div>

          <div className="mt-20 flex flex-col items-center gap-2 animate-parallax-float">
            <span className="text-[10px] uppercase tracking-widest-3 text-dark-500">
              Scroll
            </span>
            <svg
              className="h-5 w-5 text-dark-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* ──────────────── ACT I · SUB ROSA ──────────────── */}
      <section className="relative border-t border-dark-700/30 py-28 sm:py-36">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{ backgroundImage: 'var(--tw-gradient-stops), linear-gradient(180deg, rgba(140,47,58,0) 0%, rgba(140,47,58,0.08) 50%, rgba(11,17,32,0) 100%)' }}
        />
        <RoseGlyph className="rose-watermark h-[28rem] w-[28rem] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <p className="act-mark mb-6">{t('landing.subRosaMark')}</p>
          <h2 className="font-display text-display-sm font-medium text-dark-100 sm:text-display-md">
            {t('landing.subRosaTitle')}
          </h2>
          <div className="gold-rose-line mx-auto mt-8 w-24" />
          <p className="mt-10 font-serif text-lg leading-relaxed text-dark-300 sm:text-xl">
            {t('landing.subRosaBody')}
          </p>
          <p className="pull-quote mx-auto mt-12 max-w-2xl text-center !border-l-0 !pl-0 font-serif italic text-rose-200/80">
            {t('landing.subRosaQuote')}
          </p>
        </div>
      </section>

      {/* ──────────────── ACT II · THREE ESSENCES ──────────────── */}
      <section className="relative border-t border-dark-700/30 bg-dark-950/40 py-28 sm:py-36">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="act-mark mb-6">{t('landing.essencesMark')}</p>
            <h2 className="font-display text-display-sm font-medium text-dark-100 sm:text-display-md">
              {t('landing.essencesTitle')}
            </h2>
            <div className="gold-rose-line mx-auto mt-8 w-24" />
            <p className="mx-auto mt-8 max-w-2xl font-serif text-lg leading-relaxed text-dark-300">
              {t('landing.essencesLead')}
            </p>
          </div>

          <div className="mt-20 grid gap-8 md:grid-cols-3">
            {essences.map((key, idx) => (
              <article
                key={key}
                className="group relative overflow-hidden border border-dark-700/30 bg-dark-800/40 p-10 transition-all duration-500 hover:border-rose-400/25 hover:bg-dark-800/60"
              >
                <div className="absolute inset-0 bg-rose-gold-subtle opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative">
                  <div className="mb-8 flex items-start justify-between">
                    <div className="text-rose-300/80">
                      <RoseGlyph className="h-10 w-10" />
                    </div>
                    <span className="font-display text-5xl font-light text-brand-400/15">
                      {['I', 'II', 'III'][idx]}
                    </span>
                  </div>

                  <p className="act-mark mb-2 !text-rose-300/70">
                    {t(`landing.essences.${key}.century`)}
                  </p>
                  <h3 className="font-display text-2xl font-medium text-dark-100">
                    {t(`landing.essences.${key}.title`)}
                  </h3>
                  <div className="gold-rose-line mt-4 w-10" />
                  <p className="mt-6 font-serif text-[15px] leading-relaxed text-dark-300">
                    {t(`landing.essences.${key}.desc`)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── ACT III · REPERTOIRE (services) ──────────────── */}
      <section className="relative border-t border-dark-700/30 py-28 sm:py-36">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="act-mark mb-6">{t('landing.servicesMark')}</p>
            <h2 className="font-display text-display-sm font-medium text-dark-100 sm:text-display-md">
              {t('landing.servicesTitle')}
            </h2>
            <div className="gold-rose-line mx-auto mt-8 w-24" />
            <p className="mx-auto mt-8 max-w-2xl font-serif text-lg leading-relaxed text-dark-300">
              {t('landing.servicesLead')}
            </p>
          </div>

          <div className="mt-16 grid gap-0.5 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <article
                key={service.key}
                className="group relative overflow-hidden border border-dark-700/25 bg-dark-800/30 p-8 transition-all duration-500 hover:border-brand-400/30 hover:bg-dark-800/60"
              >
                <span className="absolute right-5 top-4 font-display text-5xl font-light text-brand-400/10">
                  {service.numeral}
                </span>
                <div className="text-brand-400/80">
                  <RoseGlyph className="h-9 w-9" strokeWidth={1.1} />
                </div>
                <h3 className="mt-6 font-display text-xl font-medium text-dark-100">
                  {t(`landing.services.${service.key}.title`)}
                </h3>
                <div className="gold-line-left mt-3 w-10" />
                <p className="mt-4 font-serif text-[15px] leading-relaxed text-dark-400">
                  {t(`landing.services.${service.key}.desc`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── ACT IV · ROSE VARIETIES (tiers) ──────────────── */}
      <section className="relative border-t border-dark-700/30 bg-dark-950/40 py-28 sm:py-36">
        <RoseGlyph className="rose-watermark h-[24rem] w-[24rem] -right-24 top-20" />

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="act-mark mb-6">{t('landing.tierMark')}</p>
            <h2 className="font-display text-display-sm font-medium text-dark-100 sm:text-display-md">
              {t('landing.tierTitle')}
            </h2>
            <div className="gold-rose-line mx-auto mt-8 w-24" />
            <p className="mx-auto mt-8 max-w-2xl font-serif text-lg leading-relaxed text-dark-300">
              {t('landing.tierLead')}
            </p>
          </div>

          <div className="mt-16 grid gap-5 sm:grid-cols-2">
            {tiers.map((tier) => (
              <article
                key={tier.key}
                className={`group relative overflow-hidden border ${tier.border} ${tier.bg} p-10 transition-all duration-500 hover:border-rose-400/30`}
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="act-mark !text-rose-300/70">
                      {t(`landing.tiers.${tier.key}.variety`)}
                    </p>
                    <h3
                      className={`mt-3 font-display text-3xl font-medium ${tier.accent}`}
                    >
                      {tier.label}
                    </h3>
                    <p className="mt-2 font-serif text-base italic text-rose-200/70">
                      — {t(`landing.tiers.${tier.key}.meaning`)}
                    </p>
                  </div>
                  <div className="text-rose-300/50 transition-transform duration-500 group-hover:scale-110">
                    <RoseGlyph className="h-12 w-12" />
                  </div>
                </div>

                <div className="gold-rose-line mt-8 w-20" />
                <p className="mt-6 font-serif text-[15px] leading-relaxed text-dark-300">
                  {t(`landing.tiers.${tier.key}.services`)}
                </p>
                <p className="mt-4 font-display text-lg font-light text-dark-200">
                  {t(`landing.tiers.${tier.key}.rate`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── ACT V · THORNS & PETALS (curation / safety) ──────────────── */}
      <section className="relative border-t border-dark-700/30 py-28 sm:py-36">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="grid gap-16 lg:grid-cols-[2fr_3fr] lg:gap-20">
            <div>
              <p className="act-mark mb-6">{t('landing.thornsMark')}</p>
              <h2 className="font-display text-display-sm font-medium text-dark-100 sm:text-display-md">
                {t('landing.thornsTitle')}
              </h2>
              <div className="gold-rose-line mt-8 w-24" />
              <p className="mt-8 font-serif text-lg leading-relaxed text-dark-300">
                {t('landing.thornsLead')}
              </p>

              {/* Decorative rose */}
              <div className="mt-12 text-brand-400/50">
                <RoseGlyph className="h-24 w-24" strokeWidth={1} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {thorns.map((key, i) => (
                <article
                  key={key}
                  className="group relative border border-dark-700/30 bg-dark-800/30 p-7 transition-all duration-500 hover:border-rose-400/25 hover:bg-dark-800/60"
                >
                  <span className="font-display text-4xl font-light text-brand-400/15">
                    0{i + 1}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-medium text-dark-100">
                    {t(`landing.thorns.${key}.title`)}
                  </h3>
                  <div className="gold-line-left mt-3 w-10 transition-all duration-500 group-hover:w-16" />
                  <p className="mt-4 font-serif text-[14.5px] leading-relaxed text-dark-400">
                    {t(`landing.thorns.${key}.desc`)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── ACT VI · INVITATION (final CTA) ──────────────── */}
      <section className="relative overflow-hidden border-t border-dark-700/30 py-32">
        <div className="absolute inset-0 velvet-stage opacity-80" />
        <div
          className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
          style={{
            backgroundImage:
              'linear-gradient(90deg, transparent, rgba(201,169,110,0.3), rgba(176,74,85,0.35), rgba(201,169,110,0.3), transparent)',
          }}
        />
        <RoseGlyph className="rose-watermark h-[36rem] w-[36rem] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <div className="mb-8 flex justify-center text-rose-300/80">
            <RoseGlyph className="h-16 w-16 animate-rose-bloom" />
          </div>

          <p className="act-mark mb-6">{t('landing.invitationMark')}</p>
          <h2 className="font-display text-display-sm font-medium text-dark-100 sm:text-display-md">
            {t('landing.invitationTitle')}
          </h2>
          <p className="mx-auto mt-8 max-w-xl font-serif text-lg leading-relaxed text-dark-300">
            {t('landing.invitationLead')}
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/register"
              className="rounded-none bg-brand-400 px-10 py-4 text-[12px] font-bold uppercase tracking-widest-2 text-dark-900 transition-all hover:bg-brand-300"
            >
              {t('landing.ctaCreate')}
            </Link>
            <Link
              href="/escorts"
              className="rounded-none border border-rose-400/40 px-10 py-4 text-[12px] font-medium uppercase tracking-widest-2 text-rose-200 transition-all hover:bg-rose-500/10"
            >
              {t('landing.ctaBrowse')}
            </Link>
          </div>

          <div className="mt-16 flex items-center justify-center gap-4">
            <span className="gold-rose-line w-16" />
            <span className="font-display text-sm italic text-rose-200/70">
              sub rosa · sub fide
            </span>
            <span className="gold-rose-line w-16" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
