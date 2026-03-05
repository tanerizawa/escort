'use client';

import { useState } from 'react';

interface Dispute {
  id: string;
  bookingId: string;
  reporterName: string;
  respondentName: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function AdminDisputesPage() {
  const [disputes] = useState<Dispute[]>([]);
  const [activeTab, setActiveTab] = useState<'OPEN' | 'RESOLVED'>('OPEN');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light tracking-wide text-dark-100">Dispute Resolution</h1>
        <p className="mt-1 text-sm text-dark-400">
          Tangani dispute dan keluhan antara client dan escort
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-dark-800/50 p-1">
        {(['OPEN', 'RESOLVED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-2 text-sm transition-colors ${
              activeTab === tab
                ? 'bg-dark-700 text-dark-100'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            {tab === 'OPEN' ? 'Open Disputes' : 'Resolved'}
          </button>
        ))}
      </div>

      {/* Disputes List */}
      <div className="space-y-3">
        {disputes.length === 0 ? (
          <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-12 text-center">
            <p className="text-dark-400">
              {activeTab === 'OPEN' ? 'Tidak ada dispute terbuka' : 'Belum ada dispute yang diselesaikan'}
            </p>
            <p className="mt-2 text-xs text-dark-500">Data akan muncul setelah backend terhubung</p>
          </div>
        ) : (
          disputes.map((dispute) => (
            <div
              key={dispute.id}
              className="rounded-xl border border-dark-700/50 bg-dark-800/30 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      dispute.type === 'HARASSMENT' ? 'bg-red-500/10 text-red-400' :
                      dispute.type === 'PAYMENT' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      {dispute.type}
                    </span>
                    <span className="font-mono text-xs text-dark-500">#{dispute.id.slice(0, 8)}</span>
                  </div>
                  <p className="mt-2 text-sm text-dark-200">{dispute.description}</p>
                  <div className="mt-2 flex gap-4 text-xs text-dark-400">
                    <span>Reporter: {dispute.reporterName}</span>
                    <span>Respondent: {dispute.respondentName}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg bg-brand-400/10 px-3 py-1.5 text-xs text-brand-400 hover:bg-brand-400/20">
                    Review
                  </button>
                </div>
              </div>
              <p className="mt-3 text-2xs text-dark-500">Dilaporkan: {dispute.createdAt}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
