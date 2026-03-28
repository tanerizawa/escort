import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-dark-700/30 bg-dark-950">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16">
        <div className="grid gap-12 md:grid-cols-5">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-baseline gap-0.5">
              <span className="font-display text-xl font-medium tracking-wide text-dark-100">ARETON</span>
              <span className="font-display text-xl text-brand-400">.</span>
              <span className="text-[10px] font-medium uppercase tracking-widest-2 text-brand-400/70">id</span>
            </Link>
            <p className="mt-4 max-w-xs font-serif text-sm leading-relaxed text-dark-500">
              Layanan pendamping profesional eksklusif untuk acara formal,
              perjalanan bisnis, dan kebutuhan sosial Anda.
            </p>
            <div className="mt-6 h-px w-16 bg-gradient-to-r from-brand-400/50 to-transparent" />
          </div>

          {/* Layanan */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest-2 text-dark-300 mb-5">Layanan</h4>
            <ul className="space-y-3">
              {[
                { label: 'Cari Pendamping', href: '/escorts' },
                { label: 'Cara Kerja', href: '/how-it-works' },
                { label: 'Blog', href: '/blog' },
                { label: 'Keamanan', href: '/safety' },
                { label: 'FAQ', href: '/faq' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="font-serif text-sm text-dark-500 hover:text-brand-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Perusahaan */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest-2 text-dark-300 mb-5">Perusahaan</h4>
            <ul className="space-y-3">
              {[
                { label: 'Tentang Kami', href: '/about' },
                { label: 'Testimoni', href: '/testimonials' },
                { label: 'Hubungi Kami', href: '/contact' },
                { label: 'Jadi Partner', href: '/register?role=escort' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="font-serif text-sm text-dark-500 hover:text-brand-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest-2 text-dark-300 mb-5">Legal</h4>
            <ul className="space-y-3">
              {[
                { label: 'Kebijakan Privasi', href: '/privacy' },
                { label: 'Syarat & Ketentuan', href: '/terms' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="font-serif text-sm text-dark-500 hover:text-brand-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 h-px bg-gradient-to-r from-transparent via-brand-400/20 to-transparent" />
        <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-[11px] tracking-wider text-dark-600">
            &copy; {new Date().getFullYear()} ARETON.id — All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {['Instagram', 'LinkedIn', 'Twitter'].map((social) => (
              <a
                key={social}
                href="#"
                className="text-[11px] uppercase tracking-widest text-dark-600 hover:text-brand-400 transition-colors"
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
