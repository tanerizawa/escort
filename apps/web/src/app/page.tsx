import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dark-900 text-dark-100">
      {/* Header */}
      <header className="border-b border-brand-400/15 px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extralight tracking-widest text-dark-100">ARETON</span>
            <span className="text-2xl text-brand-400">.</span>
            <span className="text-2xl font-extralight tracking-widest text-brand-400">id</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="rounded-lg border border-dark-500/25 px-5 py-2 text-sm text-dark-300 transition-colors hover:border-brand-400/30 hover:text-brand-400"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand-400/10 border border-brand-400/30 px-5 py-2 text-sm font-medium text-brand-400 transition-colors hover:bg-brand-400/20"
            >
              Daftar
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-brand-400">
            Professional Companion Service
          </p>
          <h1 className="mb-6 text-4xl font-light tracking-tight text-dark-100 sm:text-6xl">
            Pendamping Profesional
            <br />
            <span className="text-gradient-gold font-normal">Berkelas & Terverifikasi</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-dark-400 leading-relaxed">
            Platform premium yang menghubungkan Anda dengan companion profesional terverifikasi untuk meeting bisnis,
            dinner formal, event, dan kebutuhan profesional lainnya.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="rounded-xl bg-brand-400 px-8 py-3.5 text-sm font-semibold text-dark-900 transition-all hover:bg-brand-300 hover:shadow-lg hover:shadow-brand-400/20"
            >
              Mulai Sekarang
            </Link>
            <Link
              href="/register?role=escort"
              className="rounded-xl border border-dark-500/25 px-8 py-3.5 text-sm font-medium text-dark-200 transition-colors hover:border-brand-400/30 hover:text-brand-400"
            >
              Bergabung Sebagai Partner
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="border-t border-dark-700/50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-sm font-semibold uppercase tracking-[0.15em] text-brand-400">
            Layanan Kami
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: '🤝',
                title: 'Pendamping Meeting',
                desc: 'Companion profesional untuk meeting bisnis, presentasi, dan negosiasi',
              },
              {
                icon: '🍽',
                title: 'Pendamping Dinner',
                desc: 'Partner elegan untuk acara makan malam formal atau kasual',
              },
              {
                icon: '🎭',
                title: 'Pendamping Event',
                desc: 'Plus-one berkelas untuk gala, wedding, atau networking event',
              },
              {
                icon: '💼',
                title: 'Asisten Bisnis',
                desc: 'Sekretaris profesional untuk perjalanan bisnis domestik/internasional',
              },
            ].map((service, i) => (
              <div key={i} className="gold-card p-6 transition-all hover:border-brand-400/30">
                <div className="mb-3 text-3xl">{service.icon}</div>
                <h3 className="mb-2 text-[15px] font-semibold text-dark-100">{service.title}</h3>
                <p className="text-sm leading-relaxed text-dark-400">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="border-t border-dark-700/50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-sm font-semibold uppercase tracking-[0.15em] text-brand-400">
            Klasifikasi Partner
          </h2>
          <div className="flex flex-col gap-3">
            {[
              {
                name: 'Silver',
                color: 'text-slate-400 border-slate-400/30',
                services: 'Pendamping makan, acara kasual',
                rate: 'Rp 300K - 500K / jam',
              },
              {
                name: 'Gold',
                color: 'text-amber-400 border-amber-400/30',
                services: 'Meeting bisnis, dinner formal, pesta',
                rate: 'Rp 500K - 1Jt / jam',
              },
              {
                name: 'Platinum',
                color: 'text-violet-400 border-violet-400/30',
                services: 'Asisten bisnis, negosiasi, sekretaris perjalanan',
                rate: 'Rp 1Jt - 2.5Jt / jam',
              },
              {
                name: 'Diamond',
                color: 'text-sky-400 border-sky-400/30',
                services: 'VIP escort, diplomat/CEO companion, international trip',
                rate: 'Rp 2.5Jt - 5Jt+ / jam',
              },
            ].map((tier, i) => (
              <div
                key={i}
                className={`grid grid-cols-[100px_1fr_160px] items-center gap-4 rounded-lg border-l-2 ${tier.color.split(' ')[1]} bg-dark-800/60 px-5 py-4`}
              >
                <span className={`text-sm font-bold ${tier.color.split(' ')[0]}`}>{tier.name}</span>
                <span className="text-sm text-dark-200">{tier.services}</span>
                <span className="text-right text-sm font-semibold text-dark-100">{tier.rate}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-t border-dark-700/50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-sm font-semibold uppercase tracking-[0.15em] text-brand-400">
            Keunggulan
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Verifikasi Ketat', desc: 'eKYC, background check, interview, training wajib' },
              { title: 'AI Smart Matching', desc: 'Pencocokan berdasar kebutuhan, preferensi, dan kompatibilitas' },
              { title: 'Escrow Payment', desc: 'Dana aman di escrow, release setelah layanan selesai' },
              { title: 'SOS & Safety', desc: 'Tombol darurat, live tracking, 24/7 support team' },
              { title: 'Rating Terperinci', desc: 'Skor attitude, ketepatan waktu, profesionalisme' },
              { title: 'Multi-bahasa', desc: 'Interface & partner tersedia dalam berbagai bahasa' },
            ].map((item, i) => (
              <div key={i} className="glass-card p-5">
                <h3 className="mb-1 text-sm font-semibold text-dark-100">{item.title}</h3>
                <p className="text-xs leading-relaxed text-dark-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-700/50 px-6 py-10">
        <div className="mx-auto max-w-6xl text-center">
          <div className="mb-3 flex items-baseline justify-center gap-1">
            <span className="text-lg font-extralight tracking-widest text-dark-300">ARETON</span>
            <span className="text-lg text-brand-400">.</span>
            <span className="text-lg font-extralight tracking-widest text-brand-400">id</span>
          </div>
          <p className="text-xs text-dark-500">
            &copy; {new Date().getFullYear()} ARETON.id — Professional Companion Service Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
