import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmRawTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import fs from "fs";
const conn = new Connection("http://127.0.0.1:8932", "confirmed");
const admin = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync("/mnt/d/flpwe3/flp-curve-lab/keys/admin.json", "utf8"))));
const TO = new PublicKey("7ck7BJhD942hJGA51hMVZX7PZtr1YWx6Y4Sx4KQphMFb");
const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: admin.publicKey, toPubkey: TO, lamports: Math.round(1 * LAMPORTS_PER_SOL) }));
tx.feePayer = admin.publicKey;
tx.recentBlockhash = (await conn.getLatestBlockhash("confirmed")).blockhash;
tx.sign(admin);
const sig = await conn.sendRawTransaction(tx.serialize(), { skipPreflight: true });
for (let i = 0; i < 60; i++) {
  const st = (await conn.getSignatureStatus(sig))?.value;
  if (st?.confirmationStatus === "confirmed" || st?.confirmationStatus === "finalized") break;
  await new Promise((r) => setTimeout(r, 700));
}
console.log("fund sig", sig);
console.log("wallet balance now:", (await conn.getBalance(TO)) / 1e9);
