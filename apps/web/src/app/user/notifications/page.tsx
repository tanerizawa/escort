'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { AlertTriangle, Bell, CheckCircle2, ClipboardList, DollarSign, MessageCircle, Star } from 'lucide-react';
import { Icon } from '@/components/ui/icon';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, string>;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      const payload = res.data?.data || res.data;
      const items = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
      setNotifications(items);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // silent
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent  
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'BOOKING_NEW':
      case 'BOOKING_ACCEPTED':
      case 'BOOKING_REJECTED':
        return 'ClipboardList';
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_RELEASED':
        return 'DollarSign';
      case 'CHAT_MESSAGE':
        return 'MessageCircle';
      case 'REVIEW_NEW':
        return 'Star';
      case 'SOS_ALERT':
        return 'AlertTriangle';
      case 'VERIFICATION':
        return 'CheckCircle2';
      default:
        return 'Bell';
    }
  };

  const filtered = filter === 'unread' 
    ? (notifications || []).filter((n) => !n.isRead) 
    : (notifications || []);
  const unreadCount = (notifications || []).filter((n) => !n.isRead).length;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-dark-100">Notifikasi</h1>
          <p className="mt-1 text-sm text-dark-400">
            {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex items-center gap-2">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm transition-colors ${
              filter === f
                ? 'bg-brand-400/10 text-brand-400'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            {f === 'all' ? 'Semua' : 'Belum Dibaca'}
            {f === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-400 px-1.5 py-0.5 text-[10px] font-bold text-dark-900">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent>
            <div className="py-16 text-center">
              <div className="mb-4"><Bell className="h-10 w-10" /></div>
              <h3 className="text-lg font-light text-dark-200">
                {filter === 'unread' ? 'Semua Sudah Dibaca' : 'Belum Ada Notifikasi'}
              </h3>
              <p className="mt-2 text-sm text-dark-500">
                {filter === 'unread'
                  ? 'Anda telah membaca semua notifikasi.'
                  : 'Notifikasi akan muncul di sini.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => (
            <div
              key={notif.id}
              className={`rounded-xl border p-4 transition-all ${
                !notif.isRead
                  ? 'border-brand-400/20 bg-brand-400/5'
                  : 'border-dark-700/50 bg-dark-800/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5"><Icon name={getIcon(notif.type)} className="h-5 w-5 text-brand-400" /></span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className={`text-sm ${!notif.isRead ? 'font-medium text-dark-100' : 'text-dark-300'}`}>
                        {notif.title}
                      </h3>
                      <p className="mt-1 text-sm text-dark-400">{notif.message}</p>
                      <p className="mt-2 text-xs text-dark-500">{formatTime(notif.createdAt)}</p>
                    </div>
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="shrink-0 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        Tandai dibaca
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
