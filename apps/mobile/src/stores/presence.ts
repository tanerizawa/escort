import { create } from 'zustand';
import { getSocket } from '../lib/socket';

interface PresenceState {
  /** Set of user IDs currently online */
  onlineUsers: Set<string>;
  isOnline: (userId: string) => boolean;
  subscribe: () => () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUsers: new Set<string>(),

  isOnline: (userId: string) => get().onlineUsers.has(userId),

  subscribe: () => {
    const socket = getSocket();

    const handleOnline = ({ userId }: { userId: string }) => {
      set((state) => {
        const next = new Set(state.onlineUsers);
        next.add(userId);
        return { onlineUsers: next };
      });
    };

    const handleOffline = ({ userId }: { userId: string }) => {
      set((state) => {
        const next = new Set(state.onlineUsers);
        next.delete(userId);
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
