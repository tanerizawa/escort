'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { AlertTriangle, Bell, ClipboardList, DollarSign, MessageCircle, Star } from 'lucide-react';
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

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setUnreadCount(0);
      return;
    }
    loadUnreadCount();
    intervalRef.current = setInterval(loadUnreadCount, 30000); // poll every 30s
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, user?.id]);

  const getAuthConfig = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return null;
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const clearAuthState = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    setUser(null);
    setUnreadCount(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const authConfig = getAuthConfig();
      if (!authConfig) {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        setUnreadCount(0);
        return;
      }
      const res = await api.get('/notifications/unread-count', authConfig);
      const d = res.data?.data || res.data;
      setUnreadCount(d?.count || 0);
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.message === 'No refresh token') {
        clearAuthState();
      }
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const authConfig = getAuthConfig();
      if (!authConfig) {
        setNotifications([]);
        return;
      }
      const res = await api.get('/notifications', { ...authConfig, params: { limit: 10 } });
      const payload = res.data?.data || res.data;
      setNotifications(Array.isArray(payload) ? payload : (payload?.data || []));
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.message === 'No refresh token') {
        clearAuthState();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const authConfig = getAuthConfig();
      if (!authConfig) return;
      await api.patch(`/notifications/${id}/read`, undefined, authConfig);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.message === 'No refresh token') {
        clearAuthState();
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const authConfig = getAuthConfig();
      if (!authConfig) return;
      await api.patch('/notifications/read-all', undefined, authConfig);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.message === 'No refresh token') {
        clearAuthState();
      }
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
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
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
      default:
        return 'Bell';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative rounded-lg p-2 text-dark-400 transition-colors hover:bg-dark-700 hover:text-dark-200"
        aria-label="Notifikasi"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-dark-700 bg-dark-800 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-dark-700 px-4 py-3">
            <h3 className="text-sm font-medium text-dark-100">Notifikasi</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mb-2"><Bell className="h-7 w-7" /></div>
                <p className="text-xs text-dark-500">Belum ada notifikasi</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-dark-700/50 ${
                    !notif.isRead ? 'bg-brand-400/5' : ''
                  }`}
                >
                  <span className="mt-0.5"><Icon name={getIcon(notif.type)} className="h-5 w-5 text-brand-400" /></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!notif.isRead ? 'font-medium text-dark-100' : 'text-dark-300'}`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-dark-500 line-clamp-2">{notif.message}</p>
                    <p className="mt-1 text-[10px] text-dark-600">{formatTime(notif.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-dark-700 px-4 py-2">
              <Link
                href={user?.role === 'ESCORT' ? '/escort/notifications' : '/user/notifications'}
                className="block text-center text-xs text-brand-400 hover:text-brand-300 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Lihat semua notifikasi
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
