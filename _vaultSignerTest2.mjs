// 第二轮：复用已初始化的 config，直接打 swap_bucket_to_sol，验证 vault PDA 签名
import fs from "fs";
import { createHash } from "crypto";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";

const RPC = "http://127.0.0.1:8942";
const PROGRAM_ID = new PublicKey("3uvGiB1BshLcuLBtGk6bJceYGoYruPo3mxLs39tc4vGT");
const MOCK_DAMM = new PublicKey("4ArWmVZdDTrweGUcGx4TWr8RL8pr2opZ6tuwvGvw89Uo");
const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
const admin = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync("D:/flpwe3/flp-curve-lab/keys/admin.json", "utf8"))));
const conn = new Connection(RPC, "confirmed");
const disc = (n) => createHash("sha256").update("global:" + n).digest().subarray(0, 8);
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
  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
  const [dividendVault] = PublicKey.findProgramAddressSync([Buffer.from("dividend_vault")], PROGRAM_ID);
  const [opsVault] = PublicKey.findProgramAddressSync([Buffer.from("ops_vault")], PROGRAM_ID);
  const [solBuffer] = PublicKey.findProgramAddressSync([Buffer.from("sol_buffer")], PROGRAM_ID);

  const cfgInfo = await conn.getAccountInfo(configPda);
  const fairMint = new PublicKey(cfgInfo.data.subarray(8, 40));
  console.log("reuse fair mint:", fairMint.toBase58());

  const dividendAta = getAssociatedTokenAddressSync(fairMint, dividendVault, true, TOKEN_2022_PROGRAM_ID);
  const liqSaleAta = getAssociatedTokenAddressSync(fairMint, solBuffer, true, TOKEN_2022_PROGRAM_ID);
  const opsAta = getAssociatedTokenAddressSync(fairMint, opsVault, true, TOKEN_2022_PROGRAM_ID);
  const wsolAta = getAssociatedTokenAddressSync(WSOL_MINT, configPda, true, TOKEN_PROGRAM_ID);
  console.log("dividend bucket:", (await conn.getTokenAccountBalance(dividendAta)).value.uiAmountString, "FAIR");

  const empty = {
    pool: Keypair.generate().publicKey, tokenAVault: Keypair.generate().publicKey,
    tokenBVault: Keypair.generate().publicKey, poolAuthority: Keypair.generate().publicKey,
    eventAuthority: Keypair.generate().publicKey,
  };
  const fund = new Transaction();
  for (const k of Object.values(empty)) fund.add(SystemProgram.transfer({ fromPubkey: admin.publicKey, toPubkey: k, lamports: 890880 }));
  console.log("fund mock accounts:", await sendTx(fund.instructions, [admin]));

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
  const after = (await conn.getTokenAccountBalance(dividendAta)).value.uiAmount;

  console.log("\n=== swap tx:", sig);
  console.log("logs:\n" + logs.map((l) => "  " + l).join("\n"));
  const checks = {
    txOk: !txInfo?.meta?.err,
    mockCalled: !!mockLog,
    vaultSigned: !!mockLog && mockLog.includes("is_signer=true"),
    bucketDebited: after === 900,
    wsolClosed: (await conn.getAccountInfo(wsolAta)) === null,
  };
  console.log("CHECKS:", JSON.stringify(checks));
  console.log("PASS:", Object.values(checks).every(Boolean));
  fs.writeFileSync("D:/flpwe3/mock-damm/_vault-signer-result.json", JSON.stringify({ sig, mockLog, checks, logs }, null, 2));
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
