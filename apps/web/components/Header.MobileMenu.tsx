'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import LanguageSwitcher from './LanguageSwitcher';
import { useLocale } from './I18nProvider';

/**
 * 移动端汉堡包菜单(Client Component)
 * 只在 < md(< 768px)显示。点开一个全宽抽屉,展开"生成图纸 / 我的图纸 / 语言 / 登录/头像"。
 *
 * 头像菜单部分复用 Header.UserMenu 的 dropdown 模式,但移动端用全屏面板而不是 popover。
 */
export function MobileMenu({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const { user, ready, logout } = useAuth();
  const { t } = useLocale();
  const ref = useRef<HTMLDivElement>(null);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // body 滚动锁(打开时)
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  const handleLogout = () => {
    logout();
    setOpen(false);
    window.location.href = '/';
  };

  return (
    <div className="md:hidden" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? '关闭菜单' : '打开菜单'}
        aria-expanded={open}
        aria-controls="mobile-menu-panel"
        className="w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 transition"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* 抽屉面板 */}
          <div
            id="mobile-menu-panel"
            role="dialog"
            aria-modal="true"
            aria-label="导航菜单"
            className="fixed top-16 inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 overflow-y-auto"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col">
              {ready && user && (
                <div className="px-2 py-3 mb-2 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
                  已登录: {user.username || user.email}
                </div>
              )}
              <Link
                href="/generate"
                onClick={() => setOpen(false)}
                className="px-4 py-3 min-h-[44px] inline-flex items-center text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              >
                生成图纸
              </Link>
              <Link
                href="/patterns"
                onClick={() => setOpen(false)}
                className="px-4 py-3 min-h-[44px] inline-flex items-center text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              >
                我的图纸
              </Link>
              <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
              {loggedIn ? (
                <>
                  <Link
                    href="/patterns"
                    onClick={() => setOpen(false)}
                    className="px-4 py-3 min-h-[44px] inline-flex items-center text-base text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                  >
                    我的图纸
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-left px-4 py-3 min-h-[44px] inline-flex items-center text-base text-red-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="mx-2 mt-2 px-4 py-3 min-h-[44px] inline-flex items-center justify-center text-base bg-primary-700 text-white rounded-lg hover:bg-primary-800"
                >
                  {t('nav.login')}
                </Link>
              )}
              {/* ← 005 新增:语言切换(移动端放在登录按钮之后) */}
              <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
              <div className="px-2 py-2 text-sm text-gray-500 dark:text-gray-400">
                {t('nav.languageSwitch')}
              </div>
              <LanguageSwitcher />
            </nav>
          </div>
        </>
      )}
    </div>
  );
}