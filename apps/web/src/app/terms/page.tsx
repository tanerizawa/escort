'use client';

import Link from 'next/link';
import { MagazineLayout } from '@/components/layout/magazine-layout';

export default function TermsPage() {
  return (
    <MagazineLayout breadcrumb="Syarat & Ketentuan">
      {/* Hero */}
      <section className="py-28 sm:py-36">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-8 flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-brand-400/40" />
            <p className="text-[11px] font-medium uppercase tracking-widest-2 text-brand-400">Legal</p>
            <span className="h-px w-12 bg-brand-400/40" />
          </div>
          <h1 className="font-display text-display-sm font-medium text-dark-100 sm:text-display-lg">
            Syarat &amp; Ketentuan
          </h1>
          <p className="mt-4 font-serif text-lg text-dark-400">Terakhir diperbarui: 1 Maret 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="border-t border-dark-700/30 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="space-y-12 text-dark-300">

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">1. Ketentuan Umum</h2>
            <p className="font-serif text-[15px] leading-relaxed">
              Dengan mengakses dan menggunakan platform ARETON.id (&quot;Platform&quot;), Anda menyetujui dan terikat
              oleh syarat dan ketentuan ini. Platform ini dioperasikan oleh PT ARETON Digital Indonesia
              (&quot;Kami&quot;, &quot;Perusahaan&quot;).
            </p>
            <p className="font-serif text-[15px] leading-relaxed mt-3">
              ARETON.id adalah marketplace yang menghubungkan klien dengan pendamping profesional
              terverifikasi untuk keperluan bisnis, acara formal, dan kebutuhan profesional lainnya.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">2. Definisi</h2>
            <ul className="list-disc pl-6 space-y-2 font-serif text-[15px]">
              <li><strong className="text-dark-100">Platform</strong> — Situs web ARETON.id dan semua layanan terkait.</li>
              <li><strong className="text-dark-100">Klien</strong> — Pengguna yang mencari dan memesan layanan pendampingan.</li>
              <li><strong className="text-dark-100">Partner/Escort</strong> — Profesional terverifikasi yang menyediakan layanan pendampingan.</li>
              <li><strong className="text-dark-100">Booking</strong> — Pemesanan layanan pendampingan melalui Platform.</li>
              <li><strong className="text-dark-100">Escrow</strong> — Sistem penahanan dana oleh Platform hingga layanan selesai.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">3. Kelayakan Pengguna</h2>
            <p className="font-serif text-[15px] leading-relaxed mb-3">Untuk menggunakan Platform, Anda harus:</p>
            <ul className="list-disc pl-6 space-y-1 font-serif text-[15px]">
              <li>Berusia minimal 21 tahun</li>
              <li>Memiliki kapasitas hukum untuk mengikat perjanjian</li>
              <li>Memberikan informasi yang benar dan akurat saat registrasi</li>
              <li>Tidak pernah diblokir atau dibatasi aksesnya oleh Platform</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">4. Registrasi &amp; Akun</h2>
            <p className="font-serif text-[15px] leading-relaxed">
              Anda bertanggung jawab penuh atas keamanan akun Anda, termasuk password dan
              informasi login. Segala aktivitas yang terjadi di akun Anda menjadi tanggung jawab Anda.
            </p>
            <p className="font-serif text-[15px] leading-relaxed mt-3">
              Kami berhak menangguhkan atau menghapus akun yang melanggar ketentuan ini,
              memberikan informasi palsu, atau terlibat dalam aktivitas ilegal.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">5. Layanan Pendampingan</h2>
            <p className="font-serif text-[15px] leading-relaxed mb-3">
              ARETON.id menyediakan layanan pendampingan profesional yang meliputi:
            </p>
            <ul className="list-disc pl-6 space-y-1 font-serif text-[15px]">
              <li>Pendamping meeting dan presentasi bisnis</li>
              <li>Pendamping acara formal (gala dinner, wedding, networking)</li>
              <li>Asisten perjalanan bisnis</li>
              <li>Pendamping acara sosial</li>
            </ul>
            <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-6">
              <p className="font-serif text-[15px] text-amber-200/80">
                <strong className="text-amber-300">Penting:</strong> ARETON.id hanya menyediakan layanan pendampingan profesional.
                Segala bentuk layanan yang melanggar hukum, norma kesusilaan, atau bertentangan dengan
                nilai-nilai etika profesional dilarang keras dan akan dikenakan sanksi tegas.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">6. Pembayaran &amp; Escrow</h2>
            <ul className="list-disc pl-6 space-y-2 font-serif text-[15px]">
              <li>Semua pembayaran dilakukan melalui Platform menggunakan sistem escrow.</li>
              <li>Dana ditahan oleh Platform dan dirilis ke Partner setelah layanan selesai.</li>
              <li>Platform fee sebesar 20% dari total transaksi dikenakan kepada Partner.</li>
              <li>Metode pembayaran: Virtual Account, E-Wallet, Kartu Kredit/Debit.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">7. Kebijakan Pembatalan</h2>
            <div className="overflow-x-auto rounded-2xl border border-dark-700/20">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-700/30 bg-dark-800/30">
                    <th className="py-3 px-4 text-left text-[11px] uppercase tracking-widest text-dark-400">Waktu Pembatalan</th>
                    <th className="py-3 px-4 text-left text-[11px] uppercase tracking-widest text-dark-400">Biaya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/20 font-serif">
                  <tr><td className="py-3 px-4">&gt; 24 jam sebelum jadwal</td><td className="py-3 px-4 text-green-400">Gratis</td></tr>
                  <tr><td className="py-3 px-4">12 – 24 jam</td><td className="py-3 px-4">25%</td></tr>
                  <tr><td className="py-3 px-4">6 – 12 jam</td><td className="py-3 px-4">50%</td></tr>
                  <tr><td className="py-3 px-4">1 – 6 jam</td><td className="py-3 px-4">75%</td></tr>
                  <tr><td className="py-3 px-4">&lt; 1 jam / no-show</td><td className="py-3 px-4 text-red-400">100%</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">8. Tier &amp; Rating</h2>
            <p className="font-serif text-[15px] leading-relaxed mb-4">Partner dikelompokkan dalam tier berdasarkan kualifikasi:</p>
            <div className="overflow-x-auto rounded-2xl border border-dark-700/20">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-700/30 bg-dark-800/30">
                    <th className="py-3 px-4 text-left text-[11px] uppercase tracking-widest text-dark-400">Tier</th>
                    <th className="py-3 px-4 text-left text-[11px] uppercase tracking-widest text-dark-400">Tarif/Jam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/20 font-serif">
                  <tr><td className="py-3 px-4 text-slate-300">Silver</td><td className="py-3 px-4">Rp 300K – 500K</td></tr>
                  <tr><td className="py-3 px-4 text-brand-400">Gold</td><td className="py-3 px-4">Rp 500K – 1 Juta</td></tr>
                  <tr><td className="py-3 px-4 text-violet-300">Platinum</td><td className="py-3 px-4">Rp 1 Juta – 2.5 Juta</td></tr>
                  <tr><td className="py-3 px-4 text-sky-300">Diamond</td><td className="py-3 px-4">Rp 2.5 Juta – 5 Juta+</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">9. Hak Kekayaan Intelektual</h2>
            <p className="font-serif text-[15px] leading-relaxed">
              Semua konten di Platform, termasuk logo, desain, teks, dan kode sumber, adalah milik
              PT ARETON Digital Indonesia dan dilindungi oleh hukum hak kekayaan intelektual Indonesia.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">10. Batasan Tanggung Jawab</h2>
            <p className="font-serif text-[15px] leading-relaxed">
              Platform menyediakan layanan &quot;as is&quot;. Kami tidak bertanggung jawab atas kerugian
              yang timbul dari penggunaan Platform, termasuk namun tidak terbatas pada kerugian
              langsung, tidak langsung, insidental, atau konsekuensial.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">11. Penyelesaian Sengketa</h2>
            <p className="font-serif text-[15px] leading-relaxed">
              Setiap sengketa yang timbul dari penggunaan Platform akan diselesaikan secara
              musyawarah. Apabila tidak tercapai kesepakatan, akan diselesaikan melalui Badan
              Arbitrase Nasional Indonesia (BANI) di Jakarta.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">12. Perubahan Ketentuan</h2>
            <p className="font-serif text-[15px] leading-relaxed">
              Kami berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan
              diberitahukan melalui email atau notifikasi di Platform. Penggunaan Platform setelah
              perubahan dianggap sebagai persetujuan Anda terhadap ketentuan baru.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-medium text-dark-100 mb-4">13. Kontak</h2>
            <p className="font-serif text-[15px] leading-relaxed mb-3">
              Untuk pertanyaan terkait syarat dan ketentuan ini, hubungi kami di:
            </p>
            <ul className="list-none space-y-2 font-serif text-[15px]">
              <li>Email: <span className="text-brand-400">legal@areton.id</span></li>
              <li>Alamat: Jakarta, Indonesia</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <Link href="/" className="text-[11px] uppercase tracking-widest text-dark-500 hover:text-brand-400 transition-colors">
            &larr; Kembali ke Beranda
          </Link>
          <Link href="/privacy" className="text-[11px] uppercase tracking-widest text-brand-400 hover:text-brand-300 transition-colors">
            Kebijakan Privasi &rarr;
          </Link>
        </div>
      </div>
      </section>
    </MagazineLayout>
  );
}
