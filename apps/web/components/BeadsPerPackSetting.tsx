'use client';

/**
 * spec 011 — 每包颗数设置组件
 */
import { useState } from 'react';

interface Props {
  value: number;
  onSave: (val: number) => void;
  locale?: 'zh' | 'en';
}

export default function BeadsPerPackSetting({ value, onSave, locale = 'zh' }: Props) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft < 1 || draft > 10000) {
      setError(locale === 'en' ? 'Must be between 1 and 10000' : '范围 1-10000');
      return;
    }
    setError(null);
    onSave(draft);
  };

  const isDirty = draft !== value;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block">
        <div className="text-sm font-medium mb-1">
          {locale === 'en' ? 'Beads per pack' : '每包颗数'}
        </div>
        <p className="text-xs text-gray-500 mb-2">
          {locale === 'en'
            ? 'Used to estimate pack counts in the usage report. MARD defaults to 500.'
            : '用于用量清单的包数估算。MARD 默认 500 颗/包。'}
        </p>
        <input
          type="number"
          min={1}
          max={10000}
          value={draft}
          onChange={(e) => setDraft(Number(e.target.value))}
          className="w-32 px-3 py-2 border rounded-lg font-mono"
        />
      </label>
      {error && <div className="text-sm text-red-700">⚠️ {error}</div>}
      <button
        type="submit"
        disabled={!isDirty}
        className="px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50 transition text-sm"
      >
        {locale === 'en' ? 'Save' : '保存'}
      </button>
    </form>
  );
}