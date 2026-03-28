'use client';

import Link from 'next/link';
import { MagazineLayout } from '@/components/layout/magazine-layout';

export default function PrivacyPage() {
  return (
    <MagazineLayout breadcrumb="Kebijakan Privasi">
      {/* Hero */}
      <section className="py-28 sm:py-36">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-8 flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-brand-400/40" />
            <p className="text-[11px] font-medium uppercase tracking-widest-2 text-brand-400">Legal</p>
            <span className="h-px w-12 bg-brand-400/40" />
          </div>
          <h1 className="font-display text-display-sm font-medium text-dark-100 sm:text-display-lg">
            Kebijakan Privasi
          </h1>
          <p className="mt-4 font-serif text-lg text-dark-400">Terakhir diperbarui: 1 Maret 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="border-t border-dark-700/30 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="space-y-12 text-dark-300">

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">1. Pendahuluan</h2>
            <p className="font-serif text-[15px] leading-relaxed">
              PT ARETON Digital Indonesia (&quot;Kami&quot;) berkomitmen untuk melindungi privasi Anda.
              Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan,
              menyimpan, dan melindungi informasi pribadi Anda saat menggunakan platform
              ARETON.id (&quot;Platform&quot;).
            </p>
            <p className="font-serif text-[15px] leading-relaxed mt-3">
              Kebijakan ini sesuai dengan Undang-Undang No. 27 Tahun 2022 tentang Perlindungan
              Data Pribadi (UU PDP) Republik Indonesia.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">2. Data yang Kami Kumpulkan</h2>
            <h3 className="font-display text-base font-medium text-dark-200 mt-4 mb-2">2.1 Data Identitas</h3>
            <ul className="list-disc pl-6 space-y-1 font-serif text-[15px]">
              <li>Nama lengkap, email, nomor telepon</li>
              <li>Foto profil</li>
              <li>KTP (untuk verifikasi Partner)</li>
              <li>Sertifikasi profesional (untuk Partner)</li>
            </ul>

            <h3 className="font-display text-base font-medium text-dark-200 mt-6 mb-2">2.2 Data Transaksi</h3>
            <ul className="list-disc pl-6 space-y-1 font-serif text-[15px]">
              <li>Riwayat booking dan pembayaran</li>
              <li>Metode pembayaran yang digunakan</li>
              <li>Invoice dan bukti transaksi</li>
            </ul>

            <h3 className="font-display text-base font-medium text-dark-200 mt-6 mb-2">2.3 Data Teknis</h3>
            <ul className="list-disc pl-6 space-y-1 font-serif text-[15px]">
              <li>Alamat IP, tipe browser, sistem operasi</li>
              <li>Device fingerprint untuk keamanan</li>
              <li>Cookie dan data sesi</li>
            </ul>

            <h3 className="font-display text-base font-medium text-dark-200 mt-6 mb-2">2.4 Data Lokasi</h3>
            <ul className="list-disc pl-6 space-y-1 font-serif text-[15px]">
              <li>Data GPS selama sesi booking aktif (untuk fitur keamanan)</li>
              <li>Data lokasi dihapus otomatis setelah sesi selesai</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">3. Penggunaan Data</h2>
            <p className="font-serif text-[15px] leading-relaxed mb-3">Data Anda digunakan untuk:</p>
            <ul className="list-disc pl-6 space-y-1 font-serif text-[15px]">
              <li>Memproses registrasi dan verifikasi akun</li>
              <li>Mencocokkan klien dengan partner yang sesuai</li>
              <li>Memproses transaksi dan pembayaran</li>
              <li>Menyediakan fitur chat dan notifikasi</li>
              <li>Menjamin keamanan melalui fitur SOS dan tracking</li>
              <li>Meningkatkan layanan melalui analitik agregat</li>
              <li>Memenuhi kewajiban hukum dan regulasi</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">4. Perlindungan Data</h2>
            <p className="font-serif text-[15px] leading-relaxed mb-4">Kami menerapkan langkah-langkah keamanan berikut:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { title: 'Enkripsi AES-256-GCM', desc: 'Data sensitif dienkripsi at-rest' },
                { title: 'SSL/TLS', desc: 'Semua komunikasi dienkripsi in-transit' },
                { title: 'Two-Factor Auth', desc: 'TOTP + backup codes tersedia' },
                { title: 'Device Fingerprint', desc: 'Deteksi login dari perangkat baru' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-dark-700/20 bg-dark-800/30 p-4">
                  <span className="font-display text-sm font-medium text-dark-100">{item.title}</span>
                  <p className="mt-1 font-serif text-[13px] text-dark-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">5. Berbagi Data</h2>
            <p className="font-serif text-[15px] leading-relaxed mb-3">Kami <strong className="text-dark-100">tidak menjual</strong> data Anda kepada pihak ketiga. Data hanya dibagikan dalam kondisi:</p>
            <ul className="list-disc pl-6 space-y-2 font-serif text-[15px]">
              <li><strong className="text-dark-100">Antar pengguna:</strong> Info profil dasar dibagikan antara klien dan partner saat booking.</li>
              <li><strong className="text-dark-100">Payment gateway:</strong> Data pembayaran diproses oleh penyedia layanan pembayaran resmi.</li>
              <li><strong className="text-dark-100">Hukum:</strong> Jika diwajibkan oleh hukum, putusan pengadilan, atau otoritas berwenang.</li>
              <li><strong className="text-dark-100">Keamanan:</strong> Untuk mencegah penipuan atau ancaman keamanan.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">6. Hak Anda</h2>
            <p className="font-serif text-[15px] leading-relaxed mb-3">Sesuai UU PDP, Anda memiliki hak untuk:</p>
            <ul className="list-disc pl-6 space-y-2 font-serif text-[15px]">
              <li><strong className="text-dark-100">Akses</strong> — Melihat data pribadi yang kami simpan</li>
              <li><strong className="text-dark-100">Koreksi</strong> — Memperbarui data yang tidak akurat</li>
              <li><strong className="text-dark-100">Penghapusan</strong> — Meminta penghapusan data (dengan batasan hukum)</li>
              <li><strong className="text-dark-100">Portabilitas</strong> — Mendapatkan salinan data Anda</li>
              <li><strong className="text-dark-100">Keberatan</strong> — Menolak pemrosesan data untuk tujuan tertentu</li>
              <li><strong className="text-dark-100">Penarikan</strong> — Menarik persetujuan pemrosesan data</li>
            </ul>
            <p className="font-serif text-[15px] leading-relaxed mt-3">
              Untuk menggunakan hak-hak ini, hubungi kami di <span className="text-brand-400">privacy@areton.id</span>.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">7. Retensi Data</h2>
            <ul className="list-disc pl-6 space-y-2 font-serif text-[15px]">
              <li><strong className="text-dark-100">Data akun:</strong> Selama akun aktif + 30 hari setelah penghapusan</li>
              <li><strong className="text-dark-100">Data transaksi:</strong> 5 tahun (kewajiban perpajakan)</li>
              <li><strong className="text-dark-100">Data lokasi:</strong> Dihapus otomatis setelah sesi booking selesai</li>
              <li><strong className="text-dark-100">Chat:</strong> 1 tahun setelah booking selesai</li>
              <li><strong className="text-dark-100">Audit log:</strong> 2 tahun</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">8. Cookie</h2>
            <p className="font-serif text-[15px] leading-relaxed mb-3">Platform menggunakan cookie untuk:</p>
            <ul className="list-disc pl-6 space-y-2 font-serif text-[15px]">
              <li><strong className="text-dark-100">Esensial:</strong> Autentikasi sesi, keamanan CSRF</li>
              <li><strong className="text-dark-100">Preferensi:</strong> Bahasa, tema tampilan</li>
              <li><strong className="text-dark-100">Analitik:</strong> Penggunaan Platform (agregat, anonim)</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">9. Anak di Bawah Umur</h2>
            <p className="font-serif text-[15px] leading-relaxed">
              Platform tidak ditujukan untuk pengguna di bawah 21 tahun. Kami tidak secara sengaja
              mengumpulkan data dari anak di bawah umur. Jika kami mengetahui adanya data anak
              di bawah umur, kami akan segera menghapusnya.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">10. Perubahan Kebijakan</h2>
            <p className="font-serif text-[15px] leading-relaxed">
              Kami dapat memperbarui kebijakan ini sewaktu-waktu. Perubahan material akan
              diberitahukan melalui email atau notifikasi Platform minimal 30 hari sebelum berlaku.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">11. Kontak</h2>
            <p className="font-serif text-[15px] leading-relaxed mb-3">
              Untuk pertanyaan terkait privasi data Anda:
            </p>
            <ul className="list-none space-y-2 font-serif text-[15px]">
              <li>Data Protection Officer: <span className="text-brand-400">privacy@areton.id</span></li>
              <li>Email umum: <span className="text-brand-400">support@areton.id</span></li>
              <li>Alamat: Jakarta, Indonesia</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <Link href="/" className="text-[11px] uppercase tracking-widest text-dark-500 hover:text-brand-400 transition-colors">
            &larr; Kembali ke Beranda
          </Link>
          <Link href="/terms" className="text-[11px] uppercase tracking-widest text-brand-400 hover:text-brand-300 transition-colors">
            Syarat &amp; Ketentuan &rarr;
          </Link>
        </div>
      </div>
      </section>
    </MagazineLayout>
  );
}
