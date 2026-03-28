'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-dark-700/30 bg-dark-800/30">
        <span className="font-display text-4xl font-light text-dark-500">404</span>
      </div>
      <h1 className="font-display text-2xl font-medium text-dark-100">Halaman Tidak Ditemukan</h1>
      <p className="mt-3 max-w-md font-serif text-sm leading-relaxed text-dark-400">
        Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <Link
        href="/"
        className="mt-8 border border-brand-400/40 px-8 py-3 text-[11px] font-semibold uppercase tracking-widest text-brand-400 transition-all hover:bg-brand-400/10"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
