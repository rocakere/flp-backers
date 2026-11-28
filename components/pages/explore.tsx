'use client';
import Link from 'next/link';
import { useState } from 'react';
import { dict, pathFor, type Lang } from '@/lib/i18n';

const TABS = ['最新发射', '即将毕业', '已迁移', '我的持仓'];
const TABS_EN = ['Newest', 'Graduating', 'Migrated', 'My Holdings'];

export default function ExplorePage({ lang }: { lang: Lang }) {
  const t = dict[lang].note.explore;
  const [active, setActive] = useState(0);
  const tabs = lang === 'en' ? TABS_EN : TABS;
  const empty =
    lang === 'en'
      ? 'Nothing here yet — the first tokens launched on FAIR will show up in this feed.'
      : '这里还空着。协议上出现第一个发射项目后，列表会按进度实时出现在这里。';

  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <h1 className="text-3xl font-bold text-black">{t.title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-black/60">{t.desc}</p>

      <div className="mt-8 flex flex-wrap gap-2 border-b border-black/10 pb-3">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActive(i)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              active === i
                ? 'bg-purple-700 text-white'
                : 'border border-black/15 text-black/60 hover:bg-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-dashed border-black/15 bg-white/50 p-8 text-center">
          <div className="text-sm font-semibold text-black/70">{tabs[active]}</div>
          <p className="mt-2 text-xs leading-6 text-black/50">{empty}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white/60 p-8">
          <div className="text-xs font-semibold tracking-widest text-purple-700">FAIR</div>
          <p className="mt-2 text-xs leading-6 text-black/60">
            {lang === 'en'
              ? 'Sorting will follow 24h volume by default; progress bars show how far a curve has filled.'
              : '默认按 24 小时成交量排序；卡片上显示曲线进度条、费率标识与官网 / X / TG 三个入口。'}
          </p>
          <Link href={pathFor(lang, '/launch')} className="mt-4 inline-block text-xs font-semibold text-purple-700 underline">
            {lang === 'en' ? 'Launch a token →' : '去发一个 →'}
          </Link>
        </div>
      </div>
    </main>
  );
}
