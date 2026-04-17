import Link from 'next/link';
import { MarketingShell } from '@/components/layout/marketing-shell';

export default function TermsPage() {
  return (
    <MarketingShell
      mark="Legal"
      title="Syarat &amp;"
      highlight="Ketentuan"
      description="Aturan yang menjaga keindahan platform — disusun agar setiap pertemuan berlangsung dalam rasa hormat dan kepantasan."
    >
      <div className="mx-auto max-w-3xl">
        <p className="text-center font-serif text-sm text-dark-500">
          Terakhir diperbarui: 1 Maret 2026
        </p>
        <div className="gold-rose-line mx-auto mt-4 w-16" />

        <div className="mt-14 space-y-14 text-dark-300">
          <Section num="I" title="Ketentuan Umum">
            <p className="font-serif text-[15px] leading-relaxed">
              Dengan mengakses dan menggunakan ARETON.id, Anda menyetujui dan terikat
              syarat dan ketentuan ini. Platform ini dioperasikan oleh PT ARETON Digital
              Indonesia.
            </p>
            <p className="mt-3 font-serif text-[15px] leading-relaxed">
              ARETON.id adalah marketplace yang menghubungkan klien dengan pendamping
              profesional terverifikasi untuk keperluan bisnis, acara formal, dan kebutuhan
              profesional lainnya.
            </p>
          </Section>

          <Section num="II" title="Definisi">
            <BulletList
              items={[
                'Platform — ARETON.id dan semua layanan terkait.',
                'Klien — pengguna yang mencari dan memesan layanan pendampingan.',
                'Partner / Escort — profesional terverifikasi yang menyediakan layanan pendampingan.',
                'Booking — pemesanan layanan pendampingan melalui platform.',
                'Escrow — sistem penahanan dana oleh platform hingga layanan selesai.',
              ]}
            />
          </Section>

          <Section num="III" title="Kelayakan Pengguna">
            <p className="mb-3 font-serif text-[15px] leading-relaxed">
              Untuk menggunakan platform, Anda harus:
            </p>
            <BulletList
              items={[
                'Berusia minimal 21 tahun.',
                'Memiliki kapasitas hukum untuk mengikat perjanjian.',
                'Memberikan informasi yang benar dan akurat saat registrasi.',
                'Tidak pernah diblokir atau dibatasi aksesnya oleh platform.',
              ]}
            />
          </Section>

          <Section num="IV" title="Registrasi &amp; Akun">
            <p className="font-serif text-[15px] leading-relaxed">
              Anda bertanggung jawab penuh atas keamanan akun Anda, termasuk password dan
              informasi login. Segala aktivitas di akun Anda menjadi tanggung jawab Anda.
            </p>
            <p className="mt-3 font-serif text-[15px] leading-relaxed">
              Kami berhak menangguhkan atau menghapus akun yang melanggar ketentuan ini,
              memberikan informasi palsu, atau terlibat dalam aktivitas ilegal.
            </p>
          </Section>

          <Section num="V" title="Layanan Pendampingan">
            <p className="mb-3 font-serif text-[15px] leading-relaxed">
              ARETON.id menyediakan layanan pendampingan profesional yang meliputi:
            </p>
            <BulletList
              items={[
                'Pendamping meeting dan presentasi bisnis.',
                'Pendamping acara formal (gala dinner, wedding, networking).',
                'Asisten perjalanan bisnis.',
                'Pendamping acara sosial.',
              ]}
            />
            <div className="mt-5 border border-rose-400/25 bg-rose-500/5 p-6">
              <p className="font-serif text-[15px] text-rose-100/90">
                <strong className="text-rose-200">Penting:</strong> ARETON.id hanya
                menyediakan layanan pendampingan profesional. Segala bentuk layanan yang
                melanggar hukum, norma kesusilaan, atau nilai etika profesional dilarang
                keras.
              </p>
            </div>
          </Section>

          <Section num="VI" title="Pembayaran &amp; Escrow">
            <BulletList
              items={[
                'Semua pembayaran dilakukan lewat platform menggunakan sistem escrow.',
                'Dana ditahan oleh platform dan dirilis ke partner setelah layanan selesai.',
                'Platform fee 20% dari total transaksi dikenakan kepada partner.',
                'Metode pembayaran: Virtual Account, E-Wallet, Kartu Kredit/Debit.',
              ]}
            />
          </Section>

          <Section num="VII" title="Kebijakan Pembatalan">
            <div className="overflow-x-auto border border-dark-700/30">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-700/30 bg-dark-800/50">
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest text-rose-200/80">
                      Waktu Pembatalan
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest text-rose-200/80">
                      Biaya
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/30 font-serif text-dark-300">
                  <tr>
                    <td className="px-4 py-3">&gt; 24 jam sebelum jadwal</td>
                    <td className="px-4 py-3 text-emerald-300">Gratis</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">12 – 24 jam</td>
                    <td className="px-4 py-3">25%</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">6 – 12 jam</td>
                    <td className="px-4 py-3">50%</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">1 – 6 jam</td>
                    <td className="px-4 py-3">75%</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">&lt; 1 jam / no-show</td>
                    <td className="px-4 py-3 text-rose-300">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section num="VIII" title="Tier &amp; Rating">
            <p className="mb-5 font-serif text-[15px] leading-relaxed">
              Partner dikelompokkan dalam tier berdasarkan kualifikasi:
            </p>
            <div className="overflow-x-auto border border-dark-700/30">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-700/30 bg-dark-800/50">
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest text-rose-200/80">
                      Tier (Varietas Mawar)
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest text-rose-200/80">
                      Tarif / Jam
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/30 font-serif text-dark-300">
                  <tr><td className="px-4 py-3 text-slate-300">Silver · Tea Rose</td><td className="px-4 py-3">Rp 300K – 500K</td></tr>
                  <tr><td className="px-4 py-3 text-brand-400">Gold · Damask</td><td className="px-4 py-3">Rp 500K – 1 Juta</td></tr>
                  <tr><td className="px-4 py-3 text-rose-200">Platinum · Gallica</td><td className="px-4 py-3">Rp 1 – 2,5 Juta</td></tr>
                  <tr><td className="px-4 py-3 text-rose-300">Diamond · Rose Noir</td><td className="px-4 py-3">Rp 2,5 – 5 Juta+</td></tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section num="IX" title="Hak Kekayaan Intelektual">
            <p className="font-serif text-[15px] leading-relaxed">
              Semua konten di platform, termasuk logo, desain, teks, dan kode sumber,
              adalah milik PT ARETON Digital Indonesia dan dilindungi oleh hukum hak
              kekayaan intelektual Indonesia.
            </p>
          </Section>

          <Section num="X" title="Batasan Tanggung Jawab">
            <p className="font-serif text-[15px] leading-relaxed">
              Platform menyediakan layanan &quot;as is&quot;. Kami tidak bertanggung jawab atas
              kerugian yang timbul dari penggunaan platform, termasuk namun tidak terbatas
              pada kerugian langsung, tidak langsung, insidental, atau konsekuensial.
            </p>
          </Section>

          <Section num="XI" title="Penyelesaian Sengketa">
            <p className="font-serif text-[15px] leading-relaxed">
              Setiap sengketa yang timbul dari penggunaan platform akan diselesaikan secara
              musyawarah. Apabila tidak tercapai kesepakatan, akan diselesaikan melalui
              Badan Arbitrase Nasional Indonesia (BANI) di Jakarta.
            </p>
          </Section>

          <Section num="XII" title="Perubahan Ketentuan">
            <p className="font-serif text-[15px] leading-relaxed">
              Kami berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan
              diberitahukan lewat email atau notifikasi platform. Penggunaan platform
              setelah perubahan dianggap sebagai persetujuan Anda.
            </p>
          </Section>

          <Section num="XIII" title="Kontak">
            <p className="mb-3 font-serif text-[15px] leading-relaxed">
              Untuk pertanyaan terkait syarat dan ketentuan ini, hubungi kami di:
            </p>
            <ul className="space-y-2 font-serif text-[15px]">
              <li>
                Email:{' '}
                <a className="text-rose-200 hover:text-rose-100" href="mailto:legal@areton.id">
                  legal@areton.id
                </a>
              </li>
              <li>Alamat: Jakarta, Indonesia</li>
            </ul>
          </Section>
        </div>

        <div className="mt-20 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Link
            href="/"
            className="text-[11px] uppercase tracking-widest text-dark-500 transition-colors hover:text-rose-200"
          >
            ← Kembali ke Beranda
          </Link>
          <Link
            href="/privacy"
            className="text-[11px] uppercase tracking-widest text-rose-200 transition-colors hover:text-rose-100"
          >
            Kebijakan Privasi →
          </Link>
        </div>
      </div>
    </MarketingShell>
  );
}

function Section({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-4">
        <span className="font-display text-sm font-light text-brand-400/40">{num}.</span>
        <h2 className="font-display text-xl font-medium text-dark-100">{title}</h2>
      </div>
      <div className="gold-rose-line mt-3 w-12" />
      <div className="mt-5">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-6 font-serif text-[15px] text-dark-300 marker:text-rose-400/60">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
