/**
 * spec 007 — JSON-LD 结构化数据
 */
import type { BeadSize } from '@pixelbead/shared';

interface SoftwareAppProps {
  name?: string;
  description?: string;
  url?: string;
}

export function JsonLdSoftwareApp({
  name = 'PixelBead',
  description = '上传图片,3 秒生成可打印拼豆图纸',
  url = 'https://pixel.iiclub.com.cn',
}: SoftwareAppProps) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    url,
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
    },
    author: {
      '@type': 'Organization',
      name: 'PixelBead',
      url,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}

interface CreativeWorkProps {
  patternId: string;
  name: string;
  author?: string;
  datePublished?: string;
  image?: string;
  beadSize: BeadSize;
}

export function JsonLdCreativeWork({
  patternId,
  name,
  author = 'Anonymous',
  datePublished,
  image,
  beadSize,
}: CreativeWorkProps) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `https://pixel.iiclub.com.cn/patterns/${patternId}`,
    name,
    author: { '@type': 'Person', name: author },
    datePublished: datePublished || new Date().toISOString(),
    image: image || `https://pixel.iiclub.com.cn/og/${patternId}.png`,
    keywords: ['拼豆', '拼豆图纸', 'bead pattern', 'pixel art', beadSize].join(','),
    encodingFormat: 'image/png',
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}