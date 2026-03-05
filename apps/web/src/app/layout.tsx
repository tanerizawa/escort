import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ARETON.id — Professional Companion Service',
    template: '%s | ARETON.id',
  },
  description:
    'Platform layanan pendamping profesional premium yang menghubungkan klien dengan companion terverifikasi untuk kebutuhan bisnis, sosial, dan profesional.',
  keywords: ['companion', 'professional', 'escort', 'business', 'indonesia', 'premium'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-screen bg-dark-900 font-sans">{children}</body>
    </html>
  );
}
