'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

interface MagazineLayoutProps {
  children: React.ReactNode;
  /** Optional breadcrumb label (shown below logo) */
  breadcrumb?: string;
}

export function MagazineLayout({ children, breadcrumb }: MagazineLayoutProps) {
  return (
    <div className="min-h-screen bg-dark-900 text-dark-100">
      {/* ── Header ── */}
      <Navbar />

      {/* ── Content ── */}
      <main className="pt-20">
        {children}
      </main>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
