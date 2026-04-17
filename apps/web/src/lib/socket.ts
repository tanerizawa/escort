import { io, Socket } from 'socket.io-client';

function getSocketBaseUrl() {
  const explicitWsUrl = process.env.NEXT_PUBLIC_WS_URL;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const fallbackUrl = process.env.NODE_ENV === 'production'
    ? 'https://api.areton.id'
    : 'http://localhost:4000';

  const rawUrl = explicitWsUrl || apiUrl?.replace(/\/api\/?$/, '') || fallbackUrl;

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === 'https:' || parsed.protocol === 'wss:') {
      parsed.protocol = 'wss:';
    } else if (parsed.protocol === 'http:' || parsed.protocol === 'ws:') {
      parsed.protocol = 'ws:';
    }
    return parsed.origin;
  } catch {
    return process.env.NODE_ENV === 'production' ? 'wss://api.areton.id' : 'ws://localhost:4000';
  }
}

const SOCKET_URL = `${getSocketBaseUrl()}/chat`;
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    socket = io(SOCKET_URL, {
      auth: { token },
      path: '/socket.io',
      // Start with HTTP polling then upgrade to websocket when available.
      // This avoids hard failures on networks/proxies that block websocket upgrades.
      transports: ['polling', 'websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 6000,
      timeout: 10000,
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) {
    return s;
  }
  if (token) {
    s.auth = { token };
  }
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
  socket = null;
}
