'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError, type UsageReport } from '@/lib/api';
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
  const [viewing, setViewing] = useState<PatternResult | null>(null);
  const [viewTab, setViewTab] = useState<'preview' | 'symbol'>('symbol');
  const [usage, setUsage] = useState<UsageReport | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [beadsPerPack, setBadsPerPack] = useState(500);

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

  // 加载用户 beads_per_pack 设置
  useEffect(() => {
    if (!token) return;
    api.getUserSettings(token).then((s) => setBadsPerPack(s.beads_per_pack)).catch(() => {});
  }, [token]);

  // modal 打开后:拉用量
  useEffect(() => {
    if (!viewing || !token) return;
    setViewTab('symbol');
    setUsage(null);
    setUsageLoading(true);
    api
      .getUsage(viewing.id, token, beadsPerPack)
      .then(setUsage)
      .catch(() => setUsage(null))
      .finally(() => setUsageLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewing?.id, token]);

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

  async function downloadUsageCsv() {
    if (!viewing || !token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/patterns/${viewing.id}/usage.csv?beads_per_pack=${beadsPerPack}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pixelbead-usage-${viewing.id.slice(0, 8)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : '下载失败');
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
              <div className="flex items-center justify-between pt-1 gap-2">
                <button
                  type="button"
                  onClick={() => setViewing(p)}
                  className="text-xs text-primary-600 hover:underline"
                >
                  {locale === 'en' ? 'View' : '查看'}
                </button>
                <a
                  href={p.symbolUrl}
                  download={`pattern-${p.id}.png`}
                  className="text-xs text-gray-500 hover:underline"
                >
                  {locale === 'en' ? 'Download' : '下载'}
                </a>
              </div>
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

      {/* 预览 / 符号图 + 色号统计 modal */}
      {viewing && (viewing.previewUrl || viewing.symbolUrl) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setViewing(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">
                  {viewing.width}×{viewing.height}{' '}
                  <span className="text-gray-400">·</span>{' '}
                  <span className="font-mono text-gray-500">
                    {viewing.id.slice(0, 8)}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {viewing.palette}{' '}
                  <span className="text-gray-400">·</span>{' '}
                  {new Date(viewing.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
              <button
                type="button"
                aria-label="关闭"
                onClick={() => setViewing(null)}
                className="w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-2xl leading-none flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Tab 切换 */}
            <div className="flex border-b px-6 bg-gray-50 dark:bg-gray-900/50 items-center">
              <button
                type="button"
                onClick={() => setViewTab('symbol')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                  viewTab === 'symbol'
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {locale === 'en' ? 'Symbol Chart' : '符号图'}
              </button>
              <button
                type="button"
                onClick={() => setViewTab('preview')}
                disabled={!viewing.previewUrl}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  viewTab === 'preview'
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {locale === 'en' ? 'Preview' : '拼豆预览'}
              </button>
              <div className="flex-1" />
              <a
                href={viewTab === 'symbol' ? viewing.symbolUrl! : viewing.previewUrl!}
                download={`pattern-${viewing.id}-${viewTab}.png`}
                className="self-center text-xs text-primary-600 hover:underline"
              >
                {locale === 'en' ? '↓ Download this image' : '↓ 下载当前图'}
              </a>
            </div>

            {/* 图片区 */}
            <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
              <img
                src={viewTab === 'symbol' ? viewing.symbolUrl! : viewing.previewUrl!}
                alt={viewTab === 'symbol' ? '符号图' : '拼豆预览'}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* 色号统计 */}
            <div className="border-t bg-white dark:bg-gray-900 px-6 py-4">
              {usageLoading ? (
                <div className="text-sm text-gray-500">
                  {locale === 'en' ? 'Loading color stats…' : '加载色号统计…'}
                </div>
              ) : usage ? (
                <>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {locale === 'en' ? 'Color Stats' : '色号统计'}
                    </h4>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        <strong className="text-gray-900 dark:text-gray-100">
                          {usage.items.length}
                        </strong>{' '}
                        {locale === 'en' ? 'colors' : '种色号'}
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-gray-100">
                          {usage.total_count.toLocaleString()}
                        </strong>{' '}
                        {locale === 'en' ? 'beads' : '颗'}
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-gray-100">
                          {usage.total_packs.toLocaleString()}
                        </strong>{' '}
                        {locale === 'en' ? `packs (${beadsPerPack}/pack)` : `包 (${beadsPerPack}/包)`}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-48 overflow-y-auto">
                    {usage.items
                      .slice()
                      .sort((a, b) => b.count - a.count)
                      .map((item) => (
                        <div
                          key={item.code}
                          className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-center"
                          title={`${item.code} ${item.name_zh || item.name_en || ''} · ${item.count}颗 / ${item.packs}包`}
                        >
                          <span
                            className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 mb-1"
                            style={{ backgroundColor: item.rgb }}
                            aria-hidden="true"
                          />
                          <span className="font-mono text-xs font-semibold">
                            {item.code}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            ×{item.count}
                          </span>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-400">
                  {locale === 'en' ? 'No usage data' : '暂无用量数据'}
                </div>
              )}
            </div>

            {/* Footer 操作 */}
            <div className="border-t px-6 py-3 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
              <Link
                href={`/patterns/${viewing.id}`}
                className="text-sm text-primary-600 hover:underline"
              >
                {locale === 'en' ? 'Open full detail page →' : '打开详情页 →'}
              </Link>
              <button
                type="button"
                onClick={downloadUsageCsv}
                disabled={!usage}
                className="px-3 py-1.5 text-sm bg-blue-700 text-white rounded hover:bg-blue-800 transition disabled:opacity-40"
              >
                📄 {locale === 'en' ? 'Download usage CSV' : '下载用量清单 (CSV)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}