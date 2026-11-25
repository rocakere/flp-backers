'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { dict, langFromPath, pathFor, type Lang } from '@/lib/i18n';
import { useNetwork } from '@/components/solana-provider';
import { NETWORK_ORDER, NETWORKS, type NetworkId } from '@/lib/networks';

export default function Navbar() {
  // 钱包按钮依赖浏览器环境，挂载后再渲染，避免服务端/客户端不一致
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pathname = usePathname() || '/';
  const router = useRouter();
  const lang = langFromPath(pathname);
  const t = dict[lang].nav;
  const { network, setNetwork } = useNetwork();

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

  const navLink = 'text-purple-700 transition hover:text-purple-900';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white/60 backdrop-blur">
      {/* 第一行 */}
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-3">
        {/* 左侧：FAIR 文字 + Logo 图 */}
        <Link href={pathFor(lang)} className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <span className="text-lg font-bold text-purple-700 sm:text-xl">FAIR</span>
          <img src="/logo.png" alt="FAIR Logo" width={22} height={32} className="h-7 w-auto object-contain sm:h-8" />
        </Link>

        {/* 中间 */}
        <Link
          href={pathFor(lang, '/launch')}
          className="hidden shrink-0 text-lg font-semibold text-green-700 sm:block"
        >
          {t.launch}
        </Link>

        {/* 右侧：网络 + 语言 + 钱包 */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <select
            value={network.id}
            onChange={(e) => setNetwork(e.target.value as NetworkId)}
            aria-label="network"
            className="cursor-pointer border border-black/20 bg-white px-1 py-1 text-[11px] text-black/70 sm:px-2 sm:text-sm"
          >
            {NETWORK_ORDER.map((id) => (
              <option key={id} value={id}>
                {NETWORKS[id].label}
              </option>
            ))}
          </select>
          <select
            value={lang}
            onChange={(e) => switchLang(e.target.value)}
            aria-label="language"
            className="cursor-pointer border border-black/20 bg-white px-1 py-1 text-[11px] text-black/70 sm:px-2 sm:text-sm"
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

      {/* 第二行：菜单。窄屏自动换行，不再横向溢出 */}
      <nav className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-black/5 bg-white/20 px-3 py-2 text-[13px] sm:gap-x-20 sm:px-4 sm:py-3 sm:text-base">
        <Link href={pathFor(lang)} className={navLink}>
          {t.home}
        </Link>
        <Link href={`${pathFor(lang)}#core`} className={navLink}>
          {t.core}
        </Link>
        <Link href={pathFor(lang, '/whitepaper')} className={navLink}>
          {t.whitepaper}
        </Link>
        <Link href={pathFor(lang, '/audit')} className={navLink}>
          {t.audit}
        </Link>
        <Link href={pathFor(lang, '/explore')} className={navLink}>
          {t.explore}
        </Link>
        <Link href={pathFor(lang, '/help')} className={navLink}>
          {t.help}
        </Link>
      </nav>
    </header>
  );
}
