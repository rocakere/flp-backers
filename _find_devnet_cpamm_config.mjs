import { Connection, PublicKey } from '@solana/web3.js';

const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
const P = new PublicKey('cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG');
const u64 = (i) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(i)); return b; };
for (let i = 0; i < 8; i++) {
  const addr = PublicKey.findProgramAddressSync([Buffer.from('config'), u64(i)], P)[0];
  const info = await conn.getAccountInfo(addr);
  console.log(i, addr.toBase58(), info ? `size=${info.data.length} owner=${info.owner.toBase58()}` : 'none');
}
const all = await conn.getProgramAccounts(P, { dataSlice: { offset: 0, length: 0 } });
const hist = {};
for (const a of all) hist[a.account.data.length] = (hist[a.account.data.length] || 0) + 1;
console.log('program accounts:', all.length, JSON.stringify(hist));
