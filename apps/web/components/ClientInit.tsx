'use client';

/**
 * spec 006 — 客户端初始化(Plausible + Sentry)
 *
 * 客户端 mount 时调 initPlausible + initSentryBrowser
 * 放在根布局中确保全局生效
 */
import { useEffect } from 'react';
import { initPlausible } from '@/lib/analytics';
import { initSentryBrowser } from '@/lib/sentry';

export function ClientInit(): null {
  useEffect(() => {
    initPlausible();
    initSentryBrowser();
  }, []);
  return null;
}