'use client';

import { useState } from 'react';

interface PendingEscort {
  id: string;
  fullName: string;
  email: string;
  tier: string;
  submittedAt: string;
  photoUrl: string | null;
  certifications: string[];
}

export default function AdminPendingEscortsPage() {
  const [pendingList] = useState<PendingEscort[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    // TODO: PATCH /api/admin/escorts/:id/verify { status: 'APPROVED' }
    console.log('Approve escort:', id);
  };

  const handleReject = async (id: string) => {
    // TODO: PATCH /api/admin/escorts/:id/verify { status: 'REJECTED', reason: '...' }
    console.log('Reject escort:', id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light tracking-wide text-dark-100">Verifikasi Escort</h1>
        <p className="mt-1 text-sm text-dark-400">
          Review dan verifikasi pendaftaran escort partner baru
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2">
          <span className="text-xs text-amber-400">Pending: {pendingList.length}</span>
        </div>
      </div>

      {/* Pending List */}
      <div className="grid gap-4 lg:grid-cols-2">
        {pendingList.length === 0 ? (
          <div className="col-span-2 rounded-xl border border-dark-700/30 bg-dark-800/20 p-12 text-center">
            <p className="text-dark-400">Tidak ada escort yang menunggu verifikasi</p>
            <p className="mt-2 text-xs text-dark-500">Data akan muncul setelah backend terhubung</p>
          </div>
        ) : (
          pendingList.map((escort) => (
            <div
              key={escort.id}
              className={`rounded-xl border p-5 transition-colors ${
                selectedId === escort.id
                  ? 'border-brand-400/50 bg-dark-800/60'
                  : 'border-dark-700/50 bg-dark-800/30 hover:border-dark-600/50'
              }`}
              onClick={() => setSelectedId(escort.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-dark-100">{escort.fullName}</h3>
                  <p className="mt-1 text-xs text-dark-400">{escort.email}</p>
                </div>
                <span className="rounded-full bg-brand-400/10 px-2 py-0.5 text-xs text-brand-400">
                  {escort.tier}
                </span>
              </div>

              {escort.certifications.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {escort.certifications.map((cert, i) => (
                    <span key={i} className="rounded bg-dark-700/50 px-2 py-0.5 text-2xs text-dark-300">
                      {cert}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleApprove(escort.id); }}
                  className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/20"
                >
                  Approve
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleReject(escort.id); }}
                  className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/20"
                >
                  Reject
                </button>
              </div>

              <p className="mt-3 text-2xs text-dark-500">Diajukan: {escort.submittedAt}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
