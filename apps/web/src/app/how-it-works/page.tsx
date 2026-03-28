'use client';

import Link from 'next/link';
import { MagazineLayout } from '@/components/layout/magazine-layout';

const steps = [
  {
    number: '01',
    title: 'Daftar & Verifikasi',
    desc: 'Buat akun dalam hitungan menit. Verifikasi identitas Anda untuk memastikan keamanan komunitas.',
    detail: 'Kami memverifikasi setiap pengguna melalui KTP dan sistem face-match untuk menjaga integritas platform.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80&auto=format',
    imageAlt: 'Professional verification process',
    accent: 'from-brand-400/20 via-amber-400/10',
  },
  {
    number: '02',
    title: 'Telusuri & Pilih',
    desc: 'Jelajahi katalog companion terverifikasi. Filter berdasarkan tier, keahlian, bahasa, dan lokasi.',
    detail: 'Setiap profil companion dilengkapi foto terverifikasi, bio detail, rating dari klien sebelumnya, dan sertifikasi profesional.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80&auto=format',
    imageAlt: 'Browse companion profiles',
    accent: 'from-violet-400/20 via-blue-400/10',
  },
  {
    number: '03',
    title: 'Pesan & Bayar',
    desc: 'Pilih tanggal, waktu, dan durasi. Pembayaran aman melalui sistem escrow terlindungi.',
    detail: 'Dana Anda ditahan di escrow hingga sesi selesai. Jika ada masalah, proses dispute tersedia untuk perlindungan Anda.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80&auto=format',
    imageAlt: 'Secure payment process',
    accent: 'from-emerald-400/20 via-teal-400/10',
  },
  {
    number: '04',
    title: 'Nikmati & Review',
    desc: 'Nikmati pengalaman pendampingan profesional. Berikan ulasan untuk membantu komunitas.',
    detail: 'Setelah sesi selesai, Anda dapat memberikan rating dan ulasan. Dana otomatis dirilis ke companion setelah konfirmasi.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80&auto=format',
    imageAlt: 'Enjoy the experience',
    accent: 'from-sky-400/20 via-cyan-400/10',
  },
];

const protections = [
  { label: 'Verifikasi KTP & Face-Match', desc: 'Semua pengguna diverifikasi identitasnya', icon: '🛡️' },
  { label: 'Escrow Payment', desc: 'Dana aman hingga sesi selesai', icon: '🔒' },
  { label: 'Live Location Tracking', desc: 'Tracking real-time selama sesi aktif', icon: '📍' },
  { label: 'Tombol SOS Darurat', desc: 'Bantuan segera jika dibutuhkan', icon: '🚨' },
  { label: 'Rating & Review', desc: 'Sistem penilaian transparan', icon: '⭐' },
  { label: 'Dukungan 24/7', desc: 'Tim support siap membantu kapan saja', icon: '💬' },
];

