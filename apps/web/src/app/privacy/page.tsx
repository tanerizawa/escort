import Link from 'next/link';
import { MarketingShell } from '@/components/layout/marketing-shell';

export default function PrivacyPage() {
  return (
    <MarketingShell
      mark="Legal"
      title="Kebijakan"
      highlight="Privasi"
      description="PT ARETON Digital Indonesia menjaga data Anda sub rosa — dalam kepercayaan, dengan sistem enkripsi kelas tinggi, sesuai UU PDP Indonesia."
    >
      <div className="mx-auto max-w-3xl">
        <p className="text-center font-serif text-sm text-dark-500">
          Terakhir diperbarui: 1 Maret 2026
        </p>
        <div className="gold-rose-line mx-auto mt-4 w-16" />

        <div className="mt-14 space-y-14 text-dark-300">
          <Section num="I" title="Pendahuluan">
            <p className="font-serif text-[15px] leading-relaxed">
              PT ARETON Digital Indonesia (&quot;Kami&quot;) berkomitmen melindungi privasi
              Anda. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan,
              menyimpan, dan melindungi informasi pribadi Anda saat menggunakan platform
              ARETON.id.
            </p>
            <p className="mt-3 font-serif text-[15px] leading-relaxed">
              Kebijakan ini sesuai dengan UU No. 27 Tahun 2022 tentang Perlindungan Data
              Pribadi (UU PDP) Republik Indonesia.
            </p>
          </Section>

          <Section num="II" title="Data yang Kami Kumpulkan">
            <SubHeading>2.1 Data Identitas</SubHeading>
            <BulletList
              items={[
                'Nama lengkap, email, nomor telepon',
                'Foto profil',
                'KTP (untuk verifikasi Partner)',
                'Sertifikasi profesional (untuk Partner)',
              ]}
            />
            <SubHeading>2.2 Data Transaksi</SubHeading>
            <BulletList
              items={[
                'Riwayat booking dan pembayaran',
                'Metode pembayaran yang digunakan',
                'Invoice dan bukti transaksi',
              ]}
            />
            <SubHeading>2.3 Data Teknis</SubHeading>
            <BulletList
              items={[
                'Alamat IP, tipe browser, sistem operasi',
                'Device fingerprint untuk keamanan',
                'Cookie dan data sesi',
              ]}
            />
            <SubHeading>2.4 Data Lokasi</SubHeading>
            <BulletList
              items={[
                'Data GPS selama sesi booking aktif (untuk fitur keamanan)',
                'Data lokasi dihapus otomatis setelah sesi selesai',
              ]}
            />
          </Section>

          <Section num="III" title="Penggunaan Data">
            <p className="mb-3 font-serif text-[15px] leading-relaxed">Data Anda digunakan untuk:</p>
            <BulletList
              items={[
                'Memproses registrasi dan verifikasi akun',
                'Mencocokkan klien dengan partner yang sesuai',
                'Memproses transaksi dan pembayaran',
                'Menyediakan fitur chat dan notifikasi',
                'Menjamin keamanan melalui fitur SOS dan tracking',
                'Meningkatkan layanan melalui analitik agregat',
                'Memenuhi kewajiban hukum dan regulasi',
              ]}
            />
          </Section>

          <Section num="IV" title="Perlindungan Data">
            <p className="mb-5 font-serif text-[15px] leading-relaxed">
              Kami menerapkan lapisan keamanan berikut:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { title: 'Enkripsi AES-256-GCM', desc: 'Data sensitif dienkripsi at-rest.' },
                { title: 'TLS pada seluruh transport', desc: 'Komunikasi terenkripsi end-to-end.' },
                { title: 'Two-Factor Auth', desc: 'TOTP + backup codes tersedia.' },
                { title: 'Device Fingerprint', desc: 'Deteksi login dari perangkat baru.' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="border border-dark-700/30 bg-dark-800/40 p-5"
                >
                  <span className="font-display text-sm font-medium text-rose-200">
                    {item.title}
                  </span>
                  <p className="mt-2 font-serif text-[13px] text-dark-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section num="V" title="Berbagi Data">
            <p className="mb-3 font-serif text-[15px] leading-relaxed">
              Kami <strong className="text-dark-100">tidak menjual</strong> data Anda kepada
              pihak ketiga. Data hanya dibagikan dalam kondisi:
            </p>
            <BulletList
              items={[
                'Antar pengguna: info profil dasar dibagikan antara klien dan partner saat booking.',
                'Payment gateway: data pembayaran diproses oleh penyedia resmi.',
                'Hukum: jika diwajibkan hukum, putusan pengadilan, atau otoritas berwenang.',
                'Keamanan: untuk mencegah penipuan atau ancaman keamanan.',
              ]}
            />
          </Section>

          <Section num="VI" title="Hak Anda">
            <p className="mb-3 font-serif text-[15px] leading-relaxed">
              Sesuai UU PDP, Anda berhak untuk:
            </p>
            <BulletList
              items={[
                'Akses — melihat data pribadi yang kami simpan.',
                'Koreksi — memperbarui data yang tidak akurat.',
                'Penghapusan — meminta penghapusan data (dengan batasan hukum).',
                'Portabilitas — mendapatkan salinan data Anda.',
                'Keberatan — menolak pemrosesan data untuk tujuan tertentu.',
                'Penarikan — menarik persetujuan pemrosesan data.',
              ]}
            />
            <p className="mt-3 font-serif text-[15px] leading-relaxed">
              Untuk menggunakan hak-hak ini, hubungi kami di{' '}
              <a
                href="mailto:privacy@areton.id"
                className="text-rose-200 transition-colors hover:text-rose-100"
              >
                privacy@areton.id
              </a>
              .
            </p>
          </Section>

          <Section num="VII" title="Retensi Data">
            <BulletList
              items={[
                'Data akun: selama akun aktif + 30 hari setelah penghapusan.',
                'Data transaksi: 5 tahun (kewajiban perpajakan).',
                'Data lokasi: dihapus otomatis setelah sesi booking selesai.',
                'Chat: 1 tahun setelah booking selesai.',
                'Audit log: 2 tahun.',
              ]}
            />
          </Section>

          <Section num="VIII" title="Cookie">
            <BulletList
              items={[
                'Esensial: autentikasi sesi, keamanan CSRF.',
                'Preferensi: bahasa, tema tampilan.',
                'Analitik: penggunaan platform (agregat, anonim).',
              ]}
            />
          </Section>

          <Section num="IX" title="Anak di Bawah Umur">
            <p className="font-serif text-[15px] leading-relaxed">
              Platform tidak ditujukan untuk pengguna di bawah 21 tahun. Kami tidak secara
              sengaja mengumpulkan data dari anak di bawah umur. Jika kami mengetahui
              adanya data tersebut, kami akan segera menghapusnya.
            </p>
          </Section>

          <Section num="X" title="Perubahan Kebijakan">
            <p className="font-serif text-[15px] leading-relaxed">
              Kami dapat memperbarui kebijakan ini sewaktu-waktu. Perubahan material
              diberitahukan lewat email atau notifikasi platform minimal 30 hari sebelum
              berlaku.
            </p>
          </Section>

          <Section num="XI" title="Kontak">
            <p className="mb-3 font-serif text-[15px] leading-relaxed">
              Untuk pertanyaan terkait privasi data Anda:
            </p>
            <ul className="space-y-2 font-serif text-[15px]">
              <li>
                Data Protection Officer:{' '}
                <a className="text-rose-200 hover:text-rose-100" href="mailto:privacy@areton.id">
                  privacy@areton.id
                </a>
              </li>
              <li>
                Email umum:{' '}
                <a className="text-rose-200 hover:text-rose-100" href="mailto:support@areton.id">
                  support@areton.id
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
            href="/terms"
            className="text-[11px] uppercase tracking-widest text-rose-200 transition-colors hover:text-rose-100"
          >
            Syarat &amp; Ketentuan →
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

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-6 mb-2 font-display text-base font-medium text-rose-200/90">
      {children}
    </h3>
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
