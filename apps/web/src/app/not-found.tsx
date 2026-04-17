import Link from 'next/link';
import { RoseGlyph } from '@/components/brand/rose-glyph';

export default function NotFound() {
  return (
    <div className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      <div className="pointer-events-none absolute inset-0 velvet-stage opacity-70" />
      <RoseGlyph className="rose-watermark h-[30rem] w-[30rem] -left-24 -top-16 animate-petal-drift" />
      <RoseGlyph
        className="rose-watermark h-[24rem] w-[24rem] -right-20 bottom-0 animate-petal-drift"
        style={{ animationDelay: '4s' }}
      />

      <div className="relative z-10 max-w-xl">
        <div className="mx-auto mb-8 text-rose-300/70">
          <RoseGlyph className="mx-auto h-16 w-16" strokeWidth={1.1} />
        </div>

        <p className="act-mark">Jalan yang hilang</p>
        <h1 className="mt-5 font-display text-display-sm font-medium text-dark-100 sm:text-display-md">
          404 — <span className="italic text-gradient-rose-gold">halaman tidak ditemukan</span>
        </h1>
        <div className="gold-rose-line mx-auto mt-8 w-24" />
        <p className="mx-auto mt-8 max-w-md font-serif text-lg leading-relaxed text-dark-300">
          Mawar yang Anda cari tidak lagi mekar di sini. Mungkin ia telah berpindah taman,
          atau Anda salah jalan — kembali saja ke beranda.
        </p>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Link
            href="/"
            className="rounded-none bg-brand-400 px-10 py-4 text-[12px] font-bold uppercase tracking-widest-2 text-dark-900 transition-all hover:bg-brand-300"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/escorts"
            className="rounded-none border border-rose-400/40 px-10 py-4 text-[12px] font-medium uppercase tracking-widest-2 text-rose-200 transition-all hover:bg-rose-500/10"
          >
            Telusuri Companion
          </Link>
        </div>
      </div>
    </div>
  );
}
