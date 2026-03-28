import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
  description:
    'Kebijakan privasi ARETON.id — bagaimana kami melindungi data pribadi Anda.',
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
