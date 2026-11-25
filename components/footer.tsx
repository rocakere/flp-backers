'use client';
import { usePathname } from 'next/navigation';
import { dict, langFromPath } from '@/lib/i18n';

export default function Footer() {
  const pathname = usePathname() || '/';
  const t = dict[langFromPath(pathname)].footer;

  return (
    <footer className="mt-20 border-t border-black/10 py-10 text-sm text-black/50">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <div>{t.tagline}</div>
        <div className="flex gap-6">
          <span className="cursor-not-allowed text-black/30">{t.docs}</span>
          <span className="cursor-not-allowed text-black/30">{t.x}</span>
          <span className="cursor-not-allowed text-black/30">{t.discord}</span>
        </div>
        <div className="text-xs text-black/40">{t.risk}</div>
      </div>
      <div className="mx-auto mt-6 flex max-w-7xl flex-col items-center gap-1 border-t border-black/10 pt-6 text-xs text-black/40 md:flex-row md:justify-center md:gap-6">
        <span>{t.dev}</span>
        <span>{t.contact}</span>
      </div>
    </footer>
  );
}
