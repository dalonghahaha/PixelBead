import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          PixelBead
        </Link>
        <nav className="flex gap-6 text-sm">
          <Link href="/generate" className="hover:text-primary-600">
            生成图纸
          </Link>
          <Link href="/patterns" className="hover:text-primary-600">
            我的图纸
          </Link>
          <Link href="/login" className="hover:text-primary-600">
            登录
          </Link>
        </nav>
      </div>
    </header>
  );
}
