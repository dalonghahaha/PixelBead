'use client';

/**
 * spec 006 — React ErrorBoundary(根 + 局部)
 *
 * 捕获子组件异常,上报 Sentry + 显示兜底 UI
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** 边界位置(用于 Sentry tag) */
  boundary?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Sentry 上报(可选,失败静默)
    void this.reportToSentry(error, info);
  }

  private async reportToSentry(error: Error, info: ErrorInfo): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      // 动态加载避免 SSR
      const Sentry = await import('@sentry/nextjs');
      Sentry.captureException(error, {
        tags: { boundary: this.props.boundary || 'root' },
        contexts: { react: { componentStack: info.componentStack } },
      });
    } catch (e) {
      // 静默失败
      if (process.env.NODE_ENV !== 'production') console.warn('Sentry capture failed:', e);
    }
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  override render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
            ⚠️ 出错了
          </h2>
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">
            {this.state.error.message}
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="px-4 py-2 bg-primary-700 text-white text-sm rounded hover:bg-primary-800 transition"
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}