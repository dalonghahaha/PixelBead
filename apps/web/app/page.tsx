import Link from 'next/link';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

/** FR-5: SEO metadata + og + twitter */
export function generateMetadata(): Metadata {
  return {
    title: 'PixelBead — 上传图片,3 秒生成拼豆图纸',
    description:
      '上传任意图片,一键生成带色号标注的拼豆图纸。支持 MARD、Artkal、COCO 等主流色板。',
    openGraph: {
      title: 'PixelBead — 上传图片,3 秒生成拼豆图纸',
      description:
        '上传任意图片,一键生成带色号标注的拼豆图纸。',
      images: ['/og.png'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'PixelBead — 上传图片,3 秒生成拼豆图纸',
      description:
        '上传任意图片,一键生成带色号标注的拼豆图纸。',
      images: ['/og.png'],
    },
  };
}

/** FR-6: 动态拉色板数 + ISR 缓存 + fallback */
async function getPaletteCount(): Promise<number | null> {
  try {
    const res = await fetch(`${API_BASE}/palettes`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data.length : null;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  // Server Component 读 cookie 决定 CTA 路由(FR-3)
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get('pixelbead_token');
  const loggedIn = !!tokenCookie?.value;
  const ctaHref = loggedIn ? '/generate' : '/login?redirect=/generate';

  // FR-6 动态色板数
  const paletteCount = await getPaletteCount();
  const paletteText =
    paletteCount !== null
      ? `${paletteCount} 种真实拼豆色板`
      : '20+ 种真实拼豆色板';

  const features = [
    {
      icon: '📷',
      title: '支持常见图片格式',
      desc: 'JPG / PNG / WEBP,最大 10MB,上传即处理',
    },
    {
      icon: '🎨',
      title: paletteText,
      desc: 'MARD / Artkal / COCO 等主流品牌,自动匹配色号',
    },
    {
      icon: '📥',
      title: '一键导出可打印图纸',
      desc: '带色号标注 + 网格线 + 用量清单,直接打印开拼',
    },
  ];

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="text-center pt-12 pb-8">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
          PixelBead
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-200 mb-3">
          上传图片,3 秒生成拼豆图纸
        </p>
        <p className="text-base text-gray-500 dark:text-gray-400 mb-10">
          像素化 · 颜色匹配 · 网格导出,一气呵成
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href={ctaHref}
            className="inline-flex items-center px-8 py-3 min-h-[44px] bg-primary-600 text-white rounded-lg hover:bg-primary-700 hover:scale-105 active:bg-primary-800 active:scale-100 transition text-base font-medium shadow-lg shadow-primary-600/20"
          >
            开始生成 →
          </Link>
        </div>
      </section>

      {/* Features (h2 — 修 heading hierarchy) */}
      <section className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {features.map((f) => (
          <div
            key={f.title}
            className="text-center p-6 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
          >
            <div className="text-4xl mb-3" aria-hidden="true">
              {f.icon}
            </div>
            <h2 className="text-lg font-semibold mb-2">{f.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {f.desc}
            </p>
          </div>
        ))}
      </section>

      {/* 示例 — 真实图(FR-1) + 响应式(FR-4) */}
      <section className="max-w-4xl mx-auto">
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 items-center bg-gray-50 dark:bg-gray-800/30 rounded-2xl p-6 sm:p-8">
          <div>
            <h2 className="text-2xl font-bold mb-3">从照片到拼豆,只需三步</h2>
            <ol className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white text-sm flex items-center justify-center">
                  1
                </span>
                <span>上传任意图片</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white text-sm flex items-center justify-center">
                  2
                </span>
                <span>选择色板和网格大小</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white text-sm flex items-center justify-center">
                  3
                </span>
                <span>下载带色号标注的图纸</span>
              </li>
            </ol>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm">
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 mb-3">
              示例效果
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <img
                  src="/examples/original.jpg"
                  alt="拼豆图案示例原图(CC0 卡通小狗)"
                  width={464}
                  height={464}
                  className="aspect-square rounded w-full object-cover"
                />
                <div className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
                  原图
                </div>
              </div>
              <div>
                <img
                  src="/examples/pattern.png"
                  alt="对应的拼豆图纸,29×29 网格,MARD 色板"
                  width={464}
                  height={464}
                  className="aspect-square rounded w-full"
                />
                <div className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
                  拼豆图纸
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}