import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'Cari Pendamping Profesional',
  description:
    'Temukan companion profesional terverifikasi untuk acara bisnis, dinner formal, event sosial, dan perjalanan profesional di seluruh Indonesia.',
  openGraph: {
    title: 'Cari Pendamping Profesional — ARETON.id',
    description:
      'Temukan companion profesional terverifikasi untuk acara bisnis, dinner formal, dan event sosial.',
    url: 'https://areton.id/escorts',
  },
};

export default function EscortsPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-dark-900 text-dark-100">
      <div
        className="pointer-events-none fixed inset-0 -z-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse at 20% -10%, rgba(176,74,85,0.08), transparent 55%), radial-gradient(ellipse at 110% 40%, rgba(201,169,110,0.06), transparent 55%)',
        }}
      />
      <Navbar />
      <main className="relative z-10 pt-20 page-enter">{children}</main>
      <Footer />
    </div>
  );
}
