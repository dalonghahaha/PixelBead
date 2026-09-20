/**
 * spec 006 — analytics 单元测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock window.plausible
beforeEach(() => {
  global.window.plausible = vi.fn();
});

describe('analytics event tracking', () => {
  it('trackAuthSignup 调 plausible("pb_auth_signup")', async () => {
    const { trackAuthSignup } = await import('@/lib/analytics');
    trackAuthSignup('invite');
    expect(window.plausible).toHaveBeenCalledWith('pb_auth_signup', {
      props: { source: 'invite' },
    });
  });

  it('trackAuthLogin 调 plausible("pb_auth_login")', async () => {
    const { trackAuthLogin } = await import('@/lib/analytics');
    trackAuthLogin('password');
    expect(window.plausible).toHaveBeenCalledWith('pb_auth_login', {
      props: { method: 'password' },
    });
  });

  it('trackGenerateStart 带 image_size_kb + bead_size', async () => {
    const { trackGenerateStart } = await import('@/lib/analytics');
    trackGenerateStart(1024, 'mini');
    expect(window.plausible).toHaveBeenCalledWith('pb_generate_start', {
      props: { image_size_kb: 1024, bead_size: 'mini' },
    });
  });

  it('trackExportPdf 带 page_count + pdf_size_kb', async () => {
    const { trackExportPdf } = await import('@/lib/analytics');
    trackExportPdf('pat-1', 4, 500);
    expect(window.plausible).toHaveBeenCalledWith('pb_export_pdf', {
      props: { pattern_id: 'pat-1', page_count: 4, pdf_size_kb: 500 },
    });
  });

  it('trackTaskCompleted 带 duration_ms', async () => {
    const { trackTaskCompleted } = await import('@/lib/analytics');
    trackTaskCompleted('task-1', 2300);
    expect(window.plausible).toHaveBeenCalledWith('pb_task_completed', {
      props: { task_id: 'task-1', duration_ms: 2300 },
    });
  });

  it('trackTaskFailed 带 error_code', async () => {
    const { trackTaskFailed } = await import('@/lib/analytics');
    trackTaskFailed('task-1', 'oom');
    expect(window.plausible).toHaveBeenCalledWith('pb_task_failed', {
      props: { task_id: 'task-1', error_code: 'oom' },
    });
  });

  it('trackUsageTableViewed 仅带 pattern_id', async () => {
    const { trackUsageTableViewed } = await import('@/lib/analytics');
    trackUsageTableViewed('pat-1');
    expect(window.plausible).toHaveBeenCalledWith('pb_usage_table_viewed', {
      props: { pattern_id: 'pat-1' },
    });
  });

  it('SSR 环境 trackEvent 静默失败', async () => {
    // 模拟 SSR(wind* undefined)
    const origWindow = global.window;
    // @ts-ignore
    delete (global as any).window;
    const { trackEvent } = await import('@/lib/analytics');
    expect(() => trackEvent('test_event')).not.toThrow();
    global.window = origWindow;
  });
});