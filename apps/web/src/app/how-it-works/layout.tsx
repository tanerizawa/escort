import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cara Kerja',
  description:
    'Pelajari cara kerja ARETON.id — dari pendaftaran, pencarian companion, booking, hingga pembayaran escrow yang aman.',
};

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
