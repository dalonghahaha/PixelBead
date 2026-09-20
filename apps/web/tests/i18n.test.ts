/**
 * spec 005 — i18n 工具测试
 *
 * 覆盖:
 * - detectLocaleFromHeader(Accept-Language 嗅探)
 * - makeT(zh) / makeT(en) 类型安全文案
 * - fallback:中文 key 缺失 → 返回 key 名
 * - locale 嵌套 key 解析('landing.heroTitle')
 */
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_LOCALE,
  detectLocaleFromHeader,
  makeT,
} from '@/i18n/config';

describe('detectLocaleFromHeader', () => {
  it('null → 默认 zh', () => {
    expect(detectLocaleFromHeader(null)).toBe(DEFAULT_LOCALE);
    expect(DEFAULT_LOCALE).toBe('zh');
  });

  it('空字符串 → 默认 zh', () => {
    expect(detectLocaleFromHeader('')).toBe('zh');
  });

  it('en-US → en', () => {
    expect(detectLocaleFromHeader('en-US')).toBe('en');
    expect(detectLocaleFromHeader('en-GB,en;q=0.9')).toBe('en');
  });

  it('zh-CN → zh', () => {
    expect(detectLocaleFromHeader('zh-CN,zh;q=0.9')).toBe('zh');
    expect(detectLocaleFromHeader('zh-TW')).toBe('zh');
  });

  it('优先级:en > zh', () => {
    expect(detectLocaleFromHeader('zh-CN,en-US;q=0.8')).toBe('en');
    expect(detectLocaleFromHeader('en,zh-CN;q=0.5')).toBe('en');
  });
});

describe('makeT(zh)', () => {
  const t = makeT('zh');

  it('简单 key', () => {
    expect(t('common.loading')).toBe('加载中…');
    expect(t('nav.login')).toBe('登录');
  });

  it('嵌套 key', () => {
    expect(t('landing.heroTitle')).toBe('上传图片,3 秒生成拼豆图纸');
    expect(t('landing.ctaStart')).toBe('开始生成 →');
    expect(t('generate.title')).toBe('上传图片 → 拼豆图纸');
  });

  it('缺失 key → 返回 key 本身', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key');
    expect(t('landing.doesNotExist')).toBe('landing.doesNotExist');
  });
});

describe('makeT(en)', () => {
  const t = makeT('en');

  it('简单 key', () => {
    expect(t('common.loading')).toBe('Loading…');
    expect(t('nav.login')).toBe('Login');
  });

  it('嵌套 key', () => {
    expect(t('landing.heroTitle')).toBe('Upload an image, generate bead patterns in 3 seconds');
    expect(t('landing.ctaStart')).toBe('Start now →');
    expect(t('generate.title')).toBe('Upload Image → Bead Pattern');
  });

  it('占位符透传', () => {
    // generate.resultSuccess 含 {count} 占位符,实际使用 t() 时需自己 replace
    expect(t('generate.resultSuccess')).toContain('{count}');
  });
});