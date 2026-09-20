import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { I18nProvider } from '@/components/I18nProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { JsonLdSoftwareApp } from '@/components/JsonLd';
import { ClientInit } from '@/components/ClientInit';
import {
  LOCALE_COOKIE,
  LOCALE_HTML_LANG,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  detectLocaleFromHeader,
  type Locale,
} from '@/i18n/config';

export const metadata: Metadata = {
  title: 'PixelBead — 拼豆图纸生成器',
  description: '上传图片,一键生成拼豆图纸',
};

// ← 006 G-006-1/2:客户端初始化 Plausible + Sentry(在 ClientInit 组件中)
// + 007 G-007-4:JSON-LD 结构化数据(在 <head> 中)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server Component 读 cookie 判断登录态
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get('pixelbead_token');
  const loggedIn = !!tokenCookie?.value;

  // ← 005 新增:读 locale cookie(SSR 阶段直接渲染目标语言)
  const localeCookie = cookieStore.get(LOCALE_COOKIE);
  let initialLocale: Locale = DEFAULT_LOCALE;
  if (localeCookie?.value === 'zh' || localeCookie?.value === 'en') {
    initialLocale = localeCookie.value;
  } else {
    // 兜底:Accept-Language 嗅探
    // 注意:Next.js App Router 不直接暴露 Request,这里仅作为占位,
    // 客户端 I18nProvider 首次 mount 会再读 cookie 覆盖
    initialLocale = DEFAULT_LOCALE;
  }
  const htmlLang = LOCALE_HTML_LANG[initialLocale];

  return (
    <html lang={htmlLang}>
      <head>
        {/* ← 007 G-007-4:JSON-LD 结构化数据 */}
        <JsonLdSoftwareApp />
      </head>
      <body className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <ClientInit />
        <I18nProvider initialLocale={initialLocale}>
          <ErrorBoundary boundary="root">
            <Header loggedIn={loggedIn} />
            <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
            <Footer />
          </ErrorBoundary>
        </I18nProvider>
      </body>
    </html>
  );
}