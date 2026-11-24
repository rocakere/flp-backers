'use client';
import Link from 'next/link';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white/60 backdrop-blur">
      {/* 第一行 */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* 左侧：FLP 文字 + Logo 图（图在后面），删掉 Backers */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-purple-700">FAIR</span>
          <img src="/logo.png" alt="FLP Logo" width={32} height={32} className="object-contain" />
        </Link>

        {/* 中间 */}
        <Link href="/launch" className="text-lg font-semibold text-green-700">
          Launch a Token
        </Link>

        {/* 右侧 */}
        <div className="flex items-center gap-3">
          <select className="border border-black/20 bg-white px-2 py-1 text-sm">
            <option>中文</option>
            <option>English</option>
          </select>
          <WalletMultiButton />
        </div>
      </div>

      {/* 第二行：菜单间距 gap-20 */}
      <nav className="mx-auto flex max-w-7xl items-center justify-center gap-20 border-t border-black/5 bg-white/20 py-3">
        <Link href="/#core" className="text-purple-700 hover:text-purple-900 transition">核心理念</Link>
        <Link href="/whitepaper" className="text-purple-700 hover:text-purple-900 transition">白皮书</Link>
        <Link href="#lang" className="text-purple-700 hover:text-purple-900 transition">语言</Link>
        <Link href="/audit" className="text-purple-700 hover:text-purple-900 transition">审计报告</Link>
        <Link href="/explore" className="text-purple-700 hover:text-purple-900 transition">代币广场</Link>
        <input placeholder="搜索" className="border border-black/20 bg-white px-2 py-1 text-sm outline-none" />
      </nav>
    </header>
  );
}