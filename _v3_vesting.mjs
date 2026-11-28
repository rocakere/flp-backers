// Vesting time-travel: dev_vest_start is set to "now - OFFSET days" at init, which is the
// only way to exercise the schedule locally (a validator cannot warp the Clock sysvar).
// Usage: OFFSET_DAYS=450 node _v3_vesting.mjs
import fs from 'node:fs';
import crypto from 'node:crypto';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID, createInitializeTransferFeeConfigInstruction, createInitializeMintInstruction,
  createMintToInstruction, createAssociatedTokenAccountIdempotentInstruction, getAssociatedTokenAddressSync, getAccount,
} from '@solana/spl-token';

const OFFSET_DAYS = Number(process.env.OFFSET_DAYS || 450);
const RPC = 'http://127.0.0.1:8972';
const conn = new Connection(RPC, 'confirmed');
const PROGRAM_ID = new PublicKey('3uvGiB1BshLcuLBtGk6bJceYGoYruPo3mxLs39tc4vGT');
const DAMM = new PublicKey('cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG');
const admin = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('/mnt/d/flpwe3/flp-curve-lab/keys/admin.json', 'utf8'))));

const DEV_TOTAL = BigInt(50_000_000) * BigInt(10) ** BigInt(9);
const MINT_FILE = `/mnt/d/flpwe3/flp-treasury/.local-v3/mint-${OFFSET_DAYS}.json`;

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

(async () => {
  const out = { offsetDays: OFFSET_DAYS, total: DEV_TOTAL.toString() };
  const now = (await conn.getBlockTime(await conn.getSlot())) ?? Math.floor(Date.now() / 1000);
  const vestStart = now - OFFSET_DAYS * 86_400;
  out.vestStart = vestStart; out.now = now;

  let mintKp;
  if (fs.existsSync(MINT_FILE)) mintKp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(MINT_FILE, 'utf8'))));
  else { mintKp = Keypair.generate(); fs.mkdirSync('/mnt/d/flpwe3/flp-treasury/.local-v3', { recursive: true }); fs.writeFileSync(MINT_FILE, JSON.stringify(Array.from(mintKp.secretKey))); }
  const mint = mintKp.publicKey;
  out.mint = mint.toBase58();

  const devAta = getAssociatedTokenAddressSync(mint, devVault, true, TOKEN_2022_PROGRAM_ID);
  const benAta = getAssociatedTokenAddressSync(mint, admin.publicKey, false, TOKEN_2022_PROGRAM_ID);

  // mint
  const rent = await conn.getMinimumBalanceForRentExemption(278);
  if (!(await conn.getAccountInfo(mint))) {
    console.log(`\n[1] mint (${OFFSET_DAYS}d back-dated start)`);
    const r = await send(new Transaction().add(
      SystemProgram.createAccount({ fromPubkey: admin.publicKey, newAccountPubkey: mint, space: 278, lamports: rent, programId: TOKEN_2022_PROGRAM_ID }),
      createInitializeTransferFeeConfigInstruction(mint, config, config, 50, BigInt(10) ** BigInt(12), TOKEN_2022_PROGRAM_ID),
      createInitializeMintInstruction(mint, 9, admin.publicKey, null, TOKEN_2022_PROGRAM_ID),
    ), [mintKp], 'mint');
    if (r.err) throw new Error('mint failed ' + r.err);
  }

  // init config
  if (!(await conn.getAccountInfo(config))) {
    console.log('[2] initialize_config, dev_vest_start =', vestStart, `(${OFFSET_DAYS} days ago)`);
    const data = Buffer.concat([
      disc('initialize_config'), pk(mint), pk(admin.publicKey), pk(DAMM), pk(admin.publicKey),
      pk(admin.publicKey), i64(vestStart), u64(DEV_TOTAL), pk(admin.publicKey),
    ]);
    const r = await send(new Transaction().add(new TransactionInstruction({
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
    if (r.err) throw new Error('init config failed ' + r.err);
  }

  // fund dev_vault via mint_to (no transfer fee, so the vault holds the full 50,000,000)
  console.log('[3] mint_to dev_vault ATA (fee-free mint, full allocation)');
  const r3 = await send(new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, devAta, devVault, mint, TOKEN_2022_PROGRAM_ID),
    createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, benAta, admin.publicKey, mint, TOKEN_2022_PROGRAM_ID),
    createMintToInstruction(mint, devAta, admin.publicKey, DEV_TOTAL, [], TOKEN_2022_PROGRAM_ID),
  ), [], 'fund-dev-vault');
  if (r3.err) throw new Error('fund failed ' + r3.err);
  out.devVaultBalance = (await bal(devAta)).toString();

  // expected schedule from the constant, computed here first so the on-chain result can differ
  const CLIFF = 180 * 86_400, PERIOD = 30 * 86_400, RELEASES = 10;
  const elapsed = now - vestStart;
  const periods = elapsed < CLIFF ? 0 : Math.min(Math.floor((elapsed - CLIFF) / PERIOD), RELEASES);
  const expectedVested = (DEV_TOTAL * BigInt(periods)) / BigInt(RELEASES);
  out.expected = { periods, vested: expectedVested.toString() };

  // claim
  console.log(`[4] claim_dev_vested (periods=${periods}, expect ${expectedVested})`);
  const benBefore = await bal(benAta);
  const r4 = await send(new Transaction().add(new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: config, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: devVault, isSigner: false, isWritable: false },
      { pubkey: devAta, isSigner: false, isWritable: true },
      { pubkey: benAta, isSigner: false, isWritable: true },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    ], data: Buffer.from(disc('claim_dev_vested')),
  })), [], 'claim');
  out.claim = { err: r4.err ?? null, sig: r4.sig ?? null };
  await sleep(800);
  const devAfter = await bal(devAta);
  const benDelta = (await bal(benAta)) - benBefore;
  out.claim.devVaultAfter = devAfter.toString();
  out.claim.beneficiaryDelta = benDelta.toString();
  out.claim.feeTaken = (expectedVested - benDelta).toString();

  // second claim: nothing new vested, must be refused
  const r5 = await send(new Transaction().add(new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: config, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: devVault, isSigner: false, isWritable: false },
      { pubkey: devAta, isSigner: false, isWritable: true },
      { pubkey: benAta, isSigner: false, isWritable: true },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    ], data: Buffer.from(disc('claim_dev_vested')),
  })), [], 'claim-again');
  out.secondClaimErrs = r5.err ?? 'UNEXPECTEDLY PASSED';

  const checks = { vaultFull: out.devVaultBalance === DEV_TOTAL.toString() };
  if (periods === 0) {
    // inside the cliff: the release must be refused and the vault must not move
    checks.refused = !!r4.err;
    checks.vaultUntouched = devAfter === DEV_TOTAL;
    checks.noTokensMoved = benDelta === 0n;
  } else {
    checks.claimedExact = devAfter === DEV_TOTAL - expectedVested;
    checks.landed = benDelta > 0n;
    checks.secondClaimRefused = !!r5.err;
  }
  out.checks = checks;
  console.log('\n', JSON.stringify(out, null, 1));
  console.log('PASS:', Object.values(checks).every(Boolean));
  fs.writeFileSync(`/mnt/d/flpwe3/flp-treasury/.local-v3/vesting-${OFFSET_DAYS}d.json`, JSON.stringify(out, null, 2));
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
