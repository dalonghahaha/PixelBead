/**
 * 拼豆规格工具函数(spec 009)
 * - 常量与 i18n
 * - 底板尺寸提示计算
 */
import type { BeadSize } from '@pixelbead/shared';

export interface BeadSizeInfo {
  value: BeadSize;
  diameter_mm: number;
  cell_size_mm: number; // 单个豆中心距(mm),经验值
  standard_plate_count: number; // 同底板可容纳格子数(Midi 经验为 Mini 的 1/4)
}

export const BEAD_SIZE_TABLE: Record<BeadSize, BeadSizeInfo> = {
  mini: {
    value: 'mini',
    diameter_mm: 2.6,
    cell_size_mm: 2.6,
    standard_plate_count: 1, // Mini:格子数 = 底板格子数
  },
  midi: {
    value: 'midi',
    diameter_mm: 5,
    cell_size_mm: 5,
    standard_plate_count: 4, // Midi:同底板容纳 1/4 格子(经验 2 倍线性 → 4 倍面积)
  },
};

/**
 * 根据图纸格子数 + 拼豆规格,计算推荐底板尺寸(格子数)
 *
 * Mini:底板尺寸 = 图纸格子数(1:1)
 * Midi:同底板容纳 1/4 格子,故图纸 58×58 等价于 29×29 底板格子数
 */
export function suggestedPlateSize(
  patternCells: number,
  beadSize: BeadSize,
): number {
  const info = BEAD_SIZE_TABLE[beadSize];
  if (info.standard_plate_count === 1) return patternCells;
  return Math.ceil(patternCells / Math.sqrt(info.standard_plate_count));
}

/**
 * 底板尺寸提示文案(中英文)
 *
 * 返回形如 "29×29 底板可容纳 29×29 格子"
 */
export function plateSizeHint(
  width: number,
  height: number,
  beadSize: BeadSize,
  locale: 'zh' | 'en' = 'zh',
): string {
  const plateW = suggestedPlateSize(width, beadSize);
  const plateH = suggestedPlateSize(height, beadSize);
  return locale === 'en'
    ? `${plateW}×${plateH} plate fits ${plateW}×${plateH} cells`
    : `${plateW}×${plateH} 底板可容纳 ${plateW}×${plateH} 格子`;
}

/**
 * 规格本地化标签(同步 shared 包,便于前端单独使用)
 */
export function beadSizeLabel(value: BeadSize, locale: 'zh' | 'en' = 'zh'): string {
  if (locale === 'en') {
    return value === 'mini' ? 'Mini (2.6mm)' : 'Midi (5mm)';
  }
  return value === 'mini' ? 'Mini (2.6mm)' : '大颗 (5mm)';
}