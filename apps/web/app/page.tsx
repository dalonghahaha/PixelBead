import Link from 'next/link';
import type { HealthStatus, PaletteInfo } from '@pixelbead/shared';

async function fetchHealth(): Promise<HealthStatus | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchPalettes(): Promise<PaletteInfo[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/palettes`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

const features = [
  {
    id: '001',
    title: '项目骨架',
    status: 'in-progress',
    desc: 'Monorepo + Next.js + FastAPI + Docker 一键启动',
  },
  {
    id: '002',
    title: '用户系统',
    status: 'planned',
    desc: '注册 / 登录 / JWT 鉴权',
  },
  {
    id: '003',
    title: '图纸生成',
    status: 'planned',
    desc: '上传图片 → 拼豆图纸(pypindou 算法)',
  },
];

export default async function HomePage() {
  const [health, palettes] = await Promise.all([fetchHealth(), fetchPalettes()]);

  return (
    <div className="space-y-12">
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
          PixelBead
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          上传图片,一键生成可打印的拼豆图纸
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/generate"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            开始生成
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            登录
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f) => (
          <div
            key={f.id}
            className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-gray-500">#{f.id}</span>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  f.status === 'in-progress'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {f.status === 'in-progress' ? '进行中' : '规划中'}
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-1">{f.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="font-medium mb-2">后端健康</div>
          {health ? (
            <div className="text-green-600">
              ✓ {health.status} · {health.service ?? 'api'}
            </div>
          ) : (
            <div className="text-red-600">✗ 后端未连接</div>
          )}
        </div>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="font-medium mb-2">可用色卡</div>
          {palettes.length > 0 ? (
            <div className="text-green-600">✓ {palettes.length} 个色卡</div>
          ) : (
            <div className="text-gray-500">— 暂不可用 —</div>
          )}
        </div>
      </section>
    </div>
  );
}
