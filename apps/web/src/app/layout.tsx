import type { Metadata } from 'next';
import { Inter, Playfair_Display, Cormorant_Garamond } from 'next/font/google';
import { I18nProvider } from '@/i18n';
import { PresenceProvider } from '@/components/providers/presence-provider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'ARETON.id — Professional Companion Service',
    template: '%s | ARETON.id',
  },
  description:
    'Platform layanan pendamping profesional premium Indonesia. Temukan companion terverifikasi untuk acara bisnis, dinner formal, event sosial, dan perjalanan profesional.',
  keywords: [
    'companion profesional',
    'pendamping bisnis',
    'escort service indonesia',
    'professional companion',
    'business escort',
    'event companion',
    'dinner companion',
    'areton',
    'premium service',
    'verified companion',
  ],
  metadataBase: new URL('https://areton.id'),
  openGraph: {
    title: 'ARETON.id — Professional Companion Service',
    description:
      'Platform pendamping profesional premium Indonesia. Companion terverifikasi untuk kebutuhan bisnis, sosial, dan profesional Anda.',
    url: 'https://areton.id',
    siteName: 'ARETON.id',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ARETON.id — Professional Companion Service',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ARETON.id — Professional Companion Service',
    description:
      'Platform pendamping profesional premium Indonesia. Companion terverifikasi untuk kebutuhan bisnis & sosial.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://areton.id',
  },
  verification: {},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${playfair.variable} ${cormorant.variable}`}>
      <body className="min-h-screen bg-dark-900 font-sans">
        <I18nProvider>
          <PresenceProvider>{children}</PresenceProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
