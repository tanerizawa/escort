'use client';

import { useState } from 'react';

const EMERGENCY_CONTACTS = [
  { name: 'ARETON.id Support', number: '021-5555-8888', available: '24/7', icon: '🛎️' },
  { name: 'Polisi (Darurat)', number: '110', available: '24/7', icon: '🚔' },
  { name: 'Ambulans', number: '118 / 119', available: '24/7', icon: '🚑' },
  { name: 'Komnas Perempuan', number: '021-3903963', available: 'Senin-Jumat', icon: '👩‍⚖️' },
  { name: 'Hotline Kekerasan', number: '129', available: '24/7', icon: '📞' },
];

const SAFETY_TIPS = [
  {
    category: 'Sebelum Booking',
    icon: '📋',
    tips: [
      'Periksa profil dan rating escort sebelum booking',
      'Baca review dari client lain untuk mendapatkan gambaran',
      'Pilih lokasi meeting di tempat umum yang ramai',
      'Informasikan teman/keluarga tentang rencana Anda',
      'Pastikan handphone terisi penuh sebelum pertemuan',
    ],
  },
  {
    category: 'Selama Pertemuan',
    icon: '🤝',
    tips: [
      'Selalu bertemu di tempat umum terlebih dahulu',
      'Jangan membagikan informasi pribadi seperti alamat rumah',
      'Jaga komunikasi melalui platform ARETON.id',
      'Gunakan fitur GPS tracking selama booking berlangsung',
      'Percaya insting Anda — jika ada yang tidak beres, segera tinggalkan',
      'Jangan menerima minuman dari orang yang tidak dikenal',
    ],
  },
  {
    category: 'Pembayaran & Transaksi',
    icon: '💳',
    tips: [
      'Selalu bayar melalui platform — hindari transfer langsung',
      'Sistem escrow melindungi kedua belah pihak',
      'Simpan bukti pembayaran dari setiap transaksi',
      'Laporkan jika ada permintaan pembayaran di luar platform',
      'Jangan membagikan info kartu kredit / rekening bank',
    ],
  },
  {
    category: 'Keamanan Digital',
    icon: '🔒',
    tips: [
      'Aktifkan autentikasi 2 faktor (2FA) di akun Anda',
      'Gunakan password yang kuat dan unik',
      'Jangan klik link mencurigakan yang dikirim via chat',
      'Laporkan akun atau pesan mencurigakan',
      'Logout dari perangkat yang tidak Anda gunakan',
    ],
  },
];

const PLATFORM_POLICIES = [
  {
    title: 'Kebijakan Zero Tolerance',
    description:
      'ARETON.id memiliki kebijakan zero tolerance terhadap segala bentuk kekerasan, pelecehan, dan perilaku tidak pantas. Pelanggaran akan mengakibatkan pemblokiran permanen.',
  },
  {
    title: 'Verifikasi Identitas',
    description:
      'Semua escort telah melalui proses verifikasi identitas yang ketat termasuk validasi KTP dan screening background check.',
  },
  {
    title: 'Escrow Payment',
    description:
      'Sistem escrow menjamin pembayaran Anda aman. Dana baru dilepaskan ke escort setelah layanan selesai dan Anda melakukan konfirmasi.',
  },
  {
    title: 'Pelaporan Insiden',
    description:
      'Tim keamanan kami memantau semua laporan 24/7. Setiap laporan akan ditindaklanjuti dalam waktu kurang dari 1 jam.',
  },
  {
    title: 'Privasi Data',
    description:
      'Data pribadi Anda dienkripsi dan dilindungi sesuai standar keamanan internasional. Kami tidak pernah membagikan data Anda ke pihak ketiga.',
  },
  {
    title: 'Asuransi Layanan',
    description:
      'Setiap booking dilindungi oleh kebijakan perlindungan platform. Jika terjadi masalah, Anda berhak mendapatkan refund penuh.',
  },
];

