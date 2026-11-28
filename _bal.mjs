import { Connection, PublicKey } from "@solana/web3.js";
const conn = new Connection("http://127.0.0.1:8932", "confirmed");
const W = new PublicKey("7ck7BJhD942hJGA51hMVZX7PZtr1YWx6Y4Sx4KQphMFb");
const bal = await conn.getBalance(W);
console.log("wallet", W.toBase58(), "balance SOL:", bal / 1e9, "exists:", !!(await conn.getAccountInfo(W)));
const A = new PublicKey("JAw2puwRMQ3z29sv7LnHn5x12SprJfVhCg6qQUeq4DHk");
console.log("admin balance SOL:", (await conn.getBalance(A)) / 1e9);
