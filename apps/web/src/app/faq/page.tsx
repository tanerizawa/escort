'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MarketingShell } from '@/components/layout/marketing-shell';
import { RoseGlyph } from '@/components/brand/rose-glyph';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  title: string;
  items: FaqItem[];
}

const faqData: FaqCategory[] = [
  {
    title: 'Umum',
    items: [
      { q: 'Apa itu ARETON.id?', a: 'ARETON.id adalah platform pendampingan profesional yang menghubungkan klien dengan companion terverifikasi untuk kebutuhan bisnis, acara formal, perjalanan, dan kebutuhan sosial lainnya. Kami hanya menyediakan layanan pendampingan profesional yang sah dan legal.' },
      { q: 'Siapa saja yang bisa menggunakan ARETON.id?', a: 'ARETON.id tersedia untuk semua pengguna berusia minimal 21 tahun yang telah melalui proses verifikasi identitas — baik sebagai klien yang mencari companion maupun sebagai profesional yang ingin bergabung sebagai partner.' },
      { q: 'Apakah ARETON.id beroperasi secara legal?', a: 'Ya. ARETON.id dioperasikan oleh PT ARETON Digital Indonesia sesuai hukum Indonesia. Kami hanya menyediakan layanan pendampingan profesional untuk kebutuhan bisnis dan sosial. Segala aktivitas yang melanggar hukum dilarang keras.' },
      { q: 'Di kota mana saja ARETON.id beroperasi?', a: 'Saat ini kami beroperasi di seluruh Indonesia, dengan konsentrasi companion di Jakarta, Surabaya, Bandung, Bali, dan Medan. Companion tier Diamond dan Platinum juga tersedia untuk perjalanan antar kota.' },
    ],
  },
  {
    title: 'Pendaftaran & Akun',
    items: [
      { q: 'Bagaimana cara mendaftar?', a: 'Klik tombol "Daftar" di halaman utama, isi data diri Anda, dan verifikasi email. Untuk keamanan, Anda juga perlu memverifikasi identitas dengan KTP. Proses keseluruhan memakan waktu kurang dari 5 menit.' },
      { q: 'Apakah data saya aman?', a: 'Kami menggunakan enkripsi AES-256-GCM untuk data sensitif, TLS untuk semua komunikasi, dan two-factor authentication. Data Anda dilindungi sesuai UU PDP Indonesia.' },
      { q: 'Bagaimana cara menjadi companion partner?', a: 'Daftar lewat portal "Masuk lewat Portal Partner", lengkapi profil Anda termasuk foto, bio, keahlian, dan sertifikasi. Tim kami me-review dan mewawancarai sebelum menyetujui profil. Proses approval biasanya 2–3 hari kerja.' },
      { q: 'Apakah saya bisa menghapus akun saya?', a: 'Ya. Anda memiliki hak penuh atas data Anda sesuai UU PDP. Hubungi privacy@areton.id untuk mengajukan penghapusan. Data dihapus dalam 30 hari kecuali yang wajib dipertahankan untuk keperluan hukum.' },
    ],
  },
  {
    title: 'Booking & Pembayaran',
    items: [
      { q: 'Bagaimana sistem pembayaran bekerja?', a: 'Kami menggunakan sistem escrow — dana Anda ditahan secara aman oleh platform dan baru dirilis ke companion setelah sesi selesai dan dikonfirmasi. Ini melindungi kedua belah pihak.' },
      { q: 'Metode pembayaran apa yang diterima?', a: 'Virtual Account (semua bank besar), e-wallet (GoPay, OVO, Dana, ShopeePay), dan kartu kredit/debit (Visa, Mastercard). Semua transaksi diproses melalui payment gateway berlisensi.' },
      { q: 'Berapa biaya platform fee?', a: 'Platform fee sebesar 20% dikenakan pada companion dari total transaksi. Klien membayar harga yang tertera tanpa biaya tambahan.' },
      { q: 'Bagaimana kebijakan pembatalan?', a: 'Lebih dari 24 jam sebelum jadwal: gratis. 12–24 jam: 25%. 6–12 jam: 50%. 1–6 jam: 75%. Kurang dari 1 jam / no-show: 100%. Kebijakan ini menjaga waktu companion.' },
      { q: 'Bagaimana jika terjadi masalah saat sesi?', a: 'Kami memiliki sistem dispute resolution. Laporkan masalah lewat aplikasi dan dana escrow akan ditahan hingga diselesaikan. Tim support kami tersedia 24/7.' },
    ],
  },
  {
    title: 'Keamanan',
    items: [
      { q: 'Bagaimana ARETON memastikan keamanan pengguna?', a: 'Verifikasi KTP + face-match, escrow payment, live location tracking selama sesi, tombol SOS darurat, dan tim safety response 24/7. Setiap companion juga melalui background check.' },
      { q: 'Apa itu tombol SOS?', a: 'Tombol SOS tersedia di aplikasi selama sesi aktif. Ketika ditekan, lokasi Anda dikirim ke tim safety dan kontak darurat. Tim merespons dalam hitungan menit, termasuk eskalasi WhatsApp ke admin.' },
      { q: 'Apakah lokasi saya di-tracking?', a: 'Location tracking hanya aktif selama sesi booking, untuk keamanan Anda. Setelah sesi selesai, data lokasi dihapus otomatis. Kami tidak pernah membagikan data lokasi ke pihak ketiga.' },
    ],
  },
  {
    title: 'Untuk Companion',
    items: [
      { q: 'Berapa tarif yang bisa saya tentukan?', a: 'Tarif ditentukan berdasarkan tier: Silver (Rp 300K–500K/jam), Gold (Rp 500K–1Jt/jam), Platinum (Rp 1–2,5Jt/jam), Diamond (Rp 2,5–5Jt+/jam). Tier ditentukan berdasarkan kualifikasi, pengalaman, dan rating.' },
      { q: 'Kapan saya menerima pembayaran?', a: 'Dana dirilis ke rekening setelah klien mengkonfirmasi sesi selesai, biasanya 1–2 hari kerja. Jika klien tidak mengkonfirmasi dalam 24 jam, dana otomatis dirilis.' },
      { q: 'Bagaimana cara meningkatkan tier saya?', a: 'Kombinasi rating rata-rata, jumlah booking selesai, sertifikasi profesional, dan evaluasi tim kami. Konsistensi pelayanan yang baik adalah kunci kenaikan tier.' },
    ],
  },
];

