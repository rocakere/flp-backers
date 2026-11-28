import BN from 'bn.js';
import { Connection, PublicKey, SystemProgram, Transaction, type TransactionInstruction } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getMint,
  getAccount,
  createAssociatedTokenAccountIdempotentInstruction,
  createSyncNativeInstruction,
  createCloseAccountInstruction,
} from '@solana/spl-token';
import { CpAmm } from '@meteora-ag/cp-amm-sdk';
import type { QuoteResult, SwapDirection } from '@/lib/trade';

/** 交易对里的 SOL 侧统一用 wrapped SOL。 */
const WSOL = new PublicKey('So11111111111111111111111111111111111111112');

/**
 * 毕业池（DAMM v2 / CP-AMM）的报价与交易。
 * 这里和曲线池是两套程序：曲线走 DBC，毕业后走 cpamdpZCK…，池费由迁移时写的 50bps 决定。
 */

async function poolContext(connection: Connection, pool: string) {
  const cp = new CpAmm(connection);
  const st = await cp.fetchPoolState(new PublicKey(pool));
  const wsolIsB = st.tokenBMint.equals(WSOL);
  const tokenMint = wsolIsB ? st.tokenAMint : st.tokenBMint;
  const tokenFlag = wsolIsB ? st.tokenAFlag : st.tokenBFlag;
  const tokenProgram = tokenFlag === 1 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  // 我们平台的模板固定 6 位小数，但仍以链上 mint 为准，避免以后换模板时算错。
  let tokenDecimals = 6;
  try {
    tokenDecimals = (await getMint(connection, tokenMint, 'confirmed', tokenProgram)).decimals;
  } catch {
    /* 读不到就用模板默认 */
  }
  return { st, wsolIsB, tokenMint, tokenProgram, tokenDecimals };
}

export async function quoteDammSwap(params: {
  connection: Connection;
  pool: string;
  direction: SwapDirection;
  amountIn: bigint;
  slippageBps: number;
}): Promise<QuoteResult> {
  if (params.amountIn <= 0n) return { outAmount: 0n, minOut: 0n, feeLamports: 0n };
  const { st, wsolIsB, tokenDecimals } = await poolContext(params.connection, params.pool);
  const cp = new CpAmm(params.connection);

  const buy = params.direction === 'buy';
  const q = cp.getQuote({
    inAmount: new BN(params.amountIn.toString()),
    inputTokenMint: buy ? WSOL : st.tokenAMint.equals(WSOL) ? st.tokenBMint : st.tokenAMint,
    slippage: params.slippageBps,
    poolState: st,
    currentTime: Math.floor(Date.now() / 1000),
    currentSlot: 0,
    // tokenADecimal / tokenBDecimal 必须按 A、B 的真实顺序给，不能按买卖方向给
    tokenADecimal: wsolIsB ? tokenDecimals : 9,
    tokenBDecimal: wsolIsB ? 9 : tokenDecimals,
  } as never);

  return {
    outAmount: BigInt(q.swapOutAmount.toString()),
    minOut: BigInt(q.minSwapOutAmount.toString()),
    feeLamports: BigInt(q.totalFee.toString()),
  };
}

export async function executeDammSwap(params: {
  connection: Connection;
  wallet: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  pool: string;
  direction: SwapDirection;
  amountIn: bigint;
  minOut: bigint;
}): Promise<string> {
  const { st, wsolIsB, tokenMint, tokenProgram } = await poolContext(params.connection, params.pool);
  const cp = new CpAmm(params.connection);

  const wsolAta = getAssociatedTokenAddressSync(WSOL, params.wallet, false, TOKEN_PROGRAM_ID);
  const tokenAta = getAssociatedTokenAddressSync(tokenMint, params.wallet, false, tokenProgram);
  const pre: TransactionInstruction[] = [];
  const post: TransactionInstruction[] = [];

  // SOL 侧账户先确保存在
  pre.push(createAssociatedTokenAccountIdempotentInstruction(params.wallet, wsolAta, params.wallet, WSOL, TOKEN_PROGRAM_ID));

  if (params.direction === 'buy') {
    // 买入：差多少 SOL 就 wrap 多少，再 sync 让余额生效
    let have = 0n;
    try {
      have = BigInt((await getAccount(params.connection, wsolAta, 'confirmed', TOKEN_PROGRAM_ID)).amount.toString());
    } catch {
      have = 0n;
    }
    const need = params.amountIn - have;
    if (need > 0n) {
      pre.push(
        SystemProgram.transfer({ fromPubkey: params.wallet, toPubkey: wsolAta, lamports: Number(need) }),
        createSyncNativeInstruction(wsolAta, TOKEN_PROGRAM_ID),
      );
    }
  } else {
    // 卖出：把换回的 SOL 直接解包装回钱包
    post.push(createCloseAccountInstruction(wsolAta, params.wallet, params.wallet, [], TOKEN_PROGRAM_ID));
  }

  const tx = await cp.swap({
    payer: params.wallet,
    pool: new PublicKey(params.pool),
    inputTokenMint: params.direction === 'buy' ? WSOL : tokenMint,
    outputTokenMint: params.direction === 'buy' ? tokenMint : WSOL,
    tokenAMint: st.tokenAMint,
    tokenBMint: st.tokenBMint,
    tokenAVault: st.tokenAVault,
    tokenBVault: st.tokenBVault,
    tokenAProgram: wsolIsB ? tokenProgram : TOKEN_PROGRAM_ID,
    tokenBProgram: wsolIsB ? TOKEN_PROGRAM_ID : tokenProgram,
    referralTokenAccount: null,
    amountIn: new BN(params.amountIn.toString()),
    minimumAmountOut: new BN(params.minOut.toString()),
    poolState: st,
  } as never);

  tx.instructions = [...pre, ...tx.instructions, ...post];
  tx.feePayer = params.wallet;
  tx.recentBlockhash = (await params.connection.getLatestBlockhash('confirmed')).blockhash;

  const signed = await params.signTransaction(tx);
  const sig = await params.connection.sendRawTransaction(signed.serialize(), { maxRetries: 3 });
  await confirmByPolling(params.connection, sig);
  return sig;
}

async function confirmByPolling(connection: Connection, signature: string) {
  for (let i = 0; i < 90; i++) {
    const status = (await connection.getSignatureStatus(signature, { searchTransactionHistory: true }))?.value;
    if (status?.err) throw new Error(`swap failed: ${JSON.stringify(status.err)} sig=${signature}`);
    if (status && (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized')) return;
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error(`not confirmed in time: ${signature}`);
}
