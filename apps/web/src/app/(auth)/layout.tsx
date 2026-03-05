import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-brand-400/5 blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 h-48 w-48 rounded-full bg-brand-400/3 blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12">
          {/* Logo */}
          <Link href="/" className="inline-flex items-baseline gap-0.5">
            <span className="text-xl font-extralight tracking-[0.2em] text-dark-100">ARETON</span>
            <span className="text-xl text-brand-400">.</span>
            <span className="text-xl font-extralight tracking-[0.2em] text-brand-400">id</span>
          </Link>

          {/* Tagline */}
          <div className="max-w-md">
            <h1 className="text-3xl font-light leading-relaxed text-dark-100">
              Premium Companion
              <br />
              <span className="text-brand-400">Service Platform</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-dark-400">
              Layanan pendamping profesional eksklusif untuk acara formal, perjalanan bisnis,
              dan kebutuhan sosial Anda. Terverifikasi, aman, dan terpercaya.
            </p>

            <div className="mt-8 flex gap-6">
              {[
                { value: '500+', label: 'Partner Terverifikasi' },
                { value: '10K+', label: 'Client Terdaftar' },
                { value: '4.9', label: 'Rating Rata-rata' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-lg font-medium text-brand-400">{stat.value}</p>
                  <p className="text-[11px] text-dark-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-[11px] text-dark-600">
            &copy; {new Date().getFullYear()} ARETON.id — All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-baseline gap-0.5">
              <span className="text-lg font-extralight tracking-[0.2em] text-dark-100">ARETON</span>
              <span className="text-lg text-brand-400">.</span>
              <span className="text-lg font-extralight tracking-[0.2em] text-brand-400">id</span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
