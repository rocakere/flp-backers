import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { STATS_PDA } from '@/lib/addresses';

export async function GET() {
  if (!STATS_PDA) return NextResponse.json({ launched: null, raisedSol: null });
  try {
    const rpc = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
    const conn = new Connection(rpc, 'confirmed');
    const info = await conn.getAccountInfo(new PublicKey(STATS_PDA));
    if (!info) return NextResponse.json({ launched: null, raisedSol: null });
    const data = Buffer.from(info.data);
    const launched = Number(data.readBigUInt64LE(8));
    const raisedSol = Number(data.readBigUInt64LE(16)) / 1e9;
    return NextResponse.json({ launched, raisedSol });
  } catch {
    return NextResponse.json({ launched: null, raisedSol: null });
  }
}
