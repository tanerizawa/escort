'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Briefcase, Ticket, Users, UtensilsCrossed } from 'lucide-react';
import { Icon } from '@/components/ui/icon';

export default function HomePage() {
  const { t } = useI18n();

  const services = [
    { icon: 'Users', key: 'meeting' },
    { icon: 'UtensilsCrossed', key: 'dinner' },
    { icon: 'Ticket', key: 'event' },
    { icon: 'Briefcase', key: 'business' },
  ] as const;

  const tiers = [
    { name: 'Silver', color: 'text-slate-300', border: 'border-slate-400/20', bg: 'bg-slate-400/5', key: 'silver' },
    { name: 'Gold', color: 'text-brand-400', border: 'border-brand-400/20', bg: 'bg-brand-400/5', key: 'gold' },
    { name: 'Platinum', color: 'text-violet-300', border: 'border-violet-400/20', bg: 'bg-violet-400/5', key: 'platinum' },
    { name: 'Diamond', color: 'text-sky-300', border: 'border-sky-400/20', bg: 'bg-sky-400/5', key: 'diamond' },
  ] as const;

  const trustKeys = ['verification', 'matching', 'escrow', 'safety', 'rating', 'multilang'] as const;

  const editorialImages = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80&auto=format',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&auto=format',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80&auto=format',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80&auto=format',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80&auto=format',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80&auto=format',
  ];

  return (
    <div className="min-h-screen bg-dark-900 text-dark-100">

      {/* ───────── HEADER ───────── */}
      <Navbar />

      {/* ───────── HERO — Full-bleed editorial ───────── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20">
        {/* Background mosaic */}
        <div className="absolute inset-0 grid grid-cols-3 gap-0.5 opacity-[0.12]">
          {editorialImages.map((src, i) => (
            <div key={i} className="relative overflow-hidden">
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover animate-ken-burns"
                style={{ animationDelay: `${i * 3}s` }}
              />
            </div>
          ))}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900/60 via-dark-900/80 to-dark-900" />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          {/* Magazine tagline */}
          <div className="mb-8 flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-brand-400/40" />
            <p className="caption">{t('landing.tagline')}</p>
            <span className="h-px w-12 bg-brand-400/40" />
          </div>

          {/* Display heading */}
          <h1 className="font-display text-5xl font-medium leading-[1.05] tracking-tight text-dark-100 sm:text-display-lg lg:text-display-xl">
            {t('landing.heroTitle')}
          </h1>
          <p className="mx-auto mt-6 font-display text-2xl font-medium italic text-brand-400 sm:text-3xl">
            {t('landing.heroHighlight')}
          </p>

          {/* Subtext */}
          <p className="mx-auto mt-8 max-w-xl font-serif text-lg leading-relaxed text-dark-300 sm:text-xl">
            {t('landing.heroDesc')}
          </p>

          {/* CTAs */}
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/register"
              className="group relative overflow-hidden rounded-none bg-brand-400 px-10 py-4 text-[12px] font-bold uppercase tracking-widest-2 text-dark-900 transition-all hover:bg-brand-300"
            >
              <span className="relative z-10">{t('landing.ctaStart')}</span>
            </Link>
            <Link
              href="/register?role=escort"
              className="rounded-none border border-dark-500/30 px-10 py-4 text-[12px] font-medium uppercase tracking-widest-2 text-dark-200 transition-all hover:border-brand-400/40 hover:text-brand-400"
            >
              {t('landing.ctaPartner')}
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="mt-20 flex flex-col items-center gap-2 animate-parallax-float">
            <span className="text-[10px] uppercase tracking-widest-3 text-dark-500">Scroll</span>
            <svg className="h-5 w-5 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* ───────── EDITORIAL STRIP ───────── */}
      <section id="editorial" className="relative overflow-hidden py-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5">
          {editorialImages.slice(0, 4).map((src, i) => (
            <div key={i} className="group relative aspect-[3/4] overflow-hidden">
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-dark-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="h-px w-8 bg-brand-400/50 mb-3" />
                <p className="font-display text-lg font-medium text-white/90">
                  {['Elegance', 'Confidence', 'Prestige', 'Distinction'][i]}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-widest text-white/50">
                  {['Formal Events', 'Business Travel', 'Social Gala', 'Private Dining'][i]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── MANIFESTO ───────── */}
      <section className="relative py-28 sm:py-36">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="gold-line mx-auto mb-16 max-w-xs" />
          <p className="font-serif text-3xl font-light leading-relaxed text-dark-200 sm:text-4xl md:text-[2.75rem] md:leading-[1.4]">
            &ldquo;Kami tidak hanya menghubungkan—kami <em className="text-brand-400 not-italic font-medium">mengkurasi pengalaman</em> yang
            mengangkat setiap momen menjadi kenangan yang tak terlupakan.&rdquo;
          </p>
          <div className="gold-line mx-auto mt-16 max-w-xs" />
          <p className="mt-8 text-[11px] uppercase tracking-widest-3 text-dark-500">The ARETON Philosophy</p>
        </div>
      </section>

      {/* ───────── SERVICES — Magazine grid ───────── */}
      <section id="services" className="border-t border-dark-700/30 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          {/* Section header */}
          <div className="mb-20 flex flex-col items-center text-center">
            <p className="caption mb-4">{t('landing.servicesTitle')}</p>
            <h2 className="font-display text-display-sm font-medium text-dark-100 sm:text-display-md">
              Tailored for Every Occasion
            </h2>
            <div className="gold-line mt-8 w-20" />
          </div>

          {/* Services grid — editorial magazine layout */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service, i) => (
              <div
                key={i}
                className="group relative rounded-2xl border border-dark-700/30 bg-dark-800/30 p-8 transition-all duration-500 hover:border-brand-400/20 hover:bg-dark-800/50"
              >
                {/* Number */}
                <span className="font-display text-6xl font-light text-brand-400/10 absolute top-4 right-6">
                  0{i + 1}
                </span>
                <div className="mb-6"><Icon name={service.icon} className="h-10 w-10 text-brand-400" /></div>
                <h3 className="font-display text-xl font-medium text-dark-100 mb-3">
                  {t(`landing.services.${service.key}.title`)}
                </h3>
                <p className="font-serif text-[15px] leading-relaxed text-dark-400">
                  {t(`landing.services.${service.key}.desc`)}
                </p>
                <div className="gold-line-left mt-6 w-12 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:w-20" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── EDITORIAL FEATURE — Split layout ───────── */}
      <section className="relative overflow-hidden">
        <div className="grid lg:grid-cols-2 min-h-[80vh]">
          {/* Image */}
          <div className="relative overflow-hidden">
            <img
              src={editorialImages[4]}
              alt="ARETON Editorial"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-dark-900 hidden lg:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent lg:hidden" />
          </div>

          {/* Content */}
          <div className="flex items-center px-8 py-20 lg:px-16 lg:py-0">
            <div className="max-w-lg">
              <p className="caption mb-6">The ARETON Difference</p>
              <h2 className="font-display text-display-sm font-medium text-dark-100 leading-tight">
                Where Sophistication<br />
                <span className="italic text-brand-400">Meets</span> Trust
              </h2>
              <div className="gold-line-left mt-8 w-16" />
              <p className="mt-8 font-serif text-lg leading-relaxed text-dark-300">
                Setiap companion melalui proses kurasi ketat: verifikasi identitas, 
                wawancara personal, dan evaluasi berkelanjutan. Kami memastikan 
                standar profesionalisme tertinggi dalam setiap interaksi.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-6 border-t border-dark-700/30 pt-8">
                <div>
                  <p className="font-display text-3xl font-medium text-brand-400">100%</p>
                  <p className="mt-1 text-[11px] uppercase tracking-widest text-dark-500">Verified</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-medium text-brand-400">24/7</p>
                  <p className="mt-1 text-[11px] uppercase tracking-widest text-dark-500">Support</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-medium text-brand-400">Escrow</p>
                  <p className="mt-1 text-[11px] uppercase tracking-widest text-dark-500">Payment</p>
                </div>
              </div>
              <Link
                href="/register"
                className="mt-10 inline-block rounded-none border border-brand-400/40 px-8 py-3.5 text-[11px] font-semibold uppercase tracking-widest-2 text-brand-400 transition-all hover:bg-brand-400/10"
              >
                Join Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── TIERS ───────── */}
      <section id="tiers" className="border-t border-dark-700/30 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-20 flex flex-col items-center text-center">
            <p className="caption mb-4">{t('landing.tierTitle')}</p>
            <h2 className="font-display text-display-sm font-medium text-dark-100 sm:text-display-md">
              Membership Tiers
            </h2>
            <div className="gold-line mt-8 w-20" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {tiers.map((tier, i) => (
              <div
                key={i}
                className={`group rounded-2xl border ${tier.border} ${tier.bg} p-8 transition-all duration-500 hover:border-brand-400/25`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className={`font-display text-2xl font-medium ${tier.color}`}>{tier.name}</span>
                  <span className="h-px flex-1 bg-dark-700/30" />
                  <span className="font-display text-lg font-light text-dark-300">
                    {t(`landing.tiers.${tier.key}.rate`)}
                  </span>
                </div>
                <p className="font-serif text-[15px] leading-relaxed text-dark-400">
                  {t(`landing.tiers.${tier.key}.services`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── TRUST — Editorial cards ───────── */}
      <section className="border-t border-dark-700/30 py-24 sm:py-32 bg-dark-950/50">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="mb-20 flex flex-col items-center text-center">
            <p className="caption mb-4">{t('landing.trustTitle')}</p>
            <h2 className="font-display text-display-sm font-medium text-dark-100">
              Built on Trust
            </h2>
            <div className="gold-line mt-8 w-20" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trustKeys.map((key, i) => (
              <div key={i} className="group rounded-2xl border border-dark-700/20 bg-dark-800/30 p-8 transition-all duration-500 hover:border-brand-400/15 hover:bg-dark-800/40">
                <span className="font-display text-5xl font-light text-brand-400/[0.08]">0{i + 1}</span>
                <h3 className="mt-4 font-display text-lg font-medium text-dark-100">{t(`landing.trust.${key}.title`)}</h3>
                <p className="mt-2 font-serif text-sm leading-relaxed text-dark-400">{t(`landing.trust.${key}.desc`)}</p>
                <div className="gold-line-left mt-6 w-0 transition-all duration-500 group-hover:w-12" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA BANNER ───────── */}
      <section className="relative overflow-hidden py-32">
        <div className="absolute inset-0 opacity-[0.06]">
          <img
            src={editorialImages[5]}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-dark-900/90" />
        <div className="relative z-10 mx-auto max-w-3xl text-center px-6">
          <p className="caption mb-6">Ready to Begin?</p>
          <h2 className="font-display text-display-sm font-medium text-dark-100 sm:text-display-md">
            Your Next Unforgettable<br />
            <span className="italic text-brand-400">Experience</span> Awaits
          </h2>
          <p className="mx-auto mt-6 max-w-lg font-serif text-lg text-dark-300 leading-relaxed">
            Bergabunglah dengan komunitas eksklusif ARETON dan temukan pengalaman pendampingan profesional kelas dunia.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/register"
              className="rounded-none bg-brand-400 px-10 py-4 text-[12px] font-bold uppercase tracking-widest-2 text-dark-900 transition-all hover:bg-brand-300"
            >
              Create Account
            </Link>
            <Link
              href="/escorts"
              className="rounded-none border border-dark-500/30 px-10 py-4 text-[12px] font-medium uppercase tracking-widest-2 text-dark-200 transition-all hover:border-brand-400/40 hover:text-brand-400"
            >
              Browse Companions
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── FOOTER ───────── */}
      <Footer />
    </div>
  );
}
