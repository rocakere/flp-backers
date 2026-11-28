'use client';
import { useEffect, useState } from 'react';
import { dict, type Lang } from '@/lib/i18n';
import { VAULTS } from '@/lib/addresses';
import { useNetwork } from '@/components/solana-provider';
import LaunchCountdown from '@/components/launch-countdown';

type Platform = {
  ok: boolean;
  fairMint: string;
  fairPool: string;
  threshold: number;
  pools: { pool: string; mint: string; isMother: boolean; priceSol: number; quoteReserve: number; baseReserve: number; isMigrated: boolean; progress: number }[];
  stats: { launched: number | null; raisedSol: number | null; poolCount: number; totalRaised: number };
  platform: {
    totalBurned: number;
    totalDividends: number;
    dividendRound: number;
    fairAddedToPools: number;
    vaults: { dividend: string; ops: string; liq: string };
    vaultLamports: { dividend: number; ops: number; liq: number };
    fairCurveBound: boolean;
  };
};

const fmtSol = (lamports: number, digits = 4) => (lamports / 1e9).toFixed(digits);

export default function HomeContent({ lang }: { lang: Lang }) {
  const t = dict[lang].home;
  const { network } = useNetwork();
  const [launched, setLaunched] = useState<number | null>(null);
  const [p, setP] = useState<Platform | null>(null);

  useEffect(() => {
    fetch(`/api/pools?net=${network.id}`)
      .then((r) => r.json())
      .then((d: Platform) => {
        setP(d);
        // 平台统计账户只有 distributor 记账，用户自己发射的币不会写进去；
        // 这里用链上真实池子数量，才是"已经发了几个"的准确答案。
        if (typeof d.stats?.poolCount === 'number') setLaunched(d.stats.poolCount);
      })
      .catch(() => {});
  }, [network.id]);

  const mother = p?.pools.find((x) => x.isMother);
  const envLabel = lang === 'en' ? 'Devnet' : '测试网';

  const stats = [
    {
      label: t.statCa,
      value: network.programId ? `${network.programId.slice(0, 6)}…${network.programId.slice(-6)}` : 'TBA',
      copy: true,
      full: network.programId,
    },
    {
      label: t.statPrice,
      value: mother && mother.priceSol > 0 ? `${mother.priceSol.toFixed(9)} SOL` : '—',
    },
    { label: t.statLaunched, value: launched === null ? '—' : launched.toLocaleString() },
    { label: t.statSupply, value: '1,000,000,000' },
    {
      label: t.statBurned,
      value: p?.platform ? `${(p.platform.totalBurned / 1e6).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—',
    },
    {
      label: t.statDividend,
      value: p?.platform ? `${fmtSol(p.platform.totalDividends, 4)} SOL` : '—',
    },
  ];

  const vaults = [
    { label: t.vaultDividend, addr: p?.platform.vaults.dividend || VAULTS.dividend, bal: p?.platform.vaultLamports.dividend },
    { label: t.vaultOps, addr: p?.platform.vaults.ops || VAULTS.ops, bal: p?.platform.vaultLamports.ops },
  ];

  const handleCopy = async (val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      alert('Copied!');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <section className="text-center px-6 pt-10 pb-20">
        <div className="inline-block mb-6 rounded-full border border-purple-300 bg-purple-50 px-4 py-1 text-xs font-semibold tracking-wide text-purple-700">
          {t.badge}
        </div>
        <h1 className="text-6xl md:text-7xl font-extrabold text-black tracking-tight">{t.title}</h1>
        <p className="mt-6 text-lg text-black/60">{t.subtitle}</p>
        <p className="mt-6 max-w-3xl mx-auto text-base text-black/60 leading-relaxed">{t.desc}</p>

        <LaunchCountdown lang={lang} />

        <div className="mt-12 flex flex-wrap items-start justify-center gap-x-20 gap-y-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-xs text-black/40 mb-1">{s.label}</div>
              <div className="flex items-center justify-center gap-2">
                <div className={`text-base font-semibold text-black/80 ${s.copy ? 'max-w-[180px] truncate' : ''}`} title={s.full ?? s.value}>
                  {s.value}
                </div>
                {s.copy && s.full && (
                  <button
                    onClick={() => handleCopy(s.full!)}
                    className="text-[10px] px-1.5 py-0.5 border border-black/20 rounded bg-white/50 hover:bg-white text-black/60"
                  >
                    {t.copy}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-[11px] text-black/35">
          {lang === 'en'
            ? `Live from ${envLabel} · ${p ? new Date((p as Platform & { fetchedAt?: number }).fetchedAt ?? Date.now()).toLocaleTimeString() : 'syncing…'}`
            : `实时读取自${envLabel} · ${p ? new Date((p as Platform & { fetchedAt?: number }).fetchedAt ?? Date.now()).toLocaleTimeString() : '同步中…'}`}
        </p>

        {mother && (
          <p className="mt-3 text-[11px] text-black/40">
            {lang === 'en' ? 'Mother coin pool' : '母币曲线'}：
            <a
              className="ml-1 font-mono underline"
              href={`https://solscan.io/account/${mother.pool}${network.id === 'mainnet' ? '' : '?cluster=devnet'}`}
              target="_blank"
              rel="noreferrer"
            >
              {mother.pool.slice(0, 6)}…{mother.pool.slice(-6)}
            </a>
            <span className="ml-3">
              {lang === 'en' ? 'curve' : '曲线'} {Math.round((mother.progress || 0) * 100)}% · {fmtSol(mother.quoteReserve, 2)} SOL
            </span>
          </p>
        )}

        <p className="mt-10 max-w-2xl mx-auto text-xs leading-6 text-black/40">{t.note}</p>
      </section>

      <section id="core" className="text-center pb-24">
        <h2 className="text-3xl font-bold text-black">{t.coreTitle}</h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto px-6">
          {t.cards.map((c) => (
            <div key={c.t} className="bg-white/60 border border-black/10 rounded-xl p-6 text-left">
              <div className="font-bold text-black text-lg">{c.t}</div>
              <p className="mt-2 text-black/70 text-sm leading-6">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="vaults" className="pb-24 max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-black text-center">{t.vaultTitle}</h2>
        <p className="mt-4 text-sm leading-7 text-black/60 text-center max-w-2xl mx-auto">{t.vaultDesc}</p>
        <div className="mt-8 rounded-xl border border-black/10 bg-white/60 divide-y divide-black/5">
          {vaults.map((v) => (
            <div key={v.label} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold text-black">
                {v.label}
                {typeof v.bal === 'number' && (
                  <span className="ml-2 text-xs font-normal text-black/45">{fmtSol(v.bal, 4)} SOL</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-xs ${v.addr ? 'text-black/70' : 'text-black/40'} max-w-[260px] truncate`} title={v.addr || t.vaultTba}>
                  {v.addr || t.vaultTba}
                </span>
                {v.addr && (
                  <>
                    <button onClick={() => handleCopy(v.addr)} className="text-[10px] px-1.5 py-0.5 border border-black/20 rounded bg-white/50 hover:bg-white text-black/60">
                      {t.copy}
                    </button>
                    <a
                      href={`https://solscan.io/account/${v.addr}${network.id === 'mainnet' ? '' : '?cluster=devnet'}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] px-1.5 py-0.5 border border-black/20 rounded bg-white/50 hover:bg-white text-black/60"
                    >
                      {t.view}
                    </a>
                  </>
                )}
              </div>
            </div>
          ))}
          <div className="px-5 py-4 text-xs text-black/45">{t.vaultHidden}</div>
        </div>
      </section>
    </>
  );
}
