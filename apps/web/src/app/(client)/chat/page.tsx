'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

interface ChatRoom {
  bookingId: string;
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
}

export default function ChatListPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const res = await api.get('/chats');
      setRooms(res.data || []);
    } catch (err) {
      console.error('Failed to load chat rooms', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Kemarin';
    if (days < 7) return date.toLocaleDateString('id-ID', { weekday: 'short' });
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-light text-dark-100">Pesan</h1>
        <p className="mt-1 text-sm text-dark-400">Percakapan dengan client dan escort</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
        </div>
      ) : rooms.length === 0 ? (
        <Card>
          <CardContent>
            <div className="py-16 text-center">
              <div className="mb-4 text-4xl">💬</div>
              <h3 className="text-lg font-light text-dark-200">Belum Ada Pesan</h3>
              <p className="mt-2 text-sm text-dark-500">
                Percakapan akan muncul setelah booking dikonfirmasi.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rooms.map((room) => (
            <Link
              key={room.bookingId}
              href={`/chat/${room.bookingId}`}
              className="block rounded-xl border border-dark-700/50 bg-dark-800/50 p-4 transition-all hover:border-brand-400/20 hover:bg-dark-800"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {room.otherUser.profilePhoto ? (
                    <img
                      src={room.otherUser.profilePhoto}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-400/10">
                      <span className="text-lg font-medium text-brand-400">
                        {room.otherUser.firstName[0]}
                      </span>
                    </div>
                  )}
                  {room.unreadCount > 0 && (
                    <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-400 text-[10px] font-bold text-dark-900">
                      {room.unreadCount > 9 ? '9+' : room.unreadCount}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-medium ${room.unreadCount > 0 ? 'text-dark-100' : 'text-dark-300'}`}>
                      {room.otherUser.firstName} {room.otherUser.lastName}
                    </h3>
                    {room.lastMessage && (
                      <span className="text-xs text-dark-500">
                        {formatTime(room.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {room.lastMessage && (
                    <p className={`mt-0.5 truncate text-sm ${room.unreadCount > 0 ? 'text-dark-300' : 'text-dark-500'}`}>
                      {room.lastMessage.content}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
