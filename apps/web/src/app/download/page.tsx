import { MarketingShell } from '@/components/layout/marketing-shell';
import { RoseGlyph } from '@/components/brand/rose-glyph';
import {
  Download,
  Search,
  CalendarClock,
  MessageCircle,
  CreditCard,
  MapPin,
  Siren,
} from 'lucide-react';

const APP_VERSION = '1.0.0';
const APK_FILENAME = `areton-v${APP_VERSION}.apk`;
const APK_DOWNLOAD_URL = `/downloads/${APK_FILENAME}`;

const features = [
  { Icon: Search, title: 'Cari Pendamping', description: 'Browse companion profesional berdasarkan tier, keahlian, dan lokasi.' },
  { Icon: CalendarClock, title: 'Booking Mudah', description: 'Pesan dengan pilihan layanan, tanggal, dan lokasi yang fleksibel.' },
  { Icon: MessageCircle, title: 'Chat Real-time', description: 'Komunikasi langsung dengan companion melalui chat terenkripsi.' },
  { Icon: CreditCard, title: 'Pembayaran Aman', description: 'Pembayaran melalui Virtual Account, E-Wallet, QRIS, atau Crypto.' },
  { Icon: MapPin, title: 'GPS Tracking', description: 'Tracking lokasi real-time selama booking — khusus untuk kedua pihak.' },
  { Icon: Siren, title: 'Tombol SOS', description: 'Fitur darurat dengan satu sentuhan — kirim lokasi dan alarm ke admin.' },
];

const installSteps = [
  { step: 'I', title: 'Unduh APK', description: 'Klik tombol unduh di bawah untuk mengunduh file APK resmi.' },
  { step: 'II', title: 'Izinkan Instalasi', description: 'Settings → Security → aktifkan "Install from Unknown Sources" atau izinkan browser Anda.' },
  { step: 'III', title: 'Install Aplikasi', description: 'Buka file APK yang sudah diunduh, lalu klik "Install".' },
  { step: 'IV', title: 'Buka & Masuk', description: 'Buka aplikasi ARETON, daftar akun baru atau masuk dengan akun yang sudah ada.' },
];

const requirements = [
  { label: 'OS', value: 'Android 8.0 (Oreo) atau lebih baru' },
  { label: 'RAM', value: 'Minimal 2 GB' },
  { label: 'Storage', value: '~100 MB ruang tersedia' },
  { label: 'Koneksi', value: 'Internet (Wi-Fi atau data seluler)' },
  { label: 'GPS', value: 'Dibutuhkan untuk fitur lokasi & SOS' },
  { label: 'Kamera', value: 'Opsional — untuk upload foto profil' },
];

export default function DownloadPage() {
  return (
    <MarketingShell
      mark="ARETON untuk Android"
      title="Dunia ARETON,"
      highlight="dalam genggaman Anda"
      description="Temukan companion profesional terkurasi langsung dari smartphone Anda — pesan, chat, dan atur setiap pertemuan dalam satu aplikasi."
      actions={
        <a
          href={APK_DOWNLOAD_URL}
          className="inline-flex items-center gap-3 bg-brand-400 px-8 py-4 text-[12px] font-bold uppercase tracking-widest-2 text-dark-900 transition-all hover:bg-brand-300"
        >
          <Download className="h-4 w-4" />
          Unduh APK v{APP_VERSION}
        </a>
      }
    >
      <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] uppercase tracking-widest-2 text-dark-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Android 8.0+
        </span>
        <span>~50 MB</span>
        <span>v{APP_VERSION}</span>
      </div>

      {/* Features */}
      <section className="mt-24">
        <div className="text-center">
          <p className="act-mark">Repertoar Mobile</p>
          <h2 className="mt-5 font-display text-display-sm font-medium text-dark-100">
            Fitur <span className="italic text-gradient-rose-gold">lengkap</span> di ponsel Anda
          </h2>
          <div className="gold-rose-line mx-auto mt-6 w-24" />
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ Icon, title, description }) => (
            <article
              key={title}
              className="group relative overflow-hidden border border-dark-700/30 bg-dark-800/30 p-7 transition-all duration-500 hover:border-rose-400/25 hover:bg-dark-800/60"
            >
              <div className="absolute inset-0 bg-rose-gold-subtle opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center border border-rose-400/20 text-rose-300">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-5 font-display text-lg font-medium text-dark-100">{title}</h3>
                <div className="gold-line-left mt-3 w-10" />
                <p className="mt-4 font-serif text-[15px] leading-relaxed text-dark-400">
                  {description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Install steps */}
      <section className="mt-24 border-t border-dark-700/30 pt-20">
        <div className="text-center">
          <p className="act-mark">Cara Install</p>
          <h2 className="mt-5 font-display text-display-sm font-medium text-dark-100">
            Empat <span className="italic text-gradient-rose-gold">langkah singkat</span>
          </h2>
          <div className="gold-rose-line mx-auto mt-6 w-24" />
        </div>

        <div className="mx-auto mt-14 max-w-2xl space-y-6">
          {installSteps.map((item) => (
            <div
              key={item.step}
              className="flex gap-5 border border-dark-700/30 bg-dark-800/30 p-6"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-rose-400/25 font-display text-base text-rose-200">
                {item.step}
              </div>
              <div>
                <h3 className="font-display text-lg font-medium text-dark-100">{item.title}</h3>
                <div className="gold-line-left mt-2 w-8" />
                <p className="mt-3 font-serif text-[15px] leading-relaxed text-dark-400">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Requirements */}
      <section className="mt-24 border-t border-dark-700/30 pt-20">
        <div className="text-center">
          <p className="act-mark">Persyaratan Minimum</p>
          <h2 className="mt-5 font-display text-display-sm font-medium text-dark-100">
            Agar ponsel Anda <span className="italic text-gradient-rose-gold">siap menerima</span>
          </h2>
          <div className="gold-rose-line mx-auto mt-6 w-24" />
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {requirements.map((req) => (
            <div
              key={req.label}
              className="border border-dark-700/30 bg-dark-800/30 p-5"
            >
              <span className="text-[11px] uppercase tracking-widest-2 text-rose-200/80">
                {req.label}
              </span>
              <p className="mt-2 font-serif text-base text-dark-100">{req.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mt-24 border-t border-dark-700/30 pt-20 text-center">
        <div className="mx-auto mb-8 text-rose-300/80">
          <RoseGlyph className="mx-auto h-12 w-12" strokeWidth={1.1} />
        </div>
        <a
          href={APK_DOWNLOAD_URL}
          className="inline-flex items-center gap-3 bg-brand-400 px-10 py-4 text-[12px] font-bold uppercase tracking-widest-2 text-dark-900 transition-all hover:bg-brand-300"
        >
          <Download className="h-4 w-4" />
          Unduh Sekarang
        </a>
        <p className="mt-5 text-[11px] uppercase tracking-widest-2 text-dark-500">
          Gratis · Tanpa iklan · Tanpa biaya langganan
        </p>
      </section>
    </MarketingShell>
  );
}
