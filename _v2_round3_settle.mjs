// Round 3: 0.5% tax, three-leg settle (85 / 10 / 5) on the FAIR mint itself,
// plus a deliberate capture of the maximumFee cap.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction, createTransferCheckedInstruction, getAccount,
} from '@solana/spl-token';

const RPC = 'http://127.0.0.1:8962';
const conn = new Connection(RPC, 'confirmed');
const PROGRAM_ID = new PublicKey('3uvGiB1BshLcuLBtGk6bJceYGoYruPo3mxLs39tc4vGT');
const admin = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('/mnt/d/flpwe3/flp-curve-lab/keys/admin.json', 'utf8'))));
const round1 = JSON.parse(fs.readFileSync('/mnt/d/flpwe3/flp-treasury/.local-v2/round1.json', 'utf8'));
const mint = new PublicKey(round1.mints.fair);
const FEE_BPS = 50n;

const disc = (n) => crypto.createHash('sha256').update(`global:${n}`).digest().subarray(0, 8);
const u64 = (v) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(v)); return b; };
const pda = (seeds) => PublicKey.findProgramAddressSync(seeds, PROGRAM_ID)[0];
const config = pda([Buffer.from('config')]);
const tokenConfig = pda([Buffer.from('token_cfg'), mint.toBuffer()]);
const buybackOwner = pda([Buffer.from('buyback'), mint.toBuffer()]);
const liqOwner = pda([Buffer.from('liq'), mint.toBuffer()]);
const creatorAta = getAssociatedTokenAddressSync(mint, admin.publicKey, false, TOKEN_2022_PROGRAM_ID);
const feeAta = getAssociatedTokenAddressSync(mint, tokenConfig, true, TOKEN_2022_PROGRAM_ID);
const buybackAta = getAssociatedTokenAddressSync(mint, buybackOwner, true, TOKEN_2022_PROGRAM_ID);
const liqAta = getAssociatedTokenAddressSync(mint, liqOwner, true, TOKEN_2022_PROGRAM_ID);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function send(tx, signers, label) {
  const { blockhash } = await conn.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash; tx.feePayer = admin.publicKey;
  tx.sign(admin, ...signers);
  let sig;
  try { sig = await conn.sendRawTransaction(tx.serialize(), { maxRetries: 3 }); }
  catch (e) { throw new Error(`${label}: ${(e.message || '').split('\n').find((l) => l.includes('Error Code')) || e.message}`); }
  for (let i = 0; i < 120; i++) {
    const v = (await conn.getSignatureStatus(sig))?.value;
    if (v?.err) throw new Error(`${label} failed ${sig}: ${JSON.stringify(v.err)}`);
    if (v && (v.confirmationStatus === 'confirmed' || v.confirmationStatus === 'finalized')) { console.log(`  ${label} OK ${sig}`); return sig; }
    await sleep(400);
  }
  throw new Error(`${label} timeout`);
}
const bal = async (ata) => { try { return (await getAccount(conn, ata, 'confirmed', TOKEN_2022_PROGRAM_ID)).amount; } catch { return 0n; } };
const floorFee = (x) => (x * FEE_BPS) / 10000n;

