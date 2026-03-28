'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin-layout';
import api from '@/lib/api';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  SYSTEM: { label: 'Sistem', color: 'text-blue-400 bg-blue-400/10' },
  SAFETY: { label: 'Safety', color: 'text-red-400 bg-red-400/10' },
  BOOKING: { label: 'Booking', color: 'text-emerald-400 bg-emerald-400/10' },
  PAYMENT: { label: 'Keuangan', color: 'text-amber-400 bg-amber-400/10' },
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filter === 'unread') params.set('unreadOnly', 'true');

      const { data } = await api.get(`/notifications?${params.toString()}`);
      const d = data?.data || data;
      setNotifications(d.data || d || []);
      setTotalPages(d.pagination?.totalPages || 1);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat notifikasi');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      const d = data?.data || data;
      setUnreadCount(d.count ?? d.unreadCount ?? 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const markAsRead = async (notifId: string) => {
    try {
      await api.patch(`/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleFilterChange = (newFilter: 'all' | 'unread') => {
    setFilter(newFilter);
    setPage(1);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit lalu`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} jam lalu`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay} hari lalu`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getTypeInfo = (type: string) => TYPE_LABELS[type] || { label: type, color: 'text-dark-400 bg-dark-400/10' };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-wide text-dark-100">Notifikasi</h1>
            <p className="mt-1 text-sm text-dark-400">
              {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="rounded-lg border border-dark-700 px-4 py-2 text-sm text-dark-300 transition-colors hover:bg-dark-800 hover:text-dark-100"
              >
                Tandai Semua Dibaca
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-dark-700/50 pb-3">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                filter === f
                  ? 'bg-brand-400/10 text-brand-400'
                  : 'text-dark-400 hover:bg-dark-800 hover:text-dark-200'
              }`}
            >
              {f === 'all' ? 'Semua' : 'Belum Dibaca'}
            </button>
          ))}
        </div>

        {/* Content */}
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-dark-400">Memuat...</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-dark-500">
            <Bell className="h-8 w-8 mb-2 text-dark-500" />
            <p>{filter === 'unread' ? 'Tidak ada notifikasi belum dibaca' : 'Belum ada notifikasi'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const typeInfo = getTypeInfo(notif.type);
              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.isRead && markAsRead(notif.id)}
                  className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                    notif.isRead
                      ? 'border-dark-700/30 bg-dark-900/50'
                      : 'border-brand-400/20 bg-dark-800/80 hover:bg-dark-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!notif.isRead && (
                          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-brand-400" />
                        )}
                        <span className={`rounded px-2 py-0.5 text-2xs font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <span className="text-2xs text-dark-500">{formatTime(notif.createdAt)}</span>
                      </div>
                      <h3 className={`text-sm font-medium ${notif.isRead ? 'text-dark-300' : 'text-dark-100'}`}>
                        {notif.title}
                      </h3>
                      <p className="mt-0.5 text-sm text-dark-400 line-clamp-2">{notif.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-dark-700/50 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-dark-700 px-4 py-2 text-sm text-dark-300 transition-colors hover:bg-dark-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Sebelumnya
            </button>
            <span className="text-sm text-dark-400">
              Halaman {page} dari {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-dark-700 px-4 py-2 text-sm text-dark-300 transition-colors hover:bg-dark-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Selanjutnya →
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
