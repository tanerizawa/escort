'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface ChatPartner {
  id: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
}

export default function EscortChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<ChatPartner | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadMessages();
    markAsRead();

    pollRef.current = setInterval(() => {
      loadMessages(true);
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [bookingId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get(`/chats/${bookingId}/messages`);
      const data = res.data;
      setMessages(data.messages || []);
      if (data.otherUser) setPartner(data.otherUser);
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await api.patch(`/chats/${bookingId}/read`);
    } catch (err) {
      // silent
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      senderId: user?.id || '',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await api.post(`/chats/${bookingId}/messages`, { content });
      await loadMessages(true);
    } catch (err) {
      console.error('Failed to send message', err);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setNewMessage(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hari Ini';
    if (date.toDateString() === yesterday.toDateString()) return 'Kemarin';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const shouldShowDate = (msg: Message, index: number) => {
    if (index === 0) return true;
    const prevDate = new Date(messages[index - 1].createdAt).toDateString();
    const currDate = new Date(msg.createdAt).toDateString();
    return prevDate !== currDate;
  };

  const isOwnMessage = (msg: Message) => msg.senderId === user?.id;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-dark-700/50 pb-4">
        <button
          onClick={() => router.push('/escort/chat')}
          className="rounded-lg p-2 text-dark-400 transition-colors hover:bg-dark-700 hover:text-dark-200"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {partner && (
          <div className="flex items-center gap-3">
            {partner.profilePhoto ? (
              <img src={partner.profilePhoto} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-400/10">
                <span className="text-sm font-medium text-brand-400">{partner.firstName[0]}</span>
              </div>
            )}
            <div>
              <h2 className="text-sm font-medium text-dark-100">
                {partner.firstName} {partner.lastName}
              </h2>
              <p className="text-xs text-dark-500">Booking #{bookingId.slice(0, 8)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mb-3 text-3xl">👋</div>
            <p className="text-sm text-dark-500">
              Mulai percakapan dengan mengirim pesan pertama.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg, index) => (
              <div key={msg.id}>
                {shouldShowDate(msg, index) && (
                  <div className="my-4 flex items-center justify-center">
                    <span className="rounded-full bg-dark-700/80 px-3 py-1 text-xs text-dark-400">
                      {formatDateSeparator(msg.createdAt)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'} mb-1`}>
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                      isOwnMessage(msg)
                        ? 'rounded-br-md bg-brand-400 text-dark-900'
                        : 'rounded-bl-md bg-dark-700 text-dark-200'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`mt-1 text-[10px] ${isOwnMessage(msg) ? 'text-dark-900/50' : 'text-dark-500'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-dark-700/50 pt-4">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ketik pesan..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 rounded-xl border border-dark-700 bg-dark-800 px-4 py-3 text-sm text-dark-100 placeholder:text-dark-500 focus:border-brand-400/50 focus:outline-none transition-colors"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="h-[46px] w-[46px] shrink-0 rounded-xl !p-0"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
