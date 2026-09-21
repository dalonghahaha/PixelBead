'use client';

import { useLocale } from '@/components/I18nProvider';

type Section = {
  id: string;
  zh: { title: string; body: React.ReactNode };
  en: { title: string; body: React.ReactNode };
};

const SECTIONS: Section[] = [
  {
    id: 'quickstart',
    zh: {
      title: '快速开始',
      body: (
        <>
          <p>3 步从照片到拼豆图纸:</p>
          <ol className="list-decimal pl-6 space-y-2 mt-2">
            <li>
              打开「<a href="/generate" className="text-primary-600 underline">生成图纸</a>」,
              上传任意 JPG / PNG / WEBP 图片(最大 10MB)
            </li>
            <li>选择色板(MARD / Artkal / COCO 等)和网格大小,点「生成图纸」</li>
            <li>
              转换完成后,在「<a href="/patterns" className="text-primary-600 underline">我的图纸</a>」查看预览图和符号图,
              点「查看符号图」放大,或点「下载」保存 PNG
            </li>
          </ol>
          <p className="mt-3 text-sm text-gray-500">
            首次使用需要 <a href="/login" className="text-primary-600 underline">注册账号</a>(免费,
            邮箱即可)。
          </p>
        </>
      ),
    },
    en: {
      title: 'Quick Start',
      body: (
        <>
          <p>3 steps from photo to bead pattern:</p>
          <ol className="list-decimal pl-6 space-y-2 mt-2">
            <li>
              Open <a href="/generate" className="text-primary-600 underline">Generate</a>,
              upload any JPG / PNG / WEBP image (max 10MB)
            </li>
            <li>Pick a palette (MARD / Artkal / COCO etc.) and grid size, then click "Generate"</li>
            <li>
              When done, head to <a href="/patterns" className="text-primary-600 underline">My Patterns</a> to
              view the preview and symbol chart, click "View symbol" to enlarge, or "Download" to save PNG
            </li>
          </ol>
          <p className="mt-3 text-sm text-gray-500">
            First time? <a href="/login" className="text-primary-600 underline">Sign up</a> for free
            (email only).
          </p>
        </>
      ),
    },
  },

  {
    id: 'params',
    zh: {
      title: '转换参数详解',
      body: (
        <>
          <h3 className="font-semibold mt-4 mb-2">色板(Palette)</h3>
          <p>
            决定每个像素用哪个真实品牌的拼豆色号。PixelBead 内置 MARD(国产主流)、Artkal、COCO 等品牌色卡,
            自动按最近邻匹配色号。默认 <code>mard-221-alfonse-doudou</code>(221 色)。
          </p>

          <h3 className="font-semibold mt-4 mb-2">网格尺寸(宽 × 高,格)</h3>
          <p>
            最终拼豆图纸有多少行多少列,每格代表一颗豆。范围 8–200 格。
            建议根据底板物理大小 + 拼豆规格换算(见下方「底板尺寸建议」)。
          </p>

          <h3 className="font-semibold mt-4 mb-2">拼豆规格(Bead Size)</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Mini(2.6mm)</strong> — 市面最常见,默认</li>
            <li><strong>大颗(5mm)</strong> — 适合低龄儿童 / 大幅图案,拼得快</li>
          </ul>

          <h3 className="font-semibold mt-4 mb-2">限色数(留空 = 不限)</h3>
          <p>
            最终图纸最多用几种颜色。留空不限,会用到色板所有可用色。
            填具体数字(如 24)会优先保留出现频率最高的 N 种,其余替换为最接近色。
            适合想减少买豆种类的场景。
          </p>

          <h3 className="font-semibold mt-4 mb-2">预处理(Prefilter)</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>平滑(适合照片)</strong> — 先做高斯模糊再转,减少照片的细小噪点,推荐</li>
            <li><strong>无</strong> — 原图直转,适合线条画 / 卡通 / Logo 等本身已经干净的图</li>
          </ul>

          <h3 className="font-semibold mt-4 mb-2">杂色清理(Cleanup)</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>多数清理(推荐)</strong> — 3×3 窗口内,孤立色点会被替换成周围多数色,消除单颗杂色</li>
            <li><strong>不清理</strong> — 完全保留原图细节</li>
          </ul>

          <h3 className="font-semibold mt-4 mb-2">抖动(Dither)</h3>
          <p>
            开启后会用 Floyd-Steinberg 抖动算法模拟中间色,让照片渐变更柔和。
            <strong className="text-red-700"> 不推荐默认开</strong>:抖动会让单色区域内出现杂色,
            增加拼豆难度。一般只在「色彩平滑过渡很重要」的场景(如人像皮肤)才开。
          </p>
        </>
      ),
    },
    en: {
      title: 'Parameters',
      body: (
        <>
          <h3 className="font-semibold mt-4 mb-2">Palette</h3>
          <p>
            Determines which real-world bead brand / SKU matches each pixel. Built-in: MARD, Artkal, COCO etc.
            Nearest-color matching. Default <code>mard-221-alfonse-doudou</code> (221 colors).
          </p>

          <h3 className="font-semibold mt-4 mb-2">Grid Size (W × H, in beads)</h3>
          <p>
            Final pattern dimensions, each cell = 1 bead. Range 8–200. Compute from your physical board
            + bead size (see "Board Size" below).
          </p>

          <h3 className="font-semibold mt-4 mb-2">Bead Size</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Mini (2.6mm)</strong> — most common, default</li>
            <li><strong>Big (5mm)</strong> — for young kids / large patterns, faster to assemble</li>
          </ul>

          <h3 className="font-semibold mt-4 mb-2">Max Colors (blank = unlimited)</h3>
          <p>
            Cap the final palette to N most-frequent colors; others collapse to nearest. Useful when you
            want to limit which bead SKUs you need to buy.
          </p>

          <h3 className="font-semibold mt-4 mb-2">Prefilter</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Smooth (recommended for photos)</strong> — Gaussian blur first to reduce sensor noise</li>
            <li><strong>None</strong> — raw conversion, for line art / cartoons / logos already clean</li>
          </ul>

          <h3 className="font-semibold mt-4 mb-2">Cleanup</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Majority (recommended)</strong> — 3×3 window: isolated cells get replaced by neighbors</li>
            <li><strong>None</strong> — preserve all raw detail</li>
          </ul>

          <h3 className="font-semibold mt-4 mb-2">Dither</h3>
          <p>
            Floyd-Steinberg dithering for smoother gradients in photos. <strong className="text-red-700">Not
            recommended by default</strong>: dither adds noise within solid-color regions, making the actual
            beading harder. Enable only for cases where gradient smoothness really matters (e.g. skin tones).
          </p>
        </>
      ),
    },
  },

  {
    id: 'board-size',
    zh: {
      title: '底板尺寸建议',
      body: (
        <>
          <p>根据拼豆规格选网格大小:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Mini(2.6mm):1 格 ≈ 2.6mm。29×29 ≈ 7.5cm × 7.5cm(标准小底板)</li>
            <li>大颗(5mm):1 格 ≈ 5mm。29×29 ≈ 14.5cm × 14.5cm(大底板)</li>
          </ul>
          <p className="mt-3">
            转换页右侧会实时显示「底板提示」,告诉你当前宽 × 高 × 拼豆规格对应的物理尺寸,
            方便对齐你的底板。
          </p>
        </>
      ),
    },
    en: {
      title: 'Board Size Guide',
      body: (
        <>
          <p>Pick grid size based on bead size:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Mini (2.6mm): 1 cell ≈ 2.6mm. 29×29 ≈ 7.5cm × 7.5cm (standard small board)</li>
            <li>Big (5mm): 1 cell ≈ 5mm. 29×29 ≈ 14.5cm × 14.5cm (large board)</li>
          </ul>
          <p className="mt-3">
            The generate page shows a live "board hint" — physical dimensions for your current W × H × bead size
            so you can match your actual board.
          </p>
        </>
      ),
    },
  },

  {
    id: 'download',
    zh: {
      title: '下载与打印',
      body: (
        <>
          <p>
            每张图纸卡片有两张图:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>
              <strong>预览图(preview)</strong> — 实际的拼豆效果色块,无标注,纯看效果
            </li>
            <li>
              <strong>符号图(symbol)</strong> — 每个色块上叠加字母 / 数字符号,方便拼的时候对色号,
              这是<strong className="text-primary-700">真正打印用的图</strong>
            </li>
          </ul>
          <p className="mt-3">
            点「查看符号图」可弹大图(无导航,带下载按钮)。建议打印符号图 + 旁边放色号对照表拼。
          </p>
        </>
      ),
    },
    en: {
      title: 'Download & Print',
      body: (
        <>
          <p>Each pattern card has two images:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>
              <strong>Preview</strong> — final bead look, no labels, just colors
            </li>
            <li>
              <strong>Symbol chart</strong> — each cell overlaid with a letter/number symbol matching the
              SKU. <strong className="text-primary-700">This is what you actually print and bead from.</strong>
            </li>
          </ul>
          <p className="mt-3">
            Click "View symbol" for a modal with a larger version + download button. Print the symbol chart
            and keep the color legend beside it while beading.
          </p>
        </>
      ),
    },
  },

  {
    id: 'faq',
    zh: {
      title: '常见问题',
      body: (
        <div className="space-y-4 mt-2">
          <div>
            <h4 className="font-semibold">Q: 上传后多久能生成?</h4>
            <p className="text-gray-600">
              A: 小图(58×58)同步生成,&lt; 5 秒;大图(150+ 格)走异步队列,通常 30 秒 – 2 分钟,
              取决于图大小和当时负载。
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Q: 生成失败了?</h4>
            <p className="text-gray-600">
              A: 卡片上 status 显示「failed」。常见原因:图片超大(超过 10MB)、或服务端临时 OOM。
              点「删除」删掉,重新上传调小尺寸或换图试试。
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Q: 转换效果不理想?</h4>
            <p className="text-gray-600">
              A: 三步调优:① 调网格(更小=更抽象但色块大,更大=更细但难拼)② 开启「多数清理」消除杂色
              ③ 留空限色数,让色板全开。
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Q: 数据安全?</h4>
            <p className="text-gray-600">
              A: 上传图片仅用于本次转换,生成后原图不被保留;图纸和符号图存在 storage 里,
              只对本人账号可见,可以随时删除。
            </p>
          </div>
        </div>
      ),
    },
    en: {
      title: 'FAQ',
      body: (
        <div className="space-y-4 mt-2">
          <div>
            <h4 className="font-semibold">Q: How long does generation take?</h4>
            <p className="text-gray-600">
              A: Small patterns (58×58) are synchronous, &lt; 5s. Large (150+ cells) go through an async
              queue — typically 30s – 2min depending on size and current load.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Q: Generation failed?</h4>
            <p className="text-gray-600">
              A: Card status will show "failed". Common causes: image too big (&gt; 10MB), or temporary
              server OOM. Click "Delete" and re-upload with smaller dimensions or a different image.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Q: Output doesn't look great?</h4>
            <p className="text-gray-600">
              A: Three knobs: ① grid size (smaller = chunkier but easier, larger = finer but harder),
              ② enable Majority cleanup to remove speckles, ③ leave Max Colors blank to use the full palette.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Q: Data privacy?</h4>
            <p className="text-gray-600">
              A: Uploaded images are used only for the conversion and not stored afterward. Your patterns
              and symbol charts live in storage tied to your account, and can be deleted any time.
            </p>
          </div>
        </div>
      ),
    },
  },
];

