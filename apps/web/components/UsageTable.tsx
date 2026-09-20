'use client';

/**
 * spec 011 — 用量清单表格 + 导出按钮
 */
import { useEffect, useState } from 'react';
import type { BeadSize } from '@pixelbead/shared';
import { api, ApiError } from '@/lib/api';

interface UsageItem {
  code: string;
  rgb: string;
  name_zh?: string | null;
  name_en?: string | null;
  count: number;
  packs: number;
}

interface UsageReport {
  pattern_id: string;
  bead_size: BeadSize;
  items: UsageItem[];
  total_count: number;
  total_packs: number;
  generated_at: string;
}

interface Props {
  patternId: string;
  token: string;
  beadsPerPack?: number;
  locale?: 'zh' | 'en';
}

export default function UsageTable({ patternId, token, beadsPerPack = 500, locale = 'zh' }: Props) {
  const [report, setReport] = useState<UsageReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'count' | 'code'>('count');

  useEffect(() => {
    api.getUsage(patternId, token, beadsPerPack)
      .then(setReport)
      .catch((e) => setError(e instanceof ApiError ? e.message : '加载失败'));
  }, [patternId, token, beadsPerPack]);

  const handleDownload = async (fmt: 'xlsx' | 'csv') => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/patterns/${patternId}/usage.${fmt}?beads_per_pack=${beadsPerPack}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pixelbead-usage-${patternId.slice(0, 8)}.${fmt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : '下载失败');
    }
  };

  if (error) return <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">⚠️ {error}</div>;
  if (!report) return <div className="text-sm text-gray-500">加载用量清单…</div>;

  const items = [...report.items].sort((a, b) =>
    sortBy === 'count' ? b.count - a.count : a.code.localeCompare(b.code),
  );

  return (
    <div className="space-y-4">
      {/* 汇总 */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
          <div className="text-gray-500">{locale === 'en' ? 'Colors' : '色号数'}</div>
          <div className="text-lg font-semibold">{report.items.length}</div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
          <div className="text-gray-500">{locale === 'en' ? 'Total beads' : '总颗数'}</div>
          <div className="text-lg font-semibold">{report.total_count.toLocaleString()}</div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
          <div className="text-gray-500">{locale === 'en' ? 'Total packs' : '总包数'}</div>
          <div className="text-lg font-semibold">{report.total_packs.toLocaleString()}</div>
        </div>
      </div>

      {/* 导出按钮 */}
      <div className="flex gap-2">
        <button
          onClick={() => handleDownload('xlsx')}
          className="px-3 py-2 text-sm bg-green-700 text-white rounded hover:bg-green-800 transition"
        >
          📊 {locale === 'en' ? 'Excel' : 'Excel (.xlsx)'}
        </button>
        <button
          onClick={() => handleDownload('csv')}
          className="px-3 py-2 text-sm bg-blue-700 text-white rounded hover:bg-blue-800 transition"
        >
          📄 {locale === 'en' ? 'CSV' : 'CSV (.csv)'}
        </button>
      </div>

      {/* 排序切换 */}
      <div className="text-xs text-gray-500">
        {locale === 'en' ? 'Sort by:' : '排序:'}
        <button
          onClick={() => setSortBy('count')}
          className={`ml-2 ${sortBy === 'count' ? 'font-semibold text-primary-700' : ''}`}
        >
          {locale === 'en' ? 'Count ↓' : '颗数 ↓'}
        </button>
        <button
          onClick={() => setSortBy('code')}
          className={`ml-2 ${sortBy === 'code' ? 'font-semibold text-primary-700' : ''}`}
        >
          {locale === 'en' ? 'Code' : '色号'}
        </button>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs">
            <tr>
              <th className="px-3 py-2 text-left">{locale === 'en' ? 'Code' : '色号'}</th>
              <th className="px-3 py-2 text-left">{locale === 'en' ? 'Color' : '色块'}</th>
              <th className="px-3 py-2 text-left">{locale === 'en' ? 'Name' : '名称'}</th>
              <th className="px-3 py-2 text-right">{locale === 'en' ? 'Count' : '颗数'}</th>
              <th className="px-3 py-2 text-right">{locale === 'en' ? 'Packs' : '包数'}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.code} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-3 py-2 font-mono">{item.code}</td>
                <td className="px-3 py-2">
                  <span
                    className="inline-block w-5 h-5 rounded border border-gray-300"
                    style={{ backgroundColor: item.rgb }}
                    aria-hidden="true"
                  />
                </td>
                <td className="px-3 py-2">
                  {locale === 'en' ? item.name_en || item.name_zh || '—' : item.name_zh || item.name_en || '—'}
                </td>
                <td className="px-3 py-2 text-right">{item.count.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{item.packs.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}