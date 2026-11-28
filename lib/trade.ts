import BN from 'bn.js';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  DynamicBondingCurveClient,
  SwapMode,
} from '@meteora-ag/dynamic-bonding-curve-sdk';

export type SwapDirection = 'buy' | 'sell';

export type QuoteResult = {
  /** 预计拿到（buy = 代币最小单位 10^-6，sell = lamports） */
  outAmount: bigint;
  /** 按滑点保护后的最低到手数量 */
  minOut: bigint;
  /** 这笔交易被收掉的曲线手续费（quote 侧，lamports） */
  feeLamports: bigint;
};

const client = (connection: Connection) => new DynamicBondingCurveClient(connection, 'confirmed');

/**
 * 只读报价。买入时 amountIn 是 lamports，卖出时 amountIn 是代币最小单位（6 位小数）。
 * 走 swapQuote2，因为它和 swap2 一一对应：报价里的 minimumAmountOut 可以直接塞进交易。
 */
export async function quoteSwap(params: {
  connection: Connection;
  pool: string;
  dbcConfig: string;
  direction: SwapDirection;
  amountIn: bigint;
  slippageBps: number;
}): Promise<QuoteResult> {
  const c = client(params.connection);
  const [st, cfg] = await Promise.all([
    c.state.getPool(new PublicKey(params.pool)),
    c.state.getPoolConfig(new PublicKey(params.dbcConfig)),
  ]);
  if (!st || !cfg) throw new Error('curve pool not found');
  if (params.amountIn <= 0n) return { outAmount: 0n, minOut: 0n, feeLamports: 0n };

  const q = c.pool.swapQuote2({
    // getPool 返回的是 { poolState } 包装，SDK 内部按 virtualPool.poolState 取值
    virtualPool: st as never,
    config: cfg,
    swapBaseForQuote: params.direction === 'sell',
    hasReferral: false,
    eligibleForFirstSwapWithMinFee: false,
    currentPoint: new BN(Math.floor(Date.now() / 1000)),
    slippageBps: params.slippageBps,
    swapMode: SwapMode.ExactIn,
    amountIn: new BN(params.amountIn.toString()),
  } as never) as unknown as {
    outputAmount: { toString(): string };
    minimumAmountOut: { toString(): string };
    includedFeeInputAmount?: { toString(): string };
    tradingFee?: { toString(): string };
  };

  return {
    outAmount: BigInt(q.outputAmount.toString()),
    minOut: BigInt(q.minimumAmountOut.toString()),
    feeLamports: BigInt((q.includedFeeInputAmount ?? q.tradingFee ?? 0).toString()),
  };
}

/**
 * 构建并发送 swap。签名只有用户钱包一个 —— 平台不代签、不抽成。
 * 与发币那边同一套发送策略：先刷新 blockhash、再签、再 sendRawTransaction、最后轮询确认。
 */
export async function executeSwap(params: {
  connection: Connection;
  wallet: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  pool: string;
  direction: SwapDirection;
  amountIn: bigint;
  minOut: bigint;
}): Promise<string> {
  const c = client(params.connection);
  const tx = await c.pool.swap2({
    owner: params.wallet,
    pool: new PublicKey(params.pool),
    swapBaseForQuote: params.direction === 'sell',
    referralTokenAccount: null,
    swapMode: SwapMode.ExactIn,
    amountIn: new BN(params.amountIn.toString()),
    minimumAmountOut: new BN(params.minOut.toString()),
  } as never);

  tx.feePayer = params.wallet;
  tx.recentBlockhash = (await params.connection.getLatestBlockhash('confirmed')).blockhash;
  const signed = await params.signTransaction(tx);
  const sig = await params.connection.sendRawTransaction(signed.serialize(), { maxRetries: 3 });
  await confirmByPolling(params.connection, sig);
  return sig;
}

/** 公共 RPC 的 websocket 常被掐，统一用 getSignatureStatuses 轮询。 */
async function confirmByPolling(connection: Connection, signature: string) {
  for (let i = 0; i < 90; i++) {
    const status = (await connection.getSignatureStatus(signature, { searchTransactionHistory: true }))?.value;
    if (status?.err) throw new Error(`swap failed: ${JSON.stringify(status.err)} sig=${signature}`);
    if (status && (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized')) return;
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error(`not confirmed in time: ${signature}`);
}
