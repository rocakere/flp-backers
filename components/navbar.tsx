'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Navbar() {
  // 钱包按钮依赖浏览器环境，挂载后再渲染，避免服务端/客户端不一致
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white/60 backdrop-blur">
      {/* 第一行 */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* 左侧：FAIR 文字 + Logo 图 */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="text-xl font-bold text-purple-700">FAIR</span>
          <img src="/logo.png" alt="FLP Logo" width={32} height={32} className="object-contain" />
        </Link>

        {/* 中间 */}
        <Link href="/launch" className="hidden shrink-0 text-lg font-semibold text-green-700 sm:block">
          Launch a Token
        </Link>

        {/* 右侧 */}
        <div className="flex shrink-0 items-center gap-2">
          <select className="border border-black/20 bg-white px-2 py-1 text-sm text-black/60">
            <option>中文</option>
            <option disabled>English (soon)</option>
          </select>
          {mounted ? (
            <WalletMultiButton />
          ) : (
            <span className="inline-flex h-10 items-center rounded border border-black/20 px-3 text-sm text-black/40">
              连接钱包
            </span>
          )}
        </div>
      </div>

      {/* 第二行：菜单。未开放的栏目置灰，不可点击 */}
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-7 gap-y-2 border-t border-black/5 bg-white/20 px-4 py-3 text-sm sm:gap-x-20 sm:text-base">
        <Link href="/#core" className="text-purple-700 transition hover:text-purple-900">
          核心理念
        </Link>
        <span className="cursor-not-allowed text-black/30" title="白皮书整理中，暂未开放">
          白皮书<sup className="ml-0.5 text-[9px]">soon</sup>
        </span>
        <span className="cursor-not-allowed text-black/30" title="审计报告整理中，暂未开放">
          审计报告<sup className="ml-0.5 text-[9px]">soon</sup>
        </span>
        <span className="cursor-not-allowed text-black/30" title="代币广场开发中，暂未开放">
          代币广场<sup className="ml-0.5 text-[9px]">soon</sup>
        </span>
      </nav>
    </header>
  );
}
