/**
 * 图片处理工具(客户端)
 *
 * 豆板(底板)多数为正方形,用户上传的图不一定正方形,
 * 所以上传后先 center-crop 成正方形再交给后端生成图纸。
 *
 * 算法:cover(center-crop)
 * - 取原图较长边作为输出方形尺寸
 * - 短边居中裁掉两侧多余部分
 * - 输出 PNG(支持透明),保持最高质量
 */

export interface SquareOptions {
  /** 强制输出尺寸(像素)。不传则取原图长边 */
  size?: number;
  /** 输出图片类型,默认 image/png */
  type?: 'image/png' | 'image/jpeg' | 'image/webp';
  /** JPEG/WebP 压缩质量 0-1,默认 0.92 */
  quality?: number;
  /** 背景填充色(JPEG 无透明通道时可填)。默认透明 */
  background?: string;
}

/**
 * 把图片 center-crop 成正方形,返回 Blob
 *
 * @example
 *   const squared = await squareImage(file);
 *   const squared58 = await squareImage(file, { size: 58 * 4 }); // 4x 抗锯齿预览
 */
export async function squareImage(
  src: string | Blob | File,
  opts: SquareOptions = {},
): Promise<Blob> {
  const { type = 'image/png', quality = 0.92, background } = opts;

  const img = await loadImage(src);
  const size = opts.size ?? Math.max(img.width, img.height);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // JPEG 不支持透明,显式填充背景
  if (type === 'image/jpeg' || background) {
    ctx.fillStyle = background ?? '#ffffff';
    ctx.fillRect(0, 0, size, size);
  }

  // cover: 长边缩放到 size,短边居中裁掉
  const scale = Math.max(size / img.width, size / img.height);
  const sw = size / scale;
  const sh = size / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      type,
      quality,
    );
  });
}

/**
 * 同步获取图片尺寸(WxH)
 */
export async function getImageSize(src: string | Blob | File): Promise<{ w: number; h: number }> {
  const img = await loadImage(src);
  return { w: img.width, h: img.height };
}

/** 计算 center-crop 后的方形边长(像素) */
export function squaredPixelSize(w: number, h: number): number {
  return Math.max(w, h);
}

function loadImage(src: string | Blob | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url =
      src instanceof Blob || src instanceof File ? URL.createObjectURL(src) : src;
    img.onload = () => {
      // 只在用 object URL 时回收(传字符串 URL 给调用方)
      if (src instanceof Blob || src instanceof File) URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      if (src instanceof Blob || src instanceof File) URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };
    img.src = url;
  });
}