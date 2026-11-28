// Round 4: prove there is no per-transfer ceiling any more.
// A mint built exactly the way lib/launch.ts now builds it (maximumFee = u64::MAX,
// 50 bps) must withhold the full 0.5% even on a 10,000,000-token transfer — the old
// 1e12 cap would have withheld 1,000 tokens instead of 50,000.
import fs from 'node:fs';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID, createInitializeTransferFeeConfigInstruction, createInitializeMintInstruction,
  createMintToInstruction, createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction, getAssociatedTokenAddressSync, getAccount,
} from '@solana/spl-token';

const conn = new Connection('http://127.0.0.1:8962', 'confirmed');
const PROGRAM = new PublicKey('3uvGiB1BshLcuLBtGk6bJceYGoYruPo3mxLs39tc4vGT');
const config = PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM)[0];
const admin = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('/mnt/d/flpwe3/flp-curve-lab/keys/admin.json', 'utf8'))));
const KP = '/mnt/d/flpwe3/flp-treasury/.local-v2/mint-nocap.json';
const MAX_FEE = 18446744073709551615n; // u64::MAX — same constant as lib/launch.ts
const BPS = 50n;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function send(tx, signers, label) {
  const { blockhash } = await conn.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash; tx.feePayer = admin.publicKey;
  tx.sign(admin, ...signers);
  const sig = await conn.sendRawTransaction(tx.serialize(), { maxRetries: 3 });
  for (let i = 0; i < 120; i++) {
    const v = (await conn.getSignatureStatus(sig))?.value;
    if (v?.err) throw new Error(`${label} ${JSON.stringify(v.err)}`);
    if (v && (v.confirmationStatus === 'confirmed' || v.confirmationStatus === 'finalized')) { console.log(`  ${label} OK ${sig}`); return sig; }
    await sleep(400);
  }
  throw new Error(`${label} timeout`);
}
const bal = async (ata) => { try { return (await getAccount(conn, ata, 'confirmed', TOKEN_2022_PROGRAM_ID)).amount; } catch { return 0n; } };

(async () => {
  let kp;
  if (fs.existsSync(KP)) kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(KP, 'utf8'))));
  else { kp = Keypair.generate(); fs.writeFileSync(KP, JSON.stringify(Array.from(kp.secretKey))); }
  const mint = kp.publicKey;
  const buyer = Keypair.generate();
  const creatorAta = getAssociatedTokenAddressSync(mint, admin.publicKey, false, TOKEN_2022_PROGRAM_ID);
  const buyerAta = getAssociatedTokenAddressSync(mint, buyer.publicKey, false, TOKEN_2022_PROGRAM_ID);

  if (!(await conn.getAccountInfo(mint))) {
    const rent = await conn.getMinimumBalanceForRentExemption(278);
    console.log('\n[1] mint with maximumFee = u64::MAX, 50 bps');
    await send(new Transaction().add(
      SystemProgram.createAccount({ fromPubkey: admin.publicKey, newAccountPubkey: mint, space: 278, lamports: rent, programId: TOKEN_2022_PROGRAM_ID }),
      createInitializeTransferFeeConfigInstruction(mint, config, config, Number(BPS), MAX_FEE, TOKEN_2022_PROGRAM_ID),
      createInitializeMintInstruction(mint, 9, admin.publicKey, null, TOKEN_2022_PROGRAM_ID),
    ), [kp], 'mint');
  }

  console.log('[2] mint 100,000,000 to creator, then transfer 10,000,000');
  await send(new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, creatorAta, admin.publicKey, mint, TOKEN_2022_PROGRAM_ID),
    createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, buyerAta, buyer.publicKey, mint, TOKEN_2022_PROGRAM_ID),
    createMintToInstruction(mint, creatorAta, admin.publicKey, 100_000_000n * 10n ** 9n, [], TOKEN_2022_PROGRAM_ID),
  ), [], 'fund');

  const sent = 10_000_000n * 10n ** 9n;
  const before = await bal(buyerAta);
  await send(new Transaction().add(
    createTransferCheckedInstruction(creatorAta, mint, buyerAta, admin.publicKey, sent, 9, [], TOKEN_2022_PROGRAM_ID),
  ), [], 'transfer-10m');

  const got = (await bal(buyerAta)) - before;
  const withheld = sent - got;
  const expected = (sent * BPS) / 10000n;
  const oldCap = 1_000_000_000_000n;

  const out = {
    mint: mint.toBase58(), sent: sent.toString(), received: got.toString(),
    withheld: withheld.toString(), expected: expected.toString(),
    oldCapWouldHaveWithheld: oldCap.toString(),
    checks: {
      fullHalfPercent: withheld === expected,
      notCapped: withheld !== oldCap,
      capWouldHaveLost: (expected - oldCap).toString(),
    },
  };
  console.log('\n', JSON.stringify(out, null, 1));
  console.log('PASS:', out.checks.fullHalfPercent && out.checks.notCapped);
  fs.writeFileSync('/mnt/d/flpwe3/flp-treasury/.local-v2/round4-nocap.json', JSON.stringify(out, null, 2));
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
