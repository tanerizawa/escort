'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { ActiveBookingMessage } from '@/stores/active-booking.store';
import { Camera, MessageCircle, Send } from 'lucide-react';

interface TransactionChatProps {
  bookingId: string;
  initialMessages: ActiveBookingMessage[];
  isExpanded: boolean;
  onToggle: () => void;
}

export function TransactionChat({ bookingId, initialMessages, isExpanded, onToggle }: TransactionChatProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ActiveBookingMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevCountRef = useRef(initialMessages.length);

  // Poll for new messages
  useEffect(() => {
    pollRef.current = setInterval(loadMessages, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [bookingId]);

  // Update messages when initialMessages change
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnread(0);
    }
  }, [messages, isExpanded]);

  // Track unread when collapsed
  useEffect(() => {
    if (!isExpanded && messages.length > prevCountRef.current) {
      const newMsgs = messages.slice(prevCountRef.current);
      const unreadCount = newMsgs.filter(m => m.senderId !== user?.id).length;
      setUnread(prev => prev + unreadCount);
    }
    prevCountRef.current = messages.length;
  }, [messages, isExpanded, user?.id]);

  const loadMessages = useCallback(async () => {
    try {
      const res = await api.get(`/chats/${bookingId}/messages`);
      const data = res.data?.data || res.data;
      if (data?.messages) {
        setMessages(data.messages);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }
  }, [bookingId]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic add
    const tempMsg: ActiveBookingMessage = {
      id: `temp-${Date.now()}`,
      senderId: user?.id || '',
      content,
      type: 'TEXT',
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await api.post(`/chats/${bookingId}/messages`, { content });
      await loadMessages();
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
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
    return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // Collapsed: show preview
  if (!isExpanded) {
    const lastMessage = messages[messages.length - 1];
    return (
      <button
        onClick={onToggle}
        className="w-full rounded-2xl border border-dark-700/50 bg-dark-800/60 p-3 text-left transition-colors hover:bg-dark-800/80"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <span className="text-xs font-medium text-dark-400 uppercase tracking-wider">Chat</span>
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
            <span className="text-dark-500 text-xs">▼</span>
          </div>
        </div>
        {lastMessage && (
          <p className="mt-1.5 truncate text-xs text-dark-400">
            {lastMessage.senderId === user?.id ? 'Anda: ' : ''}
            {lastMessage.type === 'IMAGE' ? <><Camera className="h-4 w-4 inline-block" /> Foto</> : lastMessage.content}
          </p>
        )}
      </button>
    );
  }

  // Expanded: full chat
  return (
    <div className="rounded-2xl border border-dark-700/50 bg-dark-800/60 overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-3 border-b border-dark-700/30 hover:bg-dark-800/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <span className="text-xs font-medium text-dark-400 uppercase tracking-wider">Chat</span>
          <span className="text-[10px] text-dark-500">({messages.length})</span>
        </div>
        <span className="text-dark-500 text-xs">▲</span>
      </button>

      {/* Messages area */}
      <div className="h-52 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-track-dark-800 scrollbar-thumb-dark-600">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-dark-500">Belum ada pesan. Mulai percakapan!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-1.5 ${
                    isMine
                      ? 'bg-brand-500/20 text-brand-100 rounded-br-md'
                      : 'bg-dark-700/60 text-dark-200 rounded-bl-md'
                  }`}
                >
                  {msg.type === 'IMAGE' && msg.imageUrl ? (
                    <img src={msg.imageUrl} alt="" className="max-w-full rounded-lg max-h-32" />
                  ) : (
                    <p className="text-xs leading-relaxed break-words">{msg.content}</p>
                  )}
                  <p className={`text-[9px] mt-0.5 ${isMine ? 'text-brand-400/50' : 'text-dark-500'}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-dark-700/30 p-2">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan..."
            className="flex-1 rounded-xl bg-dark-700/50 px-3 py-2 text-xs text-white placeholder:text-dark-500 outline-none focus:ring-1 focus:ring-brand-500/50"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white transition-opacity disabled:opacity-30 hover:bg-brand-600"
          >
            {sending ? (
              <div className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
