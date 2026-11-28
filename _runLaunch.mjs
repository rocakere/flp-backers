// 用 lib/launch.ts 的真实编译产物跑一次发币（Node 侧，验证逻辑与链上约束）
import { createRequire } from "module";
import fs from "fs";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

const require = createRequire(import.meta.url);
const { launchToken } = require("./.tmp-launch/launch.js");

const RPC = process.env.RPC ?? "http://127.0.0.1:8932";
const PROGRAM_ID = "3uvGiB1BshLcuLBtGk6bJceYGoYruPo3mxLs39tc4vGT";
const DBC_CONFIG = "3BSwipjeAzQ31X5pDs87JPepurWyQBrzc5iagUjiJqEM";
const admin = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync("/mnt/d/flpwe3/flp-curve-lab/keys/admin.json", "utf8"))),
);

const conn = new Connection(RPC, "confirmed");
const DEV_BUY_SOL = Number(process.env.DEV_BUY ?? 0.05);
const TAG = process.env.TAG ?? "UI1";

const signTransaction = async (tx) => {
  tx.partialSign(admin);
  return tx;
};

const run = async () => {
  console.log("payer:", admin.publicKey.toBase58(), "bal:", (await conn.getBalance(admin.publicKey)) / 1e9);
  const res = await launchToken(conn, admin.publicKey, signTransaction, {
    name: process.env.NAME ?? `FAIR UI Test ${TAG}`,
    symbol: process.env.SYMBOL ?? `UI${TAG}`.slice(0, 8),
    uri: process.env.URI ?? "https://example.com/meta.json",
    taxDest: 0,
    devBuySol: DEV_BUY_SOL,
    programId: PROGRAM_ID,
    dbcConfig: DBC_CONFIG,
    onStep: (s) => console.log("[step]", s),
  });
  console.log("RESULT:", JSON.stringify(res, null, 2));
  fs.writeFileSync("/mnt/d/flpwe3/flp-curve-lab/keys/uiLaunch.json", JSON.stringify(res, null, 2));
};

run().then(() => process.exit(0)).catch((e) => {
  console.error("FAILED:", e.message);
  console.error("logs:", JSON.stringify(e.transactionLogs ?? e.logs ?? [], null, 1));
  console.error(e.stack?.split("\n").slice(0, 6).join("\n"));
  process.exit(1);
});
