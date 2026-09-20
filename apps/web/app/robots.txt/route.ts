/**
 * spec 007 — robots.txt(静态)
 */
import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pixelbead.app';

export function GET(): NextResponse {
  const content = `# PixelBead robots.txt
# spec 007 SEO 基建

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /account/
Disallow: /login
Disallow: /register

# Sitemap
Sitemap: ${BASE_URL}/sitemap.xml
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}