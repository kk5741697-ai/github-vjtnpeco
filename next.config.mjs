/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      // Domain-specific rewrites for tool-focused domains
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'pixorapdf.com',
          },
        ],
        destination: '/domains/pdf/:path*',
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'pixoraimg.com',
          },
        ],
        destination: '/domains/image/:path*',
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'pixoraqrcode.com',
          },
        ],
        destination: '/domains/qr/:path*',
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'pixoracode.com',
          },
        ],
        destination: '/domains/code/:path*',
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'pixoraseo.com',
          },
        ],
        destination: '/domains/seo/:path*',
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'pixoranet.com',
          },
        ],
        destination: '/domains/network/:path*',
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'pixorautilities.com',
          },
        ],
        destination: '/domains/utilities/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

export default nextConfig
