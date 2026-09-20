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
  createdAt: string;
  error?: string;
}

// API 错误
export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
