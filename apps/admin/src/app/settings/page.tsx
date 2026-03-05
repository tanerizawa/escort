'use client';

import { useState } from 'react';

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState('general');

  const sections = [
    { id: 'general', label: 'General' },
    { id: 'pricing', label: 'Pricing & Fee' },
    { id: 'tiers', label: 'Escort Tiers' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light tracking-wide text-dark-100">Settings</h1>
        <p className="mt-1 text-sm text-dark-400">Konfigurasi platform ARETON.id</p>
      </div>

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
                    defaultValue="ARETON.id"
                    className="mt-2 w-full rounded-lg border border-dark-700 bg-dark-800/50 px-4 py-2.5 text-sm text-dark-200 focus:border-brand-400/50 focus:outline-none"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-dark-400">
                    Support Email
                  </label>
                  <input
                    type="email"
                    defaultValue="support@areton.id"
                    className="mt-2 w-full rounded-lg border border-dark-700 bg-dark-800/50 px-4 py-2.5 text-sm text-dark-200 focus:border-brand-400/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-dark-400">
                    Maintenance Mode
                  </label>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="relative h-6 w-11 rounded-full bg-dark-700">
                      <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-dark-400 transition-transform" />
                    </div>
                    <span className="text-sm text-dark-400">Nonaktif</span>
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
                    defaultValue={20}
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
                    defaultValue={3}
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
                {[
                  { name: 'Silver', rate: '500.000 - 1.000.000', color: 'text-gray-400' },
                  { name: 'Gold', rate: '1.000.000 - 2.500.000', color: 'text-yellow-400' },
                  { name: 'Platinum', rate: '2.500.000 - 5.000.000', color: 'text-blue-300' },
                  { name: 'Diamond', rate: '5.000.000+', color: 'text-cyan-300' },
                ].map((tier) => (
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
              <p className="text-sm text-dark-400">Konfigurasi notifikasi akan tersedia di Phase 6</p>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-light text-dark-100">Security Settings</h2>
              <p className="text-sm text-dark-400">Konfigurasi keamanan akan tersedia di Phase 8</p>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button className="rounded-lg bg-brand-400 px-6 py-2.5 text-sm font-medium text-dark-900 transition-colors hover:bg-brand-300">
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
