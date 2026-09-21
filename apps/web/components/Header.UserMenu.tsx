'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

/**
 * 已登录态的 Header 用户头像下拉菜单(Client Component)
 * SSR 时 layout.tsx 只看到 cookie 存在 (loggedIn=true),
 * 这里 hydration 后用 useAuth() 拿真实 user,显示头像 + dropdown。
 */
export function UserMenu() {
  const { user, ready, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initialChar: string = ready && user
    ? (user.username?.[0] || user.email?.[0] || 'U')
    : '·';
  const initial = String(initialChar).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="用户菜单"
        aria-expanded={open}
        className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-semibold flex items-center justify-center hover:bg-primary-200 dark:hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 transition"
      >
        {initial}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
        >
          {ready && user && (
            <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 truncate">
              {user.username || user.email}
            </div>
          )}
          <Link
            href="/patterns"
            role="menuitem"
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 min-h-[44px] inline-flex items-center w-full"
            onClick={() => setOpen(false)}
          >
            我的图纸
          </Link>
          <Link
            href="#"
            role="menuitem"
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 min-h-[44px] inline-flex items-center w-full"
            onClick={(e) => {
              e.preventDefault();
              setOpen(false);
            }}
            aria-disabled="true"
          >
            设置(预留)
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              logout();
              setOpen(false);
              window.location.href = '/';
            }}
            className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-50 dark:hover:bg-gray-800 min-h-[44px]"
          >
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}