export default function SafetyGuidelinesPage() {
  const [activeSection, setActiveSection] = useState<'tips' | 'contacts' | 'policies'>('tips');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
          <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <h1 className="mt-4 text-3xl font-light tracking-wide text-dark-100">
          Panduan Keamanan
        </h1>
        <p className="mt-2 text-dark-400">
          Keamanan Anda adalah prioritas utama kami. Pelajari cara menjaga diri selama menggunakan platform.
        </p>
      </div>

      {/* SOS Banner */}
      <div className="mt-8 rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-500/10 to-red-600/5 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/20">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-medium text-red-300">Dalam Keadaan Darurat?</p>
            <p className="mt-0.5 text-sm text-red-400/80">
              Gunakan tombol SOS di aplikasi selama booking berlangsung. Tim kami akan segera menghubungi Anda
              dan pihak berwajib jika diperlukan.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-8 flex gap-1 rounded-xl bg-dark-800/50 p-1">
        {([
          { key: 'tips', label: 'Tips Keamanan' },
          { key: 'contacts', label: 'Kontak Darurat' },
          { key: 'policies', label: 'Kebijakan Platform' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeSection === tab.key
                ? 'bg-dark-700 text-dark-100 shadow-sm'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-8">
        {/* Safety Tips */}
        {activeSection === 'tips' && (
          <div className="space-y-6">
            {SAFETY_TIPS.map((section) => (
              <div
                key={section.category}
                className="rounded-2xl border border-dark-700/30 bg-dark-800/20 p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{section.icon}</span>
                  <h2 className="text-lg font-medium text-dark-100">{section.category}</h2>
                </div>
                <ul className="mt-4 space-y-3">
                  {section.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm leading-relaxed text-dark-300">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Emergency Contacts */}
        {activeSection === 'contacts' && (
          <div className="space-y-4">
            <p className="text-sm text-dark-400">
              Simpan nomor-nomor penting ini. Dalam keadaan darurat, jangan ragu untuk menghubungi.
            </p>
            {EMERGENCY_CONTACTS.map((contact) => (
              <div
                key={contact.name}
                className="flex items-center justify-between rounded-2xl border border-dark-700/30 bg-dark-800/20 p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-dark-800/50 text-2xl">
                    {contact.icon}
                  </div>
                  <div>
                    <p className="font-medium text-dark-100">{contact.name}</p>
                    <p className="text-sm text-dark-400">{contact.available}</p>
                  </div>
                </div>
                <a
                  href={`tel:${contact.number.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600/10 px-4 py-2.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-600/20"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  {contact.number}
                </a>
              </div>
            ))}

            {/* Additional Support */}
            <div className="mt-6 rounded-2xl border border-brand-400/20 bg-brand-400/5 p-6">
              <h3 className="font-medium text-brand-300">Butuh Bantuan Lainnya?</h3>
              <p className="mt-2 text-sm text-dark-300">
                Tim support kami siap membantu 24/7. Anda juga bisa menghubungi kami melalui:
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border border-dark-700/30 bg-dark-800/30 p-3">
                  <span className="text-lg">📧</span>
                  <div>
                    <p className="text-xs text-dark-500">Email</p>
                    <p className="text-sm text-dark-200">support@areton.id</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-dark-700/30 bg-dark-800/30 p-3">
                  <span className="text-lg">💬</span>
                  <div>
                    <p className="text-xs text-dark-500">WhatsApp</p>
                    <p className="text-sm text-dark-200">+62 812-8888-5555</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Platform Policies */}
        {activeSection === 'policies' && (
          <div className="space-y-4">
            {PLATFORM_POLICIES.map((policy, i) => (
              <div
                key={i}
                className="rounded-2xl border border-dark-700/30 bg-dark-800/20 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-400/10 text-sm font-semibold text-brand-400">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-medium text-dark-100">{policy.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-dark-300">
                      {policy.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-6 rounded-xl border border-dark-700/30 bg-dark-800/30 p-4 text-center">
              <p className="text-sm text-dark-400">
                Dengan menggunakan platform ARETON.id, Anda menyetujui{' '}
                <a href="/terms" className="text-brand-400 hover:underline">Syarat & Ketentuan</a>{' '}
                dan{' '}
                <a href="/privacy" className="text-brand-400 hover:underline">Kebijakan Privasi</a>{' '}
                kami.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
