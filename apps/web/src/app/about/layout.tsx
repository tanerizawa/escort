import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tentang Kami',
  description:
    'ARETON.id adalah platform layanan pendamping profesional premium Indonesia. Menghubungkan klien dengan companion terverifikasi.',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
