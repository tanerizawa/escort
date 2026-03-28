'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { WizardShell, WizardStep, WizardNavigation } from '@/components/ui/wizard';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';

interface EscortInfo {
  id: string;
  hourlyRate: number;
  tier: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
}

function EscortCard({ escort }: { escort: EscortInfo }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dark-700/40 bg-dark-800/30 p-4">
      {escort.user?.profilePhoto ? (
        <img src={escort.user.profilePhoto} alt="" className="h-12 w-12 rounded-xl object-cover" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-400/10">
          <span className="text-lg font-medium text-brand-400">{escort.user?.firstName?.[0]}</span>
        </div>
      )}
      <div>
        <p className="font-medium text-dark-200">{escort.user?.firstName} {escort.user?.lastName}</p>
        <p className="text-xs text-dark-500">{escort.tier} · {formatCurrency(escort.hourlyRate)}/jam</p>
      </div>
    </div>
  );
}

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const escortId = searchParams?.get('escortId') || '';
  const profileId = searchParams?.get('profileId') || '';

  const [escort, setEscort] = useState<EscortInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    date: '',
    startTime: '',
    duration: 3,
    eventType: 'SOCIAL',
    location: '',
    notes: '',
  });

  useEffect(() => {
    if (profileId || escortId) {
      loadEscort();
    } else {
      setLoading(false);
    }
  }, [profileId, escortId]);

  const loadEscort = async () => {
    try {
      const lookupId = profileId || escortId;
      const res = await api.get(`/escorts/${lookupId}`);
      const d = res.data?.data || res.data;
      setEscort(d);
    } catch {
      setError('Pendamping tidak ditemukan');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = escort ? escort.hourlyRate * form.duration : 0;
  const platformFee = totalAmount * 0.2;
  const grandTotal = totalAmount + platformFee;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const startDateTime = new Date(`${form.date}T${form.startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + form.duration * 60 * 60 * 1000);

      if (isNaN(startDateTime.getTime())) {
        setError('Format tanggal atau waktu tidak valid');
        setSubmitting(false);
        return;
      }

      const res = await api.post('/bookings', {
        escortId: escort?.user?.id || escortId,
        serviceType: form.eventType,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: form.location.trim(),
        specialRequests: form.notes?.trim() || undefined,
      });

      router.push(`/user/bookings/${res.data?.data?.id || res.data?.id}`);
    } catch (err: any) {
      const data = err?.response?.data;
      const errors = data?.errors;
      if (Array.isArray(errors) && errors.length > 0) {
        setError(errors.join('. '));
      } else {
        setError(data?.message || 'Gagal membuat pemesanan');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  if (!escort && !error) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-light text-dark-100">Pilih Pendamping Terlebih Dahulu</h2>
        <p className="mt-2 text-sm text-dark-400">Silakan telusuri dan pilih pendamping dari daftar.</p>
        <Link href="/user/escorts" className="mt-4 inline-block text-sm text-brand-400 hover:text-brand-300">
          Telusuri Pendamping
        </Link>
      </div>
    );
  }

  const steps = [
    { label: 'Tanggal & Waktu' },
    { label: 'Durasi & Acara' },
    { label: 'Lokasi & Catatan' },
    { label: 'Konfirmasi' },
  ];

  return (
    <div className="mx-auto max-w-xl">
      <nav className="mb-6 text-sm text-dark-500">
        <Link href="/user/escorts" className="hover:text-brand-400 transition-colors">Pendamping</Link>
        <span className="mx-2">/</span>
        <Link href={`/user/escorts/${profileId || escort?.id}`} className="hover:text-brand-400 transition-colors">
          {escort?.user?.firstName} {escort?.user?.lastName}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-dark-300">Pemesanan</span>
      </nav>

      {escort && <EscortCard escort={escort} />}

      <div className="mt-6">
        <WizardShell steps={steps}>
          {/* Step 1: Date & Time */}
          <WizardStep>
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </div>
                <h2 className="text-xl font-light text-dark-100">Kapan acara Anda?</h2>
                <p className="mt-2 text-sm text-dark-400">Pilih tanggal dan waktu mulai</p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <Input
                  label="Tanggal"
                  type="date"
                  value={form.date}
                  onChange={(e) => { setForm({ ...form, date: e.target.value }); setError(''); }}
                  min={minDate}
                  required
                  leftIcon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  }
                />
                <Input
                  label="Waktu Mulai"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  required
                  leftIcon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  }
                />
              </div>

              <WizardNavigation nextDisabled={!form.date || !form.startTime} hideBack />
            </div>
          </WizardStep>

          {/* Step 2: Duration & Event Type */}
          <WizardStep>
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-light text-dark-100">Detail acara</h2>
                <p className="mt-2 text-sm text-dark-400">Tentukan durasi dan jenis acara Anda</p>
              </div>

              <div className="space-y-4">
                {/* Duration visual selector */}
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-dark-400">Durasi</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 4, 5, 6, 8, 10, 12, 24].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setForm({ ...form, duration: h })}
                        className={`rounded-xl border px-3 py-3 text-center transition-all ${
                          form.duration === h
                            ? 'border-brand-400/40 bg-brand-400/10 text-brand-400'
                            : 'border-dark-700/40 text-dark-400 hover:border-dark-600/50'
                        }`}
                      >
                        <span className="block text-lg font-light">{h}</span>
                        <span className="block text-[10px] text-dark-500">jam</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event type visual selector */}
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-dark-400">Jenis Acara</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'SOCIAL', label: 'Acara Sosial', icon: '🎉' },
                      { value: 'BUSINESS', label: 'Bisnis', icon: '💼' },
                      { value: 'FORMAL', label: 'Formal', icon: '🎩' },
                      { value: 'TRAVEL', label: 'Perjalanan', icon: '✈️' },
                      { value: 'DINING', label: 'Makan Malam', icon: '🍽️' },
                      { value: 'OTHER', label: 'Lainnya', icon: '📋' },
                    ].map((ev) => (
                      <button
                        key={ev.value}
                        type="button"
                        onClick={() => setForm({ ...form, eventType: ev.value })}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                          form.eventType === ev.value
                            ? 'border-brand-400/40 bg-brand-400/10'
                            : 'border-dark-700/40 hover:border-dark-600/50'
                        }`}
                      >
                        <span className="text-xl">{ev.icon}</span>
                        <span className={`text-sm ${form.eventType === ev.value ? 'text-brand-400' : 'text-dark-300'}`}>
                          {ev.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live price */}
                {escort && (
                  <div className="rounded-xl border border-dark-700/40 bg-dark-800/30 p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">{formatCurrency(escort.hourlyRate)} × {form.duration} jam</span>
                      <span className="text-dark-200">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                )}
              </div>

              <WizardNavigation />
            </div>
          </WizardStep>

          {/* Step 3: Location & Notes */}
          <WizardStep>
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-light text-dark-100">Di mana acaranya?</h2>
                <p className="mt-2 text-sm text-dark-400">Masukkan lokasi dan catatan tambahan</p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Lokasi"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Nama tempat, alamat lengkap"
                  required
                  autoFocus
                  error={form.location.length > 0 && form.location.trim().length < 5 ? 'Lokasi minimal 5 karakter' : undefined}
                  leftIcon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  }
                />
                <Textarea
                  label="Catatan Tambahan"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Informasi penting lainnya (dress code, detail acara, dll)"
                  hint="Opsional"
                />
              </div>

              <WizardNavigation nextDisabled={form.location.trim().length < 5} />
            </div>
          </WizardStep>

          {/* Step 4: Confirmation */}
          <WizardStep>
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-400/10 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-light text-dark-100">Konfirmasi pemesanan</h2>
                <p className="mt-2 text-sm text-dark-400">Periksa kembali detail pesanan Anda</p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Summary Card */}
              <div className="rounded-xl border border-dark-700/40 bg-dark-800/30 divide-y divide-dark-700/40">
                {escort && (
                  <div className="flex items-center gap-3 p-4">
                    {escort.user?.profilePhoto ? (
                      <img src={escort.user.profilePhoto} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-400/10">
                        <span className="text-sm font-medium text-brand-400">{escort.user?.firstName?.[0]}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-dark-200">{escort.user?.firstName} {escort.user?.lastName}</p>
                      <p className="text-xs text-dark-500">{escort.tier}</p>
                    </div>
                  </div>
                )}

                <div className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Tanggal</span>
                    <span className="text-dark-200">{form.date ? new Date(form.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Waktu</span>
                    <span className="text-dark-200">{form.startTime || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Durasi</span>
                    <span className="text-dark-200">{form.duration} jam</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Lokasi</span>
                    <span className="text-dark-200 text-right max-w-[200px]">{form.location || '-'}</span>
                  </div>
                  {form.notes && (
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Catatan</span>
                      <span className="text-dark-200 text-right max-w-[200px]">{form.notes}</span>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">{formatCurrency(escort?.hourlyRate || 0)} × {form.duration} jam</span>
                    <span className="text-dark-200">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Biaya Platform (20%)</span>
                    <span className="text-dark-200">{formatCurrency(platformFee)}</span>
                  </div>
                  <div className="flex justify-between border-t border-dark-700/50 pt-2 font-medium">
                    <span className="text-dark-200">Total</span>
                    <span className="text-brand-400 text-lg">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-dark-700/30 p-3 text-xs text-dark-500 text-center">
                Pembayaran menggunakan sistem escrow. Dana baru diteruskan ke pendamping setelah layanan selesai.
              </div>

              <WizardNavigation
                nextLabel="Buat Pemesanan"
                isLoading={submitting}
                onNext={() => { handleSubmit(); return false; }}
              />
            </div>
          </WizardStep>
        </WizardShell>
      </div>
    </div>
  );
}
