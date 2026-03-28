'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Avatar } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/layout/notification-bell';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useI18n } from '@/i18n';
import { useState } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { t } = useI18n();

  const getDashboardHref = () => {
    if (user?.role === 'ESCORT') return '/escort/dashboard';
    return '/user/dashboard';
  };

  const navLinks = isAuthenticated
    ? [
        { href: getDashboardHref(), label: t('nav.dashboard') },
        { href: user?.role === 'ESCORT' ? '/escort/requests' : '/user/escorts', label: user?.role === 'ESCORT' ? t('nav.requests') : t('nav.escorts') },
        { href: user?.role === 'ESCORT' ? '/escort/earnings' : '/user/bookings', label: user?.role === 'ESCORT' ? t('nav.earnings') : t('bookings.title') },
      ]
    : [
        { href: '/about', label: 'About' },
        { href: '/escorts', label: 'Companions' },
        { href: '/blog', label: 'Blog' },
        { href: '/testimonials', label: 'Testimoni' },
        { href: '/faq', label: 'FAQ' },
      ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-dark-900/70 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-baseline gap-0.5">
          <span className="font-display text-2xl font-medium tracking-wide text-dark-100">ARETON</span>
          <span className="font-display text-2xl text-brand-400">.</span>
          <span className="text-xs font-medium uppercase tracking-widest-2 text-brand-400/70">id</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[13px] uppercase tracking-widest-2 transition-colors ${
                pathname === link.href
                  ? 'text-brand-400'
                  : 'text-dark-400 hover:text-brand-400'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
            <LanguageSwitcher compact />
            <NotificationBell />
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2.5 rounded-none px-3 py-2 transition-colors hover:bg-dark-800/40"
              >
                <Avatar
                  src={user?.profilePhoto}
                  alt={`${user?.firstName || ''} ${user?.lastName || ''}`}
                  size="sm"
                />
                <span className="hidden text-[13px] tracking-wide text-dark-200 md:block">
                  {user?.firstName}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-dark-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-3 w-60 border border-dark-700/30 bg-dark-800/95 backdrop-blur-xl py-2 shadow-2xl shadow-black/40 animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
                    <div className="border-b border-dark-700/30 px-5 py-4">
                      <p className="font-display text-sm font-medium text-dark-100">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="mt-0.5 text-[11px] tracking-wide text-dark-500">{user?.email}</p>
                    </div>
                    <Link
                      href={user?.role === 'ESCORT' ? '/escort/dashboard' : '/user/dashboard'}
                      className="flex items-center gap-2.5 px-5 py-3 text-[13px] text-dark-300 transition-colors hover:bg-dark-700/30 hover:text-dark-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href={user?.role === 'ESCORT' ? '/escort/profile' : '/user/profile'}
                      className="flex items-center gap-2.5 px-5 py-3 text-[13px] text-dark-300 transition-colors hover:bg-dark-700/30 hover:text-dark-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      {t('profile.title')}
                    </Link>
                    <Link
                      href={user?.role === 'ESCORT' ? '/escort/profile' : '/user/profile/security'}
                      className="flex items-center gap-2.5 px-5 py-3 text-[13px] text-dark-300 transition-colors hover:bg-dark-700/30 hover:text-dark-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      {t('nav.settings')}
                    </Link>
                    <div className="border-t border-dark-700/30 mt-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setShowDropdown(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-5 py-3 text-[13px] text-red-400/80 transition-colors hover:bg-red-500/5 hover:text-red-400"
                      >
                        {t('common.logout')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            </>
          ) : (
            <>
            <LanguageSwitcher compact />
            <Link
              href="/login"
              className="hidden text-[13px] uppercase tracking-widest text-dark-300 transition-colors hover:text-brand-400 sm:block"
            >
              {t('common.login')}
            </Link>
            <Link
              href="/register"
              className="rounded-none border border-brand-400/40 bg-brand-400/[0.06] px-6 py-2.5 text-[11px] font-semibold uppercase tracking-widest-2 text-brand-400 transition-all hover:bg-brand-400/15 hover:border-brand-400/60"
            >
              {t('common.register')}
            </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="ml-1 p-2 text-dark-400 hover:text-dark-100 md:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              {mobileOpen ? (
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="border-t border-dark-700/20 bg-dark-900/95 backdrop-blur-xl px-6 py-6 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-3 text-[13px] uppercase tracking-widest-2 transition-colors ${
                  pathname === link.href
                    ? 'text-brand-400'
                    : 'text-dark-400 hover:text-dark-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {!isAuthenticated && (
            <div className="mt-4 border-t border-dark-700/20 pt-4 flex gap-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 py-3 text-center text-[12px] uppercase tracking-widest text-dark-300 border border-dark-700/30 transition-colors hover:text-brand-400"
              >
                {t('common.login')}
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="flex-1 py-3 text-center text-[12px] uppercase tracking-widest-2 font-semibold text-brand-400 border border-brand-400/40 bg-brand-400/[0.06] transition-all hover:bg-brand-400/15"
              >
                {t('common.register')}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
