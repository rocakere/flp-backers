// 端到端：用前端 launch.ts 的真实发币路径（非 DBC）建币，然后 settle，验证 85/10/5
import fs from 'fs';
import { createHash } from 'crypto';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync, getMint,
  createAssociatedTokenAccountInstruction, createTransferCheckedInstruction, createMintToInstruction,
} from '@solana/spl-token';
import { launchToken } from './lib/launch.ts';

const RPC = 'http://127.0.0.1:8942';
const PROGRAM_ID = '3uvGiB1BshLcuLBtGk6bJceYGoYruPo3mxLs39tc4vGT';
const admin = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('D:/flpwe3/flp-curve-lab/keys/admin.json', 'utf8'))));
const conn = new Connection(RPC, 'confirmed');
const disc = (n: string) => createHash('sha256').update('global:' + n).digest().subarray(0, 8);
const u64 = (n: bigint) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(n); return b; };

async function sendTx(ixs: any[], signers: Keypair[] = []) {
  const tx = new Transaction().add(...ixs);
  tx.feePayer = admin.publicKey;
  tx.recentBlockhash = (await conn.getLatestBlockhash('confirmed')).blockhash;
  tx.sign(admin, ...signers);
  const sig = await conn.sendRawTransaction(tx.serialize(), { skipPreflight: true, maxRetries: 3 });
  for (let i = 0; i < 80; i++) {
    const st = await conn.getSignatureStatus(sig, { searchTransactionHistory: true });
    if (st?.value?.err) throw new Error(`tx failed: ${JSON.stringify(st.value.err)} sig=${sig}`);
    if (st?.value && ['confirmed', 'finalized'].includes(st.value.confirmationStatus as string)) return sig;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('timeout ' + sig);
}

const amount = async (ata: PublicKey) => {
  const info = await conn.getAccountInfo(ata);
  return info ? BigInt((await conn.getTokenAccountBalance(ata)).value.amount) : 0n;
};

(async () => {
  const programId = new PublicKey(PROGRAM_ID);
  const [config] = PublicKey.findProgramAddressSync([Buffer.from('config')], programId);

  console.log('== step 1: 前端 launch.ts 发币（taxDest=0, 无 DBC）');
  const res = await launchToken(
    conn,
    admin.publicKey,
    async (tx) => { tx.partialSign(admin); return tx; },
    { name: 'E2E Fair', symbol: 'E2EF', uri: '', taxDest: 0, devBuySol: 0, programId: PROGRAM_ID, dbcConfig: '' },
  );
  console.log('   mint:', res.mint, 'tokenConfig:', res.tokenConfig);
  const mintKey = new PublicKey(res.mint);
  const tokenConfig = new PublicKey(res.tokenConfig);

  const mintData = Buffer.from((await conn.getAccountInfo(mintKey))!.data);
  // 在 TLV 扩展区里找 TransferFeeConfig（type=1, len=108），不依赖 spl-token 的解析器版本
  let tlv = -1;
  for (let o = 0; o + 4 <= mintData.length; o++) {
    if (mintData.readUInt16LE(o) === 1 && mintData.readUInt16LE(o + 2) === 108) { tlv = o; break; }
  }
  const feeAuth = tlv >= 0 ? new PublicKey(mintData.subarray(tlv + 4, tlv + 36)).toBase58() : '';
  const withdrawAuth = tlv >= 0 ? new PublicKey(mintData.subarray(tlv + 36, tlv + 68)).toBase58() : '';
  console.log('   transferFeeConfigAuthority:', feeAuth);
  console.log('   withdrawWithheldAuthority :', withdrawAuth);
  const authOk = withdrawAuth === config.toBase58();

  console.log('\n== step 2: 生产者卖出产生 1% withheld');
  const buyer = Keypair.generate();
  const creatorAta = getAssociatedTokenAddressSync(mintKey, admin.publicKey, true, TOKEN_2022_PROGRAM_ID);
  const buyerAta = getAssociatedTokenAddressSync(mintKey, buyer.publicKey, true, TOKEN_2022_PROGRAM_ID);
  await sendTx([
    createAssociatedTokenAccountInstruction(admin.publicKey, buyerAta, buyer.publicKey, mintKey, TOKEN_2022_PROGRAM_ID),
  ]);
  const transferSig = await sendTx([
    createTransferCheckedInstruction(creatorAta, mintKey, buyerAta, admin.publicKey, 100_000_000_000n, 9, [], TOKEN_2022_PROGRAM_ID),
  ]);
  console.log('   transfer:', transferSig);
  console.log('   buyer 到账:', (await amount(buyerAta)).toString(), '(99e9 = 1 枚被扣)');

  console.log('\n== step 3: settle_token_tax（85/10/5 三腿）');
  const [buybackOwner] = PublicKey.findProgramAddressSync([Buffer.from('buyback'), mintKey.toBuffer()], programId);
  const [liquidityOwner] = PublicKey.findProgramAddressSync([Buffer.from('liq'), mintKey.toBuffer()], programId);
  const feeAta = getAssociatedTokenAddressSync(mintKey, tokenConfig, true, TOKEN_2022_PROGRAM_ID);
  const buybackAta = getAssociatedTokenAddressSync(mintKey, buybackOwner, true, TOKEN_2022_PROGRAM_ID);
  const liquidityAta = getAssociatedTokenAddressSync(mintKey, liquidityOwner, true, TOKEN_2022_PROGRAM_ID);

  const before = { creator: await amount(creatorAta), fee: await amount(feeAta) };
  const sig = await sendTx([new TransactionInstruction({
    programId,
    keys: [
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: tokenConfig, isSigner: false, isWritable: true },
      { pubkey: mintKey, isSigner: false, isWritable: true },
      { pubkey: feeAta, isSigner: false, isWritable: true },
      { pubkey: creatorAta, isSigner: false, isWritable: true },
      { pubkey: buybackOwner, isSigner: false, isWritable: false },
      { pubkey: buybackAta, isSigner: false, isWritable: true },
      { pubkey: liquidityOwner, isSigner: false, isWritable: false },
      { pubkey: liquidityAta, isSigner: false, isWritable: true },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      // remaining_accounts: 1% 的 withheld 记在接收方账户上，所以源是 buyerAta
      { pubkey: buyerAta, isSigner: false, isWritable: true },
    ],
    data: disc('settle_token_tax'),
  })]);
  console.log('   settle:', sig);

  const after = {
    creator: await amount(creatorAta), fee: await amount(feeAta),
    buyback: await amount(buybackAta), liq: await amount(liquidityAta),
  };
  const cfg = (await conn.getAccountInfo(tokenConfig))!.data;
  const settled = Buffer.from(cfg.subarray(83, 91)).readBigUInt64LE();
  const toCreator = Buffer.from(cfg.subarray(91, 99)).readBigUInt64LE();
  const toBuyback = Buffer.from(cfg.subarray(99, 107)).readBigUInt64LE();
  const toLiq = Buffer.from(cfg.subarray(107, 115)).readBigUInt64LE();

  console.log('\n== 结果');
  console.log('   creator 增量:', (after.creator - before.creator).toString(), '(应 841_500_000)');
  console.log('   buyback 桶  :', after.buyback.toString(), '(应 99_000_000)');
  console.log('   liquidity 桶:', after.liq.toString(), '(应 49_500_000)');
  console.log('   fee_ata     :', after.fee.toString(), '(应 0)');
  console.log('   台账 settled/toCreator/toBuyback/toLiq:', settled, toCreator, toBuyback, toLiq);

  const checks = {
    withdrawAuthorityIsConfig: authOk,
    legsCorrect: (after.creator - before.creator) === 841_500_000n && after.buyback === 99_000_000n && after.liq === 49_500_000n && after.fee === 0n,
    ledgerCorrect: settled === 1_000_000_000n && toCreator === 850_000_000n && toBuyback === 100_000_000n && toLiq === 50_000_000n,
  };
  console.log('\nCHECKS:', JSON.stringify(checks));
  console.log('PASS:', Object.values(checks).every(Boolean));
  fs.writeFileSync('D:/flpwe3/mock-damm/_launch-e2e-result.json', JSON.stringify({
    mint: res.mint,
    tokenConfig: res.tokenConfig,
    settleSig: sig,
    checks,
    creatorDelta: (after.creator - before.creator).toString(),
    buyback: after.buyback.toString(),
    liquidity: after.liq.toString(),
    feeAta: after.fee.toString(),
    ledger: { settled: settled.toString(), toCreator: toCreator.toString(), toBuyback: toBuyback.toString(), toLiq: toLiq.toString() },
  }, null, 2));
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
