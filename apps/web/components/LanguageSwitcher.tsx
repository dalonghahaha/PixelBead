'use client';

/**
 * 语言切换器(spec 005)
 * - Header 右侧挂载
 * - 下拉控件:中文 / English
 * - 当前语言选中态
 * - 切换时调 setLocale()(写 cookie + 立即重渲染)
 */
import { useState } from 'react';
import { useLocale } from './I18nProvider';
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from '@/i18n/config';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="min-h-[44px] min-w-[44px] px-3 py-2 inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
        aria-label="切换语言"
        aria-expanded={open}
      >
        <span aria-hidden="true">🌐</span>
        <span className="hidden sm:inline">{LOCALE_LABELS[locale]}</span>
        <span aria-hidden="true" className="text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 py-1 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          {SUPPORTED_LOCALES.map((loc: Locale) => (
            <button
              key={loc}
              type="button"
              onClick={() => {
                setLocale(loc);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition ${
                loc === locale
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
              aria-current={loc === locale ? 'true' : undefined}
            >
              {LOCALE_LABELS[loc]}
              {loc === locale && <span className="ml-2" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}