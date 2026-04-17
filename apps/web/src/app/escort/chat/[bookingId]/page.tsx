'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChatImage, ImagePreviewBar } from '@/components/chat/image-message';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { connectSocket } from '@/lib/socket';
import { AlertTriangle, Camera, Hand, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  content: string;
  type?: 'TEXT' | 'IMAGE';
  imageUrl?: string;
  createdAt: string;
}

interface ChatPartner {
  id: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
}

function mergeUniqueMessages(items: Message[]): Message[] {
  const byId = new Map<string, Message>();
  items.forEach((item) => {
    byId.set(item.id, item);
  });
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export default function EscortChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<ChatPartner | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectionIssue, setConnectionIssue] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [retryContent, setRetryContent] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tempImageBlobUrlsRef = useRef<string[]>([]);

  const cleanupTempImageBlobUrls = () => {
    if (tempImageBlobUrlsRef.current.length === 0) return;
    tempImageBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    tempImageBlobUrlsRef.current = [];
  };

  useEffect(() => {
    loadMessages();
    markAsRead();

    const socket = connectSocket();
    setSocketConnected(socket.connected);
    setConnectionIssue(socket.connected ? null : 'Menghubungkan ulang ke server chat...');
    socket.emit('chat:join', { bookingId });

    const handleNewMessage = (msg: Message) => {
      if (msg.senderId !== user?.id) {
        setMessages((prev) => mergeUniqueMessages([...prev, msg]));
        markAsRead();
      }
    };

    const handleConnect = () => {
      setSocketConnected(true);
      setConnectionIssue(null);
      socket.emit('chat:join', { bookingId });
      loadMessages(true);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
      setConnectionIssue('Koneksi real-time terputus. Beralih ke sinkronisasi berkala.');
    };

    const handleConnectError = () => {
      setSocketConnected(false);
      setConnectionIssue('Gagal tersambung ke server chat. Mencoba ulang otomatis...');
    };

    socket.on('chat:message', handleNewMessage);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    pollRef.current = setInterval(() => {
      loadMessages(true);
    }, 5000);

    return () => {
      socket.emit('chat:leave', { bookingId });
      socket.off('chat:message', handleNewMessage);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      if (pollRef.current) clearInterval(pollRef.current);
      cleanupTempImageBlobUrls();
    };
  }, [bookingId, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get(`/chats/${bookingId}/messages`);
      const data = res.data?.data || res.data;
      setMessages(mergeUniqueMessages(data.messages || []));
      if (data.otherUser) setPartner(data.otherUser);
    } catch (err: any) {
      if (err?.response?.status === 401 && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (!silent) console.error('Failed to load messages', err);
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
    setSendError(null);
    setRetryContent('');

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
      setRetryContent(content);
      setSendError('Pesan gagal dikirim. Coba lagi saat koneksi stabil.');
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    setImageFiles(prev => [...prev, ...validFiles].slice(0, 4));
    if (e.target) e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendImages = async () => {
    if (imageFiles.length === 0) return;
    setUploadingImage(true);
    for (const file of imageFiles) {
      const tempId = `img-${Date.now()}-${Math.random()}`;
      const previewUrl = URL.createObjectURL(file);
      try {
        const formData = new FormData();
        formData.append('image', file);
        tempImageBlobUrlsRef.current.push(previewUrl);
        const optimisticMsg: Message = {
          id: tempId,
          senderId: user?.id || '',
          content: '',
          type: 'IMAGE',
          imageUrl: previewUrl,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimisticMsg]);
        await api.post(`/chats/${bookingId}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch (err) {
        console.error('Failed to upload image', err);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        URL.revokeObjectURL(previewUrl);
        tempImageBlobUrlsRef.current = tempImageBlobUrlsRef.current.filter((url) => url !== previewUrl);
      }
    }
    setImageFiles([]);
    setUploadingImage(false);
    await loadMessages(true);
    cleanupTempImageBlobUrls();
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
            {partner?.profilePhoto ? (
              <img src={partner.profilePhoto} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-400/10">
                <span className="text-sm font-medium text-brand-400">{partner?.firstName?.[0] || '?'}</span>
              </div>
            )}
            <div>
              <h2 className="text-sm font-medium text-dark-100">
                {partner?.firstName} {partner?.lastName}
              </h2>
              <p className="text-xs text-dark-500">Booking #{bookingId.slice(0, 8)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        {connectionIssue && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
            <div className="flex items-center gap-2">
              {socketConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              <span>{connectionIssue}</span>
            </div>
            <button
              className="inline-flex items-center gap-1 rounded-md border border-yellow-500/30 px-2 py-1 text-[11px] text-yellow-200 hover:bg-yellow-500/10"
              onClick={() => loadMessages(true)}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Sinkronkan
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mb-3"><Hand className="h-8 w-8" /></div>
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
                    {msg.type === 'IMAGE' && msg.imageUrl ? (
                      <ChatImage src={msg.imageUrl} isOwn={isOwnMessage(msg)} />
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
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
        {sendError && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <div className="inline-flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{sendError}</span>
            </div>
            <button
              className="rounded-md border border-red-500/30 px-2 py-1 text-[11px] text-red-200 hover:bg-red-500/10"
              onClick={() => {
                if (retryContent) setNewMessage(retryContent);
                setSendError(null);
                inputRef.current?.focus();
              }}
            >
              Muat ulang draft
            </button>
          </div>
        )}

        <ImagePreviewBar files={imageFiles} onRemove={handleRemoveImage} onClear={() => setImageFiles([])} />
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-dark-700 bg-dark-800 text-dark-400 hover:text-brand-400 hover:border-brand-400/30 transition-colors"
            title="Kirim gambar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <input
            ref={inputRef}
            type="text"
            placeholder="Ketik pesan..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 rounded-xl border border-dark-700 bg-dark-800 px-4 py-3 text-sm text-dark-100 placeholder:text-dark-500 focus:border-brand-400/50 focus:outline-none transition-colors"
          />
          {imageFiles.length > 0 ? (
            <Button onClick={handleSendImages} disabled={uploadingImage} className="h-[46px] shrink-0 rounded-xl px-4">
              {uploadingImage ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-dark-900/30 border-t-dark-900" /> : <>{imageFiles.length} <Camera className="h-4 w-4 inline-block" /></>}
            </Button>
          ) : (
            <Button onClick={handleSend} disabled={!newMessage.trim() || sending} className="h-[46px] w-[46px] shrink-0 rounded-xl !p-0">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
