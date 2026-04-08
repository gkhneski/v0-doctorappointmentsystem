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
