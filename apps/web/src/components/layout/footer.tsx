import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-dark-700/50 bg-dark-900">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-baseline gap-0.5">
              <span className="text-lg font-extralight tracking-[0.2em] text-dark-100">ARETON</span>
              <span className="text-lg text-brand-400">.</span>
              <span className="text-lg font-extralight tracking-[0.2em] text-brand-400">id</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-dark-500">
              Layanan pendamping profesional eksklusif untuk acara formal, perjalanan bisnis,
              dan kebutuhan sosial Anda.
            </p>
          </div>

          {/* Layanan */}
          <div>
            <h4 className="text-sm font-medium text-dark-200">Layanan</h4>
            <ul className="mt-3 space-y-2">
              {[
                { label: 'Cari Pendamping', href: '/escorts' },
                { label: 'Acara Formal', href: '/escorts?skill=formal' },
                { label: 'Perjalanan Bisnis', href: '/escorts?skill=travel' },
                { label: 'Social Event', href: '/escorts?skill=social' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-dark-500 hover:text-brand-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Perusahaan */}
          <div>
            <h4 className="text-sm font-medium text-dark-200">Perusahaan</h4>
            <ul className="mt-3 space-y-2">
              {[
                { label: 'Tentang Kami', href: '/about' },
                { label: 'Cara Kerja', href: '/how-it-works' },
                { label: 'Karir', href: '/careers' },
                { label: 'Jadi Partner', href: '/register?role=escort' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-dark-500 hover:text-brand-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Bantuan */}
          <div>
            <h4 className="text-sm font-medium text-dark-200">Bantuan</h4>
            <ul className="mt-3 space-y-2">
              {[
                { label: 'Pusat Bantuan', href: '/help' },
                { label: 'Kebijakan Privasi', href: '/privacy' },
                { label: 'Syarat & Ketentuan', href: '/terms' },
                { label: 'Hubungi Kami', href: '/contact' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-dark-500 hover:text-brand-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-dark-700/50 pt-6 sm:flex-row">
          <p className="text-xs text-dark-600">
            &copy; {new Date().getFullYear()} ARETON.id — All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {['Instagram', 'LinkedIn', 'Twitter'].map((social) => (
              <a
                key={social}
                href="#"
                className="text-xs text-dark-600 hover:text-brand-400 transition-colors"
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
