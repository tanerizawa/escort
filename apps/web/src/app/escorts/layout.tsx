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
    <div className="min-h-screen bg-dark-900 text-dark-100">
      <Navbar />
      <main className="pt-20 page-enter">{children}</main>
      <Footer />
    </div>
  );
}
