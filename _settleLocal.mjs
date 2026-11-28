// 本地 8942 账本：settle_token_tax 端到端验证（不依赖 DBC/DAMM）
import fs from "fs";
import {
  Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import anchorPkg from "@coral-xyz/anchor";
const { AnchorProvider, Program, BN } = anchorPkg;
import {
  TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, ExtensionType, getMintLen,
  createInitializeTransferFeeConfigInstruction, createInitializeMintInstruction,
  getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction, createTransferCheckedInstruction, getAccount,
} from "@solana/spl-token";

const RPC = "http://127.0.0.1:8942";
const PROGRAM_ID = new PublicKey("3uvGiB1BshLcuLBtGk6bJceYGoYruPo3mxLs39tc4vGT");
const idl = JSON.parse(fs.readFileSync("D:/flpwe3/flp-treasury/target/idl/flp_treasury.json", "utf8"));
const admin = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync("D:/flpwe3/flp-curve-lab/keys/admin.json", "utf8"))));
const conn = new Connection(RPC, "confirmed");

const wallet = {
  publicKey: admin.publicKey,
  signTransaction: async (tx) => { tx.partialSign(admin); return tx; },
  signAllTransactions: async (txs) => { txs.forEach((t) => t.partialSign(admin)); return txs; },
};
const provider = new AnchorProvider(conn, wallet, { commitment: "confirmed", preflightCommitment: "confirmed" });
const program = new Program(idl, provider);

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

const bal = async (ata) => {
  try { return (await getAccount(conn, ata, "confirmed", TOKEN_2022_PROGRAM_ID)).amount; }
  catch { return 0n; }
};
const withheld = async (ata) => {
  try {
    const a = await getAccount(conn, ata, "confirmed", TOKEN_2022_PROGRAM_ID);
    return a.transferFeeAmount?.withheldAmount ?? 0n;
  } catch { return 0n; }
};

