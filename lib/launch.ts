import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeTransferFeeConfigInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { createHash } from 'crypto';
import { PROGRAM_ID } from '@/lib/addresses';

const META_PROGRAM = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const ASSOC = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

/** Fixed launch parameters: 9 decimals, 1% transfer tax, supply 1,000,000,000. */
export const LAUNCH_DECIMALS = 9;
export const LAUNCH_FEE_BPS = 100;
const MAX_FEE = (BigInt(10) ** BigInt(12));
export const LAUNCH_SUPPLY = 1_000_000_000;

const u32 = (n: number) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
};
const borshStr = (s: string) => Buffer.concat([u32(Buffer.byteLength(s)), Buffer.from(s, 'utf8')]);
const none = () => Buffer.from([0]);
const ixDisc = (name: string) =>
  Buffer.from(createHash('sha256').update(`global:${name}`).digest().subarray(0, 8));

export type LaunchParams = {
  name: string;
  symbol: string;
  uri: string;
  taxDest: 0 | 1;
};

export async function launchToken(
  connection: Connection,
  payer: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  params: LaunchParams,
): Promise<{ mint: string; signature: string; tokenConfig: string }> {
  const programId = new PublicKey(PROGRAM_ID);
  const mintKp = Keypair.generate();
  const [tokenConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from('token_cfg'), mintKp.publicKey.toBuffer()],
    programId,
  );
  const [config] = PublicKey.findProgramAddressSync([Buffer.from('config')], programId);
  const [stats] = PublicKey.findProgramAddressSync([Buffer.from('stats')], programId);
  const [metaPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), META_PROGRAM.toBuffer(), mintKp.publicKey.toBuffer()],
    META_PROGRAM,
  );

  // ---- transaction 1: mint with the 1% transfer fee, creator ATA, supply, metadata
  const mintSpace = getMintLen([ExtensionType.TransferFeeConfig]);
  const mintRent = await connection.getMinimumBalanceForRentExemption(mintSpace);
  const creatorAta = getAssociatedTokenAddressSync(mintKp.publicKey, payer, true, TOKEN_2022_PROGRAM_ID);

  const metaData = Buffer.concat([
    ixDisc('create_metadata_account_v3'),
    borshStr(params.name),
    borshStr(params.symbol),
    borshStr(params.uri),
    Buffer.from([0, 0]), // seller_fee_basis_points = 0
    none(), // creators
    none(), // collection
    none(), // uses
    Buffer.from([1]), // is_mutable
    none(), // collection_details
  ]);
  const metaIx = new TransactionInstruction({
    programId: META_PROGRAM,
    keys: [
      { pubkey: metaPda, isSigner: false, isWritable: true },
      { pubkey: mintKp.publicKey, isSigner: false, isWritable: false },
      { pubkey: payer, isSigner: true, isWritable: false },
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: payer, isSigner: true, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: metaData,
  });

  const tx1 = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mintKp.publicKey,
      space: mintSpace,
      lamports: mintRent,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    // the fee authority is the token_config PDA, so only the protocol can ever touch the fee
    createInitializeTransferFeeConfigInstruction(
      mintKp.publicKey,
      tokenConfig,
      tokenConfig,
      LAUNCH_FEE_BPS,
      MAX_FEE,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeMintInstruction(mintKp.publicKey, LAUNCH_DECIMALS, payer, null, TOKEN_2022_PROGRAM_ID),
    createAssociatedTokenAccountInstruction(payer, creatorAta, payer, mintKp.publicKey, TOKEN_2022_PROGRAM_ID),
    createMintToInstruction(
      mintKp.publicKey,
      creatorAta,
      payer,
      BigInt(LAUNCH_SUPPLY) * BigInt(10) ** BigInt(LAUNCH_DECIMALS),
      [],
      TOKEN_2022_PROGRAM_ID,
    ),
    metaIx,
  );
  tx1.partialSign(mintKp);
  const signed1 = await signTransaction(tx1);
  const signature = await connection.sendRawTransaction(signed1.serialize(), { maxRetries: 3 });
  await connection.confirmTransaction(signature, 'confirmed');

  // ---- transaction 2: register the token on the protocol
  const initIx = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: mintKp.publicKey, isSigner: false, isWritable: false },
      { pubkey: payer, isSigner: false, isWritable: false },
      { pubkey: tokenConfig, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([
      ixDisc('init_token_config'),
      Buffer.from([params.taxDest]),
      (() => {
        const b = Buffer.alloc(2);
        b.writeUInt16LE(LAUNCH_FEE_BPS);
        return b;
      })(),
      (() => {
        const b = Buffer.alloc(8);
        b.writeBigUInt64LE(MAX_FEE);
        return b;
      })(),
    ]),
  });
  const recordIx = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: stats, isSigner: false, isWritable: true },
      { pubkey: payer, isSigner: true, isWritable: false },
    ],
    data: Buffer.concat([
      ixDisc('record_launch'),
      (() => {
        const b = Buffer.alloc(8);
        b.writeBigUInt64LE(BigInt(0));
        return b;
      })(),
    ]),
  });
  const tx2 = new Transaction().add(initIx, recordIx);
  const signed2 = await signTransaction(tx2);
  const sig2 = await connection.sendRawTransaction(signed2.serialize(), { maxRetries: 3 });
  await connection.confirmTransaction(sig2, 'confirmed');

  return { mint: mintKp.publicKey.toBase58(), signature, tokenConfig: tokenConfig.toBase58() };
}

export const lamports = (sol: number) => Math.round(sol * LAMPORTS_PER_SOL);
