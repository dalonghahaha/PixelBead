/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pixelbead/shared'],
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
