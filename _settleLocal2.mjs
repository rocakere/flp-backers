// 本地 8942：手工编码指令（不依赖 IDL），验证 85/10/5 三腿
import fs from "fs";
import { createHash } from "crypto";
import {
  Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, ExtensionType, getMintLen,
  createInitializeTransferFeeConfigInstruction, createInitializeMintInstruction,
  getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction, createTransferCheckedInstruction, getAccount,
} from "@solana/spl-token";

const RPC = "http://127.0.0.1:8942";
const PROGRAM_ID = new PublicKey("3uvGiB1BshLcuLBtGk6bJceYGoYruPo3mxLs39tc4vGT");
const CP_AMM = new PublicKey("cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG");
const admin = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync("D:/flpwe3/flp-curve-lab/keys/admin.json", "utf8"))));
const conn = new Connection(RPC, "confirmed");

const disc = (name) => createHash("sha256").update("global:" + name).digest().subarray(0, 8);
const pk = (x) => Buffer.from(x.toBytes());
const u64 = (n) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(n)); return b; };

async function sendTx(ixs, signers) {
  const tx = new Transaction().add(...ixs);
  tx.feePayer = admin.publicKey;
  tx.recentBlockhash = (await conn.getLatestBlockhash("confirmed")).blockhash;
  tx.sign(...signers);
  const sig = await conn.sendRawTransaction(tx.serialize(), { skipPreflight: true, maxRetries: 3 });
  for (let i = 0; i < 80; i++) {
    const st = await conn.getSignatureStatus(sig, { searchTransactionHistory: true });
    if (st?.value?.err) throw new Error(`tx failed: ${JSON.stringify(st.value.err)} sig=${sig}`);
    if (st?.value && ["confirmed", "finalized"].includes(st.value.confirmationStatus)) return sig;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`timeout ${sig}`);
}

const bal = async (ata) => {
  try { return (await getAccount(conn, ata, "confirmed", TOKEN_2022_PROGRAM_ID)).amount; }
  catch { return 0n; }
};
const README = (b) => ({
  mint: new PublicKey(b.subarray(8, 40)),
  creator: new PublicKey(b.subarray(40, 72)),
  taxDest: b[72],
  settled: b.readBigUInt64LE(83),
  toCreator: b.readBigUInt64LE(91),
  toBuyback: b.readBigUInt64LE(99),
  toLiquidity: b.readBigUInt64LE(107),
  buybackSol: b.readBigUInt64LE(115),
  bump: b[123],
});

