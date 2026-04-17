'use client';

import type { ReactNode } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { MarketingPageHeader } from '@/components/layout/marketing-page-header';

interface MarketingShellProps {
  mark?: string;
  title: string;
  highlight?: string;
  description?: string;
  actions?: ReactNode;
  showGlyph?: boolean;
  align?: 'center' | 'start';
  children: ReactNode;
}

/**
 * Drop-in wrapper for every static marketing sub-page (about, faq,
 * contact, safety, privacy, terms, etc.). Provides the rose-inspired
 * editorial masthead and a consistent content container so each page
 * reads like a chapter of the same volume.
 */
export function MarketingShell({
  mark,
  title,
  highlight,
  description,
  actions,
  showGlyph,
  align,
  children,
}: MarketingShellProps) {
  return (
    <div className="relative min-h-screen bg-dark-900 text-dark-100">
      {/* Ambient rose/velvet wash — matches the home hero and dashboards */}
      <div
        className="pointer-events-none fixed inset-0 -z-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse at 20% -10%, rgba(176,74,85,0.08), transparent 55%), radial-gradient(ellipse at 110% 40%, rgba(201,169,110,0.06), transparent 55%)',
        }}
      />

      <Navbar />

      <main className="relative z-10 pt-20">
        <MarketingPageHeader
          mark={mark}
          title={title}
          highlight={highlight}
          description={description}
          actions={actions}
          showGlyph={showGlyph}
          align={align}
        />

        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-10 lg:py-24">{children}</div>
      </main>

      <Footer />
    </div>
  );
}
