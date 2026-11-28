// v5 core regression after the patch:
//   1) settle_token_tax → 85 / 10 / 5 legs (0.5% withheld correctly)
//   2) set_token_pool guards (distributor only, DAMM owner only)
//   3) withdraw_ops → pinned ops_dest, rent kept
import fs from 'node:fs';
import crypto from 'node:crypto';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType, getMintLen,
  createInitializeMintInstruction, createInitializeTransferFeeConfigInstruction,
  createMintToInstruction, createTransferCheckedInstruction,
  createAssociatedTokenAccountIdempotentInstruction, getAssociatedTokenAddressSync, getAccount,
} from '@solana/spl-token';

const RPC = process.env.RPC || 'http://127.0.0.1:8992';
const DIR = '/mnt/d/flpwe3/flp-treasury/.local-v5';
const conn = new Connection(RPC, 'confirmed');
const PROGRAM_ID = new PublicKey('3uvGiB1BshLcuLBtGk6bJceYGoYruPo3mxLs39tc4vGT');
const DAMM = new PublicKey('cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG');
const T22 = TOKEN_2022_PROGRAM_ID;
const admin = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('/mnt/d/flpwe3/flp-curve-lab/keys/admin.json', 'utf8'))));

const disc = (n) => crypto.createHash('sha256').update(`global:${n}`).digest().subarray(0, 8);
const u16 = (v) => { const b = Buffer.alloc(2); b.writeUInt16LE(v); return b; };
const u64 = (v) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(v)); return b; };
const pda = (s) => PublicKey.findProgramAddressSync(s, PROGRAM_ID)[0];
const config = pda([Buffer.from('config')]);
const tokenCfg = (m) => PublicKey.findProgramAddressSync([Buffer.from('token_cfg'), m.toBuffer()], PROGRAM_ID)[0];
const buybackOwner = (m) => PublicKey.findProgramAddressSync([Buffer.from('buyback'), m.toBuffer()], PROGRAM_ID)[0];
const liqOwner = (m) => PublicKey.findProgramAddressSync([Buffer.from('liq'), m.toBuffer()], PROGRAM_ID)[0];
const opsVault = pda([Buffer.from('ops_vault')]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function send(tx, signers, label, feePayer = admin.publicKey) {
  const { blockhash } = await conn.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash; tx.feePayer = feePayer;
  if (feePayer.equals(admin.publicKey)) tx.sign(admin, ...signers);
  else { tx.sign(...signers); }
  let sig;
  try { sig = await conn.sendRawTransaction(tx.serialize(), { skipPreflight: false, maxRetries: 3 }); }
  catch (e) {
    const m = (e.message || '');
    return { err: m.split('\n').find((l) => l.includes('Error Code')) || m };
  }
  for (let i = 0; i < 100; i++) {
    const v = (await conn.getSignatureStatus(sig))?.value;
    if (v?.err) return { err: JSON.stringify(v.err), sig };
    if (v && (v.confirmationStatus === 'confirmed' || v.confirmationStatus === 'finalized')) { console.log(`  ${label} OK ${sig}`); return { sig }; }
    await sleep(400);
  }
  return { err: 'timeout', sig };
}
const bal = async (a) => { try { return (await getAccount(conn, a, 'confirmed', T22)).amount; } catch { return 0n; } };
const sol = async (a) => (await conn.getBalance(a));

(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const out = { rpc: RPC };
  const cfgInfo = await conn.getAccountInfo(config);
  if (!cfgInfo) throw new Error('config missing — run _v5_poc_bootstrap.sh first');
  const d = Buffer.from(cfgInfo.data);
  const fairMint = new PublicKey(d.subarray(8, 40));
  out.config = config.toBase58();
  out.fairMint = fairMint.toBase58();
  console.log('config ok, fair mint', fairMint.toBase58());

  // ---------------- 1. settle_token_tax → 85 / 10 / 5 ----------------
  const mintKp = Keypair.generate();
  const mint = mintKp.publicKey;
  const holder = Keypair.generate();
  const other = Keypair.generate();
  const tc = tokenCfg(mint);
  const buybackPda = buybackOwner(mint);
  const liqPda = liqOwner(mint);
  const feeAta = getAssociatedTokenAddressSync(mint, tc, true, T22);
  const creatorAta = getAssociatedTokenAddressSync(mint, admin.publicKey, false, T22);
  const buybackAta = getAssociatedTokenAddressSync(mint, buybackPda, true, T22);
  const liqAta = getAssociatedTokenAddressSync(mint, liqPda, true, T22);
  const holderAta = getAssociatedTokenAddressSync(mint, holder.publicKey, false, T22);
  const otherAta = getAssociatedTokenAddressSync(mint, other.publicKey, false, T22);

  const rent = await conn.getMinimumBalanceForRentExemption(getMintLen([ExtensionType.TransferFeeConfig]));
  // signers must exist on chain before they can appear in a transaction
  for (const kp of [holder, other]) {
    const a = await conn.requestAirdrop(kp.publicKey, 500_000_000);
    for (let i = 0; i < 40; i++) { if ((await conn.getSignatureStatus(a))?.value) break; await sleep(400); }
  }
  console.log('\n[1] create token mint (0.5% fee, maxFee = u64::MAX)');
  const r1 = await send(new Transaction().add(
    SystemProgram.createAccount({ fromPubkey: admin.publicKey, newAccountPubkey: mint, space: getMintLen([ExtensionType.TransferFeeConfig]), lamports: rent, programId: T22 }),
    createInitializeTransferFeeConfigInstruction(mint, config, config, 50, 18446744073709551615n, T22),
    createInitializeMintInstruction(mint, 9, admin.publicKey, null, T22),
    createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, holderAta, holder.publicKey, mint, T22),
    createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, otherAta, other.publicKey, mint, T22),
    createMintToInstruction(mint, holderAta, admin.publicKey, 1000n * 10n ** 9n, [], T22),
  ), [mintKp], 'mint+tokens');
  if (r1.err) throw new Error('mint failed ' + r1.err);

  console.log('[2] init_token_config (tax_dest = 0, creator = admin)');
  const initIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: admin.publicKey, isSigner: true, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: admin.publicKey, isSigner: false, isWritable: false },
      { pubkey: tc, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([disc('init_token_config'), Buffer.from([0]), u16(50), u64(18446744073709551615n)]),
  });
  const r3 = await send(new Transaction().add(
    initIx,
    createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, feeAta, tc, mint, T22),
    createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, creatorAta, admin.publicKey, mint, T22),
    createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, buybackAta, buybackPda, mint, T22),
    createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, liqAta, liqPda, mint, T22),
  ), [], 'init+atas');
  if (r3.err) throw new Error('init_token_config failed ' + r3.err);

  // Fund the tax pool directly (the withheld-extraction path was already proven on v2);
  // this regression is about the 85 / 10 / 5 split itself.
  console.log('[3] mint 1.0 token straight into the tax ATA');
  const r3b = await send(new Transaction().add(
    createMintToInstruction(mint, feeAta, admin.publicKey, 1_000_000_000n, [], T22),
  ), [], 'fund-tax-ata');
  if (r3b.err) throw new Error('fund fee ata failed ' + r3b.err);

  console.log('[4] settle_token_tax');
  const settleIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: tc, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: feeAta, isSigner: false, isWritable: true },
      { pubkey: creatorAta, isSigner: false, isWritable: true },
      { pubkey: buybackPda, isSigner: false, isWritable: false },
      { pubkey: buybackAta, isSigner: false, isWritable: true },
      { pubkey: liqPda, isSigner: false, isWritable: false },
      { pubkey: liqAta, isSigner: false, isWritable: true },
      { pubkey: T22, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(disc('settle_token_tax')),
  });
  const r4 = await send(new Transaction().add(settleIx), [], 'settle');
  if (r4.err) throw new Error('settle failed ' + r4.err);

  const feeBal = await bal(feeAta), cBal = await bal(creatorAta), bBal = await bal(buybackAta), lBal = await bal(liqAta);
  const total = cBal + bBal + lBal;
  out.settle = {
    feePoolLeft: feeBal.toString(),
    creator: cBal.toString(), buyback: bBal.toString(), liquidity: lBal.toString(),
    totalLanded: total.toString(),
    creatorPct: Number(cBal * 10000n / total) / 100,
    buybackPct: Number(bBal * 10000n / total) / 100,
    liquidityPct: Number(lBal * 10000n / total) / 100,
  };
  // 85 / 10 / 5 of the 0.5 token fee = 0.425 / 0.05 / 0.025, each leg then pays its own 0.5%
  const checks1 = {
    correct85: cBal === 845_750_000n,
    correct10: bBal === 99_500_000n,
    correct5: lBal === 49_750_000n,
    ratioHolds: Math.abs(out.settle.creatorPct - 85) < 0.5 && Math.abs(out.settle.buybackPct - 10) < 0.5,
  };
  out.checks1 = checks1;
  console.log('  legs:', JSON.stringify(out.settle));

  // ---------------- 2. set_token_pool guards ----------------
  console.log('\n[5] set_token_pool guards');
  const outsider = Keypair.generate();
  const air = await conn.requestAirdrop(outsider.publicKey, 1_000_000_000);
  for (let i = 0; i < 40; i++) { const v = (await conn.getSignatureStatus(air))?.value; if (v) break; await sleep(500); }
  const setPoolIx = (authority, pool) => new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: tc, isSigner: false, isWritable: true },
      { pubkey: pool, isSigner: false, isWritable: false },
      { pubkey: DAMM, isSigner: false, isWritable: false },
      { pubkey: authority, isSigner: true, isWritable: true },
    ],
    data: Buffer.from(disc('set_token_pool')),
  });
  const g1 = await send(new Transaction().add(setPoolIx(outsider.publicKey, DAMM)), [outsider], 'outsider-set', outsider.publicKey);
  out.guardOutsider = g1.err ? (g1.err.includes('Unauthorized') ? 'REJECTED (Unauthorized)' : g1.err) : 'UNEXPECTEDLY PASSED';
  const g2 = await send(new Transaction().add(setPoolIx(admin.publicKey, SystemProgram.programId)), [], 'admin-wrong-owner');
  out.guardWrongOwner = g2.err ? (g2.err.includes('BadConfig') ? 'REJECTED (BadConfig)' : g2.err) : 'UNEXPECTEDLY PASSED';
  console.log('  outsider:', out.guardOutsider);
  console.log('  wrong-owner:', out.guardWrongOwner);

  // ---------------- 3. withdraw_ops ----------------
  console.log('\n[6] withdraw_ops → pinned ops_dest');
  const fund = await send(new Transaction().add(
    SystemProgram.transfer({ fromPubkey: admin.publicKey, toPubkey: opsVault, lamports: 1_000_000_000 }),
  ), [], 'fund-ops-vault');
  if (fund.err) throw new Error('fund ops vault failed ' + fund.err);
  const opsDestBefore = await sol(admin.publicKey);
  const wIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: opsVault, isSigner: false, isWritable: true },
      { pubkey: admin.publicKey, isSigner: false, isWritable: true },
    ],
    data: Buffer.from(disc('withdraw_ops')),
  });
  const r6 = await send(new Transaction().add(wIx), [], 'withdraw-ops');
  if (r6.err) throw new Error('withdraw_ops failed ' + r6.err);
  const vaultAfter = await sol(opsVault);
  out.withdrawOps = { vaultAfter: vaultAfter.toString(), rentFloor: '890880' };
  const checks3 = { rentKept: Number(vaultAfter) === 890_880 };
  out.checks3 = checks3;

  const allPass = Object.values(checks1).every(Boolean) && checks3.rentKept
    && out.guardOutsider.startsWith('REJECTED') && out.guardWrongOwner.startsWith('REJECTED');
  out.PASS = allPass;
  console.log('\n', JSON.stringify(out, null, 1));
  console.log('PASS:', allPass);
  fs.writeFileSync(`${DIR}/regress-core.json`, JSON.stringify(out, null, 2));
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
