// Round 2: cliff guard (t=0 must refuse) and the P0-5 ops exit.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';

const conn = new Connection('http://127.0.0.1:8962', 'confirmed');
const PROGRAM_ID = new PublicKey('3uvGiB1BshLcuLBtGk6bJceYGoYruPo3mxLs39tc4vGT');
const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('/mnt/d/flpwe3/flp-curve-lab/keys/admin.json', 'utf8'))));
const mint = new PublicKey(JSON.parse(fs.readFileSync('/mnt/d/flpwe3/flp-treasury/.local-v2/round1.json', 'utf8')).mints.fair);
const pda = (s) => PublicKey.findProgramAddressSync([Buffer.from(s)], PROGRAM_ID)[0];
const config = pda('config'), devVault = pda('dev_vault'), opsVault = pda('ops_vault');
const disc = (n) => crypto.createHash('sha256').update(`global:${n}`).digest().subarray(0, 8);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(tx, signers, label) {
  const { blockhash } = await conn.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash; tx.feePayer = payer.publicKey;
  tx.sign(payer, ...signers);
  let sig;
  try {
    sig = await conn.sendRawTransaction(tx.serialize(), { maxRetries: 3 });
  } catch (e) {
    // A rejection is a result here, not an exception: surface the program error text.
    const m = (e.message || '').split('\n').find((l) => l.includes('Error Code')) || e.message;
    return { sig: null, err: m.trim() };
  }
  for (let i = 0; i < 120; i++) {
    const v = (await conn.getSignatureStatus(sig))?.value;
    if (v?.err) return { sig, err: JSON.stringify(v.err) };
    if (v && (v.confirmationStatus === 'confirmed' || v.confirmationStatus === 'finalized')) return { sig, ok: true };
    await sleep(400);
  }
  return { sig, err: 'timeout' };
}

const RENT_MIN = 890_880;

(async () => {
  const out = {};
  const devAta = getAssociatedTokenAddressSync(mint, devVault, true, TOKEN_2022_PROGRAM_ID);
  const benAta = getAssociatedTokenAddressSync(mint, payer.publicKey, false, TOKEN_2022_PROGRAM_ID);

  // ---- 1. claim inside the 180-day cliff: must be rejected, nothing may move
  const before = (await conn.getTokenAccountBalance(devAta)).value.amount;
  const ix1 = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: config, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: devVault, isSigner: false, isWritable: false },
      { pubkey: devAta, isSigner: false, isWritable: true },
      { pubkey: benAta, isSigner: false, isWritable: true },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(disc('claim_dev_vested')),
  });
  const r1 = await run(new Transaction().add(ix1), [], 'claim@cliff');
  const after = (await conn.getTokenAccountBalance(devAta)).value.amount;
  out.cliffGuard = { rejected: !!r1.err, err: r1.err, before, after, unchanged: before === after };
  console.log('[1] claim inside cliff ->', r1.err ? `rejected ${r1.err}` : 'UNEXPECTEDLY PASSED');
  console.log('    dev_ata', before, '->', after);

  // ---- 2. fund ops_vault with 1 SOL, then drain it to ops_dest (= admin locally)
  const fund = new Transaction().add(SystemProgram.transfer({
    fromPubkey: payer.publicKey, toPubkey: opsVault, lamports: 1 * LAMPORTS_PER_SOL,
  }));
  const rf = await run(fund, [], 'fund-ops');
  if (rf.err) throw new Error('fund ops_vault failed ' + rf.err);
  const opsBefore = await conn.getBalance(opsVault);

  const ix2 = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: opsVault, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: false, isWritable: true },
    ],
    data: Buffer.from(disc('withdraw_ops')),
  });
  const destBefore = await conn.getBalance(payer.publicKey);
  const r2 = await run(new Transaction().add(ix2), [], 'withdraw-ops');
  const opsAfter = await conn.getBalance(opsVault);
  out.withdrawOps = {
    funded: opsBefore, after: opsAfter, sent: opsBefore - opsAfter,
    rentFloorHeld: opsAfter === RENT_MIN, sig: r2.sig, err: r2.err ?? null,
  };
  console.log('[2] ops_vault', opsBefore, '->', opsAfter, '| moved', opsBefore - opsAfter, '| keeps rent floor:', opsAfter === RENT_MIN);

  // ---- 3. second call with nothing above the floor: must refuse, not send a zero tx
  const r3 = await run(new Transaction().add(ix2), [], 'withdraw-ops-empty');
  out.withdrawOpsEmpty = { rejected: !!r3.err, err: r3.err };
  console.log('[3] withdraw again ->', r3.err ? `rejected ${r3.err}` : 'UNEXPECTEDLY PASSED');

  // ---- 4. a third party may call withdraw_ops but cannot redirect the money
  const stranger = Keypair.generate();
  const t = new Transaction().add(SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: stranger.publicKey, lamports: 50_000_000 }));
  const rt = await run(t, [], 'fund-stranger');
  if (rt.err) throw new Error('fund stranger failed ' + rt.err);
  const fund2 = new Transaction().add(SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: opsVault, lamports: 2 * LAMPORTS_PER_SOL }));
  const rf2 = await run(fund2, [], 'fund-ops2');
  if (rf2.err) throw new Error('fund ops_vault 2 failed ' + rf2.err);

  const ixEvil = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: opsVault, isSigner: false, isWritable: true },
      { pubkey: stranger.publicKey, isSigner: false, isWritable: true },
    ],
    data: Buffer.from(disc('withdraw_ops')),
  });
  const txEvil = new Transaction().add(ixEvil);
  txEvil.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
  txEvil.feePayer = stranger.publicKey;
  txEvil.sign(stranger);
  let evilErr = null;
  try {
    const sigEvil = await conn.sendRawTransaction(txEvil.serialize(), { maxRetries: 3 });
    for (let i = 0; i < 60; i++) {
      const v = (await conn.getSignatureStatus(sigEvil))?.value;
      if (v?.err) { evilErr = JSON.stringify(v.err); break; }
      if (v && (v.confirmationStatus === 'confirmed' || v.confirmationStatus === 'finalized')) break;
      await sleep(400);
    }
  } catch (e) {
    evilErr = (e.message || '').split('\n').find((l) => l.includes('Error Code')) || e.message;
  }
  out.hijackAttempt = { rejected: !!evilErr, err: evilErr, opsVaultBalance: await conn.getBalance(opsVault), strangerBalance: await conn.getBalance(stranger.publicKey) };
  console.log('[4] stranger calls with own dest ->', evilErr ? `rejected ${evilErr}` : 'UNEXPECTEDLY PASSED');

  fs.writeFileSync('/mnt/d/flpwe3/flp-treasury/.local-v2/round2.json', JSON.stringify(out, null, 2));
  console.log('\nall guards:', JSON.stringify({
    cliff: out.cliffGuard.rejected && out.cliffGuard.unchanged,
    opsDrained: out.withdrawOps.rentFloorHeld && !out.withdrawOps.err,
    opsIdempotentRejected: out.withdrawOpsEmpty.rejected,
    hijackRejected: out.hijackAttempt.rejected,
  }));
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
