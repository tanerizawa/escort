'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dark-900 text-white">
      <h1 className="text-6xl font-bold text-red-400">500</h1>
      <p className="mt-4 text-lg text-gray-400">Terjadi kesalahan server</p>
      <p className="mt-2 max-w-md text-center text-sm text-dark-500">{error?.message}</p>
      <button
        onClick={reset}
        className="mt-6 rounded bg-amber-500 px-4 py-2 text-black hover:bg-amber-400 transition-colors"
      >
        Coba Lagi
      </button>
    </div>
  );
}
