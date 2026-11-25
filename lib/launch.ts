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
  createInitializeMetadataPointerInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { createInitializeInstruction } from '@solana/spl-token-metadata';
import { createHash } from 'crypto';

const ASSOC = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

/** 元数据存在 mint 自己的 Token-2022 Metadata 扩展里（旧版 Metaplex 不支持 Token-2022 mint）。 */
const META_BUFFER_LAMPORTS = 10_000_000; // 0.01 SOL，给 metadata 扩展 realloc 留租金

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
const ixDisc = (name: string) =>
  Buffer.from(createHash('sha256').update(`global:${name}`).digest().subarray(0, 8));

export type LaunchParams = {
  name: string;
  symbol: string;
  uri: string;
  taxDest: 0 | 1;
  /** 首次买入（SOL）。0 = 不买；与建池在同一笔交易内原子执行。 */
  devBuySol?: number;
  /** 当前网络上的程序地址（随网络切换传入）。 */
  programId: string;
  /** 当前网络的 DBC partner config；空 = 跳过建池与首买。 */
  dbcConfig: string;
  /** 进度回调，给页面显示当前在做哪一步。 */
  onStep?: (step: LaunchStep) => void;
};

export type LaunchStep = 'mint' | 'register' | 'pool';

export type LaunchResult = {
  mint: string;
  signature: string;
  tokenConfig: string;
  /** 曲线池地址（配了 DBC config 才有）。 */
  pool?: string;
  /** 建池 + 首次买入那一笔的签名。 */
  buySignature?: string;
  /** 用户填了首次买入，但没配 DBC config（本地跑 UI）时置 true。 */
  poolSkipped?: boolean;
};

export async function launchToken(
  connection: Connection,
  payer: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  params: LaunchParams,
): Promise<LaunchResult> {
  const programId = new PublicKey(params.programId);
  const mintKp = Keypair.generate();
  const [tokenConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from('token_cfg'), mintKp.publicKey.toBuffer()],
    programId,
  );
  const [config] = PublicKey.findProgramAddressSync([Buffer.from('config')], programId);
  const [stats] = PublicKey.findProgramAddressSync([Buffer.from('stats')], programId);

  // ---- transaction 1: mint with the 1% transfer fee + T22 metadata extension, creator ATA, supply
  const mintSpace = getMintLen([ExtensionType.TransferFeeConfig, ExtensionType.MetadataPointer]);
  const mintRent = await connection.getMinimumBalanceForRentExemption(mintSpace) + META_BUFFER_LAMPORTS;
  const creatorAta = getAssociatedTokenAddressSync(mintKp.publicKey, payer, true, TOKEN_2022_PROGRAM_ID);

  const metaIx = createInitializeInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    metadata: mintKp.publicKey,
    updateAuthority: payer,
    mint: mintKp.publicKey,
    mintAuthority: payer,
    name: params.name,
    symbol: params.symbol,
    uri: params.uri,
  });

  const tx1 = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mintKp.publicKey,
      space: mintSpace,
      lamports: mintRent,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    // 元数据指针指向 mint 自己（T22 Metadata 扩展内嵌，旧版 Metaplex 不支持 Token-2022）
    createInitializeMetadataPointerInstruction(
      mintKp.publicKey,
      payer,
      mintKp.publicKey,
      TOKEN_2022_PROGRAM_ID,
    ),
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
    // mint 初始化之后才能写 metadata（同笔交易内顺序执行）
    metaIx,
    createAssociatedTokenAccountInstruction(payer, creatorAta, payer, mintKp.publicKey, TOKEN_2022_PROGRAM_ID),
    createMintToInstruction(
      mintKp.publicKey,
      creatorAta,
      payer,
      BigInt(LAUNCH_SUPPLY) * BigInt(10) ** BigInt(LAUNCH_DECIMALS),
      [],
      TOKEN_2022_PROGRAM_ID,
    ),
  );
  params.onStep?.('mint');
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
  params.onStep?.('register');
  const tx2 = new Transaction().add(initIx, recordIx);
  const signed2 = await signTransaction(tx2);
  const sig2 = await connection.sendRawTransaction(signed2.serialize(), { maxRetries: 3 });
  await connection.confirmTransaction(sig2, 'confirmed');

  // ---- transaction 3: 建曲线池 + 首次买入，同一笔交易内原子（要么都成，要么都败）
  const devBuyLamports = lamports(params.devBuySol ?? 0);
  let pool: string | undefined;
  let buySignature: string | undefined;
  let poolSkipped = false;

  if (devBuyLamports > 0) {
    if (!params.dbcConfig) {
      // 没配 partner config（本地集群）时只跑 UI，不碰链上建池
      poolSkipped = true;
    } else {
      // DBC SDK 是 CJS 包，动态引入以免在 SSR 阶段执行
      const [anchorMod, dbcSdk] = await Promise.all([
        import('@coral-xyz/anchor'),
        import('@meteora-ag/dynamic-bonding-curve-sdk'),
      ]);
      const BN = (anchorMod as unknown as { BN: new (n: number | string) => unknown }).BN as new (n: number | string) => { toString(): string };
      params.onStep?.('pool');
      const dbc = new dbcSdk.DynamicBondingCurveClient(connection, 'confirmed');
      const dbcConfig = new PublicKey(params.dbcConfig);
      const tx3 = await dbc.creator.createPoolWithFirstBuy({
        createPoolParam: {
          name: params.name,
          symbol: params.symbol,
          uri: params.uri,
          payer,
          poolCreator: payer,
          config: dbcConfig,
          baseMint: mintKp.publicKey,
        },
        firstBuyParam: {
          buyer: payer,
          receiver: payer,
          buyAmount: new BN(devBuyLamports),
          // 建池与首买同一笔成交，池价还是开盘价，没有可被抢跑的窗口
          minimumAmountOut: new BN(0),
          referralTokenAccount: null,
        },
      });
      const signed3 = await signTransaction(tx3);
      buySignature = await connection.sendRawTransaction(signed3.serialize(), { maxRetries: 3 });
      await connection.confirmTransaction(buySignature, 'confirmed');
      pool = dbcSdk.deriveDbcPoolAddress(WSOL_MINT, mintKp.publicKey, dbcConfig).toBase58();
    }
  }

  return {
    mint: mintKp.publicKey.toBase58(),
    signature,
    tokenConfig: tokenConfig.toBase58(),
    pool,
    buySignature,
    poolSkipped,
  };
}

export const lamports = (sol: number) => Math.round(sol * LAMPORTS_PER_SOL);