export default function HowItWorksPage() {
  return (
    <MagazineLayout breadcrumb="Cara Kerja">
      {/* ── Hero with art-deco background ── */}
      <section className="relative py-28 sm:py-36 overflow-hidden">
        {/* Decorative floating orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 art-orb animate-float opacity-60" />
        <div className="absolute bottom-10 right-10 w-48 h-48 art-orb animate-float opacity-40" style={{ animationDelay: '3s' }} />
        
        {/* Art deco geometric pattern */}
        <div className="absolute inset-0 art-deco-bg" />
        
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mb-8 flex items-center justify-center gap-4">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-brand-400/50" />
            <p className="text-[11px] font-medium uppercase tracking-widest-2 text-brand-400">Cara Kerja</p>
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-brand-400/50" />
          </div>
          <h1 className="font-display text-display-sm font-medium text-dark-100 sm:text-display-lg">
            Empat Langkah Menuju<br />
            Pengalaman <span className="italic text-brand-400">Terbaik</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl font-serif text-lg leading-relaxed text-dark-300">
            Dari pendaftaran hingga ulasan—setiap langkah dirancang untuk memberikan keamanan, 
            kenyamanan, dan pengalaman yang tak terlupakan.
          </p>
          
          {/* Decorative divider */}
          <div className="mt-12 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-brand-400/30" />
            <span className="h-1 w-1 bg-brand-400/50" />
            <span className="h-px w-8 bg-brand-400/30" />
          </div>
        </div>
      </section>

      {/* ── Steps — cinematic with real images ── */}
      <section className="border-t border-dark-700/30 py-24">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="space-y-0">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className={`grid gap-8 py-16 lg:grid-cols-2 lg:gap-16 ${
                  i < steps.length - 1 ? 'border-b border-dark-700/20' : ''
                }`}
              >
                {/* Text column */}
                <div className={`flex flex-col justify-center ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="font-display text-7xl font-light text-brand-400/10">{step.number}</span>
                    <div className="text-brand-400/50">{step.icon}</div>
                  </div>
                  <h3 className="font-display text-2xl font-medium text-dark-100 sm:text-3xl">{step.title}</h3>
                  <div className="mt-4 h-px w-16 bg-gradient-to-r from-brand-400/50 to-transparent" />
                  <p className="mt-6 font-serif text-lg leading-relaxed text-dark-200">{step.desc}</p>
                  <p className="mt-4 font-serif text-[15px] leading-relaxed text-dark-400">{step.detail}</p>
                </div>

                {/* Visual column — cinematic image card */}
                <div className={`flex items-center justify-center ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className="relative w-full max-w-md group">
                    {/* Outer decorative frame */}
                    <div className="absolute -inset-3 border border-brand-400/[0.08] transition-all duration-700 group-hover:border-brand-400/15" />
                    
                    {/* Main image container */}
                    <div className="relative aspect-[4/5] overflow-hidden border border-dark-700/30">
                      <img
                        src={step.image}
                        alt={step.imageAlt}
                        className="h-full w-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                      
                      {/* Cinematic overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/20 to-transparent opacity-70" />
                      <div className={`absolute inset-0 bg-gradient-to-br ${step.accent} to-transparent opacity-40`} />
                      <div className="absolute inset-0 vignette opacity-20" />

                      {/* Step label inside image */}
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center border border-brand-400/30 bg-dark-900/60 backdrop-blur-sm text-brand-400">
                            {step.icon}
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest-2 text-brand-400/60">Step {step.number}</p>
                            <p className="font-display text-sm font-medium text-dark-100">{step.title}</p>
                          </div>
                        </div>
                      </div>

                      {/* Decorative corner marks */}
                      <div className="absolute top-3 left-3 w-5 h-5 border-l border-t border-brand-400/20" />
                      <div className="absolute top-3 right-3 w-5 h-5 border-r border-t border-brand-400/20" />
                      <div className="absolute bottom-3 left-3 w-5 h-5 border-l border-b border-brand-400/20 opacity-30" />
                      <div className="absolute bottom-3 right-3 w-5 h-5 border-r border-b border-brand-400/20 opacity-30" />
                    </div>

                    {/* Connector line to next step */}
                    {i < steps.length - 1 && (
                      <div className="absolute -bottom-16 left-1/2 hidden h-16 w-px bg-gradient-to-b from-brand-400/20 to-transparent lg:block" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust features grid — with visual art ── */}
      <section className="relative border-t border-dark-700/30 py-24 overflow-hidden">
        {/* Background art */}
        <div className="absolute inset-0 bg-dark-950/50" />
        <div className="absolute inset-0 art-deco-bg opacity-60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 art-orb opacity-30" />
        
        <div className="relative mx-auto max-w-5xl px-6 lg:px-10">
          <div className="mb-16 text-center">
            <p className="text-[11px] font-medium uppercase tracking-widest-2 text-brand-400 mb-4">Perlindungan</p>
            <h2 className="font-display text-display-sm font-medium text-dark-100">
              Keamanan di Setiap Langkah
            </h2>
            <div className="mx-auto mt-6 h-px w-20 bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {protections.map((p, i) => (
              <div key={i} className="group relative border border-dark-700/20 bg-dark-800/30 p-6 transition-all duration-500 hover:border-brand-400/15 overflow-hidden">
                {/* Shimmer on hover */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-brand-400/[0.04] to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                
                {/* Decorative corner */}
                <div className="absolute top-2 right-2 w-3 h-3 border-r border-t border-brand-400/10 transition-all duration-500 group-hover:border-brand-400/25" />
                
                <div className="relative flex items-start gap-4">
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <h3 className="font-display text-[15px] font-medium text-dark-100">{p.label}</h3>
                    <p className="mt-1 font-serif text-sm text-dark-400">{p.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA — with background imagery ── */}
      <section className="relative py-24 overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=60&auto=format"
            alt=""
            className="h-full w-full object-cover opacity-[0.04]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/95 to-dark-900" />
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-400/20 to-transparent" />
        
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-brand-400/30" />
            <span className="h-1.5 w-1.5 rotate-45 bg-brand-400/40" />
            <span className="h-px w-12 bg-brand-400/30" />
          </div>
          <h2 className="font-display text-display-sm font-medium text-dark-100">
            Siap Memulai?
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-serif text-lg text-dark-300 leading-relaxed">
            Daftar sekarang dan temukan companion profesional yang sesuai dengan kebutuhan Anda.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/register"
              className="rounded-none bg-brand-400 px-10 py-4 text-[12px] font-bold uppercase tracking-widest-2 text-dark-900 transition-all hover:bg-brand-300 hover:shadow-[0_0_30px_rgba(201,169,110,0.2)]"
            >
              Daftar Gratis
            </Link>
            <Link
              href="/escorts"
              className="rounded-none border border-dark-500/30 px-10 py-4 text-[12px] font-medium uppercase tracking-widest-2 text-dark-200 transition-all hover:border-brand-400/40 hover:text-brand-400"
            >
              Jelajahi Companion
            </Link>
          </div>
        </div>
      </section>
    </MagazineLayout>
  );
}
