'use client';

/**
 * 拼豆规格选择器(spec 009)
 * - 分段控件(2 选项:Mini / Midi)— 用 role="radiogroup" + role="radio"(a11y 友好)
 * - 移动端 < 640px 自动切下拉(<select>)
 * - 含 "?" tooltip — tooltip 触发按钮是 radio 的**兄弟节点**,不再嵌套
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

  const labelId = 'bead-size-label';

  return (
    <div>
      <span id={labelId} className="block text-sm font-medium mb-1">
        拼豆规格
      </span>

      {/* 桌面端分段控件 — radio group */}
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="hidden sm:flex flex-wrap gap-2"
      >
        {BEAD_SIZE_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          const tipOpen = tooltipOpen === opt.value;
          return (
            <div key={opt.value} className="relative flex-1 min-w-[120px]">
              <div
                role="radio"
                tabIndex={0}
                aria-checked={selected}
                onClick={() => onChange(opt.value)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    onChange(opt.value);
                  }
                }}
                className={`px-3 py-2 border rounded-lg text-sm transition cursor-pointer text-center ${
                  selected
                    ? 'border-primary-700 bg-primary-50 text-primary-700 font-medium'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {locale === 'en' ? opt.label_en : opt.label_zh}
              </div>
              {/* tooltip 触发按钮 — radio 的兄弟节点,不是子节点,避开 nested-interactive */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTooltipOpen(tipOpen ? null : opt.value);
                }}
                aria-label="规格说明"
                aria-expanded={tipOpen}
                className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-xs text-gray-500 hover:text-gray-700 rounded-full border border-gray-300 bg-white"
              >
                ?
              </button>
              {tipOpen && (
                <div className="absolute z-10 mt-1 left-0 right-0 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                  {locale === 'en' ? opt.tooltip_en : opt.tooltip_zh}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 移动端下拉(< 640px) */}
      <div className="sm:hidden">
        <label htmlFor="gen-bead-size" className="sr-only">
          拼豆规格
        </label>
        <select
          id="gen-bead-size"
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