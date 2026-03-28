import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hubungi Kami',
  description:
    'Hubungi tim ARETON.id untuk pertanyaan, dukungan, atau kerjasama bisnis.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
