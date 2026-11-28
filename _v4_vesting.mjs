// Cliff / period boundary tests. OFFSET_DAYS sets dev_vest_start = now - OFFSET days.
// Usage: OFFSET_DAYS=180 node _v4_vesting.mjs   (RPC via RPC env, default 8982)
import fs from 'node:fs';
import crypto from 'node:crypto';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID, createInitializeTransferFeeConfigInstruction, createInitializeMintInstruction,
  createMintToInstruction, createAssociatedTokenAccountIdempotentInstruction, getAssociatedTokenAddressSync, getAccount,
} from '@solana/spl-token';

const OFFSET_DAYS = Number(process.env.OFFSET_DAYS || 480);
const RPC = process.env.RPC || 'http://127.0.0.1:8982';
const DIR = '/mnt/d/flpwe3/flp-treasury/.local-v4';
const conn = new Connection(RPC, 'confirmed');
const PROGRAM_ID = new PublicKey('3uvGiB1BshLcuLBtGk6bJceYGoYruPo3mxLs39tc4vGT');
const DAMM = new PublicKey('cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG');
const admin = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('/mnt/d/flpwe3/flp-curve-lab/keys/admin.json', 'utf8'))));

const DEV_TOTAL = BigInt(50_000_000) * BigInt(10) ** BigInt(9);
const MAX_FEE = 18446744073709551615n; // u64::MAX — no per-transfer cap
const MINT_FILE = `${DIR}/mint-${OFFSET_DAYS}.json`;

