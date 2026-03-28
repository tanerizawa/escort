import { Metadata } from 'next';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'Blog & Insights — ARETON.id',
  description: 'Tips, panduan, dan wawasan seputar layanan pendamping profesional, etika acara, dan lifestyle.',
  openGraph: {
    title: 'Blog & Insights — ARETON.id',
    description: 'Tips dan panduan layanan pendamping profesional.',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-900 text-dark-100">
      <Navbar />
      <main className="pt-20">{children}</main>
      <Footer />
    </div>
  );
}
