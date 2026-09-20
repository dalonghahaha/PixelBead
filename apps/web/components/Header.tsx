import Link from 'next/link';
import { UserMenu } from './Header.UserMenu';
import { MobileMenu } from './Header.MobileMenu';

export function Header({ loggedIn }: { loggedIn: boolean }) {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 min-h-[44px] shrink-0">
          <img src="/favicon.svg" alt="" className="w-6 h-6" aria-hidden="true" />
          <span className="font-bold text-gray-900 dark:text-white">PixelBead</span>
        </Link>

        {/* 桌面 nav(≥ 768px) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <Link
            href="/generate"
            className="px-3 py-2 min-h-[44px] inline-flex items-center text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
          >
            生成图纸
          </Link>
          <Link
            href="/patterns"
            className="px-3 py-2 min-h-[44px] inline-flex items-center text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
          >
            我的图纸
          </Link>
          {loggedIn ? (
            <div className="ml-2">
              <UserMenu />
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 px-4 py-2 min-h-[44px] inline-flex items-center text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              登录
            </Link>
          )}
        </nav>

        {/* 移动端汉堡(< 768px) */}
        <MobileMenu loggedIn={loggedIn} />
      </div>
    </header>
  );
}