(async () => {
  const mintKp = Keypair.generate();
  const mint = mintKp.publicKey;
  const buyer = Keypair.generate();

  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
  const [statsPda] = PublicKey.findProgramAddressSync([Buffer.from("stats")], PROGRAM_ID);
  const [dividendVault] = PublicKey.findProgramAddressSync([Buffer.from("dividend_vault")], PROGRAM_ID);
  const [opsVault] = PublicKey.findProgramAddressSync([Buffer.from("ops_vault")], PROGRAM_ID);
  const [liqVault] = PublicKey.findProgramAddressSync([Buffer.from("liq_vault")], PROGRAM_ID);
  const [solBuffer] = PublicKey.findProgramAddressSync([Buffer.from("sol_buffer")], PROGRAM_ID);
  const [tokenConfig] = PublicKey.findProgramAddressSync([Buffer.from("token_cfg"), mint.toBuffer()], PROGRAM_ID);

  console.log("mint:", mint.toBase58());
  console.log("config:", configPda.toBase58(), "tokenConfig:", tokenConfig.toBase58());

  // 1. 带 1% 转账税的 Token-2022 mint，withdraw authority = config PDA
  const mintLen = getMintLen([ExtensionType.TransferFeeConfig]);
  const lamports = await conn.getMinimumBalanceForRentExemption(mintLen);
  const ixs = [
    SystemProgram.createAccount({ fromPubkey: admin.publicKey, newAccountPubkey: mint, lamports, space: mintLen, programId: TOKEN_2022_PROGRAM_ID }),
    createInitializeTransferFeeConfigInstruction(mint, admin.publicKey, configPda, 100, BigInt(1_000_000_000_000), TOKEN_2022_PROGRAM_ID),
    createInitializeMintInstruction(mint, 9, admin.publicKey, null, TOKEN_2022_PROGRAM_ID),
  ];
  console.log("create mint tx:", await sendTx(ixs, [admin, mintKp]));

  // 2. initialize_config
  const cfgIx = await program.methods
    .initializeConfig(mint, admin.publicKey, new PublicKey("cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG"), mint)
    .accounts({ payer: admin.publicKey, config: configPda, stats: statsPda, dividendVault, opsVault, liqVault, solBuffer, systemProgram: SystemProgram.programId })
    .instruction();
  console.log("initialize_config tx:", await sendTx([cfgIx], [admin]));

  // 3. init_token_config（creator = admin）
  const tcIx = await program.methods
    .initTokenConfig(0, 100, new BN("1000000000000"))
    .accounts({ payer: admin.publicKey, mint, creator: admin.publicKey, tokenConfig, systemProgram: SystemProgram.programId })
    .instruction();
  console.log("init_token_config tx:", await sendTx([tcIx], [admin]));

  // 4. 四个 ATA
  const creatorAta = getAssociatedTokenAddressSync(mint, admin.publicKey, false, TOKEN_2022_PROGRAM_ID);
  const buyerAta = getAssociatedTokenAddressSync(mint, buyer.publicKey, false, TOKEN_2022_PROGRAM_ID);
  const feeAta = getAssociatedTokenAddressSync(mint, tokenConfig, true, TOKEN_2022_PROGRAM_ID);
  const buybackAta = getAssociatedTokenAddressSync(mint, tokenConfig, true, TOKEN_2022_PROGRAM_ID);
  const liqAta = getAssociatedTokenAddressSync(mint, tokenConfig, true, TOKEN_2022_PROGRAM_ID);

  const ataList = [
    [creatorAta, admin.publicKey], [buyerAta, buyer.publicKey],
    [feeAta, tokenConfig], [buybackAta, tokenConfig], [liqAta, tokenConfig],
  ];
  const ataTx = new Transaction();
  for (const [ata, owner] of ataList) {
    ataTx.add(createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, ata, owner, mint, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID));
  }
  console.log("create ATAs tx:", await sendTx(ataTx.instructions, [admin]));

  // 5. mint 1000 枚给 creator
  const mintIx = createMintToInstruction(mint, creatorAta, admin.publicKey, 1_000_000_000_000n, [], TOKEN_2022_PROGRAM_ID);
  console.log("mintTo tx:", await sendTx([mintIx], [admin]));

  // 6. creator -> buyer 转 100 枚，产生 1% withheld
  const trIx = createTransferCheckedInstruction(creatorAta, mint, buyerAta, admin.publicKey, 100_000_000_000n, 9, [], TOKEN_2022_PROGRAM_ID);
  console.log("transfer tx:", await sendTx([trIx], [admin]));

  const before = {
    creator: await bal(creatorAta), buyer: await bal(buyerAta), fee: await bal(feeAta),
    buyback: await bal(buybackAta), liq: await bal(liqAta),
    buyerWithheld: await withheld(buyerAta),
  };
  console.log("BEFORE settle:", JSON.stringify({ ...before, buyerWithheld: before.buyerWithheld.toString() }, (k, v) => (typeof v === "bigint" ? v.toString() : v)));

  // 7. settle_token_tax
  const settleIx = await program.methods
    .settleTokenTax()
    .accounts({ config: configPda, tokenConfig, mint, feeAta, creatorAta, buybackAta, liquidityAta: liqAta, tokenProgram: TOKEN_2022_PROGRAM_ID })
    .remainingAccounts([{ pubkey: buyerAta, isSigner: false, isWritable: true }])
    .instruction();
  const settleSig = await sendTx([settleIx], [admin]);
  console.log("settle tx:", settleSig);

  await new Promise((r) => setTimeout(r, 1200));
  const after = {
    creator: await bal(creatorAta), buyer: await bal(buyerAta), fee: await bal(feeAta),
    buyback: await bal(buybackAta), liq: await bal(liqAta),
    creatorWithheld: await withheld(creatorAta), buybackWithheld: await withheld(buybackAta), liqWithheld: await withheld(liqAta),
  };
  console.log("AFTER settle:", JSON.stringify(after, (k, v) => (typeof v === "bigint" ? v.toString() : v)));

  // 8. 读 token_config 台账
  const tcAcc = await program.account.tokenConfig.fetch(tokenConfig);
  console.log("token_config:", JSON.stringify({
    settled: tcAcc.settled.toString(), toCreator: tcAcc.toCreator.toString(),
    toBuyback: tcAcc.toBuyback.toString(), toLiquidity: tcAcc.toLiquidity.toString(),
    creator: tcAcc.creator.toBase58(), taxDest: tcAcc.taxDest,
  }));

  // 断言
  const lamportsPerToken = 1_000_000_000n;
  const expectedCreator = (1_000_000_000_000n - 100_000_000_000n) + 841_500_000n; // 900 + 0.8415
  const ok = {
    feeDrained: after.fee === 0n,
    creatorNet: after.creator === expectedCreator,
    buybackIn: after.buyback === 99_000_000n,
    liqIn: after.liq === 49_500_000n,
    creatorWithheld: after.creatorWithheld === 8_500_000n,
    buybackWithheld: after.buybackWithheld === 1_000_000n,
    liqWithheld: after.liqWithheld === 500_000n,
    settled: tcAcc.settled === 1_000_000_000n,
    toCreator: tcAcc.toCreator === 850_000_000n,
  };
  console.log("CHECKS:", JSON.stringify(ok, null, 2));
  console.log(JSON.stringify({ mint: mint.toBase58(), config: configPda.toBase58(), tokenConfig: tokenConfig.toBase58(), settleSig, pass: Object.values(ok).every(Boolean) }));
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
