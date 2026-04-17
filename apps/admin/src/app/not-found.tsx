import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dark-900 text-white">
      <h1 className="text-6xl font-bold text-gold-400">404</h1>
      <p className="mt-4 text-lg text-gray-400">Halaman tidak ditemukan</p>
      <Link href="/dashboard" className="mt-6 text-gold-400 hover:underline">
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
