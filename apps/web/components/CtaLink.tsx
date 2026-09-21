'use client';

/**
 * Client Component:CTA 链接 + 埋点点击
 * 拆出来为了不污染 page.tsx(Server Component)的 SSR
 */
import Link from 'next/link';
import { trackLandingCtaClick } from '@/lib/analytics';

interface Props {
  href: string;
  position: 'hero' | 'nav' | 'footer';
  className?: string;
  children: React.ReactNode;
}

export default function CtaLink({ href, position, className, children }: Props) {
  return (
    <Link
      href={href}
      onClick={() => trackLandingCtaClick(position)}
      className={className}
    >
      {children}
    </Link>
  );
}