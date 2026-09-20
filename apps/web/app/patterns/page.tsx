'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { PatternResult } from '@pixelbead/shared';

export default function PatternsPage() {
  const router = useRouter();
  const { token, isLoggedIn, ready, logout } = useAuth();
  const [items, setItems] = useState<PatternResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !isLoggedIn) router.push('/login');
  }, [ready, isLoggedIn, router]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api
      .listPatterns(token)
      .then(setItems)
      .catch((e) => setError(e instanceof ApiError ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [token]);

  if (!ready) return <div className="py-12 text-center">加载中…</div>;
  if (!isLoggedIn) return null;

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">我的图纸</h1>
        <div className="flex gap-3">
          <Link
            href="/generate"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            + 新建
          </Link>
          <button
            onClick={logout}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            退出
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-12">加载中…</div>}

      {error && (
        <div className="text-red-600 bg-red-50 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          还没有图纸,去{' '}
          <Link href="/generate" className="text-primary-600 underline">
            生成一个
          </Link>{' '}
          吧
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((p) => (
          <div
            key={p.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            {p.previewUrl ? (
              <img
                src={`http://localhost:8000${p.previewUrl}`}
                alt="预览"
                className="w-full aspect-square object-contain bg-gray-50"
              />
            ) : (
              <div className="aspect-square flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
                {p.status}
              </div>
            )}
            <div className="p-3 space-y-1 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs text-gray-500">
                  {p.id.slice(0, 8)}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    p.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : p.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {p.width}×{p.height} · {p.palette}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(p.createdAt).toLocaleString('zh-CN')}
              </div>
              {p.symbolUrl && (
                <a
                  href={`http://localhost:8000${p.symbolUrl}`}
                  download={`pattern-${p.id}.png`}
                  className="block text-center text-xs text-primary-600 hover:underline pt-1"
                >
                  下载符号图
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
