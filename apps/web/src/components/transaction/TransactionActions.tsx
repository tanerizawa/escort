'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useActiveBookingStore } from '@/stores/active-booking.store';
import { AlertTriangle, CheckCircle2, Lock, MapPin, RefreshCw, ShieldAlert, X } from 'lucide-react';

interface TransactionActionsProps {
  bookingId: string;
  bookingStatus: string;
  paymentStatus?: string;
  userRole: 'CLIENT' | 'ESCORT';
  startTime: string;
}

export function TransactionActions({
  bookingId,
  bookingStatus,
  paymentStatus,
  userRole,
  startTime,
}: TransactionActionsProps) {
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showRecommendConfirm, setShowRecommendConfirm] = useState(false);
  const [recommendNote, setRecommendNote] = useState('');

  const refreshBooking = useActiveBookingStore((s) => s.refreshBooking);

  const handleAction = async (action: string, body: Record<string, any> = {}) => {
    setLoading(action);
    setError('');
    try {
      await api.patch(`/bookings/${bookingId}/${action}`, body);
      // Refresh active booking state
      await refreshBooking();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.data?.message || 'Terjadi kesalahan';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading('');
    }
  };

  const handleCancel = async () => {
    await handleAction('cancel', { reason: cancelReason || 'Dibatalkan oleh pengguna' });
    setShowCancelConfirm(false);
  };

  const handleRecommend = async () => {
    await handleAction('recommend-replacement', { reason: recommendNote || 'Merekomendasikan pengganti' });
    setShowRecommendConfirm(false);
  };

  const startMs = new Date(startTime).getTime();
  const now = Date.now();
  const canCheckin = startMs - now < 30 * 60 * 1000; // within 30min of start time

  // Cancel confirmation modal
  if (showCancelConfirm) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <h4 className="text-sm font-medium text-red-400 mb-2"><AlertTriangle className="h-4 w-4 inline-block mr-1" /> Batalkan Booking?</h4>
          <p className="text-xs text-dark-400 mb-3">
            Pembatalan setelah pembayaran dapat dikenakan biaya penalti. Dana akan diproses sesuai kebijakan.
          </p>
          <input
            type="text"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Alasan pembatalan (opsional)"
            className="w-full rounded-xl bg-dark-700/50 px-3 py-2 text-xs text-white placeholder:text-dark-500 outline-none focus:ring-1 focus:ring-red-500/50 mb-3"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => setShowCancelConfirm(false)}
            >
              Batal
            </Button>
            <button
              onClick={handleCancel}
              disabled={loading === 'cancel'}
              className="flex-1 rounded-xl bg-red-500/20 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/30 disabled:opacity-50"
            >
              {loading === 'cancel' ? 'Memproses...' : 'Ya, Batalkan'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Recommend replacement modal (escort)
  if (showRecommendConfirm) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4">
          <h4 className="text-sm font-medium text-yellow-300 mb-2"><RefreshCw className="h-4 w-4 inline-block mr-1" /> Rekomendasikan Pengganti</h4>
          <p className="text-xs text-dark-400 mb-3">
            Anda dapat merekomendasikan pengganti jika tidak dapat menghadiri booking ini. Tim akan menghubungi klien untuk verifikasi.
          </p>
          <input
            type="text"
            value={recommendNote}
            onChange={(e) => setRecommendNote(e.target.value)}
            placeholder="Catatan atau alasan (opsional)"
            className="w-full rounded-xl bg-dark-700/50 px-3 py-2 text-xs text-white placeholder:text-dark-500 outline-none focus:ring-1 focus:ring-yellow-400/50 mb-3"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => setShowRecommendConfirm(false)}
            >
              Batal
            </Button>
            <button
              onClick={handleRecommend}
              disabled={loading === 'recommend-replacement'}
              className="flex-1 rounded-xl bg-yellow-400/20 px-3 py-2 text-xs font-medium text-yellow-300 transition-colors hover:bg-yellow-400/30 disabled:opacity-50"
            >
              {loading === 'recommend-replacement' ? 'Memproses...' : 'Kirim Rekomendasi'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Error message */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Primary action based on status */}
      {bookingStatus === 'CONFIRMED' && paymentStatus === 'ESCROW' && (
        <>
          <button
            onClick={() => handleAction('checkin')}
            disabled={loading === 'checkin' || !canCheckin}
            className={`w-full rounded-2xl px-4 py-4 text-sm font-medium transition-all ${
              canCheckin
                ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-500/25 active:scale-[0.98]'
                : 'bg-dark-700 text-dark-400 cursor-not-allowed'
            }`}
          >
            {loading === 'checkin' ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Memproses Check-in...
              </span>
            ) : canCheckin ? (
              <span className="flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4 inline-block" /> Check-in Sekarang
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock className="h-4 w-4 inline-block" /> Check-in tersedia 30 menit sebelum jadwal
              </span>
            )}
          </button>
          {!canCheckin && (
            <p className="text-center text-[10px] text-dark-500">
              Jadwal dimulai: {new Date(startTime).toLocaleString('id-ID', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          )}
        </>
      )}

      {bookingStatus === 'ONGOING' && (
        <button
          onClick={() => handleAction('checkout')}
          disabled={loading === 'checkout'}
          className="w-full rounded-2xl bg-green-500 px-4 py-4 text-sm font-medium text-white transition-all hover:bg-green-600 shadow-lg shadow-green-500/25 active:scale-[0.98] disabled:opacity-50"
        >
          {loading === 'checkout' ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Memproses Check-out...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 inline-block" /> Check-out & Selesai
            </span>
          )}
        </button>
      )}

      {/* Secondary actions */}
      <div className="flex gap-2">
        {/* SOS Button - always visible */}
        <a
          href="/user/safety"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
        >
          <ShieldAlert className="h-4 w-4 inline-block" /> Darurat
        </a>

        {/* Confirmed actions: client can cancel, escort can recommend replacement */}
        {bookingStatus === 'CONFIRMED' && userRole === 'CLIENT' && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dark-600/50 bg-dark-800/50 px-3 py-2.5 text-xs font-medium text-dark-400 transition-colors hover:text-dark-300 hover:bg-dark-700/50"
          >
            <X className="h-4 w-4 inline-block" /> Batalkan
          </button>
        )}
        {bookingStatus === 'CONFIRMED' && userRole === 'ESCORT' && (
          <button
            onClick={() => setShowRecommendConfirm(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-3 py-2.5 text-xs font-medium text-yellow-300 transition-colors hover:bg-yellow-400/10"
          >
            <RefreshCw className="h-4 w-4 inline-block" /> Rekomendasikan Pengganti
          </button>
        )}
      </div>
    </div>
  );
}
