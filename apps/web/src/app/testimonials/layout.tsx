import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'Testimoni Klien | ARETON.id',
  description: 'Baca pengalaman langsung dari klien yang telah menggunakan layanan pendamping profesional ARETON.id.',
  openGraph: {
    title: 'Testimoni Klien | ARETON.id',
    description: 'Pengalaman langsung dari klien ARETON.id',
  },
};

export default function TestimonialsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-900 text-dark-100">
      <Navbar />
      <main className="pt-20">{children}</main>
      <Footer />
    </div>
  );
}
