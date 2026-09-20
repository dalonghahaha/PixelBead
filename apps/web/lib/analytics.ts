/**
 * spec 006 — 行为埋点 + 错误监控(Plausible + Sentry)
 *
 * 命名规范:pb_<domain>_<action>
 */
import type { BeadSize } from '@pixelbead/shared';

// Plausible 自定义事件签名(避免硬编码)
declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
  }
}

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'pixelbead.app';

/** ← 006 G-006-1:重新导出供 layout 导入 */
export { initPlausible as initPlausibleAnalytics };

/** 注入 Plausible script(幂等) */
export function initPlausible(): void {
  if (typeof window === 'undefined') return;
  if (document.querySelector(`script[data-domain="${PLAUSIBLE_DOMAIN}"]`)) return;

  const script = document.createElement('script');
  script.defer = true;
  script.dataset.domain = PLAUSIBLE_DOMAIN;
  script.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(script);
}

/** 通用事件追踪 */
export function trackEvent(event: string, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.plausible) return;
  try {
    window.plausible(event, { props: props || {} });
  } catch (e) {
    // 静默失败,不影响主流程
    if (import.meta.env.DEV) console.warn('plausible track failed:', e);
  }
}

/** SHA256 哈希(用于 user_id_hash) */
async function sha256(text: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // SSR 兜底
    return '';
  }
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const SALT = process.env.NEXT_PUBLIC_ANALYTICS_SALT || 'dev-salt';

/** 生成 user_id_hash(不可逆) */
export async function hashUserId(email: string | null | undefined): Promise<string> {
  if (!email) return '';
  return sha256(`${email}${SALT}`);
}

// ---- 10 个核心事件 ----


export const trackAuthSignup = (source: 'direct' | 'invite' = 'direct') =>
  trackEvent('pb_auth_signup', { source });

export const trackAuthLogin = (method: 'password' | 'oauth' = 'password') =>
  trackEvent('pb_auth_login', { method });

export const trackGenerateStart = (imageSizeKb: number, beadSize: BeadSize) =>
  trackEvent('pb_generate_start', { image_size_kb: imageSizeKb, bead_size: beadSize });

export const trackGenerateSuccess = (durationMs: number, patternId: string, beadCount: number) =>
  trackEvent('pb_generate_success', { duration_ms: durationMs, pattern_id: patternId, bead_count: beadCount });

export const trackGenerateFailure = (errorCode: string, durationMs: number) =>
  trackEvent('pb_generate_failure', { error_code: errorCode, duration_ms: durationMs });

export const trackExportPdf = (patternId: string, pageCount: number, pdfSizeKb: number) =>
  trackEvent('pb_export_pdf', { pattern_id: patternId, page_count: pageCount, pdf_size_kb: pdfSizeKb });

export const trackExportUsageXlsx = (patternId: string, rowCount: number) =>
  trackEvent('pb_export_usage_xlsx', { pattern_id: patternId, row_count: rowCount });

export const trackExportUsageCsv = (patternId: string, rowCount: number) =>
  trackEvent('pb_export_usage_csv', { pattern_id: patternId, row_count: rowCount });

export const trackShareClick = (patternId: string, channel: string) =>
  trackEvent('pb_share_click', { pattern_id: patternId, channel });

export const trackLandingCtaClick = (position: 'hero' | 'nav' | 'footer') =>
  trackEvent('pb_landing_cta_click', { position });

// ---- 010 异步任务事件 ----

export const trackTaskCreated = (taskId: string) =>
  trackEvent('pb_task_created', { task_id: taskId });

export const trackTaskCompleted = (taskId: string, durationMs: number) =>
  trackEvent('pb_task_completed', { task_id: taskId, duration_ms: durationMs });

export const trackTaskFailed = (taskId: string, errorCode: string) =>
  trackEvent('pb_task_failed', { task_id: taskId, error_code: errorCode });

// ---- 011 用量清单事件 ----

export const trackUsageTableViewed = (patternId: string) =>
  trackEvent('pb_usage_table_viewed', { pattern_id: patternId });