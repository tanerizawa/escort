'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface NotificationPreferences {
  // Channels
  inApp: boolean;
  email: boolean;
  push: boolean;
  whatsapp: boolean;
  // Types
  booking: boolean;
  chat: boolean;
  payment: boolean;
  promotion: boolean;
}

const CHANNEL_OPTIONS = [
  { key: 'inApp', label: 'In-App Notification', description: 'Notifikasi di dalam aplikasi', icon: '🔔' },
  { key: 'email', label: 'Email', description: 'Kirim notifikasi ke email Anda', icon: '📧' },
  { key: 'push', label: 'Push Notification', description: 'Notifikasi browser/mobile', icon: '📱' },
  { key: 'whatsapp', label: 'WhatsApp', description: 'Notifikasi via WhatsApp', icon: '💬' },
];

const TYPE_OPTIONS = [
  { key: 'booking', label: 'Booking', description: 'Update status booking, konfirmasi, pembatalan' },
  { key: 'chat', label: 'Chat', description: 'Pesan baru dari client atau escort' },
  { key: 'payment', label: 'Pembayaran', description: 'Konfirmasi pembayaran, refund, payout' },
  { key: 'promotion', label: 'Promosi', description: 'Promo, diskon, dan penawaran khusus' },
];

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    inApp: true,
    email: true,
    push: true,
    whatsapp: false,
    booking: true,
    chat: true,
    payment: true,
    promotion: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await api.get('/notifications/preferences');
        setPrefs(res.data);
      } catch {
        /* use defaults */
      } finally {
        setLoading(false);
      }
    };
    fetchPrefs();
  }, []);

  const handleToggle = async (key: string) => {
    const newValue = !prefs[key as keyof NotificationPreferences];
    setPrefs((prev) => ({ ...prev, [key]: newValue }));

    setSaving(true);
    try {
      await api.put('/notifications/preferences', { [key]: newValue });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Revert on failure
      setPrefs((prev) => ({ ...prev, [key]: !newValue }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-dark-800/30" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-light tracking-wide text-dark-100">Pengaturan Notifikasi</h1>
        <p className="mt-1 text-sm text-dark-400">
          Atur bagaimana dan kapan Anda ingin menerima notifikasi
        </p>
      </div>

      {/* Save Indicator */}
      {saved && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Pengaturan tersimpan
        </div>
      )}

      {/* Channel Preferences */}
      <div className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wider text-dark-400">
          Channel Notifikasi
        </h2>
        <div className="mt-4 space-y-3">
          {CHANNEL_OPTIONS.map((channel) => (
            <div
              key={channel.key}
              className="flex items-center justify-between rounded-xl border border-dark-700/30 bg-dark-800/20 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{channel.icon}</span>
                <div>
                  <p className="text-sm font-medium text-dark-200">{channel.label}</p>
                  <p className="text-xs text-dark-500">{channel.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(channel.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  prefs[channel.key as keyof NotificationPreferences]
                    ? 'bg-brand-400'
                    : 'bg-dark-600'
                }`}
                disabled={saving}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    prefs[channel.key as keyof NotificationPreferences]
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Type Preferences */}
      <div className="mt-10">
        <h2 className="text-sm font-medium uppercase tracking-wider text-dark-400">
          Tipe Notifikasi
        </h2>
        <div className="mt-4 space-y-3">
          {TYPE_OPTIONS.map((type) => (
            <div
              key={type.key}
              className="flex items-center justify-between rounded-xl border border-dark-700/30 bg-dark-800/20 p-4"
            >
              <div>
                <p className="text-sm font-medium text-dark-200">{type.label}</p>
                <p className="text-xs text-dark-500">{type.description}</p>
              </div>
              <button
                onClick={() => handleToggle(type.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  prefs[type.key as keyof NotificationPreferences]
                    ? 'bg-brand-400'
                    : 'bg-dark-600'
                }`}
                disabled={saving}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    prefs[type.key as keyof NotificationPreferences]
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="mt-10 rounded-xl border border-dark-700/30 bg-dark-800/20 p-4">
        <p className="text-xs leading-relaxed text-dark-500">
          Catatan: Notifikasi keamanan (SOS, verifikasi akun) tidak dapat dinonaktifkan
          demi keselamatan Anda. Perubahan pengaturan berlaku segera.
        </p>
      </div>
    </div>
  );
}
