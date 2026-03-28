'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import AdminLayout from '@/components/admin-layout';

interface GdprOverview {
  totalExportRequests: number;
  pendingExports: number;
  completedExports: number;
  deletedAccounts: number;
}

interface ExportEntry {
  id: string;
  user: { name: string; email: string };
  format: string;
  status: string;
  downloadUrl: string | null;
  expiresAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export default function AdminDataRequestsPage() {
  const [overview, setOverview] = useState<GdprOverview | null>(null);
  const [exports, setExports] = useState<ExportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, exportsRes] = await Promise.all([
        api.get('/gdpr/admin/overview').catch(() => null),
        api.get(`/gdpr/admin/exports?page=${page}&limit=20`).catch(() => null),
      ]);

      if (overviewRes) {
        const d = overviewRes.data?.data || overviewRes.data;
        setOverview(d);
      }
      if (exportsRes) {
        const d = exportsRes.data?.data || exportsRes.data;
        const list = d?.data || d || [];
        setExports(Array.isArray(list) ? list : []);
        const pag = d?.pagination;
        if (pag) setTotalPages(pag.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-400/10 text-emerald-400';
      case 'PROCESSING': return 'bg-blue-400/10 text-blue-400';
      case 'PENDING': return 'bg-amber-400/10 text-amber-400';
      case 'FAILED': return 'bg-red-400/10 text-red-400';
      default: return 'bg-dark-700/30 text-dark-400';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-dark-600 border-t-brand-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light tracking-wide text-dark-100">Data Requests</h1>
        <p className="mt-1 text-sm text-dark-400">GDPR & UU PDP — Data export dan penghapusan akun</p>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-dark-500">Total Export Requests</p>
            <p className="mt-1 text-2xl font-light text-dark-100">{overview.totalExportRequests}</p>
          </div>
          <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-dark-500">Pending</p>
            <p className="mt-1 text-2xl font-light text-amber-400">{overview.pendingExports}</p>
          </div>
          <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-dark-500">Completed</p>
            <p className="mt-1 text-2xl font-light text-emerald-400">{overview.completedExports}</p>
          </div>
          <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-dark-500">Akun Dihapus</p>
            <p className="mt-1 text-2xl font-light text-red-400">{overview.deletedAccounts}</p>
          </div>
        </div>
      )}

      {/* Export Requests Table */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-dark-400">Riwayat Export Data</h2>
        {exports.length === 0 ? (
          <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-10 text-center text-dark-400">
            Belum ada permintaan export data
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-dark-700/50">
            <table className="w-full text-sm">
              <thead className="bg-dark-800/50">
                <tr className="text-left text-xs uppercase tracking-wider text-dark-500">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Dibuat</th>
                  <th className="px-4 py-3">Selesai</th>
                  <th className="px-4 py-3">Expired</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/30">
                {exports.map((e) => (
                  <tr key={e.id} className="hover:bg-dark-800/30">
                    <td className="px-4 py-3">
                      <p className="text-dark-200">{e.user.name}</p>
                      <p className="text-xs text-dark-500">{e.user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-dark-700/50 px-2 py-0.5 text-xs uppercase text-dark-300">
                        {e.format}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(e.status)}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-dark-400">
                      {new Date(e.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-xs text-dark-400">
                      {e.completedAt ? new Date(e.completedAt).toLocaleDateString('id-ID') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-dark-400">
                      {e.expiresAt ? new Date(e.expiresAt).toLocaleDateString('id-ID') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-dark-600/30 px-3 py-1.5 text-sm text-dark-300 hover:text-dark-100 disabled:opacity-30"
          >
            Prev
          </button>
          <span className="text-sm text-dark-400">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-dark-600/30 px-3 py-1.5 text-sm text-dark-300 hover:text-dark-100 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}

      {/* GDPR Info */}
      <div className="rounded-lg border border-dark-700/50 bg-dark-800/30 p-5">
        <h3 className="mb-2 text-sm font-semibold text-dark-200">Kepatuhan Regulasi</h3>
        <div className="space-y-2 text-xs text-dark-400">
          <p>Platform ini mematuhi GDPR (EU) dan UU PDP (Indonesia) untuk perlindungan data pribadi:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-dark-300">Hak Akses (Pasal 13)</strong> — User dapat melihat semua data yang disimpan</li>
            <li><strong className="text-dark-300">Hak Portabilitas (Pasal 13)</strong> — Data dapat diexport dalam format JSON</li>
            <li><strong className="text-dark-300">Hak Penghapusan (Pasal 14)</strong> — User dapat menghapus akun dan data personal</li>
            <li><strong className="text-dark-300">Hak Koreksi (Pasal 13)</strong> — User dapat memperbarui data yang tidak akurat</li>
          </ul>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
}
