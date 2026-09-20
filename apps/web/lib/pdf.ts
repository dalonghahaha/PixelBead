/**
 * spec 008 — PDF 生成(前端 jsPDF 实现)
 *
 * 最小可用版:
 * - 单页 A4 横向 PDF
 * - 网格 + 色号文字 + 坐标轴(A-Z-AA-AZ, 1-N)
 * - 深浅色对比(浅色格黑字,深色格白字)
 * - 字号自适应(≥ 6pt)
 *
 * 不在 MVP 范围(留作后续):
 * - 自动分块(>A4 自动切多页)
 * - 对位标记
 * - 符号图叠加层
 * - 自定义纸张大小
 * - zip 批量下载
 */
import type jsPDF from 'jspdf';

export interface GridCell {
  code: string;
  rgb: string; // "#RRGGBB"
}

export interface PatternGrid {
  pattern_id: string;
  width: number;
  height: number;
  bead_size: string;
  locale: string;
  grid: GridCell[][]; // 二维数组 grid[y][x]
  palette: Array<{
    code: string;
    name_zh?: string;
    name_en?: string;
    rgb: string;
  }>;
}

const PAGE_W_MM = 297; // A4 横
const PAGE_H_MM = 210;
const MARGIN_MM = 10;
const FONT_SIZE_MIN = 6; // pt

/**
 * 列号:A-Z (1-26), AA-AZ (27-52), ...
 */
export function colLabel(idx: number): string {
  let s = '';
  let n = idx;
  while (true) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
    if (n < 0) break;
  }
  return s;
}

/**
 * 文字色对比
 */
function isLightColor(hex: string): boolean {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 128;
}

/**
 * 解析 RGB hex → [r, g, b]
 */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/**
 * 生成单页 A4 PDF
 *
 * 用法:
 *   import('jspdf').then(({ jsPDF }) => {
 *     const doc = generatePdf(patternGrid, 'zh');
 *     doc.save(`pixelbead-${patternGrid.pattern_id}.pdf`);
 *   });
 */
export function generatePdf(
  pattern: PatternGrid,
  jsPDFLib: typeof jsPDF,
  locale: 'zh' | 'en' = 'zh',
): jsPDF {
  const doc = new jsPDFLib({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const usableW = PAGE_W_MM - 2 * MARGIN_MM;
  const usableH = PAGE_H_MM - 2 * MARGIN_MM;
  const cellW = usableW / pattern.width;
  const cellH = usableH / pattern.height;
  const cellSize = Math.min(cellW, cellH); // 取较小值避免文字溢出
  // 重新计算实际网格占据的尺寸(居中)
  const gridW = cellSize * pattern.width;
  const gridH = cellSize * pattern.height;
  const offsetX = (PAGE_W_MM - gridW) / 2;
  const offsetY = (PAGE_H_MM - gridH) / 2;

  // 字号(自适应,≥ FONT_SIZE_MIN pt)
  const fontSizePt = Math.max(FONT_SIZE_MIN, cellSize * 1.4);
  doc.setFontSize(fontSizePt);

  // 标题
  doc.setFontSize(14);
  doc.text(
    locale === 'en' ? `Bead Pattern (${pattern.bead_size})` : `拼豆图纸 (${pattern.bead_size})`,
    MARGIN_MM,
    MARGIN_MM - 3,
  );
  doc.setFontSize(fontSizePt);

  // 网格
  for (let y = 0; y < pattern.height; y++) {
    for (let x = 0; x < pattern.width; x++) {
      const cell = pattern.grid[y]?.[x];
      if (!cell) continue;
      const [r, g, b] = hexToRgb(cell.rgb);
      const cx = offsetX + x * cellSize;
      const cy = offsetY + y * cellSize;

      // 填充格子
      doc.setFillColor(r, g, b);
      doc.rect(cx, cy, cellSize, cellSize, 'F');

      // 边框
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.05);
      doc.rect(cx, cy, cellSize, cellSize, 'S');

      // 色号文字
      doc.setTextColor(isLightColor(cell.rgb) ? 0 : 255, isLightColor(cell.rgb) ? 0 : 255, isLightColor(cell.rgb) ? 0 : 255);
      const codeWidth = doc.getTextWidth(cell.code);
      const codeX = cx + (cellSize - codeWidth) / 2;
      const codeY = cy + cellSize / 2 + fontSizePt * 0.15; // baseline 调整
      doc.text(cell.code, codeX, codeY);
    }
  }

  // 坐标轴标签(列 A-Z-AA-AZ)
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  for (let x = 0; x < pattern.width; x++) {
    doc.text(colLabel(x), offsetX + x * cellSize + cellSize / 2, offsetY - 1, { align: 'center' });
  }
  for (let y = 0; y < pattern.height; y++) {
    doc.text(String(y + 1), offsetX - 1.5, offsetY + y * cellSize + cellSize / 2 + 1, { align: 'right' });
  }

  // 页脚
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `PixelBead · ${pattern.pattern_id.slice(0, 8)} · ${pattern.width}×${pattern.height} · ${pattern.bead_size}`,
    MARGIN_MM,
    PAGE_H_MM - 3,
  );

  return doc;
}