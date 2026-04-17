'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import AdminLayout from '@/components/admin-layout';

interface PlatformConfig {
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  commission: number;
  minBookingDuration: number;
  tiers: { name: string; rate: string; color: string }[];
}

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [config, setConfig] = useState<PlatformConfig>({
    platformName: 'ARETON.id',
    supportEmail: 'support@areton.id',
    maintenanceMode: false,
    commission: 20,
    minBookingDuration: 3,
    tiers: [
      { name: 'Silver', rate: '500.000 - 1.000.000', color: 'text-gray-400' },
      { name: 'Gold', rate: '1.000.000 - 2.500.000', color: 'text-yellow-400' },
      { name: 'Platinum', rate: '2.500.000 - 5.000.000', color: 'text-blue-300' },
      { name: 'Diamond', rate: '5.000.000+', color: 'text-cyan-300' },
    ],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const sections = [
    { id: 'general', label: 'General' },
    { id: 'pricing', label: 'Pricing & Fee' },
    { id: 'tiers', label: 'Escort Tiers' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security' },
  ];

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/config');
      const data = res.data?.data || res.data || {};
      setConfig((prev) => ({
        ...prev,
        platformName: data.platformName || prev.platformName,
        supportEmail: data.supportEmail || prev.supportEmail,
        commission: data.commissionRate ?? prev.commission,
        minBookingDuration: data.minBookingHours ?? prev.minBookingDuration,
      }));
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.put('/admin/config/commission', {
        commissionRate: config.commission,
        minBookingHours: config.minBookingDuration,
        supportEmail: config.supportEmail,
      });
      setMessage('Pengaturan berhasil disimpan');
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light tracking-wide text-dark-100">Settings</h1>
        <p className="mt-1 text-sm text-dark-400">Konfigurasi platform ARETON.id</p>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${message.includes('berhasil') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message}
        </div>
      )}

      <div className="flex gap-6">
        {/* Settings Nav */}
        <nav className="w-48 flex-shrink-0 space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                activeSection === section.id
                  ? 'bg-brand-400/10 text-brand-400'
                  : 'text-dark-400 hover:bg-dark-800/50 hover:text-dark-200'
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>

        {/* Settings Content */}
        <div className="flex-1 rounded-xl border border-dark-700/50 bg-dark-800/30 p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-dark-600 border-t-brand-400" />
            </div>
          ) : (
            <>
              {activeSection === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-light text-dark-100">General Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-dark-400">
                        Platform Name
                      </label>
                      <input
                        type="text"
                        value={config.platformName}
                        onChange={(e) => setConfig({ ...config, platformName: e.target.value })}
                        className="mt-2 w-full rounded-lg border border-dark-700 bg-dark-800/50 px-4 py-2.5 text-sm text-dark-200 focus:border-brand-400/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-dark-400">
                        Support Email
                      </label>
                      <input
                        type="email"
                        value={config.supportEmail}
                        onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                        className="mt-2 w-full rounded-lg border border-dark-700 bg-dark-800/50 px-4 py-2.5 text-sm text-dark-200 focus:border-brand-400/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-dark-400">
                        Maintenance Mode
                      </label>
                      <div className="mt-2 flex items-center gap-3">
                        <button
                          onClick={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })}
                          className={`relative h-6 w-11 rounded-full transition-colors ${config.maintenanceMode ? 'bg-brand-400' : 'bg-dark-700'}`}
                        >
                          <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${config.maintenanceMode ? 'left-6' : 'left-1'}`} />
                        </button>
                        <span className="text-sm text-dark-400">{config.maintenanceMode ? 'Aktif' : 'Nonaktif'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'pricing' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-light text-dark-100">Pricing & Fee Configuration</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-dark-400">
                        Platform Commission (%)
                      </label>
                      <input
                        type="number"
                        value={config.commission}
                        onChange={(e) => setConfig({ ...config, commission: parseInt(e.target.value) || 0 })}
                        className="mt-2 w-32 rounded-lg border border-dark-700 bg-dark-800/50 px-4 py-2.5 text-sm text-dark-200 focus:border-brand-400/50 focus:outline-none"
                      />
                      <p className="mt-1 text-xs text-dark-500">Persentase komisi platform dari setiap booking</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-dark-400">
                        Minimum Booking Duration (jam)
                      </label>
                      <input
                        type="number"
                        value={config.minBookingDuration}
                        onChange={(e) => setConfig({ ...config, minBookingDuration: parseInt(e.target.value) || 1 })}
                        className="mt-2 w-32 rounded-lg border border-dark-700 bg-dark-800/50 px-4 py-2.5 text-sm text-dark-200 focus:border-brand-400/50 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'tiers' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-light text-dark-100">Escort Tier Configuration</h2>
                  <div className="space-y-3">
                    {config.tiers.map((tier) => (
                      <div key={tier.name} className="flex items-center justify-between rounded-lg border border-dark-700/50 bg-dark-800/20 px-4 py-3">
                        <span className={`font-medium ${tier.color}`}>{tier.name}</span>
                        <span className="text-sm text-dark-400">Rp {tier.rate}/jam</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-light text-dark-100">Notification Settings</h2>
                  <p className="text-sm text-dark-400">Konfigurasi notifikasi dikelola melalui environment variables (Firebase FCM, Brevo SMTP, Twilio WhatsApp). Lihat Runbook untuk detail.</p>
                </div>
              )}

              {activeSection === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-light text-dark-100">Security Settings</h2>
                  <p className="text-sm text-dark-400">Konfigurasi keamanan dikelola melalui environment variables (JWT secrets, encryption keys, rate limits). Lihat Runbook untuk detail.</p>
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-brand-400 px-6 py-2.5 text-sm font-medium text-dark-900 transition-colors hover:bg-brand-300 disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </AdminLayout>
  );
}
