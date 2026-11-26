'use client';
import { useEffect, useState } from 'react';
import { dict, type Lang } from '@/lib/i18n';
import { VAULTS } from '@/lib/addresses';
import { useNetwork } from '@/components/solana-provider';
import LaunchCountdown from '@/components/launch-countdown';

export default function HomeContent({ lang }: { lang: Lang }) {
  const t = dict[lang].home;
  const { network } = useNetwork();
  const [launched, setLaunched] = useState<number | null>(null);
  useEffect(() => {
    fetch(`/api/stats?net=${network.id}`)
      .then((r) => r.json())
      .then((d) => { if (typeof d.launched === 'number') setLaunched(d.launched); })
      .catch(() => {});
  }, [network.id]);

  const stats = [
    { label: t.statCa, value: 'TBA', copy: false },
    { label: t.statPrice, value: '—' },
    { label: t.statLaunched, value: launched === null ? '—' : launched.toLocaleString() },
    { label: t.statSupply, value: '1,000,000,000' },
    { label: t.statBurned, value: '—' },
    { label: t.statDividend, value: '—' },
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
                <div className={`text-base font-semibold text-black/80 ${s.copy ? 'max-w-[180px] truncate' : ''}`} title={s.value}>
                  {s.value}
                </div>
                {s.copy && (
                  <button
                    onClick={() => handleCopy(s.value)}
                    className="text-[10px] px-1.5 py-0.5 border border-black/20 rounded bg-white/50 hover:bg-white text-black/60"
                  >
                    {t.copy}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

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
          {[
            { label: t.vaultDividend, addr: VAULTS.dividend },
            { label: t.vaultOps, addr: VAULTS.ops },
          ].map((v) => (
            <div key={v.label} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold text-black">{v.label}</div>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-xs ${v.addr ? 'text-black/70' : 'text-black/40'} max-w-[260px] truncate`} title={v.addr || t.vaultTba}>
                  {v.addr || t.vaultTba}
                </span>
                {v.addr && (
                  <>
                    <button onClick={() => handleCopy(v.addr)} className="text-[10px] px-1.5 py-0.5 border border-black/20 rounded bg-white/50 hover:bg-white text-black/60">
                      {t.copy}
                    </button>
                    <a href={`https://solscan.io/account/${v.addr}`} target="_blank" rel="noreferrer" className="text-[10px] px-1.5 py-0.5 border border-black/20 rounded bg-white/50 hover:bg-white text-black/60">
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
