/**
 * spec 009 — 前端工具函数测试
 *
 * 覆盖:
 * - suggestedPlateSize 计算(Mini / Midi)
 * - plateSizeHint 文案(zh / en)
 * - beadSizeLabel 本地化
 */
import { describe, it, expect } from 'vitest';
import { suggestedPlateSize, plateSizeHint, beadSizeLabel } from '@/lib/beadSize';

describe('suggestedPlateSize', () => {
  it('Mini: 底板尺寸 = 图纸格子数(1:1)', () => {
    expect(suggestedPlateSize(58, 'mini')).toBe(58);
    expect(suggestedPlateSize(29, 'mini')).toBe(29);
    expect(suggestedPlateSize(116, 'mini')).toBe(116);
  });

  it('Midi: 同底板容纳 1/4 格子,向上取整', () => {
    // 58×58 → ceil(58 / 2) = 29
    expect(suggestedPlateSize(58, 'midi')).toBe(29);
    // 29 → ceil(29 / 2) = 15
    expect(suggestedPlateSize(29, 'midi')).toBe(15);
    // 100 → ceil(100 / 2) = 50
    expect(suggestedPlateSize(100, 'midi')).toBe(50);
  });

  it('极端值兜底', () => {
    expect(suggestedPlateSize(8, 'mini')).toBe(8);
    expect(suggestedPlateSize(8, 'midi')).toBe(4);
    expect(suggestedPlateSize(200, 'mini')).toBe(200);
    expect(suggestedPlateSize(200, 'midi')).toBe(100);
  });
});

describe('plateSizeHint', () => {
  it('中文文案:Mini 默认', () => {
    expect(plateSizeHint(58, 58, 'mini', 'zh')).toBe(
      '58×58 底板可容纳 58×58 格子'
    );
  });

  it('中文文案:Midi 缩减', () => {
    expect(plateSizeHint(58, 58, 'midi', 'zh')).toBe(
      '29×29 底板可容纳 29×29 格子'
    );
  });

  it('英文文案', () => {
    expect(plateSizeHint(58, 58, 'mini', 'en')).toBe(
      '58×58 plate fits 58×58 cells'
    );
    expect(plateSizeHint(58, 58, 'midi', 'en')).toBe(
      '29×29 plate fits 29×29 cells'
    );
  });

  it('非方形图纸分别算', () => {
    expect(plateSizeHint(58, 29, 'midi', 'zh')).toBe(
      '29×15 底板可容纳 29×15 格子'
    );
  });
});

describe('beadSizeLabel', () => {
  it('中文标签', () => {
    expect(beadSizeLabel('mini', 'zh')).toBe('Mini (2.6mm)');
    expect(beadSizeLabel('midi', 'zh')).toBe('大颗 (5mm)');
  });

  it('英文标签', () => {
    expect(beadSizeLabel('mini', 'en')).toBe('Mini (2.6mm)');
    expect(beadSizeLabel('midi', 'en')).toBe('Midi (5mm)');
  });

  it('默认 locale = zh', () => {
    expect(beadSizeLabel('mini')).toBe('Mini (2.6mm)');
    expect(beadSizeLabel('midi')).toBe('大颗 (5mm)');
  });
});