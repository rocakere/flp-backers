// 验证 swap_bucket_to_sol 的 vault PDA 签名能过 CPI（mock DAMM 只校验 payer.is_signer）
import fs from "fs";
import { createHash } from "crypto";
import {
  Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getMintLen,
  createInitializeMintInstruction, getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction, createMintToInstruction,
} from "@solana/spl-token";

const RPC = "http://127.0.0.1:8942";
const PROGRAM_ID = new PublicKey("3uvGiB1BshLcuLBtGk6bJceYGoYruPo3mxLs39tc4vGT");
const MOCK_DAMM = new PublicKey("4ArWmVZdDTrweGUcGx4TWr8RL8pr2opZ6tuwvGvw89Uo");
const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
const admin = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync("D:/flpwe3/flp-curve-lab/keys/admin.json", "utf8"))));
const conn = new Connection(RPC, "confirmed");

const disc = (n) => createHash("sha256").update("global:" + n).digest().subarray(0, 8);
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

(async () => {
  const fairMintKp = Keypair.generate();
  const fairMint = fairMintKp.publicKey;

  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
  const [statsPda] = PublicKey.findProgramAddressSync([Buffer.from("stats")], PROGRAM_ID);
  const [dividendVault] = PublicKey.findProgramAddressSync([Buffer.from("dividend_vault")], PROGRAM_ID);
  const [opsVault] = PublicKey.findProgramAddressSync([Buffer.from("ops_vault")], PROGRAM_ID);
  const [liqVault] = PublicKey.findProgramAddressSync([Buffer.from("liq_vault")], PROGRAM_ID);
  const [solBuffer] = PublicKey.findProgramAddressSync([Buffer.from("sol_buffer")], PROGRAM_ID);
  const [buybackBuffer] = PublicKey.findProgramAddressSync([Buffer.from("buyback_buffer")], PROGRAM_ID);

  console.log("mock DAMM:", MOCK_DAMM.toBase58());
  console.log("fair mint:", fairMint.toBase58());

  // 1. FAIR mint（Token-2022，无 transfer fee）
  const len = getMintLen([]);
  const lamports = await conn.getMinimumBalanceForRentExemption(len);
  console.log("1) fair mint:", await sendTx([
    SystemProgram.createAccount({ fromPubkey: admin.publicKey, newAccountPubkey: fairMint, lamports, space: len, programId: TOKEN_2022_PROGRAM_ID }),
    createInitializeMintInstruction(fairMint, 9, admin.publicKey, null, TOKEN_2022_PROGRAM_ID),
  ], [admin, fairMintKp]));

  // 2. initialize_config（cp_amm_program = mock）
  const initData = Buffer.concat([disc("initialize_config"), pk(fairMint), pk(admin.publicKey), pk(MOCK_DAMM), pk(admin.publicKey)]);
  console.log("2) initialize_config:", await sendTx([new TransactionInstruction({
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
    data: initData,
  })], [admin]));

  // 3. 四个桶 ATA（owner 为各自 vault）
  const dividendAta = getAssociatedTokenAddressSync(fairMint, dividendVault, true, TOKEN_2022_PROGRAM_ID);
  const liqSaleAta = getAssociatedTokenAddressSync(fairMint, solBuffer, true, TOKEN_2022_PROGRAM_ID);
  const liqPairAta = getAssociatedTokenAddressSync(fairMint, liqVault, true, TOKEN_2022_PROGRAM_ID);
  const opsAta = getAssociatedTokenAddressSync(fairMint, opsVault, true, TOKEN_2022_PROGRAM_ID);
  const wsolAta = getAssociatedTokenAddressSync(WSOL_MINT, configPda, true, TOKEN_PROGRAM_ID);

  const ataTx = new Transaction();
  for (const [ata, owner] of [[dividendAta, dividendVault], [liqSaleAta, solBuffer], [liqPairAta, liqVault], [opsAta, opsVault]]) {
    ataTx.add(createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, ata, owner, fairMint, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID));
  }
  ataTx.add(createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, wsolAta, configPda, WSOL_MINT, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID));
  console.log("3) ATAs:", await sendTx(ataTx.instructions, [admin]));

  // 4. mint 1000 FAIR 到 dividend 桶
  console.log("4) mintTo dividend bucket:", await sendTx([
    createMintToInstruction(fairMint, dividendAta, admin.publicKey, 1_000_000_000_000n, [], TOKEN_2022_PROGRAM_ID),
  ], [admin]));

  // 5. 五个空账户（DAMM mock 不校验内容，但 CPI 账户必须存在）
  const empty = {
    pool: Keypair.generate().publicKey,
    tokenAVault: Keypair.generate().publicKey,
    tokenBVault: Keypair.generate().publicKey,
    poolAuthority: Keypair.generate().publicKey,
    eventAuthority: Keypair.generate().publicKey,
  };
  const fundTx = new Transaction();
  for (const k of Object.values(empty)) {
    fundTx.add(SystemProgram.transfer({ fromPubkey: admin.publicKey, toPubkey: k, lamports: 890880 }));
  }
  console.log("5) fund mock accounts:", await sendTx(fundTx.instructions, [admin]));

  // 6. swap_bucket_to_sol(bucket=0)
  console.log("6) swap_bucket_to_sol — 关键一步：vault PDA 以 invoke_signed 签名进 CPI");
  const sig = await sendTx([new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: configPda, isSigner: false, isWritable: true },
      { pubkey: fairMint, isSigner: false, isWritable: true },
      { pubkey: WSOL_MINT, isSigner: false, isWritable: false },
      { pubkey: wsolAta, isSigner: false, isWritable: true },
      { pubkey: empty.tokenAVault, isSigner: false, isWritable: true },
      { pubkey: empty.tokenBVault, isSigner: false, isWritable: true },
      { pubkey: empty.pool, isSigner: false, isWritable: true },
      { pubkey: empty.poolAuthority, isSigner: false, isWritable: false },
      { pubkey: empty.eventAuthority, isSigner: false, isWritable: false },
      { pubkey: MOCK_DAMM, isSigner: false, isWritable: false },
      { pubkey: dividendVault, isSigner: false, isWritable: true },
      { pubkey: dividendAta, isSigner: false, isWritable: true },
      { pubkey: solBuffer, isSigner: false, isWritable: true },
      { pubkey: liqSaleAta, isSigner: false, isWritable: true },
      { pubkey: opsVault, isSigner: false, isWritable: true },
      { pubkey: opsAta, isSigner: false, isWritable: true },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: admin.publicKey, isSigner: true, isWritable: true },
    ],
    data: Buffer.concat([disc("swap_bucket_to_sol"), Buffer.from([0]), u64(100_000_000_000n), u64(1n)]),
  })], [admin]);

  const txInfo = await conn.getTransaction(sig, { maxSupportedTransactionVersion: 0, commitment: "confirmed" });
  const logs = txInfo?.meta?.logMessages ?? [];
  const mockLog = logs.find((l) => l.includes("mock-damm"));
  console.log("7) swap tx:", sig);
  console.log("mock-damm log:", mockLog ?? "(not found)");

  const checks = {
    txOk: !txInfo?.meta?.err,
    mockCalled: !!mockLog,
    payerSigned: !!mockLog && mockLog.includes("is_signer=true"),
    bucketDebited: (await conn.getTokenAccountBalance(dividendAta)).value.uiAmount === 900,
  };
  console.log("CHECKS:", JSON.stringify(checks, null, 2));
  console.log("PASS:", Object.values(checks).every(Boolean));
  fs.writeFileSync("D:/flpwe3/mock-damm/_vault-signer-result.json", JSON.stringify({ sig, log: mockLog, checks }, null, 2));
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
