import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/favicon.svg" alt="" className="w-6 h-6" aria-hidden="true" />
              <span className="font-bold text-gray-900 dark:text-white">PixelBead</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              上传图片,3 秒生成拼豆图纸。
              <br />
              算法基于开源 pypindou。
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              产品
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/generate" className="hover:text-primary-600 dark:hover:text-primary-400">
                  生成图纸
                </Link>
              </li>
              <li>
                <Link href="/patterns" className="hover:text-primary-600 dark:hover:text-primary-400">
                  我的图纸
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-primary-600 dark:hover:text-primary-400">
                  使用文档
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              关于
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>开源协议:Apache 2.0</li>
              <li>基于 pypindou</li>
              <li>© 2026 PixelBead MVP</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}