'use client';

/**
 * spec 010 — 异步任务进度轮询组件
 *
 * 工作机制:
 * - 每 2s 轮询一次 GET /tasks/{id}
 * - 状态变化时更新 UI(进度条 / 状态文案)
 * - complete → 跳转 /patterns/{pattern_id}
 * - failed → 显示错误 + 重试按钮
 * - 组件卸载时清理 interval
 */
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { tasksApi, taskProgressText, taskErrorMessage, type TaskProgress } from '@/lib/task';

interface Props {
  taskId: string;
  token: string;
  /** 完成后跳转 URL(默认 /patterns/{id}) */
  onCompleteRedirect?: (patternId: string) => string;
  /** 轮询间隔 ms(默认 2000) */
  intervalMs?: number;
}

export default function TaskStatusPoller({
  taskId,
  token,
  onCompleteRedirect,
  intervalMs = 2000,
}: Props) {
  const router = useRouter();
  const [task, setTask] = useState<TaskProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      if (cancelledRef.current) return;
      try {
        const data = await tasksApi.get(taskId, token);
        setTask(data);

        if (data.status === 'complete' && data.result_pattern_id) {
          const redirectUrl = onCompleteRedirect
            ? onCompleteRedirect(data.result_pattern_id)
            : `/patterns/${data.result_pattern_id}`;
          // 短暂延迟让用户看到 100%
          setTimeout(() => {
            if (!cancelledRef.current) router.push(redirectUrl);
          }, 800);
          return;
        }

        if (data.status === 'failed' || data.status === 'cancelled') {
          return; // 终态,停止轮询
        }

        // 继续轮询
        timer = setTimeout(poll, intervalMs);
      } catch (err) {
        setError(err instanceof Error ? err.message : '查询失败');
      }
    };

    poll();
    return () => {
      cancelledRef.current = true;
      if (timer) clearTimeout(timer);
    };
  }, [taskId, token, intervalMs, onCompleteRedirect, router]);

  const handleCancel = async () => {
    if (!confirm('确认取消此任务?')) return;
    try {
      await tasksApi.cancel(taskId, token);
      setTask((t) => (t ? { ...t, status: 'cancelled' } : t));
    } catch (err) {
      setError(err instanceof Error ? err.message : '取消失败');
    }
  };

  const handleRetry = () => {
    router.push('/generate');
  };

  if (error && !task) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="text-red-700 dark:text-red-300">⚠️ {error}</div>
        <Link href="/generate" className="mt-2 inline-block text-sm text-primary-700 hover:underline">
          ← 返回生成
        </Link>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-4 text-center text-gray-500">加载任务状态…</div>
    );
  }

  const isTerminal = task.status === 'complete' || task.status === 'failed' || task.status === 'cancelled';

  return (
    <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="font-medium">
          {taskProgressText(task.status, task.progress)}
        </div>
        <div className="text-xs text-gray-500 font-mono">
          {task.task_id.slice(0, 8)}…
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            task.status === 'failed'
              ? 'bg-red-500'
              : task.status === 'complete'
                ? 'bg-green-500'
                : 'bg-primary-500'
          }`}
          style={{ width: `${task.progress}%` }}
          role="progressbar"
          aria-valuenow={task.progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* 错误信息 */}
      {task.status === 'failed' && task.error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm">
          <div className="text-red-700 dark:text-red-300 font-medium">
            ⚠️ {taskErrorMessage(task.error.code)}
          </div>
          {task.error.code === 'oom' && (
            <div className="mt-1 text-xs text-red-700 dark:text-red-400">
              提示:可尝试 ① 缩小图片尺寸 ② 用图片压缩工具压到 4MB 以下
            </div>
          )}
          <button
            type="button"
            onClick={handleRetry}
            className="mt-3 px-4 py-2 bg-primary-700 text-white text-sm rounded-lg hover:bg-primary-800 transition"
          >
            重新上传
          </button>
        </div>
      )}

      {/* 取消按钮(运行中) */}
      {(task.status === 'queued' || task.status === 'running') && (
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm text-gray-500 hover:text-red-700 transition"
        >
          取消任务
        </button>
      )}

      {/* 完成后跳转链接(防止 router.push 没触发) */}
      {task.status === 'complete' && task.result_pattern_id && (
        <Link
          href={`/patterns/${task.result_pattern_id}`}
          className="inline-block text-sm text-primary-700 hover:underline"
        >
          查看图纸 →
        </Link>
      )}
    </div>
  );
}