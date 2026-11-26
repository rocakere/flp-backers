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

  const navLink =
    'relative text-purple-700 transition-colors hover:text-purple-900 after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-0 after:bg-purple-700 after:transition-all after:duration-200 hover:after:w-full';
  const statusLabel = lang === 'en' ? 'TESTNET · verified' : 'TESTNET · 全链路已验';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur-md">
      {/* 第一行 */}
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-6 sm:py-4">
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
        <Link
          href={pathFor(lang, '/audit')}
          className="hidden items-center gap-1.5 rounded-full border border-emerald-300/60 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 sm:inline-flex"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          {statusLabel}
        </Link>
      </nav>
    </header>
  );
}
