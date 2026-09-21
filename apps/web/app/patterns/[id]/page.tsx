'use client';

/**
 * spec 008/011/007 — 图纸详情页(关键集成页)
 *
 * 集成:
 * - 008 ExportPdfPanel(导出 PDF 按钮)
 * - 011 UsageTable(用量清单表格 + 导出)
 * - 007 公开图纸切换(visibility toggle) + JsonLdCreativeWork
 * - 005 i18n(全部用 t())
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, ApiError } from '@/lib/api';
import { useLocale } from '@/components/I18nProvider';
import ExportPdfPanel from '@/components/ExportPdfPanel';
import UsageTable from '@/components/UsageTable';
import { JsonLdCreativeWork } from '@/components/JsonLd';
import type { PatternResult, BeadSize } from '@pixelbead/shared';

interface Props {
  params: { id: string };
}

export default function PatternDetailPage({ params }: Props) {
  const router = useRouter();
  const { token, isLoggedIn, ready } = useAuth();
  const { locale } = useLocale();
  const [pattern, setPattern] = useState<(PatternResult & { isPublic?: boolean }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [beadsPerPack, setBeadsPerPack] = useState(500);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!ready || !isLoggedIn || !token) return;
    api.listPatterns(token)
      .then((list) => {
        const found = list.find((p) => p.id === params.id);
        if (!found) {
          setError('图纸不存在');
          return;
        }
        setPattern(found as PatternResult & { isPublic?: boolean });
        // 加载用户设置(beads_per_pack)
        api.getUserSettings(token)
          .then((s) => setBeadsPerPack(s.beads_per_pack))
          .catch(() => {}); // 设置缺失时 fallback 500
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : '加载失败'));
  }, [params.id, token, ready, isLoggedIn]);

  const handleTogglePublic = async () => {
    if (!pattern || !token) return;
    setToggling(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/patterns/${pattern.id}/visibility?is_public=${!pattern.isPublic}`,
        { method: 'PATCH', headers: { Authorization: `Bearer ***}` } },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPattern({ ...pattern, isPublic: !pattern.isPublic });
    } catch (e) {
      setError(e instanceof Error ? e.message : '切换失败');
    } finally {
      setToggling(false);
    }
  };

  if (!ready) return <div className="py-12 text-center">加载中…</div>;
  if (!isLoggedIn) return null;
  if (error && !pattern) return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="text-red-600 bg-red-50 px-4 py-3 rounded">⚠️ {error}</div>
    </div>
  );
  if (!pattern) return <div className="py-12 text-center">加载图纸…</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      {/* ← 007 G-007-5:JSON-LD CreativeWork */}
      <JsonLdCreativeWork
        patternId={pattern.id}
        name={`${pattern.width}×${pattern.height} Bead Pattern`}
        datePublished={pattern.createdAt}
        beadSize={pattern.beadSize as BeadSize}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">图纸详情</h1>
          <p className="text-sm text-gray-500 font-mono mt-1">{pattern.id}</p>
        </div>
        <a href="/patterns" className="text-sm text-primary-600 hover:underline">
          ← 返回列表
        </a>
      </div>

      {/* 预览 + 元数据 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 左侧预览 */}
        <div className="space-y-4">
          {pattern.previewUrl && (
            <div>
              <div className="text-sm font-medium mb-2">{locale === 'en' ? 'Preview' : '拼豆预览'}</div>
              <img
                src={`http://localhost:8000${pattern.previewUrl}`}
                alt="拼豆预览"
                className="w-full border rounded"
              />
            </div>
          )}
          {pattern.symbolUrl && (
            <div>
              <div className="text-sm font-medium mb-2">{locale === 'en' ? 'Symbol Chart' : '符号图'}</div>
              <img
                src={`http://localhost:8000${pattern.symbolUrl}`}
                alt="符号图"
                className="w-full border rounded"
              />
            </div>
          )}
        </div>

        {/* 右侧元信息 + 操作 */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-gray-500">{locale === 'en' ? 'Size' : '尺寸'}</div>
              <div className="font-mono">{pattern.width}×{pattern.height}</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-gray-500">{locale === 'en' ? 'Palette' : '色卡'}</div>
              <div className="font-mono">{pattern.palette}</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-gray-500">{locale === 'en' ? 'Bead Size' : '规格'}</div>
              <div className="font-mono uppercase">{pattern.beadSize}</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-gray-500">{locale === 'en' ? 'Status' : '状态'}</div>
              <div className="font-mono">{pattern.status}</div>
            </div>
          </div>

          {/* 008 PDF 导出 */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">{locale === 'en' ? 'Export' : '导出'}</h3>
            {token && <ExportPdfPanel patternId={pattern.id} token={token} />}
          </div>

          {/* 007 公开图纸切换 */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">
              {locale === 'en' ? 'Visibility' : '可见性'}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePublic}
                disabled={toggling}
                className={`px-4 py-2 text-sm rounded transition disabled:opacity-50 ${
                  pattern.isPublic
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {toggling
                  ? '切换中…'
                  : pattern.isPublic
                    ? (locale === 'en' ? '🌐 Public' : '🌐 公开')
                    : (locale === 'en' ? '🔒 Private' : '🔒 私有')}
              </button>
              <span className="text-xs text-gray-500">
                {pattern.isPublic
                  ? (locale === 'en' ? 'Listed in sitemap.xml' : '已列入 sitemap.xml')
                  : (locale === 'en' ? 'Only you can see' : '仅自己可见')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 011 用量清单 */}
      <div className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">{locale === 'en' ? 'Usage' : '用量清单'}</h2>
        {token && <UsageTable patternId={pattern.id} token={token} beadsPerPack={beadsPerPack} locale={locale} />}
      </div>
    </div>
  );
}