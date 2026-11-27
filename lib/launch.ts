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
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { createInitializeInstruction } from '@solana/spl-token-metadata';
import { createHash } from 'crypto';

const ASSOC = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

/** 元数据存在 mint 自己的 Token-2022 Metadata 扩展里（旧版 Metaplex 不支持 Token-2022 mint）。 */
const META_BUFFER_LAMPORTS = 10_000_000; // 0.01 SOL，给 metadata 扩展 realloc 留租金

/** Fixed launch parameters: 9 decimals, 0.5% transfer tax, supply 1,000,000,000. */
export const LAUNCH_DECIMALS = 9;
export const LAUNCH_FEE_BPS = 50;
/**
 * No per-transfer ceiling: the tax is always exactly 0.5% of the amount.
 * u64::MAX is the Token-2022 "unlimited" value — anything lower silently caps the tax
 * on large transfers (with 9 decimals, the old 1e12 = 1,000 tokens, so every transfer
 * above 200,000 tokens effectively paid nothing).
 */
const MAX_FEE = 18446744073709551615n;
export const LAUNCH_SUPPLY = 1_000_000_000;

// 浏览器里的 Buffer 是旧版 polyfill，没有 writeBigUInt64LE / writeUInt16LE 这类实例方法
// （Node 有，所以本地 harness 能跑通、一站到页面上就报 "b.writeBigUInt64LE is not a function"）。
// 这里统一改用 Uint8Array + DataView 写小端整数，不依赖 Buffer 的写方法。
const u32le = (n: number) => {
  const b = new Uint8Array(4);
  new DataView(b.buffer, b.byteOffset, b.byteLength).setUint32(0, n, true);
  return b;
};
const u16le = (n: number) => {
  const b = new Uint8Array(2);
  new DataView(b.buffer, b.byteOffset, b.byteLength).setUint16(0, n, true);
  return b;
};
const u64le = (v: bigint) => {
  const b = new Uint8Array(8);
  new DataView(b.buffer, b.byteOffset, b.byteLength).setBigUint64(0, v, true);
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
  // settle_token_tax 的三个收款 ATA（fee 池 + 10% buyback + 5% liquidity）。
  // buyback/liquidity 的 owner 是 per-mint PDA，地址必须是标准 ATA；任何一处缺失，
  // settle 的 associated_token 约束会直接失败，85/10/5 永远汇不出去。
  const [buybackOwner] = PublicKey.findProgramAddressSync(
    [Buffer.from('buyback'), mintKp.publicKey.toBuffer()],
    programId,
  );
  const [liquidityOwner] = PublicKey.findProgramAddressSync(
    [Buffer.from('liq'), mintKp.publicKey.toBuffer()],
    programId,
  );
  const settlementAtaIxs = (from: PublicKey) => [
    createAssociatedTokenAccountIdempotentInstruction(
      from,
      getAssociatedTokenAddressSync(mintKp.publicKey, tokenConfig, true, TOKEN_2022_PROGRAM_ID),
      tokenConfig,
      mintKp.publicKey,
      TOKEN_2022_PROGRAM_ID,
    ),
    createAssociatedTokenAccountIdempotentInstruction(
      from,
      getAssociatedTokenAddressSync(mintKp.publicKey, buybackOwner, true, TOKEN_2022_PROGRAM_ID),
      buybackOwner,
      mintKp.publicKey,
      TOKEN_2022_PROGRAM_ID,
    ),
    createAssociatedTokenAccountIdempotentInstruction(
      from,
      getAssociatedTokenAddressSync(mintKp.publicKey, liquidityOwner, true, TOKEN_2022_PROGRAM_ID),
      liquidityOwner,
      mintKp.publicKey,
      TOKEN_2022_PROGRAM_ID,
    ),
  ];

  // ============ 第一步：建池（配了 DBC config 时，mint 由 DBC 创建） ============
  //
  // 关键事实（DBC 源码 InitializeVirtualPoolWithToken2022Ctx 注释：
  // "Unique token mint address, initialized in the handler"）：
  // DBC 的 initialize_virtual_pool_with_token2022 会在 handler 内部调用
  // create_token_2022_base_mint(payer, base_mint, pool_authority, ...)，即 **由 DBC 自己
  // createAccount + InitializeMint + 写 metadata + 加 1% transferFeeConfig**。
  // 所以 baseMint 必须是"链上尚不存在"的 keypair（也正因如此 DBC 把它列为 signer）。
  // 我们如果先 createAccount 这个 mint，DBC 的 system allocate 会报
  // "Allocate: account … already in use"（实测 custom error 0x0，三次）。
    // decimals / 1% fee / maxFee / metadata 全部取自 DBC config（实测复现：9 位、
  // 100bps、u64::MAX、withdrawWithheldAuthority = 协议 config PDA）。
  const useDbc = Boolean(params.dbcConfig);
  // ---- init_token_config 必须与 mint 的创建落在同一笔交易里 ----
  // mint 一旦上链而登记还没落，任何人都能抢先把自己的钱包登记成 `creator`（token_cfg
  // 只能初始化一次），此后这位用户 0.5% 里的 85% 全部流向抢跑者。把「建 mint/建池」与
  // 「登记」压进同一笔交易，中间就没有可插队的窗口。
  const initTokenConfigIx = new TransactionInstruction({
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
      new Uint8Array([params.taxDest]),
      u16le(LAUNCH_FEE_BPS),
      u64le(MAX_FEE),
    ]),
  });
  let registeredInline = false;
  let signature = '';
  let pool: string | undefined;
  let buySignature: string | undefined;
  let poolSkipped = false;

  if (useDbc) {
    params.onStep?.('pool');
    const [anchorMod, dbcSdk] = await Promise.all([
      import('@coral-xyz/anchor'),
      import('@meteora-ag/dynamic-bonding-curve-sdk'),
    ]);
    const BN = (anchorMod as unknown as { BN: new (n: number | string) => unknown }).BN as new (
      n: number | string,
    ) => { toString(): string };
    const dbc = new dbcSdk.DynamicBondingCurveClient(connection, 'confirmed');
    const dbcConfig = new PublicKey(params.dbcConfig);
    const devBuyLamports = lamports(params.devBuySol ?? 0);
    // 建池与首买同一笔成交，池价还是开盘价，没有可被抢跑的窗口
    const tx = await dbc.creator.createPoolWithFirstBuy({
      createPoolParam: {
        name: params.name,
        symbol: params.symbol,
        uri: params.uri,
        payer,
        poolCreator: payer,
        config: dbcConfig,
        baseMint: mintKp.publicKey,
      },
      firstBuyParam: devBuyLamports > 0
        ? {
            buyer: payer,
            receiver: payer,
            buyAmount: new BN(devBuyLamports),
            minimumAmountOut: new BN(0),
            referralTokenAccount: null,
          }
        : undefined,
    });
    await prepareTransaction(connection, tx, payer);
    // 原子化：DBC 的 CPI 先创建 mint，同一笔里随后的 init_token_config 读到的就是它。
    // 交易逼近 1232 字节上限时退回分开发送（功能优先），返回结果里 registeredInline=false。
    const probeLen = Buffer.from(tx.serializeMessage()).length;
    if (probeLen + 110 <= 1232) {
      tx.add(initTokenConfigIx);
      registeredInline = true;
    }
    // DBC 建池指令把 baseMint 列为 signer（createAccount 需要新账户签名），
    // mint 私钥只在本地，必须在这笔交易里补签名，否则 serialize 报 Missing signature。
    tx.partialSign(mintKp);
    const signed = await signTransaction(tx);
    const sig = await connection.sendRawTransaction(signed.serialize(), { maxRetries: 3 });
    await confirmByPolling(connection, sig);
    signature = sig;
    buySignature = sig;
    pool = dbcSdk.deriveDbcPoolAddress(WSOL_MINT, mintKp.publicKey, dbcConfig).toBase58();

    // ---- 结算收款 ATA 预建：settle_token_tax 会把 85% 打进 creator_ata（CI 断言
    // owner == token_config.creator），并把 10% / 5% 打进 buyback / liquidity 的 per-mint
    // ATA。DBC 建池时 mint 才在这笔交易里诞生，ATA 只能在其后补建；idempotent 保证可重入。
    // 少了任何一个，settle 都会在 associated_token 约束上失败，税一分也汇不出去。
    const ataTx = new Transaction().add(...settlementAtaIxs(payer));
    if (params.taxDest === 0) {
      ataTx.add(
        createAssociatedTokenAccountIdempotentInstruction(
          payer,
          getAssociatedTokenAddressSync(mintKp.publicKey, payer, true, TOKEN_2022_PROGRAM_ID),
          payer,
          mintKp.publicKey,
          TOKEN_2022_PROGRAM_ID,
        ),
      );
    }
    await prepareTransaction(connection, ataTx, payer);
    const signedAta = await signTransaction(ataTx);
    const sigAta = await connection.sendRawTransaction(signedAta.serialize(), { maxRetries: 3 });
    await confirmByPolling(connection, sigAta);
  } else {
    // ---- 无 DBC config（本地无池模式）：自己建 mint，行为与旧版一致
  const mintSpace = getMintLen([ExtensionType.TransferFeeConfig]);
  const mintRent = await connection.getMinimumBalanceForRentExemption(mintSpace);
  const creatorAta = getAssociatedTokenAddressSync(mintKp.publicKey, payer, true, TOKEN_2022_PROGRAM_ID);

  const tx1 = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mintKp.publicKey,
      space: mintSpace,
      lamports: mintRent,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    // the withdrawWithheldAuthority is the global config PDA: settle_token_tax signs with
    // CONFIG_SEED, so anything else here makes every settlement fail with Unauthorized.
    createInitializeTransferFeeConfigInstruction(
      mintKp.publicKey,
      config,
      config,
      LAUNCH_FEE_BPS,
      MAX_FEE,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeMintInstruction(mintKp.publicKey, LAUNCH_DECIMALS, payer, null, TOKEN_2022_PROGRAM_ID),
    createAssociatedTokenAccountInstruction(payer, creatorAta, payer, mintKp.publicKey, TOKEN_2022_PROGRAM_ID),
    ...settlementAtaIxs(payer),
    createMintToInstruction(
      mintKp.publicKey,
      creatorAta,
      payer,
      BigInt(LAUNCH_SUPPLY) * BigInt(10) ** BigInt(LAUNCH_DECIMALS),
      [],
      TOKEN_2022_PROGRAM_ID,
    ),
  );
  // 同一个理由：mint 在这笔里刚被创建，登记紧跟着发出，中间没有窗口。
  tx1.add(initTokenConfigIx);
  registeredInline = true;
  params.onStep?.('mint');
  await prepareTransaction(connection, tx1, payer);
  tx1.partialSign(mintKp);
  const signed1 = await signTransaction(tx1);
  signature = await connection.sendRawTransaction(signed1.serialize(), { maxRetries: 3 });
  await confirmByPolling(connection, signature);
  // 用户填了首买但没有池可建：把这一笔降级为"只发币"
  if (lamports(params.devBuySol ?? 0) > 0) poolSkipped = true;
  }

  // ---- 兜底：只有原子化没做成（交易体积超 1232 字节）时才单独发登记 ----
  // record_launch 只允许 config.distributor 调用，普通发币人必然 Unauthorized，
  // 所以用户这笔只发 init_token_config；发币统计由 distributor/keeper 另行记账。
  if (!registeredInline) {
    params.onStep?.('register');
    const tx2 = new Transaction().add(initTokenConfigIx);
    await prepareTransaction(connection, tx2, payer);
    const signed2 = await signTransaction(tx2);
    const sig2 = await connection.sendRawTransaction(signed2.serialize(), { maxRetries: 3 });
    await confirmByPolling(connection, sig2);
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

/**
 * 轮询确认交易。
 * 本地 / 部分 RPC 的 websocket 订阅不可用，connection.confirmTransaction 会一直等到超时
 * （交易其实已经 finalized）。这里统一用 getSignatureStatuses 轮询。
 */
async function confirmByPolling(connection: Connection, signature: string) {
  for (let i = 0; i < 90; i++) {
    const status = (await connection.getSignatureStatus(signature, { searchTransactionHistory: true }))?.value;
    if (status?.err) throw new Error(`transaction failed: ${JSON.stringify(status.err)} sig=${signature}`);
    if (status && (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized')) return;
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error(`transaction not confirmed in time: ${signature}`);
}

/** 补齐 feePayer + recentBlockhash：钱包适配器不会替我们补，缺失时 partialSign 会直接报错。 */
async function prepareTransaction(connection: Connection, tx: Transaction, feePayer: PublicKey) {
  if (!tx.feePayer) tx.feePayer = feePayer;
  if (!tx.recentBlockhash) {
    tx.recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash;
  }
}
