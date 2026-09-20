import Link from 'next/link';

export default function HomePage() {
  const features = [
    {
      icon: '📷',
      title: '支持常见图片格式',
      desc: 'JPG / PNG / WEBP,最大 10MB,上传即处理',
    },
    {
      icon: '🎨',
      title: '26 种真实拼豆色板',
      desc: 'MARD / Artkal / COCO 等主流品牌,自动匹配色号',
    },
    {
      icon: '📥',
      title: '一键导出可打印图纸',
      desc: '带色号标注 + 网格线 + 用量清单,直接打印开拼',
    },
  ];

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="text-center pt-12 pb-8">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
          PixelBead
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-200 mb-3">
          上传图片,3 秒生成拼豆图纸
        </p>
        <p className="text-base text-gray-500 dark:text-gray-400 mb-10">
          像素化 · 颜色匹配 · 网格导出,一气呵成
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/generate"
            className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-base font-medium shadow-lg shadow-primary-600/20"
          >
            开始生成 →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {features.map((f) => (
          <div
            key={f.title}
            className="text-center p-6 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
          >
            <div className="text-4xl mb-3">{f.icon}</div>
            <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {f.desc}
            </p>
          </div>
        ))}
      </section>

      {/* 示例 */}
      <section className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6 items-center bg-gray-50 dark:bg-gray-800/30 rounded-2xl p-8">
          <div>
            <h2 className="text-2xl font-bold mb-3">从照片到拼豆,只需三步</h2>
            <ol className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white text-sm flex items-center justify-center">
                  1
                </span>
                <span>上传任意图片</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white text-sm flex items-center justify-center">
                  2
                </span>
                <span>选择色板和网格大小</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white text-sm flex items-center justify-center">
                  3
                </span>
                <span>下载带色号标注的图纸</span>
              </li>
            </ol>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm">
            <div className="text-center text-sm text-gray-500 mb-3">
              示例效果
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="aspect-square rounded bg-gradient-to-br from-orange-400 via-pink-500 to-purple-500" />
                <div className="text-xs text-center mt-2 text-gray-500">原图</div>
              </div>
              <div>
                <div
                  className="aspect-square rounded"
                  style={{
                    backgroundImage:
                      'repeating-conic-gradient(rgb(255,107,53) 0% 25%, rgb(74,144,226) 0% 50%, rgb(255,210,63) 0% 75%, rgb(255,255,255) 0% 100%)',
                    backgroundSize: '20% 20%',
                  }}
                />
                <div className="text-xs text-center mt-2 text-gray-500">
                  拼豆图纸
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