const disc = (n) => crypto.createHash('sha256').update(`global:${n}`).digest().subarray(0, 8);
const u64 = (v) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(v)); return b; };
const i64 = (v) => { const b = Buffer.alloc(8); b.writeBigInt64LE(BigInt(v)); return b; };
const pk = (k) => Buffer.from(k.toBuffer());
const pda = (s) => PublicKey.findProgramAddressSync(s, PROGRAM_ID)[0];
const config = pda([Buffer.from('config')]), stats = pda([Buffer.from('stats')]);
const dividendVault = pda([Buffer.from('dividend_vault')]), opsVault = pda([Buffer.from('ops_vault')]);
const liqVault = pda([Buffer.from('liq_vault')]), devVault = pda([Buffer.from('dev_vault')]), solBuffer = pda([Buffer.from('sol_buffer')]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function send(tx, signers, label) {
  const { blockhash } = await conn.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash; tx.feePayer = admin.publicKey;
  tx.sign(admin, ...signers);
  let sig;
  try { sig = await conn.sendRawTransaction(tx.serialize(), { maxRetries: 3 }); }
  catch (e) { return { err: (e.message || '').split('\n').find((l) => l.includes('Error Code')) || e.message }; }
  for (let i = 0; i < 120; i++) {
    const v = (await conn.getSignatureStatus(sig))?.value;
    if (v?.err) return { err: JSON.stringify(v.err), sig };
    if (v && (v.confirmationStatus === 'confirmed' || v.confirmationStatus === 'finalized')) { console.log(`  ${label} OK ${sig}`); return { sig }; }
    await sleep(400);
  }
  return { err: 'timeout' };
}
const bal = async (ata) => { try { return (await getAccount(conn, ata, 'confirmed', TOKEN_2022_PROGRAM_ID)).amount; } catch { return 0n; } };
const claimIx = (mint, devAta, benAta) => new TransactionInstruction({
  programId: PROGRAM_ID,
  keys: [
    { pubkey: config, isSigner: false, isWritable: true },
    { pubkey: mint, isSigner: false, isWritable: true },
    { pubkey: devVault, isSigner: false, isWritable: false },
    { pubkey: devAta, isSigner: false, isWritable: true },
    { pubkey: benAta, isSigner: false, isWritable: true },
    { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
  ], data: Buffer.from(disc('claim_dev_vested')),
});

(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const out = { offsetDays: OFFSET_DAYS, rpc: RPC, maxFee: MAX_FEE.toString() };
  const now = (await conn.getBlockTime(await conn.getSlot())) ?? Math.floor(Date.now() / 1000);
  const vestStart = now - OFFSET_DAYS * 86_400;
  out.vestStart = vestStart; out.now = now;

  let mintKp;
  if (fs.existsSync(MINT_FILE)) mintKp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(MINT_FILE, 'utf8'))));
  else { mintKp = Keypair.generate(); fs.writeFileSync(MINT_FILE, JSON.stringify(Array.from(mintKp.secretKey))); }
  const mint = mintKp.publicKey;
  out.mint = mint.toBase58();

  const devAta = getAssociatedTokenAddressSync(mint, devVault, true, TOKEN_2022_PROGRAM_ID);
  const benAta = getAssociatedTokenAddressSync(mint, admin.publicKey, false, TOKEN_2022_PROGRAM_ID);

  const rent = await conn.getMinimumBalanceForRentExemption(278);
  console.log(`\n[1] mint (start back-dated ${OFFSET_DAYS}d, maximumFee=u64::MAX)`);
  const r1 = await send(new Transaction().add(
    SystemProgram.createAccount({ fromPubkey: admin.publicKey, newAccountPubkey: mint, space: 278, lamports: rent, programId: TOKEN_2022_PROGRAM_ID }),
    createInitializeTransferFeeConfigInstruction(mint, config, config, 50, MAX_FEE, TOKEN_2022_PROGRAM_ID),
    createInitializeMintInstruction(mint, 9, admin.publicKey, null, TOKEN_2022_PROGRAM_ID),
  ), [mintKp], 'mint');
  if (r1.err) throw new Error('mint failed ' + r1.err);

  console.log('[2] initialize_config, dev_vest_start =', vestStart);
  const data = Buffer.concat([
    disc('initialize_config'), pk(mint), pk(admin.publicKey), pk(DAMM), pk(admin.publicKey),
    pk(admin.publicKey), i64(vestStart), u64(DEV_TOTAL), pk(admin.publicKey),
  ]);
  const r2 = await send(new Transaction().add(new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: admin.publicKey, isSigner: true, isWritable: true },
      { pubkey: config, isSigner: false, isWritable: true },
      { pubkey: stats, isSigner: false, isWritable: true },
      { pubkey: dividendVault, isSigner: false, isWritable: true },
      { pubkey: opsVault, isSigner: false, isWritable: true },
      { pubkey: liqVault, isSigner: false, isWritable: true },
      { pubkey: devVault, isSigner: false, isWritable: true },
      { pubkey: solBuffer, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ], data,
  })), [], 'initialize-config');
  if (r2.err) throw new Error('init config failed ' + r2.err);

  console.log('[3] mint_to dev_vault ATA (fee-free mint, full 50,000,000)');
  const r3 = await send(new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, devAta, devVault, mint, TOKEN_2022_PROGRAM_ID),
    createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, benAta, admin.publicKey, mint, TOKEN_2022_PROGRAM_ID),
    createMintToInstruction(mint, devAta, admin.publicKey, DEV_TOTAL, [], TOKEN_2022_PROGRAM_ID),
  ), [], 'fund-dev-vault');
  if (r3.err) throw new Error('fund failed ' + r3.err);
  out.devVaultBalance = (await bal(devAta)).toString();

  const CLIFF = 180 * 86_400, PERIOD = 30 * 86_400, RELEASES = 10;
  const elapsed = now - vestStart;
  const periods = elapsed < CLIFF ? 0 : Math.min(Math.floor((elapsed - CLIFF) / PERIOD), RELEASES);
  const expectedVested = (DEV_TOTAL * BigInt(periods)) / BigInt(RELEASES);
  out.elapsedDays = Math.round(elapsed / 86_400);
  out.expected = { periods, vested: expectedVested.toString() };

  console.log(`[4] claim_dev_vested (periods=${periods}, expect ${expectedVested})`);
  const benBefore = await bal(benAta);
  const r4 = await send(new Transaction().add(claimIx(mint, devAta, benAta)), [], 'claim');
  out.claim = { err: r4.err ?? null, sig: r4.sig ?? null };
  await sleep(800);
  const devAfter = await bal(devAta);
  const benDelta = (await bal(benAta)) - benBefore;
  out.claim.devVaultAfter = devAfter.toString();
  out.claim.beneficiaryDelta = benDelta.toString();
  out.claim.feeTaken = (expectedVested - benDelta).toString();

  console.log('[5] second claim (must be refused)');
  const r5 = await send(new Transaction().add(claimIx(mint, devAta, benAta)), [], 'claim-again');
  out.secondClaimErrs = r5.err ?? 'UNEXPECTEDLY PASSED';

  const checks = { vaultHoldsFullAllocation: out.devVaultBalance === DEV_TOTAL.toString() };
  if (periods === 0) {
    checks.refused = !!r4.err;
    checks.vaultUntouched = devAfter === DEV_TOTAL;
    checks.noTokensMoved = benDelta === 0n;
  } else {
    checks.claimedExact = devAfter === DEV_TOTAL - expectedVested;
    checks.landed = benDelta > 0n;
    checks.feeExactlyHalfPercent = expectedVested - benDelta === expectedVested / 200n;
    checks.secondClaimRefused = !!r5.err;
  }
  out.checks = checks;
  console.log('\n', JSON.stringify(out, null, 1));
  console.log('PASS:', Object.values(checks).every(Boolean));
  fs.writeFileSync(`${DIR}/vesting-${OFFSET_DAYS}d.json`, JSON.stringify(out, null, 2));
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
