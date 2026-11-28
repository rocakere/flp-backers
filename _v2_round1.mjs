// Round 1 on a fresh ledger (port 8962): create FAIR mint, init config, split supply 95 / 5.
// Everything here mirrors what the frontend launch.ts does, so a PASS means the on-chain
// path the site will use is sound — not a bespoke test-only path.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {
  Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeTransferFeeConfigInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';

const RPC = 'http://127.0.0.1:8962';
const conn = new Connection(RPC, 'confirmed');
const PROGRAM_ID = new PublicKey('3uvGiB1BshLcuLBtGk6bJceYGoYruPo3mxLs39tc4vGT');
const DAMM = new PublicKey('cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG');
const ADMIN_JSON = '/mnt/d/flpwe3/flp-curve-lab/keys/admin.json';
const MINT_JSON = '/mnt/d/flpwe3/flp-treasury/.local-v2/fair-mint.json';

const DECIMALS = 9;
const FEE_BPS = 50;              // 0.5% — same constant as lib/launch.ts
const MAX_FEE = BigInt(10) ** BigInt(12); // 1e12 raw = 1,000 tokens, unchanged for now
const SUPPLY = BigInt(1_000_000_000) * BigInt(10) ** BigInt(DECIMALS);
const DEV_ALLOC = BigInt(50_000_000) * BigInt(10) ** BigInt(DECIMALS);

const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(ADMIN_JSON, 'utf8'))));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function send(tx, signers, label) {
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = payer.publicKey;
  tx.sign(payer, ...signers);
  const sig = await conn.sendRawTransaction(tx.serialize(), { maxRetries: 3 });
  for (let i = 0; i < 120; i++) {
    const st = await conn.getSignatureStatus(sig);
    const v = st?.value;
    if (v?.err) throw new Error(`${label} failed ${sig}: ${JSON.stringify(v.err)}`);
    if (v && (v.confirmationStatus === 'confirmed' || v.confirmationStatus === 'finalized')) {
      console.log(`  ${label} OK ${sig}`);
      return sig;
    }
    await sleep(500);
  }
  throw new Error(`${label} not confirmed ${sig}`);
}

const pda = (seeds) => PublicKey.findProgramAddressSync(seeds, PROGRAM_ID)[0];
const config = pda([Buffer.from('config')]);
const stats = pda([Buffer.from('stats')]);
const dividendVault = pda([Buffer.from('dividend_vault')]);
const opsVault = pda([Buffer.from('ops_vault')]);
const liqVault = pda([Buffer.from('liq_vault')]);
const devVault = pda([Buffer.from('dev_vault')]);
const solBuffer = pda([Buffer.from('sol_buffer')]);

const pk = (k) => Buffer.from(k.toBuffer());
const u64 = (v) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(v)); return b; };
const i64 = (v) => { const b = Buffer.alloc(8); b.writeBigInt64LE(BigInt(v)); return b; };
const disc = (n) => crypto.createHash('sha256').update(`global:${n}`).digest().subarray(0, 8);

