import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'PixelBead — 拼豆图纸生成器',
  description: '上传图片,一键生成拼豆图纸',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server Component 读 cookie 判断登录态
  // (auth.ts setSession 同时写 cookie + localStorage,所以 SSR 阶段就能拿到)
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get('pixelbead_token');
  const loggedIn = !!tokenCookie?.value;

  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Header loggedIn={loggedIn} />
        <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}