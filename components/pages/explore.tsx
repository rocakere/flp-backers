'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { dict, pathFor, type Lang } from '@/lib/i18n';
import { useNetwork } from '@/components/solana-provider';
import TradePanel from '@/components/trade-panel';

const TABS = ['最新发射', '即将毕业', '已迁移', '我的持仓'];
const TABS_EN = ['Newest', 'Graduating', 'Migrated', 'My Holdings'];

type Pool = {
  pool: string;
  mint: string;
  creator: string;
  name: string;
  symbol: string;
  image: string;
  uri: string;
  quoteReserve: number;
  baseReserve: number;
  threshold: number;
  progress: number;
  isMigrated: boolean;
  activationPoint: number;
  isMother: boolean;
  priceSol: number;
  dammPool: string;
};

type Payload = {
  net: string;
  ok: boolean;
  reason?: string;
  fairMint: string;
  fairPool: string;
  dbcConfig: string;
  threshold: number;
  pools: Pool[];
  stats: { launched: number | null; raisedSol: number | null; poolCount: number; totalRaised: number };
  fetchedAt: number;
};

const sol = (lamports: number, digits = 3) => (lamports / 1e9).toFixed(digits);
const TOKEN_2022 = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');

export default function ExplorePage({ lang }: { lang: Lang }) {
  const t = dict[lang].note.explore;
  const { network } = useNetwork();
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [active, setActive] = useState(0);
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [held, setHeld] = useState<Set<string>>(new Set());
  const [trade, setTrade] = useState<Pool | null>(null);
  const [toast, setToast] = useState('');
  const tabs = lang === 'en' ? TABS_EN : TABS;

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/pools?net=${network.id}`)
      .then((r) => r.json())
      .then((d: Payload) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [network.id]);

  useEffect(() => {
    load();
    const id = setInterval(load, 45_000);
    return () => clearInterval(id);
  }, [load]);

  // 我的持仓：直接扫钱包的 Token-2022 账户，拿 mint 集合去和池子列表做交集
  useEffect(() => {
    if (!publicKey) return setHeld(new Set());
    connection
      .getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_2022 })
      .then((res) => {
        const mints = new Set<string>();
        for (const a of res.value) {
          const info = a.account.data.parsed?.info;
          const amount = Number(info?.tokenAmount?.uiAmount ?? 0);
          if (amount > 0) mints.add(String(info?.mint));
        }
        setHeld(mints);
      })
      .catch(() => setHeld(new Set()));
  }, [publicKey, connection]);

  const pools = useMemo(() => data?.pools ?? [], [data]);

  const shown = useMemo(() => {
    if (active === 1) return pools.filter((p) => !p.isMigrated && p.progress > 0);
    if (active === 2) return pools.filter((p) => p.isMigrated);
    if (active === 3) return pools.filter((p) => held.has(p.mint));
    return pools;
  }, [active, pools, held]);

  const labels =
    lang === 'en'
      ? { raised: 'Raised', cap: 'Cap', price: 'Price', migrated: 'Migrated', live: 'Live', pool: 'Curve', tokens: 'tokens launched', copy: 'COPY', none: 'Nothing here yet.' }
      : { raised: '已募', cap: '目标', price: '价格', migrated: '已迁移', live: '曲线中', pool: '曲线', tokens: '个发射', copy: '复制', none: '这里还空着。' };

  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <h1 className="text-3xl font-bold text-black">{t.title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-black/60">{t.desc}</p>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-black/50">
        <span>
          {lang === 'en' ? 'Network' : '网络'}：<b className="text-black/70">{network.label}</b>
        </span>
        {data?.stats.poolCount != null && (
          <span>
            {data.stats.poolCount} {labels.tokens}
          </span>
        )}
        {data?.threshold ? (
          <span>
            {lang === 'en' ? 'Graduation cap' : '毕业阈值'}：<b className="text-black/70">{sol(data.threshold, 2)} SOL</b>
          </span>
        ) : null}
        {data && !data.ok && data.reason ? <span className="text-amber-600">{data.reason}</span> : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-black/10 pb-3">
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
            {i === 3 && active === 3 && held.size > 0 ? ` (${held.size})` : ''}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="mt-8 text-sm text-black/50">{lang === 'en' ? 'Reading chain…' : '正在读取链上数据…'}</div>
      ) : shown.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-black/15 bg-white/50 p-8 text-center text-sm text-black/50">
          {active === 3 && !publicKey ? (lang === 'en' ? 'Connect a wallet to see your holdings.' : '连上钱包才能看到持仓。') : labels.none}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {shown.map((p) => (
            <div key={p.pool} className="rounded-xl border border-black/10 bg-white/70 p-5">
              <div className="flex items-start gap-3">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} className="h-11 w-11 flex-none rounded-full border border-black/10 object-cover" />
                ) : (
                  <div className="h-11 w-11 flex-none rounded-full border border-black/10 bg-purple-100 text-center text-xs leading-[44px] text-purple-700">
                    {p.symbol.slice(0, 3)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-black">{p.name}</span>
                    <span className="text-xs text-black/40">${p.symbol}</span>
                    {p.isMother && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        {lang === 'en' ? 'Mother' : '母币'}
                      </span>
                    )}
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        p.isMigrated ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {p.isMigrated ? labels.migrated : labels.live}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                    <div
                      className={`h-full rounded-full ${p.isMigrated ? 'bg-emerald-500' : 'bg-purple-600'}`}
                      style={{ width: `${Math.max(2, Math.round(p.progress * 100))}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-black/45">
                    <span>
                      {labels.raised} {sol(p.quoteReserve, 3)} SOL / {sol(p.threshold || p.quoteReserve, 2)}
                    </span>
                    <span>{Math.round(p.progress * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-black/60">
                <div>
                  {labels.price}：<b className="text-black/80">{p.priceSol.toFixed(9)} SOL</b>
                </div>
                <div className="text-right">
                  {lang === 'en' ? 'Supply' : '池内供应'}：{(p.baseReserve / 1e6).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
                <span className="text-black/40">{labels.pool}</span>
                <a
                  className="font-mono text-purple-700 underline"
                  href={`https://solscan.io/account/${p.pool}${network.id === 'mainnet' ? '' : '?cluster=devnet'}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {p.pool.slice(0, 6)}…{p.pool.slice(-6)}
                </a>
                <a
                  className="font-mono text-black/50 underline"
                  href={`https://solscan.io/token/${p.mint}${network.id === 'mainnet' ? '' : '?cluster=devnet'}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  mint {p.mint.slice(0, 4)}…{p.mint.slice(-4)}
                </a>
              </div>

              {((!p.isMigrated && data) || (p.isMigrated && p.dammPool)) && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setTrade(p)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold text-white transition ${
                      p.isMigrated ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-purple-700 hover:bg-purple-800'
                    }`}
                  >
                    {p.isMigrated
                      ? lang === 'en'
                        ? 'Buy / Sell (DAMM v2)'
                        : '买入 / 卖出（毕业池）'
                      : lang === 'en'
                        ? 'Buy / Sell'
                        : '买入 / 卖出'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between text-xs text-black/45">
        <span>
          {data
            ? `${lang === 'en' ? 'Updated' : '更新于'} ${new Date(data.fetchedAt).toLocaleTimeString()}`
            : ''}
        </span>
        <Link href={pathFor(lang, '/launch')} className="font-semibold text-purple-700 underline">
          {lang === 'en' ? 'Launch a token →' : '去发一个 →'}
        </Link>
      </div>

      {toast && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
          {toast}
        </div>
      )}

      {trade && data && (
        <TradePanel
          pool={trade.pool}
          mint={trade.mint}
          dbcConfig={data.dbcConfig}
          kind={trade.isMigrated && trade.dammPool ? 'damm' : 'curve'}
          dammPool={trade.dammPool}
          name={trade.name}
          symbol={trade.symbol}
          lang={lang === 'en' ? 'en' : 'zh'}
          onClose={() => setTrade(null)}
          onDone={(sig) => {
            setTrade(null);
            setToast(
              lang === 'en' ? `Swap confirmed: ${sig.slice(0, 10)}…` : `交易已确认：${sig.slice(0, 10)}…`,
            );
            setTimeout(() => setToast(''), 8000);
            load();
          }}
        />
      )}
    </main>
  );
}
