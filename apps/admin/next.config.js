/** @type {import('next').NextConfig} */
const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.areton.id/api';
const DEFAULT_WS_URL = process.env.NEXT_PUBLIC_WS_URL || DEFAULT_API_URL.replace('/api', '');

function toOrigin(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (!parsed.hostname || parsed.hostname.startsWith('.')) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function toWebSocketOrigin(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (!parsed.hostname || parsed.hostname.startsWith('.')) {
      return null;
    }
    if (parsed.protocol === 'https:' || parsed.protocol === 'wss:') {
      parsed.protocol = 'wss:';
    } else if (parsed.protocol === 'http:' || parsed.protocol === 'ws:') {
      parsed.protocol = 'ws:';
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function getConnectSrc() {
  const apiOrigin = toOrigin(DEFAULT_API_URL);
  const wsOrigin = toWebSocketOrigin(DEFAULT_WS_URL);
  const envExtra = (process.env.CSP_CONNECT_SRC_EXTRA || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  const values = [
    "'self'",
    apiOrigin,
    wsOrigin,
    'http://*.areton.id',
    'https://*.areton.id',
    'ws://*.areton.id',
    'wss://*.areton.id',
    'http://localhost:*',
    'ws://localhost:*',
    'http://127.0.0.1:*',
    'ws://127.0.0.1:*',
    ...envExtra,
  ].filter(Boolean);

  return [...new Set(values)].join(' ');
}

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: DEFAULT_API_URL,
    NEXT_PUBLIC_WS_URL: DEFAULT_WS_URL,
  },
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src ${getConnectSrc()}; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';`
          }
        ]
      }
    ];
  },
};

module.exports = nextConfig;
