/**
 * spec 011 — UsageTable 组件测试
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import UsageTable from '@/components/UsageTable';

vi.mock('@/lib/api', () => ({
  api: {
    getUsage: vi.fn().mockResolvedValue({
      pattern_id: 'pat-1',
      bead_size: 'mini',
      items: [
        { code: 'H1', rgb: '#FFFFFF', name_zh: '白色', name_en: 'White', count: 256, packs: 1 },
        { code: 'H2', rgb: '#000000', name_zh: '黑色', name_en: 'Black', count: 128, packs: 1 },
      ],
      total_count: 384,
      total_packs: 2,
      generated_at: '2026-09-20T00:00:00Z',
    }),
  },
  ApiError: class extends Error {},
}));

describe('UsageTable', () => {
  it('渲染用量数据', async () => {
    render(<UsageTable patternId="pat-1" token="fake-token" />);

    await waitFor(() => {
      expect(screen.getByText('256')).toBeInTheDocument();
      expect(screen.getByText('128')).toBeInTheDocument();
    });
  });

  it('按颗数降序排列', async () => {
    render(<UsageTable patternId="pat-1" token="fake-token" />);

    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      // 第一行(数据)应是 H1(256)
      expect(rows[1]).toHaveTextContent('H1');
    });
  });

  it('显示汇总:总色号数 + 总颗数 + 总包数', async () => {
    render(<UsageTable patternId="pat-1" token="fake-token" />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // 总色号数
      expect(screen.getByText('384')).toBeInTheDocument(); // 总颗数
    });
  });
});