(async () => {
  const mintKp = Keypair.generate();
  const mint = mintKp.publicKey;
  const buyer = Keypair.generate();

  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
  const [statsPda] = PublicKey.findProgramAddressSync([Buffer.from("stats")], PROGRAM_ID);
  const [dividendVault] = PublicKey.findProgramAddressSync([Buffer.from("dividend_vault")], PROGRAM_ID);
  const [opsVault] = PublicKey.findProgramAddressSync([Buffer.from("ops_vault")], PROGRAM_ID);
  const [liqVault] = PublicKey.findProgramAddressSync([Buffer.from("liq_vault")], PROGRAM_ID);
  const [solBuffer] = PublicKey.findProgramAddressSync([Buffer.from("sol_buffer")], PROGRAM_ID);
  const [tokenConfig] = PublicKey.findProgramAddressSync([Buffer.from("token_cfg"), mint.toBuffer()], PROGRAM_ID);
  const [buybackOwner] = PublicKey.findProgramAddressSync([Buffer.from("buyback"), mint.toBuffer()], PROGRAM_ID);
  const [liqOwner] = PublicKey.findProgramAddressSync([Buffer.from("liq"), mint.toBuffer()], PROGRAM_ID);

  console.log("mint:", mint.toBase58());
  console.log("config:", configPda.toBase58());
  console.log("tokenConfig:", tokenConfig.toBase58());
  console.log("buybackOwner:", buybackOwner.toBase58(), "liqOwner:", liqOwner.toBase58());

  // 1. 带 1% 税的 mint，withdraw authority = config PDA
  const mintLen = getMintLen([ExtensionType.TransferFeeConfig]);
  const lamports = await conn.getMinimumBalanceForRentExemption(mintLen);
  console.log("1) create mint:", await sendTx([
    SystemProgram.createAccount({ fromPubkey: admin.publicKey, newAccountPubkey: mint, lamports, space: mintLen, programId: TOKEN_2022_PROGRAM_ID }),
    createInitializeTransferFeeConfigInstruction(mint, admin.publicKey, configPda, 100, BigInt(1_000_000_000_000), TOKEN_2022_PROGRAM_ID),
    createInitializeMintInstruction(mint, 9, admin.publicKey, null, TOKEN_2022_PROGRAM_ID),
  ], [admin, mintKp]));

  // 2. initialize_config（手工编码：4 个 pubkey）
  const initCfgData = Buffer.concat([disc("initialize_config"), pk(mint), pk(admin.publicKey), pk(CP_AMM), pk(buyer.publicKey)]);
  const initCfgIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: admin.publicKey, isSigner: true, isWritable: true },
      { pubkey: configPda, isSigner: false, isWritable: true },
      { pubkey: statsPda, isSigner: false, isWritable: true },
      { pubkey: dividendVault, isSigner: false, isWritable: true },
      { pubkey: opsVault, isSigner: false, isWritable: true },
      { pubkey: liqVault, isSigner: false, isWritable: true },
      { pubkey: solBuffer, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: initCfgData,
  });
  console.log("2) initialize_config:", await sendTx([initCfgIx], [admin]));

  // 3. init_token_config(tax_dest=0, fee_bps=100, max_fee=1e12)，creator 必须签名
  const tcData = Buffer.concat([disc("init_token_config"), Buffer.from([0]), Buffer.alloc(2), Buffer.alloc(8)]);
  tcData.writeUInt16LE(100, 9);
  tcData.writeBigUInt64LE(BigInt("1000000000000"), 11);
  const tcIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: admin.publicKey, isSigner: true, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: admin.publicKey, isSigner: true, isWritable: false },
      { pubkey: tokenConfig, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: tcData,
  });
  console.log("3) init_token_config:", await sendTx([tcIx], [admin]));

  // 4. 四个 ATA（桶 owner 为专属 PDA）
  const creatorAta = getAssociatedTokenAddressSync(mint, admin.publicKey, false, TOKEN_2022_PROGRAM_ID);
  const buyerAta = getAssociatedTokenAddressSync(mint, buyer.publicKey, false, TOKEN_2022_PROGRAM_ID);
  const feeAta = getAssociatedTokenAddressSync(mint, tokenConfig, true, TOKEN_2022_PROGRAM_ID);
  const buybackAta = getAssociatedTokenAddressSync(mint, buybackOwner, true, TOKEN_2022_PROGRAM_ID);
  const liqAta = getAssociatedTokenAddressSync(mint, liqOwner, true, TOKEN_2022_PROGRAM_ID);
  const ataTx = new Transaction();
  for (const [ata, owner] of [
    [creatorAta, admin.publicKey], [buyerAta, buyer.publicKey], [feeAta, tokenConfig],
    [buybackAta, buybackOwner], [liqAta, liqOwner],
  ]) {
    ataTx.add(createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, ata, owner, mint, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID));
  }
  console.log("4) create ATAs:", await sendTx(ataTx.instructions, [admin]));

  console.log("5) mintTo:", await sendTx([
    createMintToInstruction(mint, creatorAta, admin.publicKey, 1_000_000_000_000n, [], TOKEN_2022_PROGRAM_ID),
  ], [admin]));

  console.log("6) transfer 100 (1% withheld):", await sendTx([
    createTransferCheckedInstruction(creatorAta, mint, buyerAta, admin.publicKey, 100_000_000_000n, 9, [], TOKEN_2022_PROGRAM_ID),
  ], [admin]));

  const before = await Promise.all([creatorAta, buyerAta, feeAta, buybackAta, liqAta].map(bal));
  console.log("BEFORE settle [creator,buyer,fee,buyback,liq]:", before.map(String).join(","));

  // 7. settle_token_tax（无参数，10 个主账户 + remaining=[buyerAta]）
  const settleIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: tokenConfig, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: feeAta, isSigner: false, isWritable: true },
      { pubkey: creatorAta, isSigner: false, isWritable: true },
      { pubkey: buybackOwner, isSigner: false, isWritable: false },
      { pubkey: buybackAta, isSigner: false, isWritable: true },
      { pubkey: liqOwner, isSigner: false, isWritable: false },
      { pubkey: liqAta, isSigner: false, isWritable: true },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: buyerAta, isSigner: false, isWritable: true }, // remaining
    ],
    data: disc("settle_token_tax"),
  });
  const settleSig = await sendTx([settleIx], [admin]);
  console.log("7) settle:", settleSig);

  await new Promise((r) => setTimeout(r, 1000));
  const after = await Promise.all([creatorAta, buyerAta, feeAta, buybackAta, liqAta].map(bal));
  console.log("AFTER  settle [creator,buyer,fee,buyback,liq]:", after.map(String).join(","));

  const raw = await conn.getAccountInfo(tokenConfig);
  const tc = README(raw.data);
  console.log("token_config:", JSON.stringify({
    settled: String(tc.settled), toCreator: String(tc.toCreator),
    toBuyback: String(tc.toBuyback), toLiquidity: String(tc.toLiquidity),
    creator: tc.creator.toBase58(), taxDest: tc.taxDest,
  }));

  const checks = {
    feeDrained: after[2] === 0n,
    creatorNet: after[0] === 900_841_500_000n,
    buybackIn: after[3] === 99_000_000n,
    liqIn: after[4] === 49_500_000n,
    settled: tc.settled === 1_000_000_000n,
    toCreator: tc.toCreator === 850_000_000n,
    toBuyback: tc.toBuyback === 100_000_000n,
    toLiquidity: tc.toLiquidity === 50_000_000n,
    distinctBuckets: feeAta.toBase58() !== buybackAta.toBase58() && buybackAta.toBase58() !== liqAta.toBase58(),
  };
  console.log("CHECKS:", JSON.stringify(checks, null, 2));
  console.log("PASS:", Object.values(checks).every(Boolean));
  fs.writeFileSync("D:/flpwe3/flp-treasury/_settle-result.json", JSON.stringify({
    mint: mint.toBase58(), config: configPda.toBase58(), tokenConfig: tokenConfig.toBase58(),
    settleSig, checks,
  }, null, 2));
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