(async () => {
  const out = { rpc: RPC, config: config.toBase58(), mints: {} };
  console.log('config PDA          ', config.toBase58());
  console.log('dev_vault PDA       ', devVault.toBase58());

  // --- mint keypair (reuse if this script is re-run on the same ledger)
  let mintKp;
  if (fs.existsSync(MINT_JSON)) {
    mintKp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(MINT_JSON, 'utf8'))));
  } else {
    mintKp = Keypair.generate();
    fs.mkdirSync('/mnt/d/flpwe3/flp-treasury/.local-v2', { recursive: true });
    fs.writeFileSync(MINT_JSON, JSON.stringify(Array.from(mintKp.secretKey)));
  }
  const mint = mintKp.publicKey;
  out.mints.fair = mint.toBase58();

  // 82 base + TLV header/padding so the 108-byte transfer-fee config fits (measured 278)
  const mintSpace = 278;
  const mintRent = await conn.getMinimumBalanceForRentExemption(mintSpace);
  const creatorAta = getAssociatedTokenAddressSync(mint, payer.publicKey, false, TOKEN_2022_PROGRAM_ID);
  const devAta = getAssociatedTokenAddressSync(mint, devVault, true, TOKEN_2022_PROGRAM_ID);
  out.mints.creatorAta = creatorAta.toBase58();
  out.mints.devAta = devAta.toBase58();

  const existing = await conn.getAccountInfo(mint);
  if (!existing) {
    const tx1 = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint,
        space: mintSpace,
        lamports: mintRent,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      // withdraw authority = config PDA: settle_token_tax signs with CONFIG_SEED
      createInitializeTransferFeeConfigInstruction(
        mint, config, config, FEE_BPS, MAX_FEE, TOKEN_2022_PROGRAM_ID,
      ),
      createInitializeMintInstruction(mint, DECIMALS, payer.publicKey, null, TOKEN_2022_PROGRAM_ID),
    );
    console.log('\n[1] create FAIR mint (0.5%, 9 decimals)');
    await send(tx1, [mintKp], 'create-mint');
  } else {
    console.log('\n[1] mint already exists, skipping');
  }

  // --- init config (9 accounts, 8 args)
  const cfgInfo = await conn.getAccountInfo(config);
  if (!cfgInfo) {
    const t = await conn.getBlockTime(await conn.getSlot());
    const vestStart = t ?? Math.floor(Date.now() / 1000);
    out.devVestStart = vestStart;
    out.devVestTotal = DEV_ALLOC.toString();
    const data = Buffer.concat([
      disc('initialize_config'),
      pk(mint), pk(payer.publicKey), pk(DAMM), pk(payer.publicKey),
      pk(payer.publicKey),                    // dev_beneficiary: local = admin, mainnet = Ledger
      i64(vestStart), u64(DEV_ALLOC),
      pk(payer.publicKey),                    // ops_dest: local = admin, mainnet = Ledger #2
    ]);
    const ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
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
    });
    console.log('\n[2] initialize_config (dev_vest_start=' + vestStart + ')');
    await send(new Transaction().add(ix), [], 'initialize-config');
  } else {
    console.log('\n[2] config already exists, skipping');
    const raw = cfgInfo.data;
    // Config: 8 discriminator, then 4 pubkeys (0..128), bumps, ...
    out.devVestStart = Number(raw.readBigInt64LE(8 + 128 + 3 + 8 + 1 + 2 + 16));
    out.devVestTotal = raw.readBigUInt64LE(8 + 128 + 3 + 8 + 1 + 2 + 8).toString();
  }

  // --- 95 / 5 split: mint_to never triggers the transfer fee, so the vault gets the
  //     full 50,000,000 (a transfer would lose 0.5% before it ever landed).
  console.log('\n[3] supply split: 950,000,000 -> creator, 50,000,000 -> dev_vault');
  const tx3 = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(payer.publicKey, creatorAta, payer.publicKey, mint, TOKEN_2022_PROGRAM_ID),
    createAssociatedTokenAccountIdempotentInstruction(payer.publicKey, devAta, devVault, mint, TOKEN_2022_PROGRAM_ID),
    createMintToInstruction(mint, creatorAta, payer.publicKey, SUPPLY - DEV_ALLOC, [], TOKEN_2022_PROGRAM_ID),
    createMintToInstruction(mint, devAta, payer.publicKey, DEV_ALLOC, [], TOKEN_2022_PROGRAM_ID),
  );
  await send(tx3, [], 'supply-split');

  const balCreator = (await conn.getTokenAccountBalance(creatorAta)).value;
  const balDev = (await conn.getTokenAccountBalance(devAta)).value;
  out.mints.creatorBalance = balCreator.amount;
  out.mints.devBalance = balDev.amount;
  out.mints.total = (BigInt(balCreator.amount) + BigInt(balDev.amount)).toString();
  console.log('  creator  :', balCreator.uiAmountString);
  console.log('  dev_vault:', balDev.uiAmountString);
  console.log('  sum      :', (BigInt(balCreator.amount) + BigInt(balDev.amount)).toString());

  fs.writeFileSync('/mnt/d/flpwe3/flp-treasury/.local-v2/round1.json', JSON.stringify(out, null, 2));
  console.log('\nwritten /mnt/d/flpwe3/flp-treasury/.local-v2/round1.json');
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
