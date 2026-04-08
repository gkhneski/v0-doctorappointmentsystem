/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
