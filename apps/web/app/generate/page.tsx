'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { PaletteInfo, PatternResult } from '@pixelbead/shared';

export default function GeneratePage() {
  const router = useRouter();
  const { token, isLoggedIn, ready } = useAuth();
  const [palettes, setPalettes] = useState<PaletteInfo[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState('mard-221-alfonse-doudou');
  const [width, setWidth] = useState(58);
  const [height, setHeight] = useState(58);
  const [maxColors, setMaxColors] = useState<number | ''>('');
  const [prefilter, setPrefilter] = useState('smooth');
  const [cleanup, setCleanup] = useState('majority');
  const [dither, setDither] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PatternResult | null>(null);

  useEffect(() => {
    api.palettes().then(setPalettes).catch(() => setPalettes([]));
  }, []);

  // 已登录守卫
  useEffect(() => {
    if (ready && !isLoggedIn) {
      router.push('/login');
    }
  }, [ready, isLoggedIn, router]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
    setResult(null);
  };

  const submit = async () => {
    if (!file || !token) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await api.createPattern(
        file,
        {
          palette,
          width,
          height,
          max_colors: maxColors === '' ? undefined : Number(maxColors),
          prefilter,
          cleanup,
          dither,
        },
        token,
      );
      setResult(r);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '生成失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return <div className="py-12 text-center">加载中…</div>;
  if (!isLoggedIn) return null;

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">上传图片 → 拼豆图纸</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 左侧:上传 + 预览 */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFileChange}
              className="block mx-auto"
            />
            <p className="text-xs text-gray-500 mt-2">
              支持 JPG/PNG/WEBP,最大 10MB
            </p>
          </div>

          {previewUrl && (
            <div>
              <div className="text-sm font-medium mb-1">原图预览</div>
              <img
                src={previewUrl}
                alt="原图"
                className="max-w-full max-h-64 border rounded"
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
                    src={`http://localhost:8000${result.previewUrl}`}
                    alt="拼豆预览"
                    className="max-w-full border rounded"
                  />
                </div>
              )}
              {result.symbolUrl && (
                <div>
                  <div className="text-sm font-medium mb-1">符号图</div>
                  <img
                    src={`http://localhost:8000${result.symbolUrl}`}
                    alt="符号图"
                    className="max-w-full border rounded"
                  />
                </div>
              )}
              <Link
                href="/patterns"
                className="inline-block text-sm text-primary-600 hover:underline"
              >
                查看我的图纸 →
              </Link>
            </div>
          )}
        </div>

        {/* 右侧:参数 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">色卡</label>
            <select
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                宽(格)
              </label>
              <input
                type="number"
                min={8}
                max={200}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                高(格)
              </label>
              <input
                type="number"
                min={8}
                max={200}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              限色数(留空不限)
            </label>
            <input
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
            <label className="block text-sm font-medium mb-1">预处理</label>
            <select
              value={prefilter}
              onChange={(e) => setPrefilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="smooth">平滑(适合照片)</option>
              <option value="none">无</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              杂色清理
            </label>
            <select
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
            <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded">
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={!file || submitting}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition font-medium"
          >
            {submitting ? '生成中(可能需要几秒)…' : '生成图纸'}
          </button>
        </div>
      </div>
    </div>
  );
}
