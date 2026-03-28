import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ — Pertanyaan Umum',
  description:
    'Jawaban untuk pertanyaan yang sering diajukan tentang layanan ARETON.id, pembayaran, keamanan, dan cara menggunakan platform.',
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
