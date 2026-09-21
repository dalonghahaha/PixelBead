'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/components/I18nProvider';
import type { PatternResult } from '@pixelbead/shared';

export default function PatternsPage() {
  const router = useRouter();
  const { token, isLoggedIn, ready, logout } = useAuth();
  const { t, locale } = useLocale();
  const [items, setItems] = useState<PatternResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingSymbol, setViewingSymbol] = useState<PatternResult | null>(null);

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

  async function handleDelete(p: PatternResult) {
    if (!token) return;
    const ok = window.confirm(
      locale === 'en'
        ? `Delete pattern ${p.id.slice(0, 8)}? This cannot be undone.`
        : `确定删除图纸 ${p.id.slice(0, 8)} 吗?不可撤销。`,
    );
    if (!ok) return;
    setDeletingId(p.id);
    try {
      await api.deletePattern(p.id, token);
      setItems((arr) => arr.filter((i) => i.id !== p.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  }

  if (!ready) return <div className="py-12 text-center">加载中…</div>;
  if (!isLoggedIn) return null;

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t('patterns.title')}</h1>
        <div className="flex gap-3">
          <Link
            href="/generate"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            {locale === 'en' ? '+ New' : '+ 新建'}
          </Link>
          <button
            onClick={logout}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {t('nav.logout')}
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
          {/* EN: {t('patterns.empty')} */}
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
                src={p.previewUrl}
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
                <div className="flex items-center justify-between pt-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingSymbol(p)}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    {locale === 'en' ? 'View symbol' : '查看符号图'}
                  </button>
                  <a
                    href={p.symbolUrl}
                    download={`pattern-${p.id}.png`}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    {locale === 'en' ? 'Download' : '下载'}
                  </a>
                </div>
              )}
              <button
                type="button"
                onClick={() => handleDelete(p)}
                disabled={deletingId === p.id}
                className="block w-full text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded py-1 mt-1 disabled:opacity-50"
              >
                {deletingId === p.id
                  ? locale === 'en'
                    ? 'Deleting…'
                    : '删除中…'
                  : locale === 'en'
                    ? 'Delete'
                    : '删除'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 符号图查看 modal */}
      {viewingSymbol && viewingSymbol.symbolUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setViewingSymbol(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">
                {locale === 'en' ? 'Symbol Chart' : '符号图'} ·{' '}
                <span className="font-mono text-gray-500">
                  {viewingSymbol.id.slice(0, 8)}
                </span>
              </h3>
              <button
                type="button"
                aria-label="关闭"
                onClick={() => setViewingSymbol(null)}
                className="w-8 h-8 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <img
              src={viewingSymbol.symbolUrl}
              alt="符号图"
              className="max-w-full mx-auto"
            />
            <div className="flex gap-3 mt-3 justify-end">
              <a
                href={viewingSymbol.symbolUrl}
                download={`pattern-${viewingSymbol.id}.png`}
                className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700"
              >
                {locale === 'en' ? 'Download' : '下载符号图'}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}