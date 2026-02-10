/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for cPanel FTP deployment
  output: 'export',

  // Disable server features for static export
  images: {
    unoptimized: true,
  },

  // Environment variables available to the browser
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001'),
  },

  // Add trailing slash for static hosting
  trailingSlash: true,
}

module.exports = nextConfig
