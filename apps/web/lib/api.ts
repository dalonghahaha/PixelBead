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

  const res = await fetch(`/api/external${path}`, { ...init, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || data.message || detail;
    } catch {}
    throw new ApiError(res.status, detail);
  }
  // 204 No Content: DELETE 返这个,没有 body,不要 res.json()
  if (res.status === 204) return undefined as T;
  return normalizeResponse(await res.json()) as T;
}

/**
 * 响应归一化器(API 返是 Python 风格蛇形 + Docker 内网绝对 URL,前端要驼峰 + 相对代理 URL)
 * 1. 深层 snake_case → camelCase(created_at → createdAt 等)
 * 2. previewUrl / symbolUrl 里有 "http://" 的,改为走 Next.js 反代 /api/external/...
 *    避免浏览器去抓 Docker 内网 URL(api:8000 不可达)
 */
function normalizeResponse<T>(data: T): T {
  const camel = camelizeKeys(data);
  rewritePatternAssetUrls(camel);
  return camel as T;
}

function camelizeKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(camelizeKeys);
  if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()),
        camelizeKeys(v),
      ]),
    );
  }
  return obj;
}

function rewritePatternAssetUrls(obj: unknown): void {
  if (Array.isArray(obj)) {
    obj.forEach(rewritePatternAssetUrls);
    return;
  }
  if (!obj || typeof obj !== 'object' || obj instanceof Date) return;
  const o = obj as Record<string, unknown>;
  // 单个 PatternResult(有 id 的就是)— 不管 previewUrl 原来是绝对还是相对 URL,
  // 一律改写为 Next.js 反代路径。API 可能返绝对 (http://api:8000/... 不可达)
  // 也可能返相对 (/patterns/... 在浏览器里会被解析为域名下的路径 → 404),
  // 都走 /api/external/patterns/{id}/preview 让 Next.js 反代到 API。
  // 幂等:如果已经是 /api/external/... 也会被改写,结果一样。
  if (typeof o.id === 'string') {
    if (typeof o.previewUrl === 'string') {
      o.previewUrl = `/api/external/patterns/${o.id}/preview`;
    }
    if (typeof o.symbolUrl === 'string') {
      o.symbolUrl = `/api/external/patterns/${o.id}/symbol`;
    }
  }
  // 递归子对象
  for (const v of Object.values(o)) rewritePatternAssetUrls(v);
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

  deletePattern: (id: string, token: string) =>
    request<void>(`/patterns/${id}`, { method: 'DELETE' }, token),

  previewUrl: (id: string) => `/api/external/patterns/${id}/preview`,
  symbolUrl: (id: string) => `/api/external/patterns/${id}/symbol`,

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
