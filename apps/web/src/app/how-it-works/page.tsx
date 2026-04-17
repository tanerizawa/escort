import Link from 'next/link';
import { MarketingShell } from '@/components/layout/marketing-shell';
import { RoseGlyph } from '@/components/brand/rose-glyph';
import { Shield, ShieldCheck, MapPin, Siren, Star, MessagesSquare } from 'lucide-react';

const steps = [
  {
    number: 'I',
    title: 'Daftar & Verifikasi',
    desc: 'Buat akun dalam hitungan menit. Verifikasi identitas Anda untuk menjaga integritas komunitas.',
    detail:
      'Setiap pengguna diverifikasi melalui KTP dan face-match. Proses verifikasi dijaga sub rosa — dienkripsi AES-256-GCM dan hanya dapat dibuka untuk keperluan safety.',
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80&auto=format',
  },
  {
    number: 'II',
    title: 'Telusuri & Pilih',
    desc: 'Jelajahi katalog companion terverifikasi. Filter berdasarkan tier, keahlian, bahasa, dan lokasi.',
    detail:
      'Setiap profil memiliki foto terverifikasi, bio yang ditulis dengan etiket, rating dari klien sebelumnya, dan sertifikasi profesional jika ada.',
    image:
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80&auto=format',
  },
  {
    number: 'III',
    title: 'Pesan & Bayar',
    desc: 'Pilih tanggal, waktu, dan durasi. Pembayaran aman melalui sistem escrow terlindungi.',
    detail:
      'Dana Anda ditahan di escrow hingga sesi selesai. Jika ada masalah, tim dispute kami membantu sepanjang pertemuan — proses diaudit dan terlacak.',
    image:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80&auto=format',
  },
  {
    number: 'IV',
    title: 'Nikmati & Ulasi',
    desc: 'Nikmati pengalaman pendampingan profesional. Berikan ulasan untuk membantu komunitas.',
    detail:
      'Setelah sesi selesai, Anda memberikan rating dan ulasan. Dana dirilis ke companion setelah konfirmasi, melengkapi siklus pertemuan.',
    image:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80&auto=format',
  },
];

const protections = [
  { Icon: ShieldCheck, label: 'Verifikasi KTP & Face-Match', desc: 'Semua pengguna diverifikasi identitasnya sebelum bergabung.' },
  { Icon: Shield, label: 'Escrow Payment', desc: 'Dana dijaga hingga sesi selesai dan disetujui kedua pihak.' },
  { Icon: MapPin, label: 'Live Location Tracking', desc: 'Tracking real-time selama sesi aktif, hanya untuk kedua pihak.' },
  { Icon: Siren, label: 'Tombol SOS Darurat', desc: 'Bantuan cepat dengan eskalasi WhatsApp ke tim admin 24/7.' },
  { Icon: Star, label: 'Rating & Review', desc: 'Sistem penilaian transparan pada sikap, ketepatan, dan profesionalisme.' },
  { Icon: MessagesSquare, label: 'Dukungan 24/7', desc: 'Tim support siap membantu kapan saja lewat in-app chat.' },
];

export default function HowItWorksPage() {
  return (
    <MarketingShell
      mark="Babak Lengkap"
      title="Empat langkah menuju"
      highlight="pertemuan yang pantas diingat"
      description="Dari pendaftaran hingga ulasan — setiap langkah dirancang untuk memberikan keamanan, kenyamanan, dan pengalaman yang terkurasi."
    >
      {/* Steps */}
      <section className="space-y-20">
        {steps.map((step, i) => (
          <article
            key={step.number}
            className={`grid gap-10 lg:grid-cols-2 lg:gap-16 ${
              i < steps.length - 1 ? 'border-b border-dark-700/30 pb-20' : ''
            }`}
          >
            <div
              className={`flex flex-col justify-center ${i % 2 === 1 ? 'lg:order-2' : ''}`}
            >
              <div className="mb-6 flex items-center gap-4">
                <span className="font-display text-7xl font-light text-brand-400/15">
                  {step.number}
                </span>
                <div className="text-rose-300/70">
                  <RoseGlyph className="h-10 w-10" strokeWidth={1.1} />
                </div>
              </div>
              <p className="act-mark">Langkah {step.number}</p>
              <h3 className="mt-3 font-display text-3xl font-medium text-dark-100 sm:text-4xl">
                {step.title}
              </h3>
              <div className="gold-rose-line mt-5 w-16" />
              <p className="mt-6 font-serif text-lg leading-relaxed text-dark-200">
                {step.desc}
              </p>
              <p className="mt-4 font-serif text-[15px] leading-relaxed text-dark-400">
                {step.detail}
              </p>
            </div>

            <div
              className={`flex items-center justify-center ${
                i % 2 === 1 ? 'lg:order-1' : ''
              }`}
            >
              <div className="relative w-full max-w-md">
                <div className="absolute -inset-3 border border-brand-400/10" />
                <div className="relative aspect-[4/5] overflow-hidden border border-dark-700/40">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <div className="gold-rose-line w-10" />
                    <p className="mt-3 text-[10px] uppercase tracking-widest-2 text-rose-200/80">
                      Langkah {step.number}
                    </p>
                    <p className="mt-1 font-display text-lg font-medium text-white">
                      {step.title}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Protections */}
      <section className="mt-24 border-t border-dark-700/30 pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="act-mark">Duri yang melindungi mawar</p>
          <h2 className="mt-5 font-display text-display-sm font-medium text-dark-100">
            Keamanan di <span className="italic text-gradient-rose-gold">setiap langkah</span>
          </h2>
          <div className="gold-rose-line mx-auto mt-6 w-24" />
          <p className="mx-auto mt-6 max-w-xl font-serif text-lg leading-relaxed text-dark-300">
            Seperti mawar yang berduri untuk menjaga kelopaknya, ARETON membungkus setiap
            pertemuan dengan lapis-lapis proteksi.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {protections.map(({ Icon, label, desc }) => (
            <article
              key={label}
              className="group relative overflow-hidden border border-dark-700/30 bg-dark-800/30 p-7 transition-all duration-500 hover:border-rose-400/25 hover:bg-dark-800/60"
            >
              <div className="absolute inset-0 bg-rose-gold-subtle opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center border border-rose-400/20 bg-dark-900/60 text-rose-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-base font-medium text-dark-100">
                      {label}
                    </h3>
                    <p className="mt-2 font-serif text-[14px] leading-relaxed text-dark-400">
                      {desc}
                    </p>
                  </div>
                </div>
                <div className="gold-line-left mt-5 w-0 transition-all duration-500 group-hover:w-16" />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-24 border-t border-dark-700/30 pt-20 text-center">
        <p className="act-mark">Undangan</p>
        <h2 className="mt-5 font-display text-display-sm font-medium text-dark-100">
          Siap <span className="italic text-gradient-rose-gold">memulai?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg font-serif text-lg leading-relaxed text-dark-300">
          Daftar sekarang dan temukan companion profesional yang sesuai kebutuhan Anda.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Link
            href="/register"
            className="rounded-none bg-brand-400 px-10 py-4 text-[12px] font-bold uppercase tracking-widest-2 text-dark-900 transition-all hover:bg-brand-300"
          >
            Daftar Gratis
          </Link>
          <Link
            href="/escorts"
            className="rounded-none border border-rose-400/40 px-10 py-4 text-[12px] font-medium uppercase tracking-widest-2 text-rose-200 transition-all hover:bg-rose-500/10"
          >
            Jelajahi Companion
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
