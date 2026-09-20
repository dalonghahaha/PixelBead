/**
 * 客户端 token 存储 + 简单状态管理
 * localStorage 持久化 + cookie 镜像(让 Server Component 也能读到登录态)
 */
'use client';

import { useEffect, useState } from 'react';
import type { User } from '@pixelbead/shared';

const TOKEN_KEY = 'pixelbead_token';
const USER_KEY = 'pixelbead_user';
const COOKIE_NAME = 'pixelbead_token';

function setCookie(value: string, maxAgeSec: number) {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSec}; SameSite=Lax`;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setCookie(token, 86400); // 镜像到 cookie 让 Server Component SSR 阶段能读
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  setCookie('', 0);
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setToken(getToken());
    setReady(true);
  }, []);

  return {
    user,
    token,
    ready,
    isLoggedIn: !!user && !!token,
    login: (t: string, u: User) => {
      setSession(t, u);
      setToken(t);
      setUser(u);
    },
    logout: () => {
      clearSession();
      setToken(null);
      setUser(null);
    },
  };
}