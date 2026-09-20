'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/components/I18nProvider';
import { trackAuthLogin, trackAuthSignup } from '@/lib/analytics';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t, locale } = useLocale();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res =
        mode === 'login'
          ? await api.login({ email, password })
          : await api.register({ email, username, password });
      login(res.token, res.user);
      // ← 006 G-006-8/9:埋点 - 登录/注册
      if (mode === 'login') trackAuthLogin('password');
      else trackAuthSignup('direct');
      router.push('/patterns');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '请求失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-3xl font-bold mb-6 text-center">
          {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
        {mode === 'login' ? '登录' : '注册'}
      </h1>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('auth.emailLabel')}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="you@example.com"
          />
        </div>

        {mode === 'register' && (
          <div>
            <label className="block text-sm font-medium mb-1">用户名
          {/* {t('auth.usernameLabel')} */}</label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={32}
              pattern="[a-zA-Z0-9_-]+"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="3-32 字母/数字/下划线"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">{t('auth.passwordLabel')}</label>
          <input
            type="password"
            required
            minLength={mode === 'register' ? 8 : 1}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder={mode === 'register' ? '至少 8 位' : ''}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
        >
          {loading
            ? (locale === 'en' ? 'Processing…' : '处理中…')
            : mode === 'login'
              ? t('auth.submitLogin')
              : t('auth.submitRegister')}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        {mode === 'login' ? (
          <>
            还没账号?{' '}
            <button
              onClick={() => setMode('register')}
              className="text-primary-600 hover:underline"
            >
              立即注册
            </button>
          </>
        ) : (
          <>
            已有账号?{' '}
            <button
              onClick={() => setMode('login')}
              className="text-primary-600 hover:underline"
            >
              返回登录
            </button>
          </>
        )}
      </div>

      <div className="mt-8 text-center text-sm">
        <Link href="/" className="text-gray-500 hover:underline">
          ← 返回首页
        </Link>
      </div>
    </div>
  );
}
