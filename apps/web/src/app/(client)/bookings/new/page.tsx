'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';

interface EscortInfo {
  id: string;
  hourlyRate: number;
  tier: string;
  user: {
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
}

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const escortId = searchParams.get('escortId') || '';

  const [escort, setEscort] = useState<EscortInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    date: '',
    startTime: '',
    duration: 3,
    eventType: 'SOCIAL',
    location: '',
    notes: '',
  });

  useEffect(() => {
    if (escortId) {
      loadEscort();
    } else {
      setLoading(false);
    }
  }, [escortId]);

  const loadEscort = async () => {
    try {
      const res = await api.get(`/escorts/${escortId}`);
      setEscort(res.data);
    } catch {
      setError('Escort tidak ditemukan');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = escort ? escort.hourlyRate * form.duration : 0;
  const platformFee = totalAmount * 0.2;
  const grandTotal = totalAmount + platformFee;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const startDateTime = new Date(`${form.date}T${form.startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + form.duration * 60 * 60 * 1000);

      const res = await api.post('/bookings', {
        escortProfileId: escortId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        eventType: form.eventType,
        location: form.location,
        notes: form.notes || undefined,
      });

      router.push(`/bookings/${res.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal membuat booking');
      setShowConfirm(false);
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
        <h2 className="text-xl font-light text-dark-100">Pilih Escort Terlebih Dahulu</h2>
        <p className="mt-2 text-sm text-dark-400">Silakan browse dan pilih escort dari daftar.</p>
        <Link href="/escorts" className="mt-4 inline-block text-sm text-brand-400 hover:text-brand-300">
          Browse Escorts
        </Link>
      </div>
    );
  }

  // Tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 text-sm text-dark-500">
        <Link href="/escorts" className="hover:text-brand-400 transition-colors">Escorts</Link>
        <span className="mx-2">/</span>
        <Link href={`/escorts/${escortId}`} className="hover:text-brand-400 transition-colors">
          {escort?.user.firstName} {escort?.user.lastName}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-dark-300">Booking</span>
      </nav>

      <h1 className="mb-6 text-2xl font-light text-dark-100">Buat Booking</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card className="mb-6">
              <CardHeader>
                <h3 className="text-lg font-medium text-dark-100">Detail Booking</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-dark-300">Tanggal</label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      min={minDate}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-dark-300">Waktu Mulai</label>
                    <Input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-dark-300">Durasi (jam)</label>
                    <Select
                      value={String(form.duration)}
                      onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                      options={[3, 4, 5, 6, 8, 10, 12, 24].map((h) => ({ value: String(h), label: `${h} jam` }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-dark-300">Jenis Acara</label>
                    <Select
                      value={form.eventType}
                      onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                      options={[
                        { value: 'SOCIAL', label: 'Social Event' },
                        { value: 'BUSINESS', label: 'Business Meeting' },
                        { value: 'FORMAL', label: 'Acara Formal' },
                        { value: 'TRAVEL', label: 'Perjalanan' },
                        { value: 'DINING', label: 'Dining' },
                        { value: 'OTHER', label: 'Lainnya' },
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark-300">Lokasi</label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Nama tempat, alamat lengkap"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark-300">Catatan Tambahan</label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    placeholder="Informasi penting lainnya (dress code, detail acara, dll)"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Confirm Modal */}
            {showConfirm && (
              <Card className="mb-6 border-brand-400/30">
                <CardContent className="py-6">
                  <h3 className="text-lg font-medium text-dark-100 mb-4">Konfirmasi Booking</h3>
                  <p className="text-sm text-dark-400 mb-4">
                    Apakah Anda yakin ingin membuat booking ini? Anda akan ditagihkan setelah escort menerima permintaan.
                  </p>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Memproses...' : 'Ya, Buat Booking'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowConfirm(false)}>
                      Batal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!showConfirm && (
              <Button type="submit" className="w-full">
                Lanjutkan ke Konfirmasi
              </Button>
            )}
          </form>
        </div>

        {/* Sidebar */}
        <div>
          <Card className="sticky top-24">
            <CardContent className="py-6">
              {/* Escort Info */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-dark-700/50">
                {escort?.user.profilePhoto ? (
                  <img
                    src={escort.user.profilePhoto}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-400/10">
                    <span className="text-lg font-medium text-brand-400">
                      {escort?.user.firstName?.[0]}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-dark-200">
                    {escort?.user.firstName} {escort?.user.lastName}
                  </p>
                  <p className="text-xs text-dark-400">{escort?.tier}</p>
                </div>
              </div>

              {/* Price Breakdown */}
              <h4 className="mb-3 text-sm font-medium text-dark-200">Rincian Biaya</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-400">
                    {formatCurrency(escort?.hourlyRate || 0)} x {form.duration} jam
                  </span>
                  <span className="text-dark-200">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Biaya Platform (20%)</span>
                  <span className="text-dark-200">{formatCurrency(platformFee)}</span>
                </div>
                <div className="flex justify-between border-t border-dark-700/50 pt-2 font-medium">
                  <span className="text-dark-200">Total</span>
                  <span className="text-brand-400">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-dark-700/30 p-3 text-xs text-dark-500">
                <p>Pembayaran menggunakan sistem escrow. Dana baru diteruskan ke escort setelah layanan selesai.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
