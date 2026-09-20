'use client';

/**
 * i18n Provider + useLocale hook(spec 005)
 *
 * 工作机制:
 * - Locale 存 cookie + React state
 * - SSR 阶段:从 cookie 读取(由 layout.tsx 注入 initialLocale prop)
 * - 客户端:LanguageSwitcher 调用 setLocale() 更新
 * - 持久化:写 cookie 一年有效期
 *
 * 用法:
 *   const { locale, t, setLocale } = useLocale();
 *   <h1>{t('landing.heroTitle')}</h1>
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  makeT,
  type Locale,
  type Messages,
  MESSAGES,
} from '@/i18n/config';

interface I18nContextValue {
  locale: Locale;
  messages: Messages;
  t: (key: string) => string;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/** Cookie 有效期 365 天 */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

interface ProviderProps {
  /** SSR 阶段从 cookie 读到的 locale(由 layout.tsx 传入) */
  initialLocale: Locale;
  children: ReactNode;
}

export function I18nProvider({ initialLocale, children }: ProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // 客户端首次挂载时,以 cookie 值为准(SSR 可能 fallback 到 Accept-Language)
  useEffect(() => {
    const cookieLocale = readCookie(LOCALE_COOKIE);
    if (cookieLocale === 'zh' || cookieLocale === 'en') {
      setLocaleState(cookieLocale);
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setCookie(LOCALE_COOKIE, next);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const t = makeT(locale);
    return {
      locale,
      messages: MESSAGES[locale],
      t,
      setLocale,
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLocale(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // 兜底:Provider 缺失时返回默认 locale(避免 SSR 报错)
    const fallbackT = makeT(DEFAULT_LOCALE);
    return {
      locale: DEFAULT_LOCALE,
      messages: MESSAGES[DEFAULT_LOCALE],
      t: fallbackT,
      setLocale: () => {},
    };
  }
  return ctx;
}