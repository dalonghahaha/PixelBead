'use client';

/**
 * spec 011 — 用户设置页
 * - 每包颗数(beads_per_pack)
 * - 未来可加:语言偏好、通知设置等
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, ApiError } from '@/lib/api';
import BeadsPerPackSetting from '@/components/BeadsPerPackSetting';
import { useLocale } from '@/components/I18nProvider';

export default function SettingsPage() {
  const router = useRouter();
  const { token, isLoggedIn, ready } = useAuth();
  const { locale, t } = useLocale();
  const [beadsPerPack, setBeadsPerPack] = useState(500);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !isLoggedIn) {
      router.push('/login');
      return;
    }
    if (!token) return;
    api.getUserSettings(token)
      .then((s) => setBeadsPerPack(s.beads_per_pack))
      .catch((e) => setError(e instanceof ApiError ? e.message : '加载失败'));
  }, [ready, isLoggedIn, token, router]);

  const handleSave = async (val: number) => {
    if (!token) return;
    try {
      const updated = await api.patchUserSettings(token, val);
      setBeadsPerPack(updated.beads_per_pack);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '保存失败');
    }
  };

  if (!ready) return <div className="py-12 text-center">加载中…</div>;
  if (!isLoggedIn) return null;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
      <p className="text-sm text-gray-500">
        {locale === 'en'
          ? 'Customize your bead pattern generation preferences'
          : '自定义拼豆图纸生成偏好'}
      </p>

      {error && (
        <div className="text-red-600 bg-red-50 px-4 py-3 rounded">⚠️ {error}</div>
      )}

      {saved && (
        <div className="text-green-700 bg-green-50 px-4 py-3 rounded">
          ✓ {locale === 'en' ? 'Saved' : '已保存'}
        </div>
      )}

      <div className="border-t pt-6">
        <BeadsPerPackSetting value={beadsPerPack} onSave={handleSave} locale={locale} />
      </div>
    </div>
  );
}