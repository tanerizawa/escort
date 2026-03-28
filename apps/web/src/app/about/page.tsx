'use client';

import { MagazineLayout } from '@/components/layout/magazine-layout';

const teamMembers = [
  { name: 'Rina Kartika', role: 'CEO & Founder', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&auto=format' },
  { name: 'Arief Prasetyo', role: 'CTO', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format' },
  { name: 'Maya Sari', role: 'Head of Operations', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&auto=format' },
  { name: 'Dimas Nugraha', role: 'Head of Safety', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&auto=format' },
];

const values = [
  { title: 'Integritas', desc: 'Setiap companion melalui proses verifikasi ketat—tanpa kompromi.', icon: '01' },
  { title: 'Profesionalisme', desc: 'Standar layanan tertinggi dalam setiap interaksi dan pengalaman.', icon: '02' },
  { title: 'Keamanan', desc: 'Sistem escrow, tracking real-time, dan SOS button untuk perlindungan penuh.', icon: '03' },
  { title: 'Privasi', desc: 'Data dienkripsi AES-256-GCM, sesuai UU PDP Indonesia.', icon: '04' },
];

const stats = [
  { value: '100%', label: 'Verified Partners' },
  { value: '24/7', label: 'Support Available' },
  { value: '4', label: 'Membership Tiers' },
  { value: 'Escrow', label: 'Secure Payments' },
];

export default function AboutPage() {
  return (
    <MagazineLayout breadcrumb="Tentang Kami">
      {/* ── Hero with art-deco ── */}
      <section className="relative overflow-hidden py-28 sm:py-36">
        <div className="absolute inset-0 opacity-[0.08]">
          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&q=80&auto=format"
            alt=""
            className="h-full w-full object-cover animate-ken-burns"
          />
        </div>
        <div className="absolute inset-0 bg-dark-900/90" />
        <div className="absolute inset-0 art-deco-bg opacity-50" />
        <div className="absolute top-20 left-10 w-48 h-48 art-orb animate-float opacity-40" />
        <div className="absolute bottom-10 right-20 w-64 h-64 art-orb animate-float opacity-30" style={{ animationDelay: '4s' }} />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <div className="mb-8 flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-brand-400/40" />
            <p className="text-[11px] font-medium uppercase tracking-widest-2 text-brand-400">Tentang Kami</p>
            <span className="h-px w-12 bg-brand-400/40" />
          </div>
          <h1 className="font-display text-display-sm font-medium text-dark-100 sm:text-display-lg">
            Mengkurasi Pengalaman<br />
            <span className="italic text-brand-400">Premium</span> Indonesia
          </h1>
          <p className="mx-auto mt-8 max-w-2xl font-serif text-lg leading-relaxed text-dark-300 sm:text-xl">
            ARETON.id adalah platform pendampingan profesional pertama di Indonesia yang menggabungkan 
            teknologi terkini dengan standar hospitalitas kelas dunia.
          </p>
        </div>
      </section>

      {/* ── Story ── */}
      <section className="border-t border-dark-700/30 py-24">
        <div className="mx-auto grid max-w-6xl gap-16 px-6 lg:grid-cols-2 lg:px-10">
          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80&auto=format"
                alt="ARETON Team"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 hidden border border-brand-400/20 bg-dark-800/90 p-8 backdrop-blur-sm lg:block">
              <p className="font-display text-4xl font-medium text-brand-400">2026</p>
              <p className="mt-1 text-[11px] uppercase tracking-widest text-dark-400">Didirikan</p>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-[11px] font-medium uppercase tracking-widest-2 text-brand-400 mb-4">Cerita Kami</p>
            <h2 className="font-display text-display-sm font-medium text-dark-100">
              Lahir dari Visi,<br />Dibangun dengan <span className="italic text-brand-400">Integritas</span>
            </h2>
            <div className="mt-6 h-px w-16 bg-gradient-to-r from-brand-400/50 to-transparent" />
            <p className="mt-8 font-serif text-[15px] leading-relaxed text-dark-300">
              ARETON didirikan dengan misi sederhana: menyediakan layanan pendampingan profesional 
              yang aman, terverifikasi, dan berkelas. Di tengah industri yang seringkali diselimuti 
              ketidakpastian, kami hadir sebagai standar baru.
            </p>
            <p className="mt-4 font-serif text-[15px] leading-relaxed text-dark-300">
              Setiap companion kami melalui proses kurasi ketat—verifikasi identitas, wawancara personal, 
              dan evaluasi berkelanjutan. Kami percaya bahwa kepercayaan dibangun melalui transparansi 
              dan konsistensi, bukan janji.
            </p>
            <p className="mt-4 font-serif text-[15px] leading-relaxed text-dark-300">
              Dengan teknologi escrow payment, real-time location tracking, dan sistem rating 
              terverifikasi, kami memastikan setiap interaksi terjaga dengan standar tertinggi.
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats strip — with visual accents ── */}
      <section className="relative border-y border-dark-700/30 py-16 overflow-hidden">
        <div className="absolute inset-0 bg-dark-950/50" />
        <div className="absolute inset-0 art-deco-bg opacity-30" />
        <div className="relative mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={stat.label} className="group relative text-center p-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-px bg-gradient-to-r from-transparent via-brand-400/30 to-transparent" />
              <p className="font-display text-3xl font-medium text-brand-400 sm:text-4xl transition-transform duration-500 group-hover:scale-105">{stat.value}</p>
              <p className="mt-2 text-[10px] uppercase tracking-widest-2 text-dark-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Values ── */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="mb-16 text-center">
            <p className="text-[11px] font-medium uppercase tracking-widest-2 text-brand-400 mb-4">Prinsip Kami</p>
            <h2 className="font-display text-display-sm font-medium text-dark-100">
              Dibangun di Atas Empat Pilar
            </h2>
            <div className="mx-auto mt-6 h-px w-20 bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {values.map((v) => (
              <div key={v.title} className="group relative overflow-hidden border border-dark-700/30 bg-dark-800/20 p-8 transition-all duration-500 hover:border-brand-400/20">
                {/* Hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-400/[0.04] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                {/* Left accent strip */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-brand-400/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                {/* Corner ornament */}
                <div className="absolute top-3 right-3 w-4 h-4 border-r border-t border-brand-400/10 transition-all duration-500 group-hover:border-brand-400/25" />
                
                <div className="relative">
                  <span className="font-display text-6xl font-light text-brand-400/8">{v.icon}</span>
                  <h3 className="mt-4 font-display text-xl font-medium text-dark-100">{v.title}</h3>
                  <p className="mt-3 font-serif text-[15px] leading-relaxed text-dark-400">{v.desc}</p>
                  <div className="mt-6 h-px w-0 bg-gradient-to-r from-brand-400/50 to-transparent transition-all duration-500 group-hover:w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="border-t border-dark-700/30 py-24 sm:py-32 bg-dark-950/30">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="mb-16 text-center">
            <p className="text-[11px] font-medium uppercase tracking-widest-2 text-brand-400 mb-4">Tim Kami</p>
            <h2 className="font-display text-display-sm font-medium text-dark-100">
              Di Balik Layar
            </h2>
            <div className="mx-auto mt-6 h-px w-20 bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((member) => (
              <div key={member.name} className="group text-center">
                <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden">
                  {/* Decorative outer frame */}
                  <div className="absolute -inset-2 border border-brand-400/[0.06] transition-all duration-700 group-hover:border-brand-400/15" />
                  
                  <img
                    src={member.img}
                    alt={member.name}
                    className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05]"
                  />
                  {/* Cinematic overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/70 via-dark-900/10 to-transparent" />
                  <div className="absolute inset-0 vignette opacity-20" />
                  
                  {/* Corner marks */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-l border-t border-brand-400/15 transition-all duration-500 group-hover:border-brand-400/30" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-r border-t border-brand-400/15 transition-all duration-500 group-hover:border-brand-400/30" />
                  
                  {/* Name overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="mb-1 h-px w-6 bg-gradient-to-r from-brand-400/40 to-transparent" />
                    <h3 className="font-display text-base font-medium text-white">{member.name}</h3>
                    <p className="mt-0.5 text-[10px] uppercase tracking-widest-2 text-brand-400/70">{member.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-dark-700/30 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-display-sm font-medium text-dark-100">
            Siap Bergabung?
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-serif text-lg text-dark-300 leading-relaxed">
            Jadilah bagian dari komunitas eksklusif ARETON dan temukan standar baru layanan pendampingan profesional.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <a
              href="/register"
              className="rounded-none bg-brand-400 px-10 py-4 text-[12px] font-bold uppercase tracking-widest-2 text-dark-900 transition-all hover:bg-brand-300"
            >
              Daftar Sekarang
            </a>
            <a
              href="/contact"
              className="rounded-none border border-dark-500/30 px-10 py-4 text-[12px] font-medium uppercase tracking-widest-2 text-dark-200 transition-all hover:border-brand-400/40 hover:text-brand-400"
            >
              Hubungi Kami
            </a>
          </div>
        </div>
      </section>
    </MagazineLayout>
  );
}