export default function DocsPage() {
  const { locale } = useLocale();
  const isZh = locale === 'zh';

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">
        {isZh ? '使用文档' : 'User Guide'}
      </h1>
      <p className="text-gray-500 mb-8">
        {isZh
          ? '从上传到拼豆,5 分钟上手'
          : 'From upload to beading, 5-minute start'}
      </p>

      {/* TOC */}
      <nav className="mb-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
          {isZh ? '目录' : 'Contents'}
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="text-primary-600 hover:underline"
              >
                {isZh ? s.zh.title : s.en.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sections */}
      <div className="space-y-12">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b">
              {isZh ? s.zh.title : s.en.title}
            </h2>
            <div className="prose prose-sm max-w-none leading-relaxed">
              {isZh ? s.zh.body : s.en.body}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16 pt-8 border-t text-sm text-gray-500">
        {isZh ? (
          <>
            还有问题?<a href="mailto:hi@pixel.iclub.com.cn" className="text-primary-600 underline ml-1">联系我们</a>
            或在 <a href="https://github.com/dalonghahaha/PixelBead" className="text-primary-600 underline ml-1" target="_blank" rel="noreferrer">GitHub</a> 提 issue。
          </>
        ) : (
          <>
            Still have questions? <a href="mailto:hi@pixel.iclub.com.cn" className="text-primary-600 underline ml-1">Contact us</a> or
            open an issue on <a href="https://github.com/dalonghahaha/PixelBead" className="text-primary-600 underline ml-1" target="_blank" rel="noreferrer">GitHub</a>.
          </>
        )}
      </div>
    </div>
  );
}