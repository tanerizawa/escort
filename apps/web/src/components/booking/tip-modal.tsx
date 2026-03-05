'use client';

import { useState } from 'react';

interface TipModalProps {
  bookingId: string;
  escortName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount: number) => void;
}

const presetAmounts = [25000, 50000, 100000, 200000, 500000];

export default function TipModal({ bookingId, escortName, isOpen, onClose, onSuccess }: TipModalProps) {
  const [amount, setAmount] = useState<number>(50000);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handlePresetSelect = (value: number) => {
    setAmount(value);
    setIsCustom(false);
    setCustomAmount('');
    setError('');
  };

  const handleCustomToggle = () => {
    setIsCustom(true);
    setCustomAmount('');
    setError('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setCustomAmount(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num)) setAmount(num);
  };

  const handleSubmit = async () => {
    if (amount < 10000) {
      setError('Minimum tip adalah Rp 10.000');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}/tip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, message: message || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Gagal memberikan tip');
      }

      setSuccess(true);
      onSuccess?.(amount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setAmount(50000);
      setCustomAmount('');
      setIsCustom(false);
      setMessage('');
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div className="w-full max-w-md rounded-2xl border border-dark-700/50 bg-dark-800 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {success ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-400/10">
              <svg className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="mt-4 text-lg font-medium text-dark-100">Tip Terkirim!</h2>
            <p className="mt-2 text-sm text-dark-400">
              Rp {amount.toLocaleString('id-ID')} telah dikirim ke {escortName}
            </p>
            <button
              onClick={handleClose}
              className="mt-6 rounded-xl bg-brand-400 px-8 py-2.5 text-sm font-medium text-dark-900 transition-colors hover:bg-brand-300"
            >
              Tutup
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-dark-100">Berikan Tip</h2>
                <p className="mt-0.5 text-sm text-dark-400">Apresiasi layanan {escortName}</p>
              </div>
              <button onClick={handleClose} className="text-dark-500 hover:text-dark-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Amount Selection */}
            <div className="mt-6">
              <label className="mb-2 block text-sm text-dark-300">Pilih Jumlah</label>
              <div className="grid grid-cols-3 gap-2">
                {presetAmounts.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handlePresetSelect(val)}
                    className={`rounded-xl border py-3 text-sm font-medium transition-all ${
                      !isCustom && amount === val
                        ? 'border-brand-400/50 bg-brand-400/10 text-brand-400'
                        : 'border-dark-600/50 text-dark-300 hover:border-dark-500/50'
                    }`}
                  >
                    {(val / 1000).toFixed(0)}K
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleCustomToggle}
                  className={`rounded-xl border py-3 text-sm font-medium transition-all ${
                    isCustom
                      ? 'border-brand-400/50 bg-brand-400/10 text-brand-400'
                      : 'border-dark-600/50 text-dark-300 hover:border-dark-500/50'
                  }`}
                >
                  Custom
                </button>
              </div>

              {isCustom && (
                <div className="mt-3">
                  <div className="flex items-center rounded-xl border border-dark-600/50 bg-dark-800/30 px-4 py-3">
                    <span className="text-sm text-dark-400">Rp</span>
                    <input
                      type="text"
                      value={customAmount ? parseInt(customAmount).toLocaleString('id-ID') : ''}
                      onChange={handleCustomChange}
                      placeholder="0"
                      autoFocus
                      className="ml-2 w-full bg-transparent text-lg font-medium text-dark-100 placeholder:text-dark-600 focus:outline-none"
                    />
                  </div>
                  <p className="mt-1 text-xs text-dark-500">Minimum Rp 10.000</p>
                </div>
              )}
            </div>

            {/* Message */}
            <div className="mt-5">
              <label className="mb-2 block text-sm text-dark-300">Pesan (Opsional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                maxLength={200}
                placeholder="Terima kasih atas layanan yang luar biasa!"
                className="w-full rounded-xl border border-dark-600/50 bg-dark-800/30 px-4 py-3 text-sm text-dark-100 placeholder:text-dark-500 focus:border-brand-400/50 focus:outline-none focus:ring-1 focus:ring-brand-400/30"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Summary & Submit */}
            <div className="mt-6 rounded-xl border border-dark-700/30 bg-dark-800/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">Jumlah Tip</span>
                <span className="text-lg font-semibold text-brand-400">
                  Rp {amount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || amount < 10000}
              className="mt-4 w-full rounded-xl bg-brand-400 py-3 text-sm font-semibold text-dark-900 transition-colors hover:bg-brand-300 disabled:opacity-40"
            >
              {submitting ? 'Memproses...' : `Kirim Tip Rp ${amount.toLocaleString('id-ID')}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
