'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MagazineLayout } from '@/components/layout/magazine-layout';

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
      {
        q: 'Apa itu ARETON.id?',
        a: 'ARETON.id adalah platform pendampingan profesional yang menghubungkan klien dengan companion terverifikasi untuk kebutuhan bisnis, acara formal, perjalanan, dan kebutuhan sosial lainnya. Kami hanya menyediakan layanan pendampingan profesional yang sah dan legal.',
      },
      {
        q: 'Siapa saja yang bisa menggunakan ARETON.id?',
        a: 'ARETON.id tersedia untuk semua pengguna berusia minimal 21 tahun yang telah melalui proses verifikasi identitas. Baik sebagai klien yang mencari companion maupun sebagai profesional yang ingin bergabung sebagai partner.',
      },
      {
        q: 'Apakah ARETON.id beroperasi secara legal?',
        a: 'Ya. ARETON.id dioperasikan oleh PT ARETON Digital Indonesia dan beroperasi sesuai hukum Indonesia. Kami hanya menyediakan layanan pendampingan profesional untuk kebutuhan bisnis dan sosial. Segala aktivitas yang melanggar hukum dilarang keras.',
      },
      {
        q: 'Di kota mana saja ARETON.id beroperasi?',
        a: 'Saat ini kami beroperasi di seluruh Indonesia, dengan konsentrasi companion di Jakarta, Surabaya, Bandung, Bali, dan Medan. Companion dengan tier Diamond dan Platinum juga tersedia untuk perjalanan antar kota.',
      },
    ],
  },
  {
    title: 'Pendaftaran & Akun',
    items: [
      {
        q: 'Bagaimana cara mendaftar?',
        a: 'Klik tombol "Register" di halaman utama, isi data diri Anda, dan verifikasi email. Untuk keamanan, Anda juga perlu memverifikasi identitas dengan KTP. Proses keseluruhan memakan waktu kurang dari 5 menit.',
      },
      {
        q: 'Apakah data saya aman?',
        a: 'Absolutely. Kami menggunakan enkripsi AES-256-GCM untuk data sensitif, SSL/TLS untuk semua komunikasi, dan Two-Factor Authentication. Data Anda dilindungi sesuai UU PDP (Undang-Undang Perlindungan Data Pribadi) Indonesia.',
      },
      {
        q: 'Bagaimana cara menjadi companion partner?',
        a: 'Daftar melalui halaman "Jadi Partner", lengkapi profil Anda termasuk foto, bio, keahlian, dan sertifikasi. Tim kami akan melakukan review dan wawancara sebelum menyetujui profil Anda. Proses approval biasanya memakan waktu 2-3 hari kerja.',
      },
      {
        q: 'Apakah saya bisa menghapus akun saya?',
        a: 'Ya. Anda memiliki hak penuh atas data Anda sesuai UU PDP. Hubungi privacy@areton.id untuk mengajukan penghapusan akun. Data akun akan dihapus dalam 30 hari, kecuali data yang wajib dipertahankan untuk keperluan hukum.',
      },
    ],
  },
  {
    title: 'Booking & Pembayaran',
    items: [
      {
        q: 'Bagaimana sistem pembayaran bekerja?',
        a: 'Kami menggunakan sistem escrow—dana Anda ditahan secara aman oleh platform dan baru dirilis ke companion setelah sesi selesai dan dikonfirmasi. Ini melindungi kedua belah pihak.',
      },
      {
        q: 'Metode pembayaran apa yang diterima?',
        a: 'Kami menerima Virtual Account (semua bank besar), e-wallet (GoPay, OVO, Dana, ShopeePay), dan kartu kredit/debit (Visa, Mastercard). Semua transaksi diproses melalui payment gateway berlisensi.',
      },
      {
        q: 'Berapa biaya platform fee?',
        a: 'Platform fee sebesar 20% dikenakan pada companion dari total transaksi. Klien membayar harga yang tertera tanpa biaya tambahan.',
      },
      {
        q: 'Bagaimana kebijakan pembatalan?',
        a: 'Pembatalan lebih dari 24 jam sebelum jadwal: gratis. 12-24 jam: biaya 25%. 6-12 jam: 50%. 1-6 jam: 75%. Kurang dari 1 jam atau no-show: 100%. Kebijakan ini berlaku untuk melindungi waktu companion.',
      },
      {
        q: 'Bagaimana jika terjadi masalah saat sesi?',
        a: 'Kami memiliki sistem dispute resolution. Anda bisa melaporkan masalah melalui aplikasi dan dana escrow akan ditahan hingga masalah diselesaikan. Tim support kami tersedia 24/7 untuk membantu mediasi.',
      },
    ],
  },
  {
    title: 'Keamanan',
    items: [
      {
        q: 'Bagaimana ARETON memastikan keamanan pengguna?',
        a: 'Kami menerapkan multi-layer security: verifikasi KTP & face-match, escrow payment, live location tracking selama sesi, tombol SOS darurat, dan tim safety response 24/7. Setiap companion juga melalui background check.',
      },
      {
        q: 'Apa itu tombol SOS?',
        a: 'Tombol SOS tersedia di aplikasi selama sesi aktif. Ketika ditekan, lokasi Anda langsung dikirim ke tim safety kami dan kontak darurat yang Anda tentukan. Tim kami akan merespons dalam hitungan menit.',
      },
      {
        q: 'Apakah lokasi saya di-tracking?',
        a: 'Location tracking hanya aktif selama sesi booking berlangsung, untuk keamanan Anda. Setelah sesi selesai, data lokasi dihapus secara otomatis. Kami tidak pernah membagikan data lokasi Anda kepada pihak ketiga.',
      },
    ],
  },
  {
    title: 'Untuk Companion',
    items: [
      {
        q: 'Berapa tarif yang bisa saya tentukan?',
        a: 'Tarif ditentukan berdasarkan tier: Silver (Rp 300K-500K/jam), Gold (Rp 500K-1 Juta/jam), Platinum (Rp 1-2.5 Juta/jam), Diamond (Rp 2.5-5 Juta+/jam). Tier Anda ditentukan berdasarkan kualifikasi, pengalaman, dan rating.',
      },
      {
        q: 'Kapan saya menerima pembayaran?',
        a: 'Dana dirilis ke rekening Anda setelah klien mengkonfirmasi sesi selesai, biasanya dalam 1-2 hari kerja. Jika klien tidak mengkonfirmasi dalam 24 jam, dana otomatis dirilis.',
      },
      {
        q: 'Bagaimana cara meningkatkan tier saya?',
        a: 'Tier ditentukan berdasarkan kombinasi: rating rata-rata, jumlah booking selesai, sertifikasi profesional, dan evaluasi tim kami. Konsistensi pelayanan yang baik adalah kunci untuk kenaikan tier.',
      },
    ],
  },
];

