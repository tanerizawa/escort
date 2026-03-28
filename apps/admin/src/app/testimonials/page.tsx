'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import AdminLayout from '@/components/admin-layout';

interface Testimonial {
  id: string;
  content: string;
  rating: number;
  isApproved: boolean;
  isFeatured: boolean;
  approvedAt: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadTestimonials();
  }, [page]);

  const loadTestimonials = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/testimonials/admin/all?page=${page}&limit=20`);
      const payload = res.data?.data || res.data;
      const list = payload?.data || payload || [];
      setTestimonials(Array.isArray(list) ? list : []);
      const pag = payload?.pagination;
      if (pag) setTotalPages(pag.totalPages || 1);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (id: string, currentlyApproved: boolean) => {
    try {
      await api.patch(`/testimonials/admin/${id}`, { isApproved: !currentlyApproved });
      setMessage(currentlyApproved ? 'Testimonial ditolak' : 'Testimonial disetujui');
      loadTestimonials();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Gagal mengubah status');
    }
  };

  const toggleFeatured = async (id: string, currentlyFeatured: boolean) => {
    try {
      await api.patch(`/testimonials/admin/${id}`, { isFeatured: !currentlyFeatured });
      setMessage(currentlyFeatured ? 'Testimonial dihapus dari featured' : 'Testimonial ditandai sebagai featured');
      loadTestimonials();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Gagal mengubah status');
    }
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm('Hapus testimonial ini?')) return;
    try {
      await api.delete(`/testimonials/admin/${id}`);
      setMessage('Testimonial berhasil dihapus');
      loadTestimonials();
    } catch {
      setMessage('Gagal menghapus testimonial');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-amber-400' : 'text-dark-600'}>★</span>
    ));
  };

  return (
    <AdminLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light tracking-wide text-dark-100">Testimonials</h1>
        <p className="mt-1 text-sm text-dark-400">Kelola testimonial dari klien</p>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          message.includes('berhasil') || message.includes('disetujui') || message.includes('ditandai')
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {message}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-dark-500">Total</p>
          <p className="mt-1 text-2xl font-light text-dark-100">{testimonials.length}</p>
        </div>
        <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-dark-500">Disetujui</p>
          <p className="mt-1 text-2xl font-light text-emerald-400">{testimonials.filter((t) => t.isApproved).length}</p>
        </div>
        <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-dark-500">Menunggu</p>
          <p className="mt-1 text-2xl font-light text-amber-400">{testimonials.filter((t) => !t.isApproved).length}</p>
        </div>
      </div>

      {/* Testimonials List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-dark-600 border-t-brand-400" />
        </div>
      ) : testimonials.length === 0 ? (
        <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-10 text-center text-dark-400">
          Belum ada testimonial
        </div>
      ) : (
        <div className="space-y-3">
          {testimonials.map((t) => (
            <div key={t.id} className="rounded-lg border border-dark-700/50 bg-dark-800/30 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-400/20 text-xs font-medium text-brand-400">
                      {t.user.firstName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-200">
                        {t.user.firstName} {t.user.lastName}
                      </p>
                      <p className="text-xs text-dark-500">{t.user.email}</p>
                    </div>
                    <div className="flex text-sm ml-2">{renderStars(t.rating)}</div>
                  </div>
                  <p className="text-sm text-dark-300 leading-relaxed">&ldquo;{t.content}&rdquo;</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-dark-500">
                    <span>{new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.isApproved ? 'bg-emerald-400/10 text-emerald-400' : 'bg-amber-400/10 text-amber-400'
                    }`}>
                      {t.isApproved ? 'Disetujui' : 'Menunggu'}
                    </span>
                    {t.isFeatured && (
                      <span className="rounded-full bg-brand-400/10 px-2 py-0.5 text-xs font-medium text-brand-400">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => toggleApproval(t.id, t.isApproved)}
                    className={`rounded px-3 py-1.5 text-xs ${
                      t.isApproved
                        ? 'text-amber-400 hover:bg-amber-400/10'
                        : 'text-emerald-400 hover:bg-emerald-400/10'
                    }`}
                  >
                    {t.isApproved ? 'Tolak' : 'Setujui'}
                  </button>
                  <button
                    onClick={() => toggleFeatured(t.id, t.isFeatured)}
                    className={`rounded px-3 py-1.5 text-xs ${
                      t.isFeatured
                        ? 'text-dark-400 hover:bg-dark-700/50'
                        : 'text-brand-400 hover:bg-brand-400/10'
                    }`}
                  >
                    {t.isFeatured ? 'Un-feature' : 'Feature'}
                  </button>
                  <button
                    onClick={() => deleteTestimonial(t.id)}
                    className="rounded px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
    </div>
    </AdminLayout>
  );
}
