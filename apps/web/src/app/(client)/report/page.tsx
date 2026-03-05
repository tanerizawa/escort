'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface BookingInfo {
  id: string;
  escortName: string;
  clientName: string;
  serviceType: string;
  startTime: string;
  location: string;
}

const incidentTypes = [
  { value: 'HARASSMENT', label: 'Pelecehan', description: 'Tindakan pelecehan verbal atau fisik' },
  { value: 'SAFETY_THREAT', label: 'Ancaman Keamanan', description: 'Merasa terancam atau tidak aman' },
  { value: 'NO_SHOW', label: 'Tidak Hadir', description: 'Pihak lain tidak datang tanpa pemberitahuan' },
  { value: 'INAPPROPRIATE_BEHAVIOR', label: 'Tingkah Laku Tidak Pantas', description: 'Perilaku tidak sesuai ketentuan layanan' },
  { value: 'PAYMENT_DISPUTE', label: 'Sengketa Pembayaran', description: 'Masalah terkait pembayaran atau biaya' },
  { value: 'LOCATION_MISMATCH', label: 'Lokasi Tidak Sesuai', description: 'Lokasi pertemuan berbeda dari perjanjian' },
  { value: 'OTHER', label: 'Lainnya', description: 'Masalah lain yang perlu dilaporkan' },
];

