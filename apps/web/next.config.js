/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pixelbead/shared'],
  // standalone output for production deployment — bypasses 'next start'
  // Server Action lookup bug (Next.js 14.2.18). Single-file server bundle.
  output: 'standalone',
  async rewrites() {
    const apiUrl = process.env.API_INTERNAL_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/external/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
