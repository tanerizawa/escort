'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check } from 'lucide-react';

interface PrivacyDashboard {
  dataCategories: Array<{ category: string; description: string; count: number }>;
  rights: Array<{ right: string; description: string; available: boolean }>;
  lastExport: string | null;
}

export default function PrivacyPage() {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<PrivacyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    loadDashboard();
    return () => {
      if (exportIntervalRef.current) clearInterval(exportIntervalRef.current);
    };
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get('/gdpr/dashboard');
      setDashboard(res.data.data || res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const exportIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requestExport = async () => {
    setExporting(true);
    try {
      await api.post('/gdpr/export');
      setExportStatus('PENDING');
      pollExportStatus();
    } catch {
      setExportStatus('ERROR');
    } finally {
      setExporting(false);
    }
  };

  const pollExportStatus = () => {
    if (exportIntervalRef.current) clearInterval(exportIntervalRef.current);
    exportIntervalRef.current = setInterval(async () => {
      try {
        const res = await api.get('/gdpr/export/status');
        const data = res.data.data || res.data;
        setExportStatus(data.status);
        if (data.status === 'COMPLETED' || data.status === 'EXPIRED') {
          if (exportIntervalRef.current) clearInterval(exportIntervalRef.current);
          exportIntervalRef.current = null;
          if (data.downloadUrl) {
            window.open(data.downloadUrl, '_blank');
          }
        }
      } catch {
        if (exportIntervalRef.current) clearInterval(exportIntervalRef.current);
        exportIntervalRef.current = null;
      }
    }, 3000);
  };

  const requestDelete = async () => {
    if (!deletePassword) { setDeleteError('Masukkan password Anda'); return; }
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.post('/gdpr/delete-account', { password: deletePassword });
      window.location.href = '/';
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message || 'Gagal menghapus akun');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-900">
        <p className="text-dark-400">Silakan login untuk mengakses dashboard privasi</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-2xl font-light text-dark-100">
          Dashboard <span className="text-brand-400">Privasi</span>
        </h1>
        <p className="mb-8 text-dark-400">
          Kelola data pribadi Anda sesuai UU PDP Indonesia & GDPR
        </p>

        {/* Data categories */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-medium text-dark-100">Data yang Kami Simpan</h2>
            <div className="space-y-3">
              {dashboard?.dataCategories?.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between rounded-lg bg-dark-700/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-dark-200">{cat.category}</p>
                    <p className="text-xs text-dark-500">{cat.description}</p>
                  </div>
                  <span className="rounded-full bg-dark-600/50 px-2 py-0.5 text-xs text-dark-400">
                    {cat.count} entri
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Your rights */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-medium text-dark-100">Hak-Hak Anda</h2>
            <div className="space-y-3">
              {dashboard?.rights?.map((right) => (
                <div key={right.right} className="flex items-start gap-3 rounded-lg bg-dark-700/30 px-4 py-3">
                  <span className={`mt-0.5 text-sm ${right.available ? 'text-green-400' : 'text-dark-600'}`}>
                    {right.available ? <Check className="h-4 w-4" /> : '○'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-dark-200">{right.right}</p>
                    <p className="text-xs text-dark-500">{right.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Export data */}
        <Card className="mb-6 border-brand-400/20">
          <CardContent className="p-6">
            <h2 className="mb-2 text-lg font-medium text-dark-100">Ekspor Data Anda</h2>
            <p className="mb-4 text-sm text-dark-400">
              Unduh salinan lengkap semua data pribadi Anda dalam format JSON
            </p>
            <div className="flex items-center gap-4">
              <Button onClick={requestExport} disabled={exporting || exportStatus === 'PENDING' || exportStatus === 'PROCESSING'}>
                {exporting ? 'Memproses...' : exportStatus === 'PENDING' || exportStatus === 'PROCESSING' ? 'Sedang Diproses...' : 'Minta Ekspor Data'}
              </Button>
              {exportStatus === 'COMPLETED' && (
                <span className="text-sm text-green-400"><Check className="h-4 w-4 inline-block mr-1" /> Ekspor selesai</span>
              )}
            </div>
            {dashboard?.lastExport && (
              <p className="mt-3 text-xs text-dark-500">
                Ekspor terakhir: {new Date(dashboard.lastExport).toLocaleDateString('id-ID')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Delete account */}
        <Card className="border-red-500/20">
          <CardContent className="p-6">
            <h2 className="mb-2 text-lg font-medium text-red-400">Hapus Akun</h2>
            <p className="mb-4 text-sm text-dark-400">
              Tindakan ini bersifat permanen. Semua data Anda akan dihapus dan tidak dapat dipulihkan.
            </p>
            {!showDeleteModal ? (
              <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                Hapus Akun Saya
              </Button>
            ) : (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                <p className="mb-3 text-sm font-medium text-red-400">
                  <AlertTriangle className="h-4 w-4 inline-block" /> Konfirmasi Penghapusan Akun
                </p>
                <p className="mb-4 text-xs text-dark-400">
                  Masukkan password Anda untuk melanjutkan. Semua data, booking, dan riwayat akan dihapus secara permanen.
                </p>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="mb-3 w-full rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-dark-200 placeholder-dark-500 focus:border-red-500/50 focus:outline-none"
                />
                {deleteError && <p className="mb-3 text-xs text-red-400">{deleteError}</p>}
                <div className="flex gap-3">
                  <Button variant="danger" onClick={requestDelete} disabled={deleteLoading}>
                    {deleteLoading ? 'Menghapus...' : 'Ya, Hapus Akun Saya'}
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); }}>
                    Batal
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
