'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { usePresenceStore } from '@/stores/presence.store';
import { connectSocket, disconnectSocket } from '@/lib/socket';

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    connectSocket();
    const unsubscribe = usePresenceStore.getState().subscribe();

    return () => {
      unsubscribe();
      disconnectSocket();
    };
  }, [isAuthenticated]);

  return <>{children}</>;
}
