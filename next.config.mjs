/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Performans iyileştirmeleri
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  // Temel güvenlik başlıkları. Site başka bir sitenin içinde çerçeve olarak açılamaz
  // (admin paneline tıklama tuzağı kurulamasın). Tam içerik güvenlik politikası ayrı bir iştir.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/r',
        has: [{ type: 'query', key: 't', value: '(?<token>.*)' }],
        destination: '/appointment/:token',
        permanent: false,
      },
      {
        source: '/r',
        destination: '/',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