function FaqAccordion({ item }: { item: FaqItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-dark-700/30 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full items-start justify-between gap-4 py-6 text-left transition-colors"
      >
        <span
          className={`font-display text-[15px] font-medium transition-colors sm:text-base ${
            isOpen ? 'text-rose-200' : 'text-dark-100 group-hover:text-dark-200'
          }`}
        >
          {item.q}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-dark-500 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-rose-300' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`grid transition-all duration-300 ${
          isOpen ? 'grid-rows-[1fr] opacity-100 pb-6' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="font-serif text-[15px] leading-relaxed text-dark-400">{item.a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <MarketingShell
      mark="Pertanyaan Tersering"
      title="Jawaban yang"
      highlight="dijaga sub rosa"
      description="Jawaban untuk pertanyaan umum tentang layanan, keamanan, dan kebijakan ARETON.id."
    >
      <div className="grid gap-12 lg:grid-cols-[240px_1fr] lg:gap-16">
        {/* Category nav */}
        <nav className="lg:sticky lg:top-28 lg:self-start">
          <div className="mb-6 flex items-center gap-3">
            <RoseGlyph className="h-5 w-5 text-rose-300/70" strokeWidth={1.1} />
            <p className="act-mark">Kategori</p>
          </div>
          <ul className="flex gap-2 overflow-x-auto pb-4 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
            {faqData.map((cat, i) => (
              <li key={cat.title}>
                <button
                  onClick={() => setActiveCategory(i)}
                  className={`whitespace-nowrap border px-4 py-2.5 text-[13px] transition-all lg:w-full lg:text-left ${
                    activeCategory === i
                      ? 'border-rose-400/30 bg-rose-500/10 text-rose-200'
                      : 'border-transparent text-dark-400 hover:border-dark-700/40 hover:text-dark-200'
                  }`}
                >
                  {cat.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* FAQ items */}
        <div>
          <div className="mb-8">
            <p className="act-mark !text-rose-300/80">Babak {activeCategory + 1}</p>
            <h2 className="mt-3 font-display text-3xl font-medium text-dark-100">
              {faqData[activeCategory].title}
            </h2>
            <div className="gold-rose-line mt-4 w-16" />
          </div>
          <div>
            {faqData[activeCategory].items.map((item, i) => (
              <FaqAccordion key={`${activeCategory}-${i}`} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="mt-24 border-t border-dark-700/30 pt-20 text-center">
        <p className="act-mark">Masih ragu?</p>
        <h2 className="mt-5 font-display text-display-sm font-medium text-dark-100">
          Tanyakan kepada <span className="italic text-gradient-rose-gold">kami</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg font-serif text-lg leading-relaxed text-dark-300">
          Tim support kami siap membantu 24/7 — jangan ragu untuk menghubungi.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Link
            href="/contact"
            className="rounded-none bg-brand-400 px-10 py-4 text-[12px] font-bold uppercase tracking-widest-2 text-dark-900 transition-all hover:bg-brand-300"
          >
            Hubungi Kami
          </Link>
          <a
            href="mailto:support@areton.id"
            className="rounded-none border border-rose-400/40 px-10 py-4 text-[12px] font-medium uppercase tracking-widest-2 text-rose-200 transition-all hover:bg-rose-500/10"
          >
            support@areton.id
          </a>
        </div>
      </section>
    </MarketingShell>
  );
}
