/**
 * spec 007 — sitemap.xml 动态生成
 *
 * 静态路由 + 公开图纸(/patterns/{id} where is_public=true)
 * 含多语言 xhtml:link 子节点(005 协同)
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 小时缓存

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: { hreflang: string; href: string }[];
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://pixelbead.app';
const LOCALES = ['zh', 'en'] as const;

// TODO 007:从 API 拉取公开图纸列表(is_public=true)
// 当前占位实现:返回静态路由
async function fetchPublicPatterns(): Promise<Array<{ id: string; updated_at: string }>> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  try {
    const res = await fetch(`${apiUrl}/patterns/public`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function GET(): Promise<NextResponse> {
  const patterns = await fetchPublicPatterns();

  const staticEntries: SitemapEntry[] = [
    { loc: '/', changefreq: 'weekly', priority: 1.0 },
    { loc: '/generate', changefreq: 'monthly', priority: 0.9 },
    { loc: '/patterns', changefreq: 'daily', priority: 0.7 },
    { loc: '/login', changefreq: 'monthly', priority: 0.5 },
    { loc: '/register', changefreq: 'monthly', priority: 0.5 },
    { loc: '/privacy', changefreq: 'yearly', priority: 0.3 },
  ];

  const patternEntries: SitemapEntry[] = patterns.map((p) => ({
    loc: `/patterns/${p.id}`,
    lastmod: p.updated_at,
    changefreq: 'weekly',
    priority: 0.8,
  }));

  const allEntries = [...staticEntries, ...patternEntries];

  // 生成 XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allEntries
  .map((e) => {
    const alternatesXml = (e.alternates || [])
      .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`)
      .join('\n');
    // 自动为每个 entry 生成 hreflang 双语链接
    const autoAlternates = LOCALES.map(
      (loc) =>
        `    <xhtml:link rel="alternate" hreflang="${loc}" href="${BASE_URL}/${loc}${e.loc}"/>`,
    ).join('\n');

    return `  <url>
    <loc>${BASE_URL}${e.loc}</loc>
${e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>\n` : ''}${e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>\n` : ''}${e.priority !== undefined ? `    <priority>${e.priority}</priority>\n` : ''}${alternatesXml}
${autoAlternates}
  </url>`;
  })
  .join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}