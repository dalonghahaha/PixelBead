/**
 * 浏览器端 API 客户端
 * - 直接打后端(开发模式,跨域已配)
 * - 携带 JWT token
 */
import type {
  AuthResponse,
  LoginPayload,
  PaletteInfo,
  PatternResult,
  RegisterPayload,
} from '@pixelbead/shared';
import type { PatternGrid } from './pdf';

export interface UsageItem {
  code: string;
  rgb: string;
  name_zh?: string | null;
  name_en?: string | null;
  count: number;
  packs: number;
}

export interface UsageReport {
  pattern_id: string;
  bead_size: string;
  items: UsageItem[];
  total_count: number;
  total_packs: number;
  generated_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || data.message || detail;
    } catch {}
    throw new ApiError(res.status, detail);
  }
  return res.json();
}

export const api = {
  // 认证
  register: (data: RegisterPayload) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginPayload) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: (token: string) =>
    request<{ id: string; email: string; username: string; created_at: string }>(
      '/auth/me',
      {},
      token,
    ),

  // 色卡
  palettes: () => request<PaletteInfo[]>('/palettes'),

  // 图纸
  createPattern: async (
    file: File,
    params: {
      palette: string;
      width: number;
      height: number;
      max_colors?: number;
      prefilter?: string;
      cleanup?: string;
      dither?: boolean;
      bead_size?: 'mini' | 'midi';  // ← 009 新增
    },
    token: string,
  ) => {
    const fd = new FormData();
    fd.append('file', file);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });
    return request<PatternResult>(
      '/patterns',
      { method: 'POST', body: fd },
      token,
    );
  },

  listPatterns: (token: string) =>
    request<PatternResult[]>('/patterns', {}, token),

  previewUrl: (id: string) => `${API_URL}/patterns/${id}/preview`,
  symbolUrl: (id: string) => `${API_URL}/patterns/${id}/symbol`,

  // ← 008 新增:grid 数据(PDF 渲染用)
  getPatternGrid: (id: string, token: string, locale: 'zh' | 'en' = 'zh') =>
    request<PatternGrid>(`/patterns/${id}/grid?locale=${locale}`, {}, token),

  // ← 011 新增:用量清单 JSON
  getUsage: (id: string, token: string, beadsPerPack = 500) =>
    request<UsageReport>(
      `/patterns/${id}/usage?beads_per_pack=${beadsPerPack}`,
      {},
      token,
    ),

  // ← 011 新增:用户设置(beads_per_pack)
  getUserSettings: (token: string) =>
    request<{ beads_per_pack: number }>('/users/me/settings', {}, token),

  patchUserSettings: (token: string, beadsPerPack: number) =>
    request<{ beads_per_pack: number }>(
      '/users/me/settings',
      {
        method: 'PATCH',
        body: JSON.stringify({ beads_per_pack: beadsPerPack }),
      },
      token,
    ),
};

export { ApiError };
