/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Note: API routes body size limits are configured per route in Next.js 15
  // The bodySizeLimit above handles server actions, and individual API routes
  // can be configured with their own limits if needed
}

module.exports = nextConfig
