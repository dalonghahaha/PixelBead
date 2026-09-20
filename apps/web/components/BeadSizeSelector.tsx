'use client';

/**
 * 拼豆规格选择器(spec 009)
 * - 分段控件(2 选项:Mini / Midi)
 * - 移动端 < 375px 自动切下拉
 * - 含 "?" tooltip 说明
 */
import { useState } from 'react';
import { BEAD_SIZE_OPTIONS } from '@pixelbead/shared';
import type { BeadSize } from '@pixelbead/shared';

interface Props {
  value: BeadSize;
  onChange: (v: BeadSize) => void;
  locale?: 'zh' | 'en';
}

export default function BeadSizeSelector({ value, onChange, locale = 'zh' }: Props) {
  const [tooltipOpen, setTooltipOpen] = useState<BeadSize | null>(null);

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        拼豆规格
      </label>

      {/* 桌面端分段控件 */}
      <div className="hidden sm:flex gap-2">
        {BEAD_SIZE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 px-3 py-2 border rounded-lg text-sm transition relative ${
              value === opt.value
                ? 'border-primary-600 bg-primary-50 text-primary-700 font-medium'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {locale === 'en' ? opt.label_en : opt.label_zh}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTooltipOpen(tooltipOpen === opt.value ? null : opt.value);
              }}
              className="ml-2 inline-flex items-center justify-center w-4 h-4 text-xs text-gray-500 hover:text-gray-700 rounded-full border border-gray-300"
              aria-label="规格说明"
            >
              ?
            </button>
            {tooltipOpen === opt.value && (
              <div className="absolute z-10 mt-1 left-0 right-0 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                {locale === 'en' ? opt.tooltip_en : opt.tooltip_zh}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* 移动端下拉(< 640px) */}
      <div className="sm:hidden">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as BeadSize)}
          className="w-full px-3 py-2 border rounded-lg"
        >
          {BEAD_SIZE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {locale === 'en' ? opt.label_en : opt.label_zh}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-gray-500 mt-1">
        {locale === 'en'
          ? 'Different sizes suit different boards. Default: Mini.'
          : '不同规格对应不同底板。默认 Mini(2.6mm)。'}
      </p>
    </div>
  );
}