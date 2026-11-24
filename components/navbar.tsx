'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { dict, langFromPath, pathFor, type Lang } from '@/lib/i18n';

export default function Navbar() {
  // 钱包按钮依赖浏览器环境，挂载后再渲染，避免服务端/客户端不一致
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pathname = usePathname() || '/';
  const router = useRouter();
  const lang = langFromPath(pathname);
  const t = dict[lang].nav;

  const switchLang = (next: string) => {
    const nextLang = next as Lang;
    if (nextLang === lang) return;
    if (nextLang === 'en') {
      router.push(pathname === '/' ? '/en' : `/en${pathname}`);
    } else {
      const stripped = pathname.replace(/^\/en/, '');
      router.push(stripped === '' ? '/' : stripped);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white/60 backdrop-blur">
      {/* 第一行 */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* 左侧：FAIR 文字 + Logo 图 */}
        <Link href={pathFor(lang)} className="flex shrink-0 items-center gap-2">
          <span className="text-xl font-bold text-purple-700">FAIR</span>
          <img src="/logo.png" alt="FAIR Logo" width={22} height={32} className="h-8 w-auto object-contain" />
        </Link>

        {/* 中间 */}
        <Link href={pathFor(lang, '/launch')} className="hidden shrink-0 text-lg font-semibold text-green-700 sm:block">
          {t.launch}
        </Link>

        {/* 右侧：语言切换 + 钱包 */}
        <div className="flex shrink-0 items-center gap-2">
          <select
            value={lang}
            onChange={(e) => switchLang(e.target.value)}
            className="cursor-pointer border border-black/20 bg-white px-2 py-1 text-sm text-black/70"
          >
            <option value="zh">{t.langZh}</option>
            <option value="en">{t.langEn}</option>
          </select>
          {mounted ? (
            <WalletMultiButton />
          ) : (
            <span className="inline-flex h-10 items-center rounded border border-black/20 px-3 text-sm text-black/40">
              {t.connect}
            </span>
          )}
        </div>
      </div>

      {/* 第二行：菜单。未开放的栏目置灰，不可点击 */}
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-7 gap-y-2 border-t border-black/5 bg-white/20 px-4 py-3 text-sm sm:gap-x-20 sm:text-base">
        <Link href={`${pathFor(lang)}#core`} className="text-purple-700 transition hover:text-purple-900">
          {t.core}
        </Link>
        <Link href={pathFor(lang, '/whitepaper')} className="text-purple-700 transition hover:text-purple-900">
          {t.whitepaper}
        </Link>
        <span className="cursor-not-allowed text-black/30" title={t.auditTip}>
          {t.audit}<sup className="ml-0.5 text-[9px]">{t.soon}</sup>
        </span>
        <span className="cursor-not-allowed text-black/30" title={t.exploreTip}>
          {t.explore}<sup className="ml-0.5 text-[9px]">{t.soon}</sup>
        </span>
      </nav>
    </header>
  );
}
