import { create } from 'zustand';
import { getSocket, connectSocket } from '@/lib/socket';

interface PresenceState {
  onlineUsers: Set<string>;
  isOnline: (userId: string) => boolean;
  subscribe: () => () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUsers: new Set<string>(),

  isOnline: (userId: string) => get().onlineUsers.has(userId),

  subscribe: () => {
    const socket = connectSocket();

    const handleOnline = (data: { userId: string }) => {
      set((state) => {
        const next = new Set(state.onlineUsers);
        next.add(data.userId);
        return { onlineUsers: next };
      });
    };

    const handleOffline = (data: { userId: string }) => {
      set((state) => {
        const next = new Set(state.onlineUsers);
        next.delete(data.userId);
        return { onlineUsers: next };
      });
    };

    socket.on('user:online', handleOnline);
    socket.on('user:offline', handleOffline);

    return () => {
      socket.off('user:online', handleOnline);
      socket.off('user:offline', handleOffline);
    };
  },
}));
