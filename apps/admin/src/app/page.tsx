import Link from 'next/link';

export default function AdminHomePage() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-dark-700/50 bg-dark-800/50 px-4 py-6">
        <div className="mb-8 px-2">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-extralight tracking-widest text-dark-100">ARETON</span>
            <span className="text-lg text-brand-400">.</span>
            <span className="text-lg font-extralight tracking-widest text-brand-400">id</span>
          </div>
          <p className="mt-1 text-2xs uppercase tracking-[0.15em] text-dark-500">Admin Panel</p>
        </div>

        <nav className="flex flex-col gap-1">
          {[
            { href: '/dashboard', label: 'Dashboard', icon: '◆' },
            { href: '/users', label: 'Users', icon: '◇' },
            { href: '/escorts/pending', label: 'Verifikasi Escort', icon: '◈' },
            { href: '/bookings', label: 'Bookings', icon: '▸' },
            { href: '/disputes', label: 'Disputes', icon: '⊘' },
            { href: '/finance', label: 'Keuangan', icon: '◎' },
            { href: '/settings', label: 'Settings', icon: '⚙' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-dark-300 transition-colors hover:bg-dark-700/50 hover:text-dark-100"
            >
              <span className="text-xs opacity-60">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <h1 className="mb-2 text-2xl font-light tracking-wide text-dark-100">Admin Dashboard</h1>
        <p className="mb-8 text-sm text-dark-400">Selamat datang di panel administrasi ARETON.id</p>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Users', value: '—', change: '', color: 'brand' },
            { label: 'Active Bookings', value: '—', change: '', color: 'blue' },
            { label: 'Revenue (Bulan Ini)', value: '—', change: '', color: 'emerald' },
            { label: 'Pending Verification', value: '—', change: '', color: 'amber' },
          ].map((kpi, i) => (
            <div
              key={i}
              className="rounded-xl border border-dark-700/50 bg-dark-800/40 p-5"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-dark-400">{kpi.label}</p>
              <p className="mt-2 text-3xl font-light text-dark-100">{kpi.value}</p>
              <p className="mt-1 text-xs text-dark-500">{kpi.change || 'No data yet'}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-dark-700/30 bg-dark-800/20 p-8 text-center">
          <p className="text-sm text-dark-400">
            Dashboard akan aktif setelah backend API terhubung dan data tersedia.
          </p>
          <p className="mt-2 text-xs text-dark-500">Phase 7 — Admin Dashboard Implementation</p>
        </div>
      </main>
    </div>
  );
}
