'use client';
import { useCallback, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { executeSwap, quoteSwap, type SwapDirection } from '@/lib/trade';
import { executeDammSwap, quoteDammSwap } from '@/lib/damm-trade';

type Props = {
  pool: string;
  mint: string;
  dbcConfig: string;
  name: string;
  symbol: string;
  lang: 'zh' | 'en';
  /** curve = 未毕业的 DBC 曲线池；damm = 已迁移到 DAMM v2 的池 */
  kind?: 'curve' | 'damm';
  /** kind=damm 时必填：迁移后的 CP-AMM 池地址 */
  dammPool?: string;
  onClose: () => void;
  onDone: (sig: string) => void;
};

const LAMPORTS = 1_000_000_000n;
const TOKEN_UNIT = 1_000_000n; // 模板固定 6 位小数

export default function TradePanel({ pool, mint, dbcConfig, name, symbol, lang, kind = 'curve', dammPool, onClose, onDone }: Props) {
  const { connection } = useConnection();
  const { connected, publicKey, signTransaction } = useWallet();
  const [dir, setDir] = useState<SwapDirection>('buy');
  const [input, setInput] = useState('');
  const [slip, setSlip] = useState(100);
  const [quote, setQuote] = useState<{ out: bigint; min: bigint } | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [balance, setBalance] = useState<{ sol: number; token: number }>({ sol: 0, token: 0 });

  const zh = lang === 'zh';

  const loadBalance = useCallback(async () => {
    if (!publicKey) return;
    try {
      const lamports = await connection.getBalance(publicKey);
      let token = 0;
      try {
        const ata = getAssociatedTokenAddressSync(new PublicKey(mint), publicKey, false, TOKEN_2022_PROGRAM_ID);
        const bal = await connection.getTokenAccountBalance(ata);
        token = bal.value.uiAmount ?? 0;
      } catch {
        token = 0;
      }
      setBalance({ sol: lamports / 1e9, token });
    } catch {
      /* 余额读不到就不显示，别挡住交易 */
    }
  }, [connection, publicKey, mint]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  // 输入变化就重新报价，350ms 防抖
  useEffect(() => {
    const v = Number(input);
    if (!Number.isFinite(v) || v <= 0) {
      setQuote(null);
      return;
    }
    let dead = false;
    const t = setTimeout(async () => {
      setQuoting(true);
      try {
        const amountIn = dir === 'buy' ? BigInt(Math.round(v * 1e9)) : BigInt(Math.round(v * 1e6));
        const q =
          kind === 'damm' && dammPool
            ? await quoteDammSwap({ connection, pool: dammPool, direction: dir, amountIn, slippageBps: slip })
            : await quoteSwap({ connection, pool, dbcConfig, direction: dir, amountIn, slippageBps: slip });
        if (!dead) setQuote({ out: q.outAmount, min: q.minOut });
      } catch (e) {
        if (!dead) {
          setQuote(null);
          setMsg((e as Error).message);
        }
      } finally {
        if (!dead) setQuoting(false);
      }
    }, 350);
    return () => {
      dead = true;
      clearTimeout(t);
    };
  }, [input, dir, slip, connection, pool, dbcConfig, kind, dammPool]);

  const submit = async () => {
    setMsg('');
    if (!connected || !publicKey || !signTransaction) return setMsg(zh ? '请先连接钱包' : 'Connect a wallet first');
    const v = Number(input);
    if (!Number.isFinite(v) || v <= 0) return setMsg(zh ? '请输入数量' : 'Enter an amount');
    if (!quote) return setMsg(zh ? '报价还没回来' : 'Wait for the quote');
    setBusy(true);
    try {
      const amountIn = dir === 'buy' ? BigInt(Math.round(v * 1e9)) : BigInt(Math.round(v * 1e6));
      const sig =
        kind === 'damm' && dammPool
          ? await executeDammSwap({
              connection,
              wallet: publicKey,
              signTransaction,
              pool: dammPool,
              direction: dir,
              amountIn,
              minOut: quote.min,
            })
          : await executeSwap({
              connection,
              wallet: publicKey,
              signTransaction,
              pool,
              direction: dir,
              amountIn,
              minOut: quote.min,
            });
      onDone(sig);
      await loadBalance();
      setMsg(zh ? `成功：${sig.slice(0, 8)}…` : `Done: ${sig.slice(0, 8)}…`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const outText = quote
    ? dir === 'buy'
      ? `${(Number(quote.out) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${symbol}`
      : `${(Number(quote.out) / 1e9).toFixed(4)} SOL`
    : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="font-semibold text-black">
            {name} <span className="text-xs text-black/40">${symbol}</span>
            {kind === 'damm' && (
              <div className="mt-0.5 text-[10px] font-normal text-emerald-700">
                {zh ? '已毕业 · DAMM v2 池交易' : 'Graduated · trading on the DAMM v2 pool'}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-sm text-black/40 hover:text-black">✕</button>
        </div>

        <div className="mt-4 flex rounded-full bg-black/5 p-1 text-sm">
          {(['buy', 'sell'] as SwapDirection[]).map((d) => (
            <button
              key={d}
              onClick={() => {
                setDir(d);
                setInput('');
                setQuote(null);
                setMsg('');
              }}
              className={`flex-1 rounded-full py-1.5 transition ${dir === d ? 'bg-purple-700 text-white' : 'text-black/55'}`}
            >
              {d === 'buy' ? (zh ? '买入' : 'Buy') : zh ? '卖出' : 'Sell'}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-xs text-black/50">
          {dir === 'buy' ? (zh ? '支付 SOL' : 'Pay SOL') : zh ? `卖出 ${symbol}` : `Sell ${symbol}`}
        </label>
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-black/15 px-3 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0.0"
            className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-black outline-none"
          />
          {dir === 'sell' && balance.token > 0 && (
            <button
              onClick={() => setInput(String(balance.token))}
              className="rounded-full border border-black/15 px-2 py-0.5 text-[10px] text-black/60"
            >
              MAX {balance.token.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </button>
          )}
          <span className="text-xs text-black/40">{dir === 'buy' ? 'SOL' : symbol}</span>
        </div>
        <div className="mt-1 text-[10px] text-black/35">
          {zh ? '余额' : 'Balance'}：{balance.sol.toFixed(4)} SOL · {balance.token.toLocaleString(undefined, { maximumFractionDigits: 2 })} {symbol}
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-black/50">
          <span>{zh ? '滑点' : 'Slippage'}</span>
          {[50, 100, 300].map((b) => (
            <button
              key={b}
              onClick={() => setSlip(b)}
              className={`rounded-full border px-2 py-0.5 ${slip === b ? 'border-purple-600 text-purple-700' : 'border-black/15 text-black/55'}`}
            >
              {(b / 100).toFixed(b === 50 ? 1 : 0)}%
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-xl bg-black/[0.03] p-3 text-xs text-black/60">
          <div className="flex justify-between">
            <span>{zh ? '预计到手' : 'You receive'}</span>
            <b className="text-black/80">{quoting ? '…' : outText}</b>
          </div>
          {quote && (
            <div className="mt-1 flex justify-between text-[10px] text-black/45">
              <span>{zh ? '最少到手（含滑点）' : 'Min received'}</span>
              <span>
                {dir === 'buy'
                  ? `${(Number(quote.min) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${symbol}`
                  : `${(Number(quote.min) / 1e9).toFixed(4)} SOL`}
              </span>
            </div>
          )}
        </div>

        {msg && <div className="mt-3 break-all text-xs text-red-600">{msg}</div>}

        <button
          onClick={submit}
          disabled={busy || quoting}
          className="mt-4 w-full rounded-xl bg-purple-700 py-3 text-sm font-semibold text-white transition disabled:opacity-40"
        >
          {busy ? (zh ? '处理中…' : 'Working…') : dir === 'buy' ? (zh ? '确认买入' : 'Confirm buy') : zh ? '确认卖出' : 'Confirm sell'}
        </button>
        <p className="mt-2 text-center text-[10px] text-black/35">
          {zh ? '交易由你的钱包签名，平台不代签、不抽成' : 'Signed by your wallet — the platform never signs or takes a cut'}
        </p>
      </div>
    </div>
  );
}
