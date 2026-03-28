'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { ActiveBooking, useActiveBookingStore } from '@/stores/active-booking.store';
import { TransactionProgress } from './TransactionProgress';
import { TransactionTimer } from './TransactionTimer';
import { TransactionPartnerInfo } from './TransactionPartnerInfo';
import { TransactionChat } from './TransactionChat';
import { TransactionActions } from './TransactionActions';
import { formatCurrency } from '@/lib/utils';
import { BellRing, Calendar, CheckCircle2, CircleDot, ClipboardList, Clock, CreditCard, DollarSign, HeartPulse, Lightbulb, Lock, MapPin, PenLine, Phone, Scale, ShieldAlert, Timer, User, X } from 'lucide-react';
import { Icon } from '@/components/ui/icon';

/* ═══════════════════════════════════════════
   SOS / Safety Modal — embedded in lock mode
   ═══════════════════════════════════════════ */

const EMERGENCY_CONTACTS = [
  { name: 'ARETON.id Support', number: '021-5555-8888', available: '24/7', icon: 'BellRing' },
  { name: 'Polisi (Darurat)', number: '110', available: '24/7', icon: 'ShieldAlert' },
  { name: 'Ambulans', number: '118 / 119', available: '24/7', icon: 'HeartPulse' },
  { name: 'Komnas Perempuan', number: '021-3903963', available: 'Senin-Jumat', icon: 'Scale' },
  { name: 'Hotline Kekerasan', number: '129', available: '24/7', icon: 'Phone' },
];

function SOSModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-dark-800 border border-dark-700/50 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-red-500/10 border-b border-red-500/20 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-6 w-6" />
            <div>
              <h2 className="text-base font-semibold text-red-400">Keadaan Darurat</h2>
              <p className="text-[11px] text-red-400/60">Hubungi bantuan segera</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-dark-700 text-dark-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4 inline-block" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 space-y-3">
          {EMERGENCY_CONTACTS.map((contact) => (
            <a
              key={contact.number}
              href={`tel:${contact.number.replace(/[^0-9+]/g, '')}`}
              className="flex items-center gap-3 rounded-2xl border border-dark-600/50 bg-dark-700/50 p-4 transition-colors hover:bg-dark-700/80 active:scale-[0.98]"
            >
              <span className="text-2xl"><Icon name={contact.icon} className="h-6 w-6" /></span>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{contact.name}</p>
                <p className="text-xs text-dark-400">{contact.available}</p>
              </div>
              <span className="text-base font-mono text-brand-400">{contact.number}</span>
            </a>
          ))}

          <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <h3 className="text-xs font-medium text-yellow-400 mb-2"><Lightbulb className="h-4 w-4 inline-block mr-1" /> Tips Keamanan</h3>
            <ul className="space-y-1.5 text-xs text-dark-400">
              <li>• Jika merasa tidak aman, segera tinggalkan lokasi</li>
              <li>• Hubungi polisi (110) untuk keadaan darurat</li>
              <li>• Gunakan fitur laporan insiden setelah situasi aman</li>
              <li>• Jangan ragu untuk meminta bantuan orang sekitar</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Booking Switcher — for multiple active bookings
   ═══════════════════════════════════════════ */

