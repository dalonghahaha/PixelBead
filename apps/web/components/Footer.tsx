export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 py-6 text-center text-sm text-gray-500">
      <div className="container mx-auto px-4">
        PixelBead MVP · 算法基于开源{' '}
        <a
          href="https://github.com/HansBug/pypindou"
          className="underline hover:text-primary-600"
          target="_blank"
          rel="noreferrer"
        >
          pypindou
        </a>{' '}
        (Apache 2.0)
      </div>
    </footer>
  );
}
