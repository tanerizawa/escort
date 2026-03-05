'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '◆' },
  { href: '/users', label: 'Users', icon: '◇' },
  { href: '/escorts/pending', label: 'Verifikasi Escort', icon: '◈' },
  { href: '/bookings', label: 'Bookings', icon: '▸' },
  { href: '/disputes', label: 'Disputes', icon: '⊘' },
  { href: '/finance', label: 'Keuangan', icon: '◎' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-dark-700/50 bg-dark-900/95 backdrop-blur-sm">
      {/* Logo */}
      <div className="border-b border-dark-700/50 px-6 py-5">
        <Link href="/dashboard" className="flex items-baseline gap-1">
          <span className="text-lg font-extralight tracking-widest text-dark-100">ARETON</span>
          <span className="text-lg text-brand-400">.</span>
          <span className="text-lg font-extralight tracking-widest text-brand-400">id</span>
        </Link>
        <p className="mt-1 text-2xs uppercase tracking-[0.15em] text-dark-500">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                  isActive
                    ? 'bg-brand-400/10 text-brand-400'
                    : 'text-dark-400 hover:bg-dark-800/50 hover:text-dark-200'
                }`}
              >
                <span className={`text-xs ${isActive ? 'opacity-100' : 'opacity-50'}`}>{item.icon}</span>
                {item.label}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-dark-700/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-400/20 text-xs text-brand-400">
            A
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-dark-200">Admin</p>
            <p className="text-2xs text-dark-500">Super Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
