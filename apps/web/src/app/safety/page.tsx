'use client';

import Link from 'next/link';
import { MagazineLayout } from '@/components/layout/magazine-layout';

const safetyFeatures = [
  {
    title: 'Verifikasi Identitas Multi-Layer',
    desc: 'Setiap pengguna wajib melalui verifikasi KTP dan face-match. Companion juga melalui wawancara personal dan background check sebelum disetujui.',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
      </svg>
    ),
  },
  {
    title: 'Escrow Payment',
    desc: 'Dana klien ditahan secara aman oleh platform dan baru dirilis ke companion setelah sesi selesai dan dikonfirmasi. Perlindungan penuh untuk kedua belah pihak.',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: 'Live Location Tracking',
    desc: 'Selama sesi booking aktif, lokasi di-track secara real-time. Data lokasi dihapus otomatis segera setelah sesi selesai—privasi Anda terjaga.',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Tombol SOS Darurat',
    desc: 'Tersedia di aplikasi selama sesi aktif. Satu ketukan langsung mengirim lokasi dan alert ke tim safety kami dan kontak darurat yang Anda tentukan.',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    title: 'Rating & Review Terverifikasi',
    desc: 'Hanya pengguna yang telah menyelesaikan booking yang bisa memberikan rating. Sistem ini memastikan transparansi dan kualitas companion.',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    title: 'Enkripsi Data AES-256',
    desc: 'Semua data sensitif dienkripsi dengan standar militer AES-256-GCM. Komunikasi dilindungi SSL/TLS. Two-Factor Authentication tersedia.',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

const guidelines = [
  {
    title: 'Untuk Klien',
    items: [
      'Jaga privasi companion—jangan bagikan informasi personal mereka.',
      'Hormati batasan profesional yang telah disepakati.',
      'Gunakan fitur chat platform untuk komunikasi.',
      'Laporkan segala bentuk pelanggaran melalui fitur Report.',
      'Pastikan pertemuan di lokasi yang aman dan publik.',
      'Jangan meminta layanan di luar lingkup pendampingan profesional.',
    ],
  },
  {
    title: 'Untuk Companion',
    items: [
      'Selalu aktifkan location tracking selama sesi.',
      'Set kontak darurat di profil Anda sebelum booking pertama.',
      'Tolak permintaan yang membuat Anda tidak nyaman.',
      'Gunakan tombol SOS jika merasa terancam.',
      'Jangan bagikan informasi personal klien kepada pihak ketiga.',
      'Laporkan perilaku klien yang melanggar ketentuan platform.',
    ],
  },
];

export default function SafetyPage() {
  return (
    <MagazineLayout breadcrumb="Keamanan">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-28 sm:py-36">
        <div className="absolute inset-0 opacity-[0.04]">
          <img
            src="https://images.unsplash.com/photo-1563986768609-322da13575f2?w=1600&q=80&auto=format"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-dark-900/95" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <div className="mb-8 flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-brand-400/40" />
            <p className="text-[11px] font-medium uppercase tracking-widest-2 text-brand-400">Safety Center</p>
            <span className="h-px w-12 bg-brand-400/40" />
          </div>
          <h1 className="font-display text-display-sm font-medium text-dark-100 sm:text-display-lg">
            Keamanan Adalah<br />
            Prioritas <span className="italic text-brand-400">Utama</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl font-serif text-lg leading-relaxed text-dark-300 sm:text-xl">
            Setiap fitur ARETON dirancang dengan keamanan sebagai pondasi. 
            Kami berkomitmen melindungi setiap pengguna—klien maupun companion.
          </p>
        </div>
      </section>

      {/* ── Emergency notice ── */}
      <section className="border-t border-red-500/20 bg-red-500/[0.03] py-8">
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-display text-sm font-medium text-red-300">Dalam Situasi Darurat</p>
              <p className="mt-1 font-serif text-sm text-dark-400">
                Jika Anda merasa dalam bahaya, segera hubungi <span className="font-medium text-dark-200">polisi (110)</span> atau 
                gunakan tombol SOS di aplikasi. Tim safety kami akan merespons secepat mungkin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Safety features ── */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="mb-16 text-center">
            <p className="text-[11px] font-medium uppercase tracking-widest-2 text-brand-400 mb-4">Fitur Keamanan</p>
            <h2 className="font-display text-display-sm font-medium text-dark-100">
              Perlindungan Multi-Layer
            </h2>
            <div className="mx-auto mt-6 h-px w-20 bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {safetyFeatures.map((feature, i) => (
              <div key={i} className="group rounded-2xl border border-dark-700/20 bg-dark-800/30 p-8 transition-all duration-500 hover:border-brand-400/15">
                <div className="mb-5 text-brand-400/50 transition-colors group-hover:text-brand-400">
                  {feature.icon}
                </div>
                <h3 className="font-display text-lg font-medium text-dark-100">{feature.title}</h3>
                <p className="mt-3 font-serif text-[15px] leading-relaxed text-dark-400">{feature.desc}</p>
                <div className="mt-6 h-px w-0 bg-gradient-to-r from-brand-400/50 to-transparent transition-all duration-500 group-hover:w-16" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Guidelines ── */}
      <section className="border-t border-dark-700/30 bg-dark-950/50 py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          <div className="mb-16 text-center">
            <p className="text-[11px] font-medium uppercase tracking-widest-2 text-brand-400 mb-4">Panduan</p>
            <h2 className="font-display text-display-sm font-medium text-dark-100">
              Tips Keamanan
            </h2>
            <div className="mx-auto mt-6 h-px w-20 bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {guidelines.map((guide) => (
              <div key={guide.title} className="rounded-2xl border border-dark-700/20 bg-dark-800/30 p-8">
                <h3 className="mb-6 font-display text-xl font-medium text-dark-100">{guide.title}</h3>
                <ul className="space-y-4">
                  {guide.items.map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-serif text-[15px] leading-relaxed text-dark-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Prohibited ── */}
      <section className="border-t border-dark-700/30 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-12 text-center">
            <p className="text-[11px] font-medium uppercase tracking-widest-2 text-brand-400 mb-4">Kebijakan</p>
            <h2 className="font-display text-display-sm font-medium text-dark-100">
              Larangan & Pelanggaran
            </h2>
            <div className="mx-auto mt-6 h-px w-20 bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-8 sm:p-10">
            <p className="font-serif text-[15px] leading-relaxed text-dark-300 mb-6">
              ARETON memiliki <span className="font-medium text-dark-100">kebijakan zero-tolerance</span> terhadap pelanggaran berikut. 
              Akun pelanggar akan langsung diblokir permanen:
            </p>
            <ul className="space-y-3">
              {[
                'Meminta atau menawarkan layanan di luar lingkup pendampingan profesional.',
                'Kekerasan verbal maupun fisik dalam bentuk apapun.',
                'Pelecehan seksual, intimidasi, atau perilaku mengancam.',
                'Memberikan informasi identitas palsu atau menipu.',
                'Membagikan data personal pengguna lain tanpa izin.',
                'Melakukan transaksi di luar platform untuk menghindari escrow.',
                'Diskriminasi berdasarkan ras, agama, gender, atau orientasi seksual.',
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="font-serif text-[15px] leading-relaxed text-dark-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Report ── */}
      <section className="border-t border-dark-700/30 bg-dark-950/50 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-display-sm font-medium text-dark-100">
            Laporkan Pelanggaran
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-serif text-lg text-dark-300 leading-relaxed">
            Jika Anda menyaksikan atau mengalami pelanggaran, jangan ragu untuk melapor. 
            Identitas pelapor akan dijaga kerahasiaannya.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/user/report"
              className="rounded-none bg-brand-400 px-10 py-4 text-[12px] font-bold uppercase tracking-widest-2 text-dark-900 transition-all hover:bg-brand-300"
            >
              Buat Laporan
            </Link>
            <a
              href="mailto:safety@areton.id"
              className="rounded-none border border-dark-500/30 px-10 py-4 text-[12px] font-medium uppercase tracking-widest-2 text-dark-200 transition-all hover:border-brand-400/40 hover:text-brand-400"
            >
              safety@areton.id
            </a>
          </div>
        </div>
      </section>
    </MagazineLayout>
  );
}
