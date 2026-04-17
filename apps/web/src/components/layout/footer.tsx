import Link from 'next/link';
import { RoseGlyph } from '@/components/brand/rose-glyph';

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-dark-700/30 bg-dark-950">
      {/* Thin gold–rose top hairline */}
      <div className="gold-rose-line absolute inset-x-0 top-0" />

      {/* Watermark rose — sits off-axis so it reads as an ornament, not a logo */}
      <RoseGlyph className="rose-watermark h-[18rem] w-[18rem] -left-20 -bottom-24" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-14 md:grid-cols-5">
          {/* Brand column */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-baseline gap-0.5">
              <span className="font-display text-xl font-medium tracking-wide text-dark-100">
                ARETON
              </span>
              <span className="font-display text-xl text-brand-400">.</span>
              <span className="text-[10px] font-medium uppercase tracking-widest-2 text-brand-400/70">
                id
              </span>
            </Link>

            <div className="mt-5 flex items-center gap-3 text-rose-300/70">
              <RoseGlyph className="h-6 w-6" strokeWidth={1.1} />
              <p className="font-display text-sm italic text-rose-200/75">
                sub rosa · sub fide
              </p>
            </div>

            <p className="mt-5 max-w-xs font-serif text-sm leading-relaxed text-dark-400">
              Layanan pendamping profesional yang terkurasi untuk pertemuan yang
              pantas diingat — dijaga dalam privasi, dikunci dalam kepercayaan.
            </p>

            <div className="gold-rose-line mt-6 w-16" />
          </div>

          <FooterColumn
            heading="Layanan"
            links={[
              { label: 'Cari Pendamping', href: '/escorts' },
              { label: 'Cara Kerja', href: '/how-it-works' },
              { label: 'Blog', href: '/blog' },
              { label: 'Keamanan', href: '/safety' },
              { label: 'FAQ', href: '/faq' },
            ]}
          />

          <FooterColumn
            heading="Perusahaan"
            links={[
              { label: 'Tentang Kami', href: '/about' },
              { label: 'Testimoni', href: '/testimonials' },
              { label: 'Hubungi Kami', href: '/contact' },
              { label: 'Jadi Partner', href: '/login/escort' },
            ]}
          />

          <FooterColumn
            heading="Legal"
            links={[
              { label: 'Kebijakan Privasi', href: '/privacy' },
              { label: 'Syarat & Ketentuan', href: '/terms' },
            ]}
          />
        </div>

        {/* Bottom rule + social */}
        <div className="gold-rose-line mt-14" />
        <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-[11px] tracking-wider text-dark-600">
            &copy; {new Date().getFullYear()} ARETON.id — All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {['Instagram', 'LinkedIn', 'Twitter'].map((social) => (
              <a
                key={social}
                href="#"
                className="text-[11px] uppercase tracking-widest text-dark-600 transition-colors hover:text-rose-200"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

interface FooterColumnProps {
  heading: string;
  links: { label: string; href: string }[];
}

function FooterColumn({ heading, links }: FooterColumnProps) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="gold-rose-line w-6" />
        <h4 className="text-[11px] font-semibold uppercase tracking-widest-2 text-rose-200/80">
          {heading}
        </h4>
      </div>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="font-serif text-sm text-dark-400 transition-colors hover:text-rose-200"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
