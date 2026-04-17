import Link from 'next/link';
import { MarketingShell } from '@/components/layout/marketing-shell';
import { RoseGlyph } from '@/components/brand/rose-glyph';

const teamMembers = [
  { name: 'Rina Kartika', role: 'CEO & Founder', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&auto=format' },
  { name: 'Arief Prasetyo', role: 'CTO', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format' },
  { name: 'Maya Sari', role: 'Head of Operations', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&auto=format' },
  { name: 'Dimas Nugraha', role: 'Head of Safety', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&auto=format' },
];

const values = [
  {
    title: 'Integritas',
    desc: 'Setiap companion melalui proses verifikasi ketat — tanpa kompromi, tanpa jalan pintas.',
    numeral: 'I',
  },
  {
    title: 'Profesionalisme',
    desc: 'Standar hospitalitas kelas dunia dalam setiap percakapan, setiap etiket, setiap detail.',
    numeral: 'II',
  },
  {
    title: 'Keamanan',
    desc: 'Escrow, live tracking, dan SOS button — sistem keamanan berlapis yang dijaga 24/7.',
    numeral: 'III',
  },
  {
    title: 'Privasi',
    desc: 'Data dienkripsi AES-256-GCM, identitas dikunci sub rosa, sesuai UU PDP Indonesia.',
    numeral: 'IV',
  },
];

const stats = [
  { value: '100%', label: 'Verified Partners' },
  { value: '24/7', label: 'Support Available' },
  { value: '4', label: 'Membership Tiers' },
  { value: 'Escrow', label: 'Secure Payments' },
];

export default function AboutPage() {
  return (
    <MarketingShell
      mark="Tentang ARETON"
      title="Mengkurasi pengalaman"
      highlight="premium Indonesia"
      description="ARETON.id adalah platform pendampingan profesional pertama di Indonesia yang menggabungkan teknologi terkini dengan standar hospitalitas kelas dunia."
    >
      {/* Cerita Kami */}
      <section className="grid gap-16 lg:grid-cols-[3fr_4fr] lg:gap-20">
        <div className="relative">
          <div className="aspect-[4/5] overflow-hidden border border-dark-700/30">
            <img
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80&auto=format"
              alt="Tim ARETON"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -right-6 hidden border border-rose-400/25 bg-dark-900/95 px-8 py-6 lg:block">
            <p className="act-mark !text-rose-300/80">Didirikan</p>
            <p className="mt-2 font-display text-4xl font-medium text-gradient-rose-gold">2026</p>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="act-mark">Cerita Kami</p>
          <h2 className="mt-5 font-display text-display-sm font-medium text-dark-100">
            Lahir dari visi, dibangun dengan{' '}
            <span className="italic text-gradient-rose-gold">integritas</span>
          </h2>
          <div className="gold-rose-line mt-6 w-20" />
          <p className="mt-8 font-serif text-[15px] leading-relaxed text-dark-300">
            ARETON didirikan dengan misi sederhana: menyediakan layanan pendampingan
            profesional yang aman, terverifikasi, dan berkelas. Di tengah industri yang
            sering diselimuti ketidakpastian, kami hadir sebagai standar baru.
          </p>
          <p className="mt-4 font-serif text-[15px] leading-relaxed text-dark-300">
            Setiap companion kami melalui proses kurasi ketat — verifikasi identitas,
            wawancara personal, dan evaluasi berkelanjutan. Kami percaya kepercayaan
            dibangun lewat transparansi dan konsistensi, bukan janji.
          </p>
          <p className="mt-4 font-serif text-[15px] leading-relaxed text-dark-300">
            Escrow payment, live location tracking, dan rating terverifikasi memastikan
            setiap interaksi terjaga pada standar tertinggi.
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="mt-24 border-y border-dark-700/30 py-14">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl font-medium text-gradient-rose-gold sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-widest-2 text-dark-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="mt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="act-mark">Empat Kelopak</p>
          <h2 className="mt-5 font-display text-display-sm font-medium text-dark-100">
            Prinsip yang <span className="italic text-gradient-rose-gold">menopang</span>{' '}
            setiap pertemuan
          </h2>
          <div className="gold-rose-line mx-auto mt-6 w-24" />
          <p className="mx-auto mt-6 max-w-xl font-serif text-lg leading-relaxed text-dark-300">
            Seperti mawar dengan empat lapis kelopak, ARETON dibangun di atas empat pilar
            yang saling menopang.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {values.map((v) => (
            <article
              key={v.title}
              className="group relative overflow-hidden border border-dark-700/30 bg-dark-800/30 p-9 transition-all duration-500 hover:border-rose-400/25 hover:bg-dark-800/60"
            >
              <div className="absolute inset-0 bg-rose-gold-subtle opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-6 flex items-start justify-between">
                  <div className="text-rose-300/80">
                    <RoseGlyph className="h-10 w-10" strokeWidth={1.1} />
                  </div>
                  <span className="font-display text-5xl font-light text-brand-400/15">
                    {v.numeral}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-medium text-dark-100">
                  {v.title}
                </h3>
                <div className="gold-rose-line mt-4 w-10" />
                <p className="mt-6 font-serif text-[15px] leading-relaxed text-dark-300">
                  {v.desc}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="mt-24 border-t border-dark-700/30 pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="act-mark">Tim Kami</p>
          <h2 className="mt-5 font-display text-display-sm font-medium text-dark-100">
            Di balik <span className="italic text-gradient-rose-gold">layar</span>
          </h2>
          <div className="gold-rose-line mx-auto mt-6 w-24" />
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {teamMembers.map((member) => (
            <div key={member.name} className="group">
              <div className="relative overflow-hidden border border-dark-700/30">
                <img
                  src={member.img}
                  alt={member.name}
                  className="aspect-[3/4] h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/85 via-dark-900/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="gold-rose-line w-8" />
                  <h3 className="mt-2 font-display text-base font-medium text-white">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-[10px] uppercase tracking-widest-2 text-rose-200/80">
                    {member.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-24 border-t border-dark-700/30 pt-20 text-center">
        <p className="act-mark">Undangan</p>
        <h2 className="mt-5 font-display text-display-sm font-medium text-dark-100">
          Siap <span className="italic text-gradient-rose-gold">bergabung?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg font-serif text-lg leading-relaxed text-dark-300">
          Jadilah bagian dari komunitas eksklusif ARETON dan temukan standar baru layanan
          pendampingan profesional.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Link
            href="/register"
            className="rounded-none bg-brand-400 px-10 py-4 text-[12px] font-bold uppercase tracking-widest-2 text-dark-900 transition-all hover:bg-brand-300"
          >
            Daftar Sekarang
          </Link>
          <Link
            href="/contact"
            className="rounded-none border border-rose-400/40 px-10 py-4 text-[12px] font-medium uppercase tracking-widest-2 text-rose-200 transition-all hover:bg-rose-500/10"
          >
            Hubungi Kami
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
