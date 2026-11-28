import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { DynamicBondingCurveClient } from '@meteora-ag/dynamic-bonding-curve-sdk';
import { DEFAULT_NETWORK, NETWORKS, isNetworkId, type NetworkId } from '@/lib/networks';

export const maxDuration = 30;

/** Meteora DBC 程序（devnet / mainnet 同址）。 */
const DBC_PROGRAM_ID = new PublicKey('dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN');
/** DBC Pool 账户大小（实测 devnet 上的池子都是 424 字节）。 */
const DBC_POOL_SIZE = 424;
/** Meteora DAMM v2（CP-AMM）程序，毕业后池子搬到这里。 */
const CP_AMM_PROGRAM_ID = new PublicKey('cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG');
const CP_AMM_POOL_SIZE = 1112;
const CP_AMM_TOKEN_A_MINT_OFFSET = 168;

/**
 * 迁移后 DBC Pool 里的 `dammV2Pool` 字段仍为 null，只能反过来在 CP-AMM 程序里按 base mint 找池。
 * 只有已迁移的池才会调用（数量很少），结果按 mint 缓存 5 分钟。
 */
const dammPoolCache = new Map<string, { at: number; pool: string }>();
async function findDammPool(conn: Connection, mint: string): Promise<string> {
  const hit = dammPoolCache.get(mint);
  if (hit && Date.now() - hit.at < 300_000) return hit.pool;
  try {
    const accs = await conn.getProgramAccounts(CP_AMM_PROGRAM_ID, {
      filters: [
        { dataSize: CP_AMM_POOL_SIZE },
        { memcmp: { offset: CP_AMM_TOKEN_A_MINT_OFFSET, bytes: mint } },
      ],
      dataSlice: { offset: 0, length: 0 },
    });
    const pool = accs[0]?.pubkey.toBase58() ?? '';
    dammPoolCache.set(mint, { at: Date.now(), pool });
    return pool;
  } catch {
    return '';
  }
}

/** 每个网络的 FLP 程序地址（PDA 依赖它，所以要跟着网络变）。 */
function flpProgramId(net: NetworkId): string {
  return (
    (net === 'mainnet' ? process.env.NEXT_PUBLIC_PROGRAM_ID_MAINNET : '') ||
    NETWORKS[net].programId ||
    ''
  );
}

type PoolCard = {
  pool: string;
  mint: string;
  creator: string;
  name: string;
  symbol: string;
  image: string;
  uri: string;
  quoteReserve: number; // lamports
  baseReserve: number;
  threshold: number; // lamports
  progress: number; // 0..1
  isMigrated: boolean;
  activationPoint: number;
  isMother: boolean;
  priceSol: number; // SOL per whole token
  ownerConfig: string;
  /** 毕业后的 DAMM v2 池地址；没迁移或反查不到就是空串 */
  dammPool: string;
};

type PlatformPayload = {
  net: NetworkId;
  ok: boolean;
  reason?: string;
  fairMint: string;
  fairPool: string;
  dbcConfig: string;
  threshold: number;
  pools: PoolCard[];
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
  fetchedAt: number;
};

/** 进程内缓存：公共 RPC 的全量扫描很贵，60 秒内复用一份。 */
let cache: { key: string; at: number; data: PlatformPayload } | null = null;
const CACHE_TTL_MS = 60_000;

/**
 * 可选代理：只有在环境里显式给了 `SOLANA_FETCH_PROXY` 时才会走代理。
 * Vercel 上不需要（也不设置）这个变量，本地开发绕墙联调时才有用。
 */
async function makeConnection(rpc: string): Promise<Connection> {
  const proxy = process.env.SOLANA_FETCH_PROXY;
  if (!proxy) return new Connection(rpc, 'confirmed');
  const { ProxyAgent, fetch } = await import('undici');
  const dispatcher = new ProxyAgent(proxy);
  return new Connection(rpc, {
    commitment: 'confirmed',
    fetch: ((input: any, init: any) => fetch(input, { ...init, dispatcher })) as any,
  });
}

const u64 = (b: Buffer, off: number) => Number(b.readBigUInt64LE(off));

