/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['areton-media-dev.s3.ap-southeast-1.amazonaws.com', 'lh3.googleusercontent.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.areton.id/api',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'https://api.areton.id',
  },
  experimental: {
    // Workaround: React 19 JSX format differs from what Next 14 _error SSR expects
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
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://api.areton.id wss://api.areton.id; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';"
          }
        ]
      }
    ];
  },
};

module.exports = nextConfig;
