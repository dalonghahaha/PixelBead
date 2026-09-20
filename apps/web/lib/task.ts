/**
 * spec 010 — 任务 API 客户端
 */
import type { BeadSize } from '@pixelbead/shared';

export type TaskStatus = 'queued' | 'running' | 'complete' | 'failed' | 'cancelled';

export interface TaskCreateResponse {
  task_id: string;
  status: TaskStatus;
}

export interface TaskError {
  code: 'oom' | 'algorithm_error' | 'timeout' | 'invalid_input';
  message: string;
}

export interface TaskProgress {
  task_id: string;
  status: TaskStatus;
  progress: number; // 0-100
  result_pattern_id?: string;
  error?: TaskError;
  bead_size: BeadSize;
  palette?: string;
  width?: number;
  height?: number;
  created_at?: string;
  updated_at?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
    throw new Error(detail);
  }
  return res.json();
}

export const tasksApi = {
  /** 创建异步任务(大图) */
  create: async (
    file: File,
    params: {
      palette: string;
      width: number;
      height: number;
      max_colors?: number;
      prefilter?: string;
      cleanup?: string;
      dither?: boolean;
      bead_size?: BeadSize;
    },
    token: string,
  ): Promise<TaskCreateResponse> => {
    const fd = new FormData();
    fd.append('file', file);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });
    return request<TaskCreateResponse>(
      '/tasks',
      { method: 'POST', body: fd },
      token,
    );
  },

  /** 查询任务状态 */
  get: (taskId: string, token: string): Promise<TaskProgress> =>
    request<TaskProgress>(`/tasks/${taskId}`, {}, token),

  /** 取消任务 */
  cancel: (taskId: string, token: string): Promise<{ task_id: string; status: TaskStatus }> =>
    request<{ task_id: string; status: TaskStatus }>(
      `/tasks/${taskId}/cancel`,
      { method: 'POST' },
      token,
    ),

  /** 列出我的任务 */
  list: (token: string, limit = 50): Promise<TaskProgress[]> =>
    request<TaskProgress[]>(`/tasks?limit=${limit}`, {}, token),
};

/** 人类可读的错误消息映射 */
export function taskErrorMessage(code: TaskError['code']): string {
  const messages: Record<TaskError['code'], string> = {
    oom: '图片过大,请尝试压缩或缩小尺寸',
    algorithm_error: '生成失败,请重试或换张图片',
    timeout: '生成超时,请重试',
    invalid_input: '图片格式不支持,请上传 JPG/PNG/WebP',
  };
  return messages[code];
}

/** 进度文案 */
export function taskProgressText(status: TaskStatus, progress: number): string {
  if (status === 'queued') return '排队中…';
  if (status === 'running') return `生成中… ${progress}%`;
  if (status === 'complete') return '生成完成';
  if (status === 'failed') return '生成失败';
  if (status === 'cancelled') return '已取消';
  return '';
}