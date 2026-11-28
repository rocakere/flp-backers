import { Connection, PublicKey } from '@solana/web3.js';

const c = new Connection('http://127.0.0.1:8942', 'confirmed');
const cfg = new PublicKey('EBjSYBgJzbig4E7DmbDJExgCTyJ6ZiumnhBQkcWAZWGS');
const tc = new PublicKey('CbmV98QqYAJFi398jYesQY6HAymLwAY4EscvqocK4JUU');
const a = await c.getAccountInfo(new PublicKey('7GhHXz5yHNH4syqntZvtY2SRnRBpEkh91pCnCuWcvC1Y'));
const d = Buffer.from(a.data);
console.log('len', d.length);
console.log('config at', d.indexOf(Buffer.from(cfg.toBytes())));
console.log('tokenConfig at', d.indexOf(Buffer.from(tc.toBytes())));
// TLV 起点 166：type 1 = TransferFeeConfig, len 108
console.log('tlv type', d.readUInt16LE(166), 'len', d.readUInt16LE(168));
const feeAuth = new PublicKey(d.subarray(170, 202)).toBase58();
const withdrawAuth = new PublicKey(d.subarray(202, 234)).toBase58();
console.log('transferFeeConfigAuthority :', feeAuth, feeAuth === cfg.toBase58() ? '<== config' : '');
console.log('withdrawWithheldAuthority  :', withdrawAuth, withdrawAuth === cfg.toBase58() ? '<== config' : '');
