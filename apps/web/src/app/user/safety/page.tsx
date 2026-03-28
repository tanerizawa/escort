'use client';

import Link from 'next/link';

const safetyFeatures = [
  {
    title: 'Verifikasi Identitas Multi-Layer',
    desc: 'Setiap pengguna wajib melalui verifikasi KTP dan face-match. Companion juga melalui wawancara personal dan background check.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
      </svg>
    ),
  },
  {
    title: 'Escrow Payment',
    desc: 'Dana ditahan secara aman dan baru dirilis setelah sesi selesai dan dikonfirmasi.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: 'Live Location Tracking',
    desc: 'Lokasi di-track real-time selama sesi aktif. Data dihapus otomatis setelah sesi selesai.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Tombol SOS Darurat',
    desc: 'Satu ketukan langsung mengirim lokasi dan alert ke tim safety dan kontak darurat Anda.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    title: 'Rating & Review Terverifikasi',
    desc: 'Hanya pengguna yang telah menyelesaikan booking yang bisa memberikan rating.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    title: 'Enkripsi Data AES-256',
    desc: 'Semua data sensitif dienkripsi standar militer. Komunikasi dilindungi SSL/TLS.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

const clientGuidelines = [
  'Jaga privasi companion—jangan bagikan informasi personal mereka.',
  'Hormati batasan profesional yang telah disepakati.',
  'Gunakan fitur chat platform untuk komunikasi.',
  'Laporkan segala bentuk pelanggaran melalui fitur Report.',
  'Pastikan pertemuan di lokasi yang aman dan publik.',
  'Jangan meminta layanan di luar lingkup pendampingan profesional.',
];

const prohibitedItems = [
  'Meminta atau menawarkan layanan di luar lingkup pendampingan profesional.',
  'Kekerasan verbal maupun fisik dalam bentuk apapun.',
  'Pelecehan seksual, intimidasi, atau perilaku mengancam.',
  'Memberikan informasi identitas palsu atau menipu.',
  'Membagikan data personal pengguna lain tanpa izin.',
  'Melakukan transaksi di luar platform untuk menghindari escrow.',
  'Diskriminasi berdasarkan ras, agama, gender, atau orientasi seksual.',
];

export default function UserSafetyPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-dark-100">Keamanan & Keselamatan</h1>
        <p className="mt-1 text-sm text-dark-400">
          Panduan keamanan dan fitur perlindungan untuk Anda
        </p>
      </div>

      {/* Emergency Notice */}
      <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
            <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-red-300">Dalam Situasi Darurat</p>
            <p className="mt-1 text-sm text-dark-400">
              Jika Anda merasa dalam bahaya, segera hubungi <span className="font-medium text-dark-200">polisi (110)</span> atau 
              gunakan tombol SOS di aplikasi.
            </p>
          </div>
        </div>
      </div>

      {/* Safety Features */}
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-light text-dark-200">Fitur Keamanan</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {safetyFeatures.map((feature, i) => (
            <div key={i} className="rounded-xl border border-dark-700/50 bg-dark-800/50 p-5">
              <div className="mb-3 text-brand-400/70">{feature.icon}</div>
              <h3 className="text-sm font-medium text-dark-100">{feature.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-dark-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Guidelines for Clients */}
      <div className="mb-6 rounded-xl border border-dark-700/50 bg-dark-800/50 p-5">
        <h2 className="mb-4 text-lg font-light text-dark-200">Tips Keamanan untuk Klien</h2>
        <ul className="space-y-3">
          {clientGuidelines.map((item, i) => (
            <li key={i} className="flex gap-3">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-dark-300">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Prohibited */}
      <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-5">
        <h2 className="mb-1 text-lg font-light text-dark-200">Larangan & Pelanggaran</h2>
        <p className="mb-4 text-xs text-dark-500">
          Kebijakan zero-tolerance — akun pelanggar akan langsung diblokir permanen.
        </p>
        <ul className="space-y-3">
          {prohibitedItems.map((item, i) => (
            <li key={i} className="flex gap-3">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-sm text-dark-300">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Report CTA */}
      <div className="rounded-xl border border-dark-700/50 bg-dark-800/50 p-6 text-center">
        <h2 className="text-lg font-light text-dark-200">Laporkan Pelanggaran</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-dark-400">
          Jika Anda menyaksikan atau mengalami pelanggaran, jangan ragu untuk melapor. 
          Identitas pelapor akan dijaga kerahasiaannya.
        </p>
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/user/report"
            className="rounded-lg bg-brand-400 px-6 py-2.5 text-sm font-medium text-dark-900 transition-colors hover:bg-brand-300"
          >
            Buat Laporan
          </Link>
          <a
            href="mailto:safety@areton.id"
            className="rounded-lg border border-dark-600/50 px-6 py-2.5 text-sm text-dark-300 transition-colors hover:border-dark-500/50"
          >
            safety@areton.id
          </a>
        </div>
      </div>
    </div>
  );
}
