/**
 * spec 008 — 分块算法(>A4 自动分块)
 *
 * 每块 = 当前纸张可容纳的最大格子数(留 5% 余量)
 * 拼接顺序:从左到右、从上到下
 */
export interface TileSize {
  cols: number;
  rows: number;
}

export interface TileInfo {
  index: number;
  rowStart: number;  // 0-based
  rowEnd: number;
  colStart: number;
  colEnd: number;
}

export interface LayoutResult {
  pageWidthCells: number;
  pageHeightCells: number;
  totalTiles: number;
  tiles: TileInfo[];
}

/**
 * 计算分块布局
 *
 * @param patternWidth 图纸宽度(格数)
 * @param patternHeight 图纸高度(格数)
 * @param pageWidthMm 纸张可用宽度 mm(扣除边距)
 * @param pageHeightMm 纸张可用高度 mm(扣除边距)
 * @param cellSizeMm 单格尺寸 mm(Mini 2.6 / Midi 5)
 * @returns LayoutResult
 */
export function calculateLayout(
  patternWidth: number,
  patternHeight: number,
  pageWidthMm: number,
  pageHeightMm: number,
  cellSizeMm: number,
): LayoutResult {
  // 留 5% 余量
  const usableW = pageWidthMm * 0.95;
  const usableH = pageHeightMm * 0.95;

  const pageWidthCells = Math.floor(usableW / cellSizeMm);
  const pageHeightCells = Math.floor(usableH / cellSizeMm);

  const cols = Math.ceil(patternWidth / pageWidthCells);
  const rows = Math.ceil(patternHeight / pageHeightCells);
  const totalTiles = cols * rows;

  const tiles: TileInfo[] = [];
  let index = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push({
        index: index++,
        rowStart: r * pageHeightCells,
        rowEnd: Math.min((r + 1) * pageHeightCells, patternHeight),
        colStart: c * pageWidthCells,
        colEnd: Math.min((c + 1) * pageWidthCells, patternWidth),
      });
    }
  }

  return { pageWidthCells, pageHeightCells, totalTiles, tiles };
}

/**
 * 单块在纸张上的对位标记(三角箭头,黑白打印仍可辨)
 *
 * 返回 SVG path 或 jsPDF 多边形坐标
 */
export const ALIGNMENT_MARKERS = {
  topLeft: '▲',
  topRight: '▶',
  bottomLeft: '◀',
  bottomRight: '▼',
} as const;