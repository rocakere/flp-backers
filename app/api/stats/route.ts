import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { DEFAULT_NETWORK, NETWORKS, isNetworkId } from '@/lib/networks';

/**
 * 读 PlatformStats：?net=localnet|devnet|mainnet 决定连哪条链、读哪个 PDA。
 * 服务端可用非 NEXT_PUBLIC 的 SOLANA_RPC_* 变量（带 key 的 RPC 放这里，不进前端包）。
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get('net') ?? '';
  const net = isNetworkId(raw) ? raw : DEFAULT_NETWORK;
  const cfg = NETWORKS[net];
  if (!cfg.statsPda) return NextResponse.json({ launched: null, raisedSol: null, net });

  const rpc = process.env[`SOLANA_RPC_${net.toUpperCase()}`] || process.env.SOLANA_RPC || cfg.rpc;
  try {
    const conn = new Connection(rpc, 'confirmed');
    const info = await conn.getAccountInfo(new PublicKey(cfg.statsPda));
    if (!info) return NextResponse.json({ launched: null, raisedSol: null, net });
    const data = Buffer.from(info.data);
    const launched = Number(data.readBigUInt64LE(8));
    const raisedSol = Number(data.readBigUInt64LE(16)) / 1e9;
    return NextResponse.json({ launched, raisedSol, net });
  } catch {
    return NextResponse.json({ launched: null, raisedSol: null, net });
  }
}
