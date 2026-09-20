/**
 * 前后端共享类型与常量
 */

// API 健康状态
export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  service?: string;
}

// 色卡信息
export interface PaletteInfo {
  id: string;
  title: string;
  standard: 'domestic' | 'international';
  count: number;
}

// 用户
export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// 拼豆规格(spec 009)
export type BeadSize = 'mini' | 'midi';

export const BEAD_SIZE_DEFAULT: BeadSize = 'mini';

export const BEAD_SIZE_OPTIONS: ReadonlyArray<{
  value: BeadSize;
  label_zh: string;
  label_en: string;
  diameter_mm: number;
  tooltip_zh: string;
  tooltip_en: string;
}> = [
  {
    value: 'mini',
    label_zh: 'Mini (2.6mm)',
    label_en: 'Mini (2.6mm)',
    diameter_mm: 2.6,
    tooltip_zh: '主流小颗粒,适合精细图案(2.6mm)',
    tooltip_en: 'Mainstream small beads, ideal for detailed patterns (2.6mm)',
  },
  {
    value: 'midi',
    label_zh: '大颗 (5mm)',
    label_en: 'Midi (5mm)',
    diameter_mm: 5,
    tooltip_zh: '大颗,适合儿童/低视力(5mm)',
    tooltip_en: 'Large beads, suitable for kids / low vision (5mm)',
  },
];

// 拼豆图纸
export type PatternStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface PatternRequest {
  width: number;
  height: number;
  palette: string;
  maxColors?: number;
  prefilter?: 'none' | 'smooth';
  cleanup?: 'none' | 'majority';
  dither?: boolean;
  beadSize?: BeadSize;  // ← 009 新增
}

export interface PatternResult {
  id: string;
  status: PatternStatus;
  previewUrl?: string;
  symbolUrl?: string;
  colorCounts?: Record<string, number>;
  width: number;
  height: number;
  palette: string;
  beadSize: BeadSize;  // ← 009 新增
  createdAt: string;
  error?: string;
}

// API 错误
export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
