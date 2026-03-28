import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download Aplikasi Android',
  description: 'Download aplikasi ARETON.id untuk Android. Temukan pendamping profesional tepercaya langsung dari smartphone Anda.',
  openGraph: {
    title: 'Download ARETON.id Android App',
    description: 'Download aplikasi ARETON.id untuk Android.',
  },
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
