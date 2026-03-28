import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants/theme';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const wsUrl = API_URL.replace('/api', '');
    socket = io(wsUrl, {
      autoConnect: false,
      transports: ['websocket'],
    });
  }
  return socket;
}

export async function connectSocket() {
  const s = getSocket();
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    s.auth = { token };
    s.connect();
  }
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}
