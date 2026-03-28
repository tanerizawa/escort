'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/icon';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: 'notification';
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { href: '/monitoring', label: 'Monitoring', icon: 'Monitor' },
      { href: '/analytics', label: 'Analytics', icon: 'BarChart3' },
    ],
  },
  {
    title: 'Users & Verifikasi',
    items: [
      { href: '/users', label: 'Users', icon: 'Users' },
    ],
  },
  {
    title: 'Operasional',
    items: [
      { href: '/bookings', label: 'Bookings', icon: 'Calendar' },
      { href: '/incidents', label: 'Incidents', icon: 'AlertTriangle' },
    ],
  },
  {
    title: 'Keuangan & Marketing',
    items: [
      { href: '/finance', label: 'Laporan Keuangan', icon: 'DollarSign' },
      { href: '/premium', label: 'Premium Listings', icon: 'Star' },
      { href: '/promo-codes', label: 'Promo Codes', icon: 'Tag' },
      { href: '/referrals', label: 'Referrals', icon: 'Share2' },
    ],
  },
  {
    title: 'Konten',
    items: [
      { href: '/articles', label: 'Artikel & Blog', icon: 'Newspaper' },
      { href: '/testimonials', label: 'Testimonials', icon: 'MessageSquareQuote' },
    ],
  },
  {
    title: 'Layanan',
    items: [
      { href: '/corporate', label: 'Corporate', icon: 'Briefcase' },
      { href: '/training', label: 'Training', icon: 'GraduationCap' },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { href: '/notifications', label: 'Notifikasi', icon: 'Bell', badge: 'notification' },
      { href: '/audit-logs', label: 'Audit Logs', icon: 'FileText' },
      { href: '/data-requests', label: 'Data Requests', icon: 'ShieldCheck' },
      { href: '/settings', label: 'Settings', icon: 'Settings' },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName, setAdminName] = useState('Admin');
  const [adminRole, setAdminRole] = useState('Super Admin');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin_user');
      if (stored) {
        const u = JSON.parse(stored);
        setAdminName(u.firstName || 'Admin');
        setAdminRole(u.role || 'ADMIN');
      }
    } catch {}

    // Fetch unread notification count
    const token = localStorage.getItem('admin_token');
    if (token) {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      fetch(`${API}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data) {
            const d = data?.data || data;
            setUnreadCount(d.count ?? d.unreadCount ?? 0);
          }
        })
        .catch(() => {});

      // Refresh unread count every 30 seconds
      const interval = setInterval(() => {
        const t = localStorage.getItem('admin_token');
        if (!t) return;
        fetch(`${API}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${t}` },
        })
          .then((res) => res.ok ? res.json() : null)
          .then((data) => {
            if (data) {
              const d = data?.data || data;
              setUnreadCount(d.count ?? d.unreadCount ?? 0);
            }
          })
          .catch(() => {});
      }, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh');
    localStorage.removeItem('admin_user');
    window.location.href = '/';
  };

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
        <div className="space-y-5">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-dark-500">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname?.startsWith(item.href + '/') ||
                    (item.href === '/users' && (pathname?.startsWith('/escorts/') || pathname?.startsWith('/users/')));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                        isActive
                          ? 'bg-brand-400/10 text-brand-400'
                          : 'text-dark-400 hover:bg-dark-800/50 hover:text-dark-200'
                      }`}
                    >
                      <span className={`${isActive ? 'opacity-100' : 'opacity-50'}`}><Icon name={item.icon} className="h-4 w-4" /></span>
                      <span className="flex-1">{item.label}</span>
                      {item.badge === 'notification' && unreadCount > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-medium text-white">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                      {isActive && !(item.badge === 'notification' && unreadCount > 0) && (
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-dark-700/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-400/20 text-xs text-brand-400">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-dark-200">{adminName}</p>
            <p className="text-2xs text-dark-500">{adminRole}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md p-1.5 text-dark-500 transition-colors hover:bg-dark-800 hover:text-red-400"
            title="Logout"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
