'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/layout/notification-bell';
import { useState } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = isAuthenticated
    ? [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/escorts', label: 'Cari Partner' },
        { href: '/bookings', label: 'Booking Saya' },
      ]
    : [
        { href: '/#services', label: 'Layanan' },
        { href: '/#how-it-works', label: 'Cara Kerja' },
        { href: '/#tiers', label: 'Tier' },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-dark-700/30 bg-dark-900/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-baseline gap-0.5">
          <span className="text-lg font-extralight tracking-[0.2em] text-dark-100">ARETON</span>
          <span className="text-lg text-brand-400">.</span>
          <span className="text-lg font-extralight tracking-[0.2em] text-brand-400">id</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                pathname === link.href
                  ? 'text-brand-400'
                  : 'text-dark-400 hover:text-dark-100'
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
            <NotificationBell />
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-dark-800/50"
              >
                <Avatar
                  src={user.profilePhoto}
                  alt={`${user.firstName} ${user.lastName}`}
                  size="sm"
                />
                <span className="hidden text-sm text-dark-200 md:block">
                  {user.firstName}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-dark-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-dark-700/50 bg-dark-800 py-2 shadow-xl shadow-black/30">
                    <div className="border-b border-dark-700/40 px-4 py-3">
                      <p className="text-sm font-medium text-dark-100">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-dark-500">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-dark-300 hover:bg-dark-700/50 hover:text-dark-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-dark-300 hover:bg-dark-700/50 hover:text-dark-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      Profil Saya
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-dark-300 hover:bg-dark-700/50 hover:text-dark-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      Pengaturan
                    </Link>
                    <div className="border-t border-dark-700/40 mt-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setShowDropdown(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10"
                      >
                        Keluar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Masuk
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Daftar</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="ml-1 rounded-lg p-2 text-dark-400 hover:text-dark-100 md:hidden"
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
        <div className="border-t border-dark-700/30 bg-dark-900/95 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm ${
                  pathname === link.href
                    ? 'text-brand-400 bg-brand-400/5'
                    : 'text-dark-300 hover:text-dark-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