const severityLevels = [
  { value: 'LOW', label: 'Rendah', color: 'border-blue-500/30 bg-blue-500/10 text-blue-400', description: 'Masalah kecil, tidak mendesak' },
  { value: 'MEDIUM', label: 'Sedang', color: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400', description: 'Memerlukan perhatian dalam 24 jam' },
  { value: 'HIGH', label: 'Tinggi', color: 'border-orange-500/30 bg-orange-500/10 text-orange-400', description: 'Perlu penanganan segera' },
  { value: 'CRITICAL', label: 'Kritis', color: 'border-red-500/30 bg-red-500/10 text-red-400', description: 'Darurat, keselamatan terancam' },
];

export default function ReportIncidentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [type, setType] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBooking({
          id: data.id,
          escortName: `${data.escort?.firstName || ''} ${data.escort?.lastName || ''}`.trim(),
          clientName: `${data.client?.firstName || ''} ${data.client?.lastName || ''}`.trim(),
          serviceType: data.serviceType,
          startTime: data.startTime,
          location: data.location,
        });
      }
    } catch (err) {
      console.error('Failed to fetch booking:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(
      (f) => f.size <= 10 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'].includes(f.type)
    );
    setEvidence((prev) => [...prev, ...validFiles].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setEvidence((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !description.trim()) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const formData = new FormData();
      formData.append('type', type);
      formData.append('severity', severity);
      formData.append('description', description);
      if (bookingId) formData.append('bookingId', bookingId);
      evidence.forEach((file) => formData.append('evidence', file));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/incidents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setReportId(data.id);
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
          <svg className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="mt-6 text-2xl font-light text-dark-100">Laporan Terkirim</h1>
        <p className="mt-2 text-sm text-dark-400">
          Tim keamanan kami akan meninjau laporan Anda dan menghubungi Anda dalam waktu 1x24 jam.
        </p>
        {reportId && (
          <p className="mt-4 text-xs text-dark-500">
            ID Laporan: <span className="font-mono text-dark-300">{reportId}</span>
          </p>
        )}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => router.push('/bookings')}
            className="rounded-xl border border-dark-600/50 px-6 py-2.5 text-sm text-dark-200 transition-colors hover:border-dark-500/50"
          >
            Kembali ke Booking
          </button>
          <button
            onClick={() => router.push('/support')}
            className="rounded-xl bg-brand-400 px-6 py-2.5 text-sm font-medium text-dark-900 transition-colors hover:bg-brand-300"
          >
            Hubungi Support
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-light tracking-wide text-dark-100">Laporkan Insiden</h1>
        <p className="mt-1 text-sm text-dark-400">
          Keamanan Anda adalah prioritas kami. Laporkan masalah apa pun yang Anda alami.
        </p>
      </div>

      {/* Booking Context */}
      {booking && (
        <div className="mb-6 rounded-xl border border-dark-700/30 bg-dark-800/20 p-4">
          <p className="text-xs text-dark-500">Terkait Booking</p>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-100">
                {booking.escortName || booking.clientName}
              </p>
              <p className="text-xs text-dark-400">
                {booking.serviceType} · {new Date(booking.startTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <p className="text-xs text-dark-400">{booking.location}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Incident Type */}
        <div>
          <label className="mb-3 block text-sm font-medium text-dark-200">Jenis Insiden *</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {incidentTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  type === t.value
                    ? 'border-brand-400/50 bg-brand-400/5'
                    : 'border-dark-700/30 bg-dark-800/10 hover:border-dark-600/50'
                }`}
              >
                <p className={`text-sm font-medium ${type === t.value ? 'text-brand-400' : 'text-dark-200'}`}>
                  {t.label}
                </p>
                <p className="mt-0.5 text-xs text-dark-500">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div>
          <label className="mb-3 block text-sm font-medium text-dark-200">Tingkat Keparahan *</label>
          <div className="flex gap-2">
            {severityLevels.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSeverity(s.value)}
                className={`flex-1 rounded-xl border p-3 text-center transition-all ${
                  severity === s.value ? s.color : 'border-dark-700/30 bg-dark-800/10 text-dark-400 hover:border-dark-600/50'
                }`}
              >
                <p className="text-sm font-medium">{s.label}</p>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-dark-500">
            {severityLevels.find((s) => s.value === severity)?.description}
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="mb-2 block text-sm font-medium text-dark-200">Deskripsi Insiden *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            required
            minLength={20}
            placeholder="Jelaskan secara detail apa yang terjadi, kapan, dan bagaimana kronologisnya..."
            className="w-full rounded-xl border border-dark-600/50 bg-dark-800/30 px-4 py-3 text-sm text-dark-100 placeholder:text-dark-500 focus:border-brand-400/50 focus:outline-none focus:ring-1 focus:ring-brand-400/30"
          />
          <p className="mt-1 text-xs text-dark-500">{description.length}/1000 karakter (min. 20)</p>
        </div>

        {/* Evidence Upload */}
        <div>
          <label className="mb-2 block text-sm font-medium text-dark-200">Bukti (Opsional)</label>
          <p className="mb-3 text-xs text-dark-500">Upload foto atau video sebagai bukti (maks. 5 file, 10MB per file)</p>

          {evidence.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {evidence.map((file, i) => (
                <div key={i} className="group relative rounded-lg border border-dark-700/30 bg-dark-800/30 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-dark-300">{file.name.slice(0, 20)}{file.name.length > 20 ? '...' : ''}</span>
                    <span className="text-2xs text-dark-500">{(file.size / (1024 * 1024)).toFixed(1)}MB</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-dark-500 hover:text-red-400">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {evidence.length < 5 && (
            <label className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-dark-600/50 py-6 transition-colors hover:border-dark-500/50">
              <input type="file" accept="image/*,video/mp4" multiple onChange={handleFileChange} className="hidden" />
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="mt-2 text-xs text-dark-400">Klik untuk upload</p>
              </div>
            </label>
          )}
        </div>

        {/* Emergency Notice */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex gap-3">
            <svg className="h-5 w-5 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            <div>
              <p className="text-sm font-medium text-red-300">Dalam bahaya segera?</p>
              <p className="mt-1 text-xs text-red-400">
                Jika Anda dalam bahaya langsung, tekan tombol SOS merah di layar atau hubungi polisi (110).
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-dark-600/50 px-6 py-3 text-sm text-dark-300 transition-colors hover:border-dark-500/50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!type || description.length < 20 || submitting}
            className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-40"
          >
            {submitting ? 'Mengirim...' : 'Kirim Laporan'}
          </button>
        </div>
      </form>
    </div>
  );
}
