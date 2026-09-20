'use client';

/**
 * spec 008 — 导出 PDF 按钮(最小可用版)
 *
 * 用法:
 *   <ExportPdfPanel patternId={pattern.id} token={token} />
 */
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';

export default function ExportPdfPanel({ patternId, token }: { patternId: string; token: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. 拉 grid 数据
      const grid = await api.getPatternGrid(patternId, token);

      // 2. 动态加载 jsPDF(避免 SSR)
      const { jsPDF } = await import('jspdf');

      // 3. 生成 PDF
      const { generatePdf } = await import('@/lib/pdf');
      const doc = generatePdf(grid, jsPDF, grid.locale as 'zh' | 'en');

      // 4. 触发下载
      doc.save(`pixelbead-${patternId}.pdf`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : '导出失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50 transition text-sm"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
              <path d="M4 12a8 8 0 018-8v8z" fill="currentColor" />
            </svg>
            生成中…
          </>
        ) : (
          <>📄 导出 PDF</>
        )}
      </button>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          ⚠️ {error}
        </div>
      )}
      <p className="text-xs text-gray-500">
        A4 横向 · 每格色号 · 坐标轴 · 可打印
      </p>
    </div>
  );
}