function FaqAccordion({ item }: { item: FaqItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-dark-700/20 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full items-start justify-between gap-4 py-6 text-left transition-colors"
      >
        <span className={`font-display text-[15px] font-medium transition-colors sm:text-base ${isOpen ? 'text-brand-400' : 'text-dark-100 group-hover:text-dark-200'}`}>
          {item.q}
        </span>
        <svg
          className={`h-5 w-5 shrink-0 text-dark-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-400' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr] opacity-100 pb-6' : 'grid-rows-[0fr] opacity-0'}`}>
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
    <MagazineLayout breadcrumb="FAQ">
      {/* ── Hero ── */}
      <section className="py-28 sm:py-36">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-8 flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-brand-400/40" />
            <p className="text-[11px] font-medium uppercase tracking-widest-2 text-brand-400">FAQ</p>
            <span className="h-px w-12 bg-brand-400/40" />
          </div>
          <h1 className="font-display text-display-sm font-medium text-dark-100 sm:text-display-lg">
            Pertanyaan yang<br />
            Sering <span className="italic text-brand-400">Ditanyakan</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl font-serif text-lg leading-relaxed text-dark-300">
            Temukan jawaban untuk pertanyaan umum tentang layanan, keamanan, 
            dan kebijakan ARETON.id.
          </p>
        </div>
      </section>

      {/* ── FAQ Content ── */}
      <section className="border-t border-dark-700/30 py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[240px_1fr] lg:gap-16">
            {/* Category nav */}
            <nav className="lg:sticky lg:top-28 lg:self-start">
              <ul className="flex gap-2 overflow-x-auto pb-4 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
                {faqData.map((cat, i) => (
                  <li key={cat.title}>
                    <button
                      onClick={() => setActiveCategory(i)}
                      className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-[13px] transition-all lg:w-full lg:text-left ${
                        activeCategory === i
                          ? 'bg-brand-400/10 font-medium text-brand-400'
                          : 'text-dark-400 hover:text-dark-200'
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
                <h2 className="font-display text-2xl font-medium text-dark-100">
                  {faqData[activeCategory].title}
                </h2>
                <div className="mt-3 h-px w-12 bg-gradient-to-r from-brand-400/50 to-transparent" />
              </div>
              <div>
                {faqData[activeCategory].items.map((item, i) => (
                  <FaqAccordion key={`${activeCategory}-${i}`} item={item} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Still need help? ── */}
      <section className="border-t border-dark-700/30 bg-dark-950/50 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-display-sm font-medium text-dark-100">
            Masih Ada Pertanyaan?
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-serif text-lg text-dark-300 leading-relaxed">
            Tim support kami siap membantu Anda 24/7. Jangan ragu untuk menghubungi kami.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/contact"
              className="rounded-none bg-brand-400 px-10 py-4 text-[12px] font-bold uppercase tracking-widest-2 text-dark-900 transition-all hover:bg-brand-300"
            >
              Hubungi Kami
            </Link>
            <a
              href="mailto:support@areton.id"
              className="rounded-none border border-dark-500/30 px-10 py-4 text-[12px] font-medium uppercase tracking-widest-2 text-dark-200 transition-all hover:border-brand-400/40 hover:text-brand-400"
            >
              support@areton.id
            </a>
          </div>
        </div>
      </section>
    </MagazineLayout>
  );
}
