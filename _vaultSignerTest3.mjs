// 第三轮：三个桶各打一次 swap，断言 CPI 里的 payer 就是对应 vault PDA（seeds 全覆盖）
import fs from "fs";
import { createHash } from "crypto";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, createMintToInstruction } from "@solana/spl-token";

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

  const cfg = (await conn.getAccountInfo(configPda)).data;
  const fairMint = new PublicKey(cfg.subarray(8, 40));

  const buckets = [
    { id: 0, vault: dividendVault, name: "dividend_vault", bump: cfg[cfg.length - 1] },
    { id: 1, vault: solBuffer, name: "sol_buffer" },
    { id: 2, vault: opsVault, name: "ops_vault" },
  ].map((b) => ({ ...b, ata: getAssociatedTokenAddressSync(fairMint, b.vault, true, TOKEN_2022_PROGRAM_ID) }));

  console.log("config:", configPda.toBase58(), "fair mint:", fairMint.toBase58());
  console.log("dividend_vault :", dividendVault.toBase58());
  console.log("sol_buffer     :", solBuffer.toBase58());
  console.log("ops_vault      :", opsVault.toBase58());

  const results = [];
  for (const b of buckets) {
    const bal = (await conn.getTokenAccountBalance(b.ata)).value.amount;
    if (BigInt(bal) < 100_000_000_000n) {
      await sendTx([createMintToInstruction(fairMint, b.ata, admin.publicKey, 200_000_000_000n - BigInt(bal), [], TOKEN_2022_PROGRAM_ID)], [admin]);
    }

    const wsolAta = getAssociatedTokenAddressSync(WSOL_MINT, configPda, true, TOKEN_PROGRAM_ID);
    const empty = {
      pool: Keypair.generate().publicKey, aV: Keypair.generate().publicKey, bV: Keypair.generate().publicKey,
      pAuth: Keypair.generate().publicKey, eAuth: Keypair.generate().publicKey,
    };
    const fund = new Transaction();
    for (const k of Object.values(empty)) fund.add(SystemProgram.transfer({ fromPubkey: admin.publicKey, toPubkey: k, lamports: 890880 }));
    await sendTx(fund.instructions, [admin]);

    const otherAtas = buckets.filter((x) => x.id !== b.id).map((x) => x.ata);
    const sig = await sendTx([new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: fairMint, isSigner: false, isWritable: true },
        { pubkey: WSOL_MINT, isSigner: false, isWritable: false },
        { pubkey: wsolAta, isSigner: false, isWritable: true },
        { pubkey: empty.aV, isSigner: false, isWritable: true },
        { pubkey: empty.bV, isSigner: false, isWritable: true },
        { pubkey: empty.pool, isSigner: false, isWritable: true },
        { pubkey: empty.pAuth, isSigner: false, isWritable: false },
        { pubkey: empty.eAuth, isSigner: false, isWritable: false },
        { pubkey: MOCK_DAMM, isSigner: false, isWritable: false },
        { pubkey: dividendVault, isSigner: false, isWritable: true },
        { pubkey: buckets[0].ata, isSigner: false, isWritable: true },
        { pubkey: solBuffer, isSigner: false, isWritable: true },
        { pubkey: buckets[1].ata, isSigner: false, isWritable: true },
        { pubkey: opsVault, isSigner: false, isWritable: true },
        { pubkey: buckets[2].ata, isSigner: false, isWritable: true },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: admin.publicKey, isSigner: true, isWritable: true },
      ],
      data: Buffer.concat([disc("swap_bucket_to_sol"), Buffer.from([b.id]), u64(100_000_000_000n), u64(1n)]),
    })], [admin]);

    const tx = await conn.getTransaction(sig, { maxSupportedTransactionVersion: 0, commitment: "confirmed" });
    const mockLog = (tx?.meta?.logMessages ?? []).find((l) => l.includes("mock-damm"));
    const signed = mockLog?.match(/payer=(\w+) is_signer=(true|false)/);
    const ok = !tx?.meta?.err && signed?.[1] === b.vault.toBase58() && signed?.[2] === "true";
    results.push({ bucket: b.name, expectedSigner: b.vault.toBase58(), log: mockLog ?? null, wsolClosed: (await conn.getAccountInfo(wsolAta)) === null, sig, ok });
    console.log(`\nbucket ${b.id} (${b.name}): ${ok ? "OK" : "FAIL"}`);
    console.log("  " + (mockLog ?? "(no mock log)"));
    console.log("  wsol closed:", results.at(-1).wsolClosed, "sig:", sig);
  }

  console.log("\n=== SUMMARY ===");
  for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.bucket}  signer=${r.expectedSigner}`);
  const pass = results.every((r) => r.ok && r.wsolClosed);
  console.log("ALL PASS:", pass);
  fs.writeFileSync("D:/flpwe3/mock-damm/_vault-signer-result.json", JSON.stringify({ pass, results }, null, 2));
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
