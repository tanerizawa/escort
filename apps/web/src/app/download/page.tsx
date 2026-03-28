'use client';

import React from 'react';
import { MagazineLayout } from '@/components/layout/magazine-layout';

const APP_VERSION = '1.0.0';
const APK_FILENAME = `areton-v${APP_VERSION}.apk`;
const APK_DOWNLOAD_URL = `/downloads/${APK_FILENAME}`;

const features = [
  {
    icon: '🔍',
    title: 'Cari Pendamping',
    description: 'Browse escort profesional berdasarkan tier, keahlian, dan lokasi',
  },
  {
    icon: '📅',
    title: 'Booking Mudah',
    description: 'Buat booking dengan pilihan layanan, tanggal, dan lokasi yang fleksibel',
  },
  {
    icon: '💬',
    title: 'Chat Real-time',
    description: 'Komunikasi langsung dengan escort melalui chat terenkripsi',
  },
  {
    icon: '💳',
    title: 'Pembayaran Aman',
    description: 'Pembayaran melalui Virtual Account, E-Wallet, QRIS, atau Crypto',
  },
  {
    icon: '📍',
    title: 'GPS Tracking',
    description: 'Tracking lokasi real-time selama booking untuk keamanan',
  },
  {
    icon: '🆘',
    title: 'Tombol SOS',
    description: 'Fitur darurat dengan satu sentuhan — kirim lokasi dan alarm',
  },
];

const installSteps = [
  {
    step: 1,
    title: 'Download APK',
    description: 'Klik tombol download di bawah untuk mengunduh file APK',
  },
  {
    step: 2,
    title: 'Izinkan Instalasi',
    description: 'Buka Settings → Security → aktifkan "Install from Unknown Sources" atau izinkan browser Anda',
  },
  {
    step: 3,
    title: 'Install Aplikasi',
    description: 'Buka file APK yang sudah didownload, lalu klik "Install"',
  },
  {
    step: 4,
    title: 'Buka & Daftar',
    description: 'Buka aplikasi ARETON, daftar akun baru atau login dengan akun yang sudah ada',
  },
];

export default function DownloadPage() {
  return (
    <MagazineLayout>
      <div className="min-h-screen bg-gradient-to-b from-[#0b1120] via-[#111827] to-[#0b1120]">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[500px] h-[500px] bg-[#c9a96e]/10 rounded-full blur-[120px]" />
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            {/* Android icon */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-[#c9a96e]/20 to-[#c9a96e]/5 border border-[#c9a96e]/30 mb-8">
              <svg viewBox="0 0 24 24" className="w-14 h-14 text-[#c9a96e]" fill="currentColor">
                <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-1.44-.59-3.06-.93-4.77-.93s-3.33.34-4.77.93L5.1 5.67c-.18-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85L5.84 9.48C3.06 11.22 1.18 14.18 1 17.6h21.4c-.18-3.42-2.06-6.38-4.8-8.12zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm9.5 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z" />
              </svg>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Download <span className="text-[#c9a96e]">ARETON</span> untuk Android
            </h1>
            <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
              Temukan pendamping profesional tepercaya langsung dari smartphone Anda.
              Booking, chat, dan manage semuanya dalam satu aplikasi.
            </p>

            {/* Download button */}
            <a
              href={APK_DOWNLOAD_URL}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#c9a96e] to-[#b8943f] text-[#0b1120] font-bold text-lg rounded-xl hover:from-[#d4b87a] hover:to-[#c9a96e] transition-all duration-300 shadow-lg shadow-[#c9a96e]/25 hover:shadow-xl hover:shadow-[#c9a96e]/30 hover:-translate-y-0.5"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
              </svg>
              Download APK v{APP_VERSION}
            </a>

            <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Android 8.0+
              </span>
              <span>~50 MB</span>
              <span>v{APP_VERSION}</span>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
              Fitur <span className="text-[#c9a96e]">Lengkap</span> di Genggaman Anda
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 rounded-xl bg-[#131b2e]/80 border border-[#253048] hover:border-[#c9a96e]/30 transition-all duration-300"
                >
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Install Steps */}
        <section className="py-16 px-4 bg-[#131b2e]/50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
              Cara <span className="text-[#c9a96e]">Install</span>
            </h2>
            <div className="space-y-6">
              {installSteps.map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#c9a96e]/20 border border-[#c9a96e]/40 flex items-center justify-center">
                    <span className="text-[#c9a96e] font-bold">{item.step}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-gray-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
              Persyaratan <span className="text-[#c9a96e]">Minimum</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'OS', value: 'Android 8.0 (Oreo) atau lebih baru' },
                { label: 'RAM', value: 'Minimal 2 GB' },
                { label: 'Storage', value: '~100 MB ruang tersedia' },
                { label: 'Koneksi', value: 'Internet (Wi-Fi atau data seluler)' },
                { label: 'GPS', value: 'Dibutuhkan untuk fitur lokasi & SOS' },
                { label: 'Kamera', value: 'Opsional — untuk upload foto profil' },
              ].map((req) => (
                <div
                  key={req.label}
                  className="p-4 rounded-lg bg-[#131b2e]/80 border border-[#253048]"
                >
                  <span className="text-xs uppercase tracking-wider text-[#c9a96e]">{req.label}</span>
                  <p className="text-white mt-1">{req.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 px-4 text-center">
          <a
            href={APK_DOWNLOAD_URL}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#c9a96e] to-[#b8943f] text-[#0b1120] font-bold text-lg rounded-xl hover:from-[#d4b87a] hover:to-[#c9a96e] transition-all duration-300 shadow-lg shadow-[#c9a96e]/25"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
            </svg>
            Download Sekarang
          </a>
          <p className="text-gray-500 text-sm mt-4">
            Gratis • Tanpa iklan • Tanpa biaya langganan
          </p>
        </section>
      </div>
    </MagazineLayout>
  );
}
