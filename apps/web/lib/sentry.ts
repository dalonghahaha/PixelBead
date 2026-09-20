/**
 * spec 006 — Sentry 初始化(浏览器)
 *
 * 云版优先(sentry.io 免费层 5K 错误/月)
 * 若需自托管,改 NEXT_PUBLIC_SENTRY_DSN + 自部署 Sentry 服务
 */
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || '';
export const SENTRY_ENV = process.env.NEXT_PUBLIC_SENTRY_ENV || 'production';

export async function initSentryBrowser(): Promise<void> {
  if (typeof window === 'undefined' || !SENTRY_DSN) return;
  try {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 0.1, // 生产 10%,开发 100%(由 NEXT_PUBLIC_SENTRY_ENV 切换)
      environment: SENTRY_ENV,
      release: process.env.NEXT_PUBLIC_SENTRY_RELEASE, // Git SHA 短码
      // 隐私:不在事件中存 PII
      beforeSend(event) {
        if (event.user) {
          // 仅保留 user_id_hash(由调用方注入)
          event.user = { id: event.user.id };
        }
        return event;
      },
    });
  } catch (e) {
    // 静默失败,不影响主流程
    if (import.meta.env.DEV) console.warn('Sentry init failed:', e);
  }
}