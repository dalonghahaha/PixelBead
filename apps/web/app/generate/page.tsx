'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { PaletteInfo, PatternResult, BeadSize } from '@pixelbead/shared';
import { BEAD_SIZE_DEFAULT } from '@pixelbead/shared';
import BeadSizeSelector from '@/components/BeadSizeSelector';
import { plateSizeHint } from '@/lib/beadSize';
import TaskStatusPoller from '@/components/TaskStatusPoller';
import type { TaskCreateResponse } from '@/lib/task';
import { squareImage, getImageSize, squaredPixelSize } from '@/lib/imageSquare';

/**
 * 豆板(底板)常用格子数 — 拼豆实物板对应格子数
 * - 全部正方形(用户反馈:实物板多为方形)
 * - 29/52/58/70/100 是 MARD / ARTKAL 国内最常见 5 档
 * - 用户上传的图先自动 center-crop 成正方形,再用这个格子数缩放
 */
const BOARD_SIZE_PRESETS = [29, 52, 58, 70, 100] as const;

export default function GeneratePage() {
  const router = useRouter();
  const { token, isLoggedIn, ready } = useAuth();
  const [palettes, setPalettes] = useState<PaletteInfo[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState('mard-221-alfonse-doudou');

  // 豆板尺寸(正方形格子数) — 用户从常见 5 档选
  const [boardSize, setBoardSize] = useState<number>(58);

  const [maxColors, setMaxColors] = useState<number | ''>('');
  const [prefilter, setPrefilter] = useState('smooth');
  const [cleanup, setCleanup] = useState('majority');
  const [dither, setDither] = useState(false);
  const [beadSize, setBeadSize] = useState<BeadSize>(BEAD_SIZE_DEFAULT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PatternResult | null>(null);
  const [asyncTaskId, setAsyncTaskId] = useState<string | null>(null);

  // 上传图状态(用于显示原始尺寸 + 裁方提示)
  const [originalSize, setOriginalSize] = useState<{ w: number; h: number } | null>(null);
  const [squaredPreviewUrl, setSquaredPreviewUrl] = useState<string | null>(null);
  const [squaring, setSquaring] = useState(false);

  useEffect(() => {
    api.palettes().then(setPalettes).catch(() => setPalettes([]));
  }, []);

  useEffect(() => {
    if (ready && !isLoggedIn) {
      router.push('/login');
    }
  }, [ready, isLoggedIn, router]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (squaredPreviewUrl) URL.revokeObjectURL(squaredPreviewUrl);
    setSquaredPreviewUrl(null);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
    setOriginalSize(null);
    if (!f) return;

    try {
      setSquaring(true);
      const { w, h } = await getImageSize(f);
      setOriginalSize({ w, h });
      // 渲染一个小的方形预览(180px)给用户看
      const blob = await squareImage(f, { size: 180, type: 'image/jpeg', quality: 0.85 });
      setSquaredPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('square preview failed:', err);
    } finally {
      setSquaring(false);
    }
  };

  const submit = async () => {
    if (!file || !token) return;
    setSubmitting(true);
    setError(null);
    try {
      // 上传前先 center-crop 成正方形,后端只接收正方形
      const squaredBlob = await squareImage(file);
      const squaredFile = new File([squaredBlob], file.name, {
        type: squaredBlob.type || 'image/png',
      });

      const r = await api.createPattern(
        squaredFile,
        {
          palette,
          width: boardSize,
          height: boardSize, // 豆板正方形,宽=高
          max_colors: maxColors === '' ? undefined : Number(maxColors),
          prefilter,
          cleanup,
          dither,
          bead_size: beadSize,
        },
        token,
      );

      if ('task_id' in r && (r as TaskCreateResponse).status === 'queued') {
        setAsyncTaskId((r as TaskCreateResponse).task_id);
        setResult(null);
      } else {
        setResult(r as PatternResult);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '生成失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return <div className="py-12 text-center">加载中…</div>;
  if (!isLoggedIn) return null;

  if (asyncTaskId && token) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">生成中…</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          大图生成需要更长时间,后台已加入队列,请稍候。
        </p>
        <TaskStatusPoller taskId={asyncTaskId} token={token} />
      </div>
    );
  }

  const willBeSquaredTo = originalSize ? squaredPixelSize(originalSize.w, originalSize.h) : null;

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">上传图片 → 拼豆图纸</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 左侧:上传 + 预览 */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <label htmlFor="gen-file-input" className="sr-only">
              选择图片文件
            </label>
            <input
              id="gen-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFileChange}
              aria-label="选择图片文件"
              className="block mx-auto"
            />
            <p className="text-xs text-gray-500 mt-2">
              支持 JPG/PNG/WEBP,最大 10MB
            </p>
          </div>

          {previewUrl && (
            <div>
              <div className="text-sm font-medium mb-1">
                原图 {originalSize ? `${originalSize.w}×${originalSize.h}` : ''}
              </div>
              <img
                src={previewUrl}
                alt="原图"
                className="max-w-full max-h-64 border rounded"
              />
            </div>
          )}

          {originalSize && (
            <div className="text-xs text-gray-600 bg-amber-50 px-3 py-2 rounded border border-amber-200">
              <strong>自动处理:</strong>{' '}
              {originalSize.w === originalSize.h ? (
                <>豆板为正方形,图也是正方形 ({originalSize.w}×{originalSize.h}),不做额外裁切。</>
              ) : (
                <>
                  豆板为正方形,非正方形图会被{' '}
                  <strong>中心裁切</strong> 为 {willBeSquaredTo}×{willBeSquaredTo} 像素
                  <span className="text-amber-700">
                    {' '}(原图 {originalSize.w}×{originalSize.h} 比例 {Math.round((originalSize.w / originalSize.h) * 100) / 100})
                  </span>
                </>
              )}
            </div>
          )}

          {squaredPreviewUrl && (
            <div>
              <div className="text-sm font-medium mb-1">裁方预览</div>
              <img
                src={squaredPreviewUrl}
                alt="裁方预览"
                className="w-44 h-44 object-cover border rounded"
              />
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-green-700">
                ✓ 生成成功 · 共 {Object.keys(result.colorCounts || {}).length} 种颜色
              </div>
              {result.previewUrl && (
                <div>
                  <div className="text-sm font-medium mb-1">拼豆预览</div>
                  <img
                    src={result.previewUrl}
                    alt="拼豆预览"
                    className="max-w-full border rounded"
                  />
                </div>
              )}
              {result.symbolUrl && (
                <div>
                  <div className="text-sm font-medium mb-1">符号图</div>
                  <img
                    src={result.symbolUrl}
                    alt="符号图"
                    className="max-w-full border rounded"
                  />
                </div>
              )}
              <Link
                href="/patterns"
                className="inline-block text-sm text-primary-700 hover:underline"
              >
                查看我的图纸 →
              </Link>
            </div>
          )}
        </div>

        {/* 右侧:参数 */}
        <div className="space-y-4">
          <div>
            <label htmlFor="gen-palette" className="block text-sm font-medium mb-1">
              色卡
            </label>
            <select
              id="gen-palette"
              value={palette}
              onChange={(e) => setPalette(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {palettes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.count}色 · {p.standard === 'domestic' ? '国内' : '国际'})
                </option>
              ))}
              {palettes.length === 0 && (
                <option value={palette}>{palette}(默认)</option>
              )}
            </select>
          </div>

          {/* 豆板尺寸预设(替代旧的 宽/高 输入) */}
          <div>
            <label htmlFor="gen-board-size" className="block text-sm font-medium mb-1">
              豆板尺寸(正方形格子数)
            </label>
            <select
              id="gen-board-size"
              value={boardSize}
              onChange={(e) => setBoardSize(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {BOARD_SIZE_PRESETS.map((n) => (
                <option key={n} value={n}>
                  {n} × {n} 格
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              市面常见: 29 / 52 / 58 / 70 / 100 格(MARD / ARTKAL 实物板尺寸)
            </p>
          </div>

          <BeadSizeSelector value={beadSize} onChange={setBeadSize} locale="zh" />
          <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded">
            底板提示:{plateSizeHint(boardSize, boardSize, beadSize, 'zh')}
          </div>

          <div>
            <label htmlFor="gen-max-colors" className="block text-sm font-medium mb-1">
              限色数(留空不限)
            </label>
            <input
              id="gen-max-colors"
              type="number"
              min={2}
              max={221}
              value={maxColors}
              onChange={(e) =>
                setMaxColors(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="默认不限"
            />
          </div>

          <div>
            <label htmlFor="gen-prefilter" className="block text-sm font-medium mb-1">
              预处理
            </label>
            <select
              id="gen-prefilter"
              value={prefilter}
              onChange={(e) => setPrefilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="smooth">平滑(适合照片)</option>
              <option value="none">无</option>
            </select>
          </div>

          <div>
            <label htmlFor="gen-cleanup" className="block text-sm font-medium mb-1">
              杂色清理
            </label>
            <select
              id="gen-cleanup"
              value={cleanup}
              onChange={(e) => setCleanup(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="majority">多数清理(推荐)</option>
              <option value="none">不清理</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={dither}
              onChange={(e) => setDither(e.target.checked)}
            />
            启用抖动(适合照片细节,不推荐默认开)
          </label>

          {error && (
            <div className="text-red-700 text-sm bg-red-50 px-3 py-2 rounded">
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={!file || submitting}
            className="w-full py-3 bg-primary-700 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition font-medium"
          >
            {submitting ? '生成中(可能需要几秒)…' : '生成图纸'}
          </button>
        </div>
      </div>
    </div>
  );
}