(async () => {
  const out = { mint: mint.toBase58(), tokenConfig: tokenConfig.toBase58(), feeBps: Number(FEE_BPS) };
  const buyer = Keypair.generate();
  const buyerAta = getAssociatedTokenAddressSync(mint, buyer.publicKey, false, TOKEN_2022_PROGRAM_ID);

  // --- 1. init_token_config(tax_dest=0, fee_bps=50, max_fee=1e12)
  if (!(await conn.getAccountInfo(tokenConfig))) {
    const data = Buffer.concat([disc('init_token_config'), Buffer.from([0]), Buffer.alloc(2), Buffer.alloc(8)]);
    data.writeUInt16LE(Number(FEE_BPS), 9);
    data.writeBigUInt64LE(BigInt('1000000000000'), 11);
    const ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: admin.publicKey, isSigner: true, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: admin.publicKey, isSigner: true, isWritable: false },
        { pubkey: tokenConfig, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });
    console.log('\n[1] init_token_config (fee_bps=50)');
    await send(new Transaction().add(ix), [], 'init-token-config');
  } else {
    console.log('\n[1] token_config exists');
  }

  // --- 2. ATAs for the four buckets
  console.log('[2] bucket ATAs');
  const ataTx = new Transaction();
  for (const [ata, owner] of [
    [buyerAta, buyer.publicKey], [feeAta, tokenConfig], [buybackAta, buybackOwner], [liqAta, liqOwner],
  ]) ataTx.add(createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, ata, owner, mint, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID));
  await send(ataTx, [], 'create-atas');

  // --- 3. transfer 100,000 tokens: 0.5% = 500 tokens = 5e11 raw, under the 1e12 cap
  const transferAmt = 100_000n * 10n ** 9n;
  const beforeCreator = await bal(creatorAta);
  console.log('[3] transfer 100,000 FAIR (0.5% withheld, below cap)');
  await send(new Transaction().add(
    createTransferCheckedInstruction(creatorAta, mint, buyerAta, admin.publicKey, transferAmt, 9, [], TOKEN_2022_PROGRAM_ID),
  ), [], 'transfer');
  const buyerBal = await bal(buyerAta);
  const withheld = transferAmt - buyerBal;
  out.transfer = { sent: transferAmt.toString(), received: buyerBal.toString(), withheld: withheld.toString(), expectedFee: floorFee(transferAmt).toString() };

  // --- 4. settle_token_tax, remaining = [buyerAta]
  const b4 = { creator: await bal(creatorAta), fee: await bal(feeAta), buyback: await bal(buybackAta), liq: await bal(liqAta) };
  console.log('[4] settle_token_tax');
  const settleIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: tokenConfig, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: feeAta, isSigner: false, isWritable: true },
      { pubkey: creatorAta, isSigner: false, isWritable: true },
      { pubkey: buybackOwner, isSigner: false, isWritable: false },
      { pubkey: buybackAta, isSigner: false, isWritable: true },
      { pubkey: liqOwner, isSigner: false, isWritable: false },
      { pubkey: liqAta, isSigner: false, isWritable: true },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: buyerAta, isSigner: false, isWritable: true },
    ],
    data: Buffer.from(disc('settle_token_tax')),
  });
  out.settleSig = await send(new Transaction().add(settleIx), [], 'settle');
  await sleep(800);

  const a4 = { creator: await bal(creatorAta), fee: await bal(feeAta), buyback: await bal(buybackAta), liq: await bal(liqAta) };
  const residualBuyer = await bal(buyerAta);
  const raw = (await conn.getAccountInfo(tokenConfig)).data;
  const tc = {
    settled: raw.readBigUInt64LE(83), toCreator: raw.readBigUInt64LE(91),
    toBuyback: raw.readBigUInt64LE(99), toLiquidity: raw.readBigUInt64LE(107),
  };
  const dCreator = a4.creator - b4.creator, dBuyback = a4.buyback - b4.buyback, dLiq = a4.liq - b4.liq;
  const near = (a, b, tol = 2n) => (a > b ? a - b : b - a) <= tol;
  out.settle = {
    feeAfter: a4.fee.toString(),
    creatorDelta: dCreator.toString(), buybackDelta: dBuyback.toString(), liqDelta: dLiq.toString(),
    bookkeeping: { settled: tc.settled.toString(), toCreator: tc.toCreator.toString(), toBuyback: tc.toBuyback.toString(), toLiquidity: tc.toLiquidity.toString() },
    buyerResidual: residualBuyer.toString(),
  };
  const checks = {
    feeEmpty: a4.fee === 0n,
    // bookkeeping legs are gross-withheld based, 85/10/5
    book85: near(tc.toCreator, (tc.settled * 85n) / 100n),
    book10: near(tc.toBuyback, (tc.settled * 10n) / 100n),
    book5: near(tc.toLiquidity, (tc.settled * 5n) / 100n),
    // actual arrival is one more 0.5% hair cut on each leg
    creatorArrived: near(dCreator, tc.toCreator - floorFee(tc.toCreator)),
    buybackArrived: near(dBuyback, tc.toBuyback - floorFee(tc.toBuyback)),
    liqArrived: near(dLiq, tc.toLiquidity - floorFee(tc.toLiquidity)),
  };
  console.log('  legs:', JSON.stringify(out.settle, null, 1));

  // --- 5. prove the maximumFee cap bites: 10,000,000 tokens would owe 50,000, capped at 1,000
  const bigAmt = 10_000_000n * 10n ** 9n;
  console.log('[5] transfer 10,000,000 FAIR (0.5% would be 50,000, cap = 1,000)');
  await send(new Transaction().add(
    createTransferCheckedInstruction(creatorAta, mint, buyerAta, admin.publicKey, bigAmt, 9, [], TOKEN_2022_PROGRAM_ID),
  ), [], 'big-transfer');
  const buyerAfterBig = await bal(buyerAta);
  const receivedBig = buyerAfterBig - residualBuyer;
  const bigWithheld = bigAmt - receivedBig;
  out.capProbe = {
    sent: bigAmt.toString(), received: receivedBig.toString(),
    withheld: bigWithheld.toString(),
    nominalFee: floorFee(bigAmt).toString(), cappedAt: '1000000000000',
    capActive: bigWithheld === 1_000_000_000_000n,
  };
  console.log('  cap probe:', JSON.stringify(out.capProbe));

  out.checks = { ...checks, capActive: out.capProbe.capActive };
  console.log('\nCHECKS:', JSON.stringify(out.checks, null, 1));
  console.log('PASS:', Object.values(out.checks).every(Boolean));
  fs.writeFileSync('/mnt/d/flpwe3/flp-treasury/.local-v2/round3.json', JSON.stringify(out, null, 2));
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
