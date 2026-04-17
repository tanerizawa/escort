import Link from 'next/link';
import { MarketingShell } from '@/components/layout/marketing-shell';
import { RoseGlyph } from '@/components/brand/rose-glyph';
import {
  ShieldCheck,
  Lock,
  MapPin,
  Siren,
  Star,
  KeyRound,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';

const safetyFeatures = [
  { Icon: ShieldCheck, title: 'Verifikasi Identitas Multi-Layer', desc: 'Setiap pengguna melalui KTP + face-match; companion juga melalui wawancara personal dan background check sebelum disetujui.' },
  { Icon: Lock, title: 'Escrow Payment', desc: 'Dana klien ditahan platform dan baru dirilis ke companion setelah sesi selesai dan dikonfirmasi — perlindungan penuh untuk kedua pihak.' },
  { Icon: MapPin, title: 'Live Location Tracking', desc: 'Selama sesi aktif, lokasi di-track real-time. Data dihapus otomatis begitu sesi selesai — privasi Anda terjaga.' },
  { Icon: Siren, title: 'Tombol SOS Darurat', desc: 'Satu ketukan mengirim lokasi dan alert ke tim safety dan kontak darurat Anda, dengan eskalasi WhatsApp otomatis ke admin.' },
  { Icon: Star, title: 'Rating & Review Terverifikasi', desc: 'Hanya pengguna yang menyelesaikan booking yang bisa memberi rating. Transparansi memastikan kualitas companion.' },
  { Icon: KeyRound, title: 'Enkripsi Data AES-256-GCM', desc: 'Data sensitif dienkripsi dengan standar kelas militer. Komunikasi TLS, 2FA tersedia sebagai lapisan tambahan.' },
];

const guidelines = [
  {
    title: 'Untuk Klien',
    items: [
      'Jaga privasi companion — jangan bagikan informasi personal mereka.',
      'Hormati batasan profesional yang telah disepakati.',
      'Gunakan fitur chat platform untuk komunikasi.',
      'Laporkan segala bentuk pelanggaran lewat fitur Report.',
      'Pastikan pertemuan di lokasi yang aman dan publik.',
      'Jangan meminta layanan di luar lingkup pendampingan profesional.',
    ],
  },
  {
    title: 'Untuk Companion',
    items: [
      'Selalu aktifkan location tracking selama sesi.',
      'Set kontak darurat di profil sebelum booking pertama.',
      'Tolak permintaan yang membuat Anda tidak nyaman.',
      'Gunakan tombol SOS jika merasa terancam.',
      'Jangan bagikan informasi personal klien kepada pihak ketiga.',
      'Laporkan perilaku klien yang melanggar ketentuan platform.',
    ],
  },
];

const prohibited = [
  'Meminta atau menawarkan layanan di luar lingkup pendampingan profesional.',
  'Kekerasan verbal maupun fisik dalam bentuk apapun.',
  'Pelecehan seksual, intimidasi, atau perilaku mengancam.',
  'Memberikan informasi identitas palsu atau menipu.',
  'Membagikan data personal pengguna lain tanpa izin.',
  'Melakukan transaksi di luar platform untuk menghindari escrow.',
  'Diskriminasi berdasarkan ras, agama, gender, atau orientasi seksual.',
];

export default function SafetyPage() {
  return (
    <MarketingShell
      mark="Safety Center"
      title="Keamanan adalah"
      highlight="prioritas utama"
      description="Seperti duri pada mawar, setiap fitur ARETON dirancang untuk melindungi — tanpa menghalangi keindahan pertemuan."
    >
      {/* Emergency notice */}
      <section className="mb-20 border border-rose-400/25 bg-rose-500/5 p-6 lg:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-rose-400/30 text-rose-200">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <p className="act-mark !text-rose-200">Dalam situasi darurat</p>
            <p className="mt-2 font-serif text-sm text-dark-300">
              Jika Anda merasa dalam bahaya, segera hubungi{' '}
              <span className="font-medium text-rose-200">polisi (110)</span> atau gunakan
              tombol SOS di aplikasi. Tim safety akan merespons secepat mungkin.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="text-center">
          <p className="act-mark">Duri yang menjaga mawar</p>
          <h2 className="mt-5 font-display text-display-sm font-medium text-dark-100">
            Perlindungan <span className="italic text-gradient-rose-gold">multi-layer</span>
          </h2>
          <div className="gold-rose-line mx-auto mt-6 w-24" />
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {safetyFeatures.map(({ Icon, title, desc }) => (
            <article
              key={title}
              className="group relative overflow-hidden border border-dark-700/30 bg-dark-800/30 p-7 transition-all duration-500 hover:border-rose-400/25 hover:bg-dark-800/60"
            >
              <div className="absolute inset-0 bg-rose-gold-subtle opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center border border-rose-400/20 text-rose-300">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-5 font-display text-lg font-medium text-dark-100">
                  {title}
                </h3>
                <div className="gold-line-left mt-3 w-10" />
                <p className="mt-4 font-serif text-[15px] leading-relaxed text-dark-400">
                  {desc}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Guidelines */}
      <section className="mt-24 border-t border-dark-700/30 pt-20">
        <div className="text-center">
          <p className="act-mark">Adab Pertemuan</p>
          <h2 className="mt-5 font-display text-display-sm font-medium text-dark-100">
            Tips <span className="italic text-gradient-rose-gold">keamanan</span> untuk
            kedua sisi
          </h2>
          <div className="gold-rose-line mx-auto mt-6 w-24" />
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2">
          {guidelines.map((guide) => (
            <div
              key={guide.title}
              className="border border-dark-700/30 bg-dark-800/30 p-8"
            >
              <div className="flex items-center gap-3 text-rose-300/80">
                <RoseGlyph className="h-6 w-6" strokeWidth={1.1} />
                <p className="act-mark !text-rose-200">{guide.title}</p>
              </div>
              <div className="gold-rose-line mt-4 w-16" />
              <ul className="mt-6 space-y-4">
                {guide.items.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-rose-300/80" />
                    <span className="font-serif text-[15px] leading-relaxed text-dark-300">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Prohibited */}
      <section className="mt-24 border-t border-dark-700/30 pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="act-mark">Zero Tolerance</p>
          <h2 className="mt-5 font-display text-display-sm font-medium text-dark-100">
            Larangan &amp; <span className="italic text-gradient-rose-gold">pelanggaran</span>
          </h2>
          <div className="gold-rose-line mx-auto mt-6 w-24" />
        </div>

        <div className="mt-12 border border-rose-400/25 bg-rose-500/5 p-8 sm:p-10">
          <p className="font-serif text-[15px] leading-relaxed text-dark-300">
            ARETON memiliki{' '}
            <span className="font-medium text-rose-200">kebijakan zero-tolerance</span>{' '}
            terhadap pelanggaran berikut. Akun pelanggar akan langsung diblokir permanen.
          </p>
          <ul className="mt-6 space-y-3">
            {prohibited.map((item) => (
              <li key={item} className="flex gap-3">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-300/80" />
                <span className="font-serif text-[15px] leading-relaxed text-dark-300">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Report CTA */}
      <section className="mt-24 border-t border-dark-700/30 pt-20 text-center">
        <p className="act-mark">Laporkan Pelanggaran</p>
        <h2 className="mt-5 font-display text-display-sm font-medium text-dark-100">
          Kami menjaga <span className="italic text-gradient-rose-gold">kerahasiaan pelapor</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl font-serif text-lg leading-relaxed text-dark-300">
          Jika Anda menyaksikan atau mengalami pelanggaran, jangan ragu untuk melapor.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Link
            href="/user/report"
            className="rounded-none bg-brand-400 px-10 py-4 text-[12px] font-bold uppercase tracking-widest-2 text-dark-900 transition-all hover:bg-brand-300"
          >
            Buat Laporan
          </Link>
          <a
            href="mailto:safety@areton.id"
            className="rounded-none border border-rose-400/40 px-10 py-4 text-[12px] font-medium uppercase tracking-widest-2 text-rose-200 transition-all hover:bg-rose-500/10"
          >
            safety@areton.id
          </a>
        </div>
      </section>
    </MarketingShell>
  );
}
