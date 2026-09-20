/**
 * i18n 配置 + 翻译表(spec 005 — 渐进式实现)
 *
 * 设计取舍(spec-kit Clarifications 决策):
 * - **不**重构 URL 前缀(/zh /en)— 风险高,SEO 收益有限(中文用户为主)
 * - **客户端切换**:Locale 存 cookie + React Context,SSR 阶段按 cookie 渲染
 * - **文案 JSON 自托管**:简单、可版本化、翻译协作无需懂技术
 *
 * Phase 1 实现:
 * - zh(默认)/ en 两语言
 * - 客户端 Context 切换
 * - Cookie 持久化
 * - `<html lang>` 跟随 SSR cookie
 *
 * Phase 2+ (留作后续 spec):
 * - next-intl 集成 + URL 前缀(若海外 SEO 收益明确)
 * - hreflang 双向链接
 */

export type Locale = 'zh' | 'en';

export const SUPPORTED_LOCALES: ReadonlyArray<Locale> = ['zh', 'en'] as const;

export const DEFAULT_LOCALE: Locale = 'zh';

export const LOCALE_LABELS: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
};

export const LOCALE_HTML_LANG: Record<Locale, string> = {
  zh: 'zh-CN',
  en: 'en',
};

/** Cookie 名:存用户当前语言偏好 */
export const LOCALE_COOKIE = 'pixelbead_locale';

/**
 * 嗅探 Accept-Language,决定默认 locale
 * 优先级:en-* > zh-* > zh(兜底)
 */
export function detectLocaleFromHeader(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const langs = acceptLanguage.split(',').map((s) => s.split(';')[0].trim().toLowerCase());
  for (const lang of langs) {
    if (lang.startsWith('en')) return 'en';
    if (lang.startsWith('zh')) return 'zh';
  }
  return DEFAULT_LOCALE;
}

/**
 * 加载指定 locale 的文案表
 *
 * 使用静态 import(JSON 全量加载)而非按需,
 * 因为 spec 005 阶段只有 2 语言 + 文案量 < 100 条,全量加载更快
 */
import zhMessages from './messages/zh.json';
import enMessages from './messages/en.json';

export type Messages = typeof zhMessages;

export const MESSAGES: Record<Locale, Messages> = {
  zh: zhMessages,
  en: enMessages,
};

/**
 * 取文案的类型安全函数
 *
 * 用法:
 *   const { t } = useLocale();
 *   t('common.generate')  // → '生成' 或 'Generate'
 *
 * 若 key 不存在,返回 key 本身(开发期可见)
 */
export type MessageKey = NestedKeyOf<Messages>;

type NestedKeyOf<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends object
      ? NestedKeyOf<T[K], `${Prefix}${K}.`>
      : never;
}[keyof T & string];

export function makeT(locale: Locale) {
  return function t(key: MessageKey): string {
    const keys = key.split('.');
    let cur: any = MESSAGES[locale];
    for (const k of keys) {
      if (cur && typeof cur === 'object' && k in cur) {
        cur = cur[k];
      } else {
        // Fallback:中文
        let fallback: any = MESSAGES[DEFAULT_LOCALE];
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk];
          } else {
            return key; // 双重缺失返回 key
          }
        }
        return typeof fallback === 'string' ? fallback : key;
      }
    }
    return typeof cur === 'string' ? cur : key;
  };
}