/** 从 Token-2022 mint 账户里取出 metadata 的 uri（存在 metadata 扩展的原始字节里）。 */
function uriFromMint(data: Buffer): string {
  const s = data.toString('utf8');
  const m = s.match(/https?:\/\/[^\s"'\x00-\x1f\\]+/);
  return m ? m[0] : '';
}

async function readMeta(uri: string): Promise<{ name: string; symbol: string; image: string }> {
  if (!uri) return { name: '', symbol: '', image: '' };
  try {
    const res = await fetch(uri, { signal: AbortSignal.timeout(6000), cache: 'no-store' });
    if (!res.ok) return { name: '', symbol: '', image: '' };
    const j = (await res.json()) as { name?: string; symbol?: string; image?: string };
    return { name: String(j.name ?? ''), symbol: String(j.symbol ?? ''), image: String(j.image ?? '') };
  } catch {
    return { name: '', symbol: '', image: '' };
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get('net') ?? '';
  const net: NetworkId = isNetworkId(raw) ? raw : DEFAULT_NETWORK;
  const cfg = NETWORKS[net];

  const empty: PlatformPayload = {
    net,
    ok: false,
    reason: cfg.dbcConfig ? undefined : 'no dbc config for this network',
    fairMint: '',
    fairPool: '',
    dbcConfig: cfg.dbcConfig,
    threshold: 0,
    pools: [],
    stats: { launched: null, raisedSol: null, poolCount: 0, totalRaised: 0 },
    platform: {
      totalBurned: 0,
      totalDividends: 0,
      dividendRound: 0,
      fairAddedToPools: 0,
      vaults: { dividend: '', ops: '', liq: '' },
      vaultLamports: { dividend: 0, ops: 0, liq: 0 },
      fairCurveBound: false,
    },
    fetchedAt: Date.now(),
  };
  if (!cfg.programId || !cfg.dbcConfig) return NextResponse.json(empty);

  if (cache && cache.key === net && Date.now() - cache.at < CACHE_TTL_MS) {
    return NextResponse.json(cache.data);
  }

  const rpc = process.env[`SOLANA_RPC_${net.toUpperCase()}`] || process.env.SOLANA_RPC || cfg.rpc;
  try {
    const conn = await makeConnection(rpc);
    const client = new DynamicBondingCurveClient(conn, 'confirmed');
    const flpId = new PublicKey(flpProgramId(net));
    const dbcConfig = new PublicKey(cfg.dbcConfig);

    // ---- 平台配置（母币 mint / 累计销毁 / 累计分红 / 三个金库）----
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config')], flpId);
    const configInfo = await conn.getAccountInfo(configPda);
    let fairMint = '';
    const platform: PlatformPayload['platform'] = {
      totalBurned: 0,
      totalDividends: 0,
      dividendRound: 0,
      fairAddedToPools: 0,
      vaults: { dividend: '', ops: '', liq: '' },
      vaultLamports: { dividend: 0, ops: 0, liq: 0 },
      fairCurveBound: false,
    };
    if (configInfo) {
      const b = Buffer.from(configInfo.data);
      fairMint = new PublicKey(b.subarray(8, 40)).toBase58();
      platform.dividendRound = u64(b, 139);
      platform.fairAddedToPools = u64(b, 147);
      platform.totalDividends = u64(b, 155);
      platform.totalBurned = u64(b, 163);
      platform.fairCurveBound = !new PublicKey(b.subarray(267, 299)).equals(PublicKey.default);
      const divPda = PublicKey.findProgramAddressSync([Buffer.from('dividend_vault')], flpId)[0];
      const opsPda = PublicKey.findProgramAddressSync([Buffer.from('ops_vault')], flpId)[0];
      const liqPda = PublicKey.findProgramAddressSync([Buffer.from('liq_vault')], flpId)[0];
      platform.vaults = { dividend: divPda.toBase58(), ops: opsPda.toBase58(), liq: liqPda.toBase58() };
      const [dv, ov, lv] = await Promise.all([
        conn.getAccountInfo(divPda),
        conn.getAccountInfo(opsPda),
        conn.getAccountInfo(liqPda),
      ]);
      platform.vaultLamports = {
        dividend: dv?.lamports ?? 0,
        ops: ov?.lamports ?? 0,
        liq: lv?.lamports ?? 0,
      };
    }

    // ---- 统计账户 ----
    let launched: number | null = null;
    let raisedSol: number | null = null;
    if (cfg.statsPda) {
      const si = await conn.getAccountInfo(new PublicKey(cfg.statsPda));
      if (si) {
        const b = Buffer.from(si.data);
        launched = u64(b, 8);
        raisedSol = u64(b, 16) / 1e9;
      }
    }

    // ---- 该 config 下的所有曲线池 ----
    const accs = await conn.getProgramAccounts(DBC_PROGRAM_ID, {
      filters: [{ dataSize: DBC_POOL_SIZE }, { memcmp: { offset: 72, bytes: dbcConfig.toBase58() } }],
    });

    const cfgState = await client.state.getPoolConfig(dbcConfig).catch(() => null);
    const threshold = cfgState ? Number(cfgState.migrationQuoteThreshold?.toString?.() ?? 0) : 0;

    const pools: PoolCard[] = [];
    for (const acc of accs) {
      const b = Buffer.from(acc.account.data);
      const mint = new PublicKey(b.subarray(136, 168));
      const creator = new PublicKey(b.subarray(104, 136));
      const st = await client.state.getPool(acc.pubkey).catch(() => null);
      if (!st) continue;
      const ps = st.poolState;
      const quoteReserve = Number(ps.quoteReserve?.toString?.() ?? 0);
      const baseReserve = Number(ps.baseReserve?.toString?.() ?? 0);
      const activationPoint = Number(ps.activationPoint?.toString?.() ?? 0);

      const mintInfo = await conn.getAccountInfo(mint);
      const uri = mintInfo ? uriFromMint(Buffer.from(mintInfo.data)) : '';
      const meta = await readMeta(uri);

      const decimals = 6; // 模板固定 6 位小数（TokenDecimal.SIX），与链上 mint 一致
      const wholeBase = baseReserve / 10 ** decimals;
      const priceSol = wholeBase > 0 ? quoteReserve / 1e9 / wholeBase : 0;

      pools.push({
        pool: acc.pubkey.toBase58(),
        mint: mint.toBase58(),
        creator: creator.toBase58(),
        name: meta.name || (mint.toBase58() === fairMint ? 'FAIR' : mint.toBase58().slice(0, 6)),
        symbol: meta.symbol || (mint.toBase58() === fairMint ? 'FAIR' : '—'),
        image: meta.image,
        uri,
        quoteReserve,
        baseReserve,
        threshold,
        progress: threshold > 0 ? Math.min(1, quoteReserve / threshold) : 0,
        isMigrated: Number(ps.isMigrated?.toString?.() ?? 0) === 1,
        activationPoint,
        isMother: fairMint !== '' && mint.toBase58() === fairMint,
        priceSol,
        ownerConfig: cfg.dbcConfig,
        dammPool: '',
      });
    }

    // 已迁移的池补上 DAMM v2 池地址，前端才能给出毕业后买卖入口
    for (const p of pools) {
      if (p.isMigrated) p.dammPool = await findDammPool(conn, p.mint);
    }

    // 新的在前；母币钉在列表末尾之外的独立字段里，不在列表里重复
    pools.sort((a, b) => b.activationPoint - a.activationPoint);

    const motherPool = pools.find((p) => p.isMother);
    const data: PlatformPayload = {
      net,
      ok: true,
      fairMint,
      fairPool: motherPool?.pool ?? '',
      dbcConfig: cfg.dbcConfig,
      threshold,
      pools,
      stats: { launched, raisedSol, poolCount: pools.length, totalRaised: pools.reduce((s, p) => s + p.quoteReserve, 0) },
      platform,
      fetchedAt: Date.now(),
    };
    cache = { key: net, at: Date.now(), data };
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ ...empty, reason: (e as Error).message }, { status: 200 });
  }
}
