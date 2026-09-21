import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '隐私政策 - PixelBead',
  description: 'PixelBead 隐私政策:我们使用的工具、数据流向、用户权利',
};

/** ← 006 G-006-11 隐私政策页 */
export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 space-y-8">
      <h1 className="text-3xl font-bold">隐私政策</h1>

      <p className="text-sm text-gray-500">最后更新:2026-09-20</p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. 我们收集什么</h2>
        <p>
          PixelBead 是开源拼豆图纸生成工具。我们仅收集与产品功能直接相关的数据,
          不收集任何与功能无关的用户信息。
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li><strong>账号信息</strong>:邮箱、用户名(用于登录)</li>
          <li><strong>上传图片</strong>:您上传的图片用于生成拼豆图纸,生成后 30 天自动清理原图</li>
          <li><strong>生成图纸</strong>:您生成的图纸数据(色号 / 网格 / 预览图)</li>
          <li><strong>行为埋点(匿名)</strong>:通过 Plausible 收集的页面访问、事件触发(无 cookie,无 IP 存储)</li>
          <li><strong>错误日志</strong>:通过 Sentry 收集的前端 / 后端异常(去标识化)</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. 我们使用的工具</h2>
        <table className="w-full text-sm border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">工具</th>
              <th className="px-3 py-2 text-left">用途</th>
              <th className="px-3 py-2 text-left">数据流向</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-3 py-2 font-medium">Plausible</td>
              <td className="px-3 py-2">行为埋点(页面访问、事件)</td>
              <td className="px-3 py-2">云版 plausible.io / 无 cookie / 无 IP 存储</td>
            </tr>
            <tr className="border-t">
              <td className="px-3 py-2 font-medium">Sentry</td>
              <td className="px-3 py-2">错误监控 + 性能监控</td>
              <td className="px-3 py-2">云版 sentry.io / 去标识化 / 不存敏感字段</td>
            </tr>
            <tr className="border-t">
              <td className="px-3 py-2 font-medium">PostgreSQL</td>
              <td className="px-3 py-2">数据库(账号 / 图纸 / 设置)</td>
              <td className="px-3 py-2">自托管 / 每日备份</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. 您的权利</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li><strong>数据导出</strong>:可申请导出您的所有数据(联系下方邮箱)</li>
          <li><strong>数据删除</strong>:可申请删除账号 + 所有关联数据(联系下方邮箱,我们 1 周内响应)</li>
          <li><strong>公开图纸撤回</strong>:您设为公开的图纸可随时切回私有</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. 联系我们</h2>
        <p>
          隐私相关问题:请发送邮件至{' '}
          <a href="mailto:privacy@pixelbead.app" className="text-primary-700 hover:underline">
            privacy@pixelbead.app
          </a>
        </p>
      </section>

      <p className="text-xs text-gray-500 pt-8 border-t">
        本政策由 PixelBead 开源项目维护,具体规则可能随产品迭代调整,以本页最新版本为准。
      </p>
    </div>
  );
}