function BookingSwitcher({
  bookings,
  selectedIndex,
  onSelect,
  onClose,
  isClient,
}: {
  bookings: ActiveBooking[];
  selectedIndex: number;
  onSelect: (idx: number) => void;
  onClose: () => void;
  isClient: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-dark-800 border border-dark-700/50 overflow-hidden max-h-[80vh] flex flex-col">
        <div className="px-5 py-4 border-b border-dark-700/50 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-white">Transaksi Aktif ({bookings.length})</h2>
            <p className="text-[11px] text-dark-400">Pilih booking yang ingin dilihat</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-dark-700 text-dark-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4 inline-block" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-2">
          {bookings.map((b, i) => {
            const isSelected = i === selectedIndex;
            const start = new Date(b.startTime);
            const partner = isClient ? b.escort : b.client;
            const partnerName = `${partner?.firstName || ''} ${partner?.lastName || ''}`.trim();
            return (
              <button
                key={b.id}
                onClick={() => { onSelect(i); onClose(); }}
                className={`w-full rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'border-brand-500/40 bg-brand-500/10'
                    : 'border-dark-600/50 bg-dark-700/30 hover:bg-dark-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${b.status === 'ONGOING' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`} />
                    <span className="text-sm font-medium text-white">{b.serviceType}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    b.status === 'ONGOING'
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {b.status === 'ONGOING' ? 'Berlangsung' : 'Siap Check-in'}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-dark-400">
                  <span><User className="h-4 w-4 inline-block mr-1" /> {partnerName}</span>
                  <span><Calendar className="h-4 w-4 inline-block mr-1" /> {start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                  <span><Clock className="h-4 w-4 inline-block mr-1" /> {start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="mt-1 text-xs text-dark-500"><MapPin className="h-4 w-4 inline-block mr-1" /> {b.location}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Transaction Screen
   ═══════════════════════════════════════════ */

interface TransactionScreenProps {
  booking: ActiveBooking;
  phase: string;
  onMinimize?: () => void;
}

export function TransactionScreen({ booking, phase, onMinimize }: TransactionScreenProps) {
  const { user } = useAuthStore();
  const { bookings, totalActive, selectedIndex, selectBooking } = useActiveBookingStore();
  const [chatExpanded, setChatExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);

  const isClient = user?.role === 'CLIENT';
  const partner = isClient ? booking.escort : booking.client;
  const partnerRole = isClient ? 'ESCORT' : 'CLIENT';

  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);
  const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

  const paymentStatus = booking.payment?.status;
  const paymentType = booking.payment?.paymentType;
  const displayAmount = booking.payment?.chargeAmount || booking.payment?.amount || booking.totalAmount;

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-dark-900 overflow-hidden">
        {/* ═══════════ Header ═══════════ */}
        <header className="shrink-0 border-b border-dark-700/50 bg-dark-900/95 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10">
                {booking.status === 'ONGOING' ? <CircleDot className="h-4 w-4 text-green-400" /> : <Lock className="h-4 w-4 text-brand-400" />}
              </div>
              <div>
                <h1 className="text-sm font-medium text-white">Transaksi Aktif</h1>
                <p className="text-[10px] text-dark-400">
                  {booking.status === 'ONGOING' ? 'Sedang berlangsung' : 'Siap check-in'}
                </p>
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-1.5">
              {/* Booking switcher (if multiple) */}
              {totalActive > 1 && (
                <button
                  onClick={() => setShowSwitcher(true)}
                  className="flex h-9 items-center gap-1.5 rounded-xl bg-dark-800 border border-dark-600/50 px-2.5 text-xs text-dark-300 transition-colors hover:bg-dark-700"
                >
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                    {totalActive}
                  </span>
                  <span className="hidden sm:inline">Booking</span>
                </button>
              )}

              {/* SOS Button */}
              <button
                onClick={() => setShowSOS(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-sm text-red-400 transition-colors hover:bg-red-500/20"
                title="Keadaan Darurat"
              >
                <ShieldAlert className="h-4 w-4 inline-block" />
              </button>

              {/* Minimize Button */}
              {onMinimize && (
                <button
                  onClick={onMinimize}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-dark-700/50 text-dark-400 transition-colors hover:bg-dark-700 hover:text-white"
                  title="Perkecil"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-4 pb-3">
            <TransactionProgress
              bookingStatus={booking.status}
              paymentStatus={paymentStatus}
            />
          </div>
        </header>

        {/* ═══════════ Scrollable Content ═══════════ */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-lg space-y-3 p-4">

            {/* Multi-booking indicator */}
            {totalActive > 1 && (
              <div className="flex items-center justify-between rounded-xl border border-brand-500/20 bg-brand-500/5 px-3 py-2">
                <span className="text-xs text-brand-400">
                  Booking {selectedIndex + 1} dari {totalActive}
                </span>
                <div className="flex items-center gap-1">
                  {bookings.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => selectBooking(i)}
                      className={`h-2 rounded-full transition-all ${
                        i === selectedIndex
                          ? 'w-6 bg-brand-500'
                          : 'w-2 bg-dark-600 hover:bg-dark-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Partner Info */}
            <TransactionPartnerInfo
              partner={partner}
              role={partnerRole as 'CLIENT' | 'ESCORT'}
              onChat={() => setChatExpanded(true)}
            />

            {/* ───── Booking Details Card ───── */}
            <div className="rounded-2xl border border-dark-700/50 bg-dark-800/60 overflow-hidden">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-dark-800/80"
              >
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  <div>
                    <h3 className="text-sm font-medium text-white">{booking.serviceType}</h3>
                    <p className="text-xs text-dark-400">
                      {startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}
                      {startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {endDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className={`text-dark-500 text-xs transition-transform ${showDetails ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {showDetails && (
                <div className="border-t border-dark-700/30 px-4 pb-4 pt-3 space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 mt-0.5" />
                    <div>
                      <p className="text-xs text-dark-400">Lokasi</p>
                      <p className="text-sm text-white">{booking.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Timer className="h-3.5 w-3.5 mt-0.5" />
                    <div>
                      <p className="text-xs text-dark-400">Durasi</p>
                      <p className="text-sm text-white">{durationHours} jam</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <DollarSign className="h-3.5 w-3.5 mt-0.5" />
                    <div>
                      <p className="text-xs text-dark-400">
                        {paymentType === 'DP_50' ? 'Pembayaran (DP 50%)' : 'Total Pembayaran'}
                      </p>
                      <p className="text-sm font-medium text-white">{formatCurrency(displayAmount)}</p>
                      {paymentType === 'DP_50' && (
                        <p className="text-[10px] text-yellow-400">
                          Total: {formatCurrency(booking.totalAmount)} — Sisa dibayar setelah layanan
                        </p>
                      )}
                    </div>
                  </div>

                  {booking.payment && (
                    <div className="flex items-start gap-2">
                      <CreditCard className="h-3.5 w-3.5 mt-0.5" />
                      <div>
                        <p className="text-xs text-dark-400">Status Pembayaran</p>
                        <p className={`text-sm font-medium ${
                          paymentStatus === 'ESCROW' ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {paymentStatus === 'ESCROW' ? '<CheckCircle2 className="h-4 w-4 inline-block" /> Lunas (Escrow)' : paymentStatus}
                        </p>
                      </div>
                    </div>
                  )}

                  {booking.specialRequests && (
                    <div className="flex items-start gap-2">
                      <PenLine className="h-3.5 w-3.5 mt-0.5" />
                      <div>
                        <p className="text-xs text-dark-400">Catatan Khusus</p>
                        <p className="text-sm text-dark-300">{booking.specialRequests}</p>
                      </div>
                    </div>
                  )}

                  {!isClient && booking.payment && (
                    <div className="mt-2 rounded-xl border border-green-500/20 bg-green-500/5 p-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-dark-400">Total Booking</span>
                        <span className="text-dark-300">{formatCurrency(booking.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-dark-400">Fee Platform (20%)</span>
                        <span className="text-red-400">-{formatCurrency(booking.payment.platformFee)}</span>
                      </div>
                      <div className="border-t border-green-500/20 mt-2 pt-2 flex justify-between text-sm">
                        <span className="text-green-400 font-medium">Pendapatan Bersih</span>
                        <span className="text-green-400 font-medium">{formatCurrency(booking.payment.escortPayout)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ───── Timer ───── */}
            <TransactionTimer
              startTime={booking.startTime}
              endTime={booking.endTime}
              checkinAt={booking.checkinAt}
              bookingStatus={booking.status}
            />

            {/* ───── Chat ───── */}
            <TransactionChat
              bookingId={booking.id}
              initialMessages={booking.messages}
              isExpanded={chatExpanded}
              onToggle={() => setChatExpanded(!chatExpanded)}
            />
          </div>
        </main>

        {/* ═══════════ Bottom Actions ═══════════ */}
        <footer className="shrink-0 border-t border-dark-700/50 bg-dark-900/95 backdrop-blur-xl p-4">
          <div className="mx-auto max-w-lg">
            <TransactionActions
              bookingId={booking.id}
              bookingStatus={booking.status}
              paymentStatus={paymentStatus}
              userRole={user?.role as 'CLIENT' | 'ESCORT'}
              startTime={booking.startTime}
            />
          </div>
        </footer>
      </div>

      {/* ═══════════ Modals ═══════════ */}
      {showSOS && <SOSModal onClose={() => setShowSOS(false)} />}
      {showSwitcher && (
        <BookingSwitcher
          bookings={bookings}
          selectedIndex={selectedIndex}
          onSelect={selectBooking}
          onClose={() => setShowSwitcher(false)}
          isClient={!!isClient}
        />
      )}
    </>
  );
}
