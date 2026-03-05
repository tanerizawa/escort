// ── Chat Types ──────────────────────────────

export type MessageType = 'TEXT' | 'IMAGE' | 'SYSTEM';

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  content: string;
  type: MessageType;
  readAt?: string;
  createdAt: string;
}

export interface ChatRoom {
  bookingId: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  participant: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    isOnline?: boolean;
  };
}

export interface SendMessagePayload {
  bookingId: string;
  content: string;
  type?: MessageType;
}

// Socket.io events
export interface ChatEvents {
  // Client → Server
  join_room: { bookingId: string };
  leave_room: { bookingId: string };
  send_message: SendMessagePayload;
  typing: { bookingId: string };
  stop_typing: { bookingId: string };
  read_messages: { bookingId: string; messageIds: string[] };

  // Server → Client
  new_message: ChatMessage;
  user_typing: { bookingId: string; userId: string };
  user_stop_typing: { bookingId: string; userId: string };
  messages_read: { bookingId: string; messageIds: string[]; readAt: string };
}
