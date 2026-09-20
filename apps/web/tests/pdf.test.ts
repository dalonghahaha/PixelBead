/**
 * spec 008 — PDF 工具函数测试
 */
import { describe, it, expect } from 'vitest';
import { calculateLayout, ALIGNMENT_MARKERS } from '@/lib/pdf/layout';

describe('calculateLayout', () => {
  it('Mini (2.6mm) 在 A4 横向下不分块', () => {
    // A4 横向: 297×210mm - 边距 = 277×190mm
    // 277/2.6 = 106 格宽, 190/2.6 = 73 格高
    const result = calculateLayout(58, 58, 277, 190, 2.6);
    expect(result.pageWidthCells).toBeGreaterThanOrEqual(58);
    expect(result.pageHeightCells).toBeGreaterThanOrEqual(58);
    expect(result.totalTiles).toBe(1); // 58×58 不分块
  });

  it('大图自动分块', () => {
    // 116×116 在 A4 横向 Mini 下需要分块
    const result = calculateLayout(116, 116, 277, 190, 2.6);
    expect(result.totalTiles).toBeGreaterThan(1);
    // 验证分块数公式
    const expectedCols = Math.ceil(116 / result.pageWidthCells);
    const expectedRows = Math.ceil(116 / result.pageHeightCells);
    expect(result.totalTiles).toBe(expectedCols * expectedRows);
  });

  it('Midi (5mm) 同底板容纳更少格子', () => {
    // 58×58 在 A4 横向 Midi 下也不分块
    const result = calculateLayout(58, 58, 277, 190, 5);
    expect(result.totalTiles).toBe(1);
  });

  it('拼接顺序:从左到右、从上到下', () => {
    const result = calculateLayout(200, 200, 100, 100, 5);
    expect(result.tiles[0].rowStart).toBe(0);
    expect(result.tiles[0].colStart).toBe(0);
    // 后续块按行优先
    if (result.tiles.length > 1) {
      expect(result.tiles[1].rowStart).toBe(0);
      expect(result.tiles[1].colStart).toBeGreaterThan(0);
    }
  });

  it('tiles 索引从 1 开始,连续', () => {
    const result = calculateLayout(200, 200, 100, 100, 5);
    result.tiles.forEach((tile, i) => {
      expect(tile.index).toBe(i + 1);
    });
  });
});

describe('ALIGNMENT_MARKERS', () => {
  it('4 个角各有标记', () => {
    expect(ALIGNMENT_MARKERS.topLeft).toBe('▲');
    expect(ALIGNMENT_MARKERS.topRight).toBe('▶');
    expect(ALIGNMENT_MARKERS.bottomLeft).toBe('◀');
    expect(ALIGNMENT_MARKERS.bottomRight).toBe('▼');
  });
});