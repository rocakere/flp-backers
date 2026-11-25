export type Lang = 'zh' | 'en';

const zh = {
  nav: {
    home: '首页',
    core: '核心理念',
    whitepaper: '白皮书',
    audit: '审计报告',
    explore: '代币广场',
    help: '帮助',
    launch: 'Launch a Token',
    connect: '连接钱包',
    langZh: '中文',
    langEn: 'English',
    soon: 'soon',
    auditTip: '审计报告整理中，暂未开放',
    exploreTip: '代币广场开发中，暂未开放',
  },
  footer: {
    tagline: 'FLP Protocol・Solana Fair Launch Token Standard',
    docs: '文档',
    x: 'X (Twitter)',
    discord: 'Discord',
    risk: '⚠️ 加密货币高风险。请自行研究，不构成投资建议。',
  },
  home: {
    badge: 'PRE-LAUNCH · 代币尚未上线',
    title: 'FairLaunch Protocol (FLP)',
    subtitle: 'Solana 通缩分红代币发射协议',
    desc: '一键部署带买卖税、自动销毁与持币分红的 Solana 代币。合约开源、权限可验证，Jito Bundle 防 MEV 发射。',
    statCa: '合约地址',
    statPrice: '价格',
    statSupply: '计划总量',
    statBurned: '已销毁',
    statDividend: '已分红',
    copy: 'COPY',
    note: '合约地址、价格、销毁量与分红额将在代币正式发射后接入链上实时读取，当前一律开放前状态，不做提前公示。',
    coreTitle: '核心优势',
    cards: [
      { t: '税收返还', d: '税金按比例自动拆分到流动性、市场与分红钱包。' },
      { t: '自动销毁', d: '按固定比例定时销毁，通缩节奏可控，全部链上可验证。' },
      { t: '持币分红', d: '按持仓比例自动分发 SOL，无需手动领取。' },
    ],
  },
  launch: {
    title: 'Launch a Token',
    sub: '在 Solana 上一键部署内置税收、销毁与分红的代币',
    notice: '当前为配置预览版本：填写参数可校验格式，链上发射功能开发完成后开放，暂不会真实创建代币。',
    fName: '代币名称 Name',
    phName: '例如 Fair Token',
    fSymbol: '代币符号 Symbol',
    phSymbol: '例如 FAIR',
    fDecimals: '小数位 Decimals',
    fSupply: '总供应量 Total Supply',
    phSupply: '1000000000',
    fImage: '图片链接 Image URL',
    phImage: 'https://...',
    fDesc: '简介 Description',
    fBuy: '买入税 % Buy Tax',
    fSell: '卖出税 % Sell Tax',
    fDir: '税收流向',
    dirHolders: '持有者分红',
    dirTreasury: '国库金库',
    btnConnect: '先连接钱包',
    btnCheck: '校验配置',
    alertConnect: '请先连接钱包',
    alertDone: '配置已校验通过。链上发射功能仍在开发中，暂不会真实创建代币。',
  },
  help: {
    title: '帮助中心',
    lead: '关于 FLP 协议、代币参数与钱包连接的常见问题，都汇总在这里。',
    faqs: [
      {
        q: '代币什么时候上线？',
        a: '目前处于开放前阶段，合约地址、价格、销毁与分红数据都不会提前公示。正式发射后，首页会直接读取链上数据展示。',
      },
      {
        q: '点“连接钱包”没有反应怎么办？',
        a: '弹窗里只会列出你浏览器中已安装的钱包插件。如果列表是空的，请先安装 Phantom、OKX Web3 或 Backpack 等 Solana 钱包插件，再刷新页面重试。',
      },
      {
        q: '买入税和卖出税的税金怎么分配？',
        a: '买卖税各为 1%，但要分两套看：FLP 母币的税按 4:3:2:1 拆分——40% 进入销毁池、30% 进入持币者分红池、20% 用于流动性回购与加深、10% 用于运营与开发；通过协议发射的新币，税归发币者，85% 结算给创作者、10% 用于回购并销毁 FLP、5% 进入该币自己的加池金库，平台不抽成。交易池另收 0.25% 手续费，与税叠加，一次往返综合损耗约 2.5%。',
      },
      {
        q: '新币是怎么发的？要不要先买？',
        a: '走链上曲线首发，不设预售、白名单、额度或内部价。35% 的供应在曲线上公开定价，价格随买入自动抬升，规则写死在合约里；曲线卖满后自动迁移成交易池，流动性就是曲线筹到的 SOL，发币方不需要先垫建池资金。',
      },
      {
        q: '税金什么时候会被卖出？',
        a: '税到账是代币，分红发的是 SOL，所以中间必须卖出。FLP 母币约 50% 的税会卖成 SOL（分红 30%、运营 10%、流动性配对 10%）。为避免形成可预测的砸盘时间点，卖出会拆成 8–12 笔在数小时内完成，harvest 时间在 6–9 天窗口内随机。',
      },
      {
        q: '分红什么时候发放？',
        a: '每 7 天对持币地址做一次快照，按持仓比例分配合约收到的 SOL，自动到账，无需手动领取。分红金额取决于税金收入，没有保底。',
      },
      {
        q: '总量会增发吗？',
        a: '总量恒定 10 亿枚，无增发、无预售、无私募、无团队预留。首发时 35% 在链上曲线公开定价销售，20% 与曲线筹集到的 SOL 组成主交易池，其余 45% 作为深度储备分批加池，加完即销毁 LP。',
      },
      {
        q: '怎么确认合约是安全的？',
        a: '审计目前尚未进行，完成后会在此公开全文与审计机构名称。合约将开源，增发与暂停权限会放弃或移交，任何人都能在链上自行核验。',
      },
    ],
    contactTitle: '还有别的问题？',
    contactDesc: '可以在 X (Twitter) 或 Discord 联系我们，完整参数与风险披露请见白皮书。',
  },
  note: {
    audit: {
      title: '审计报告',
      lead: '审计尚未进行，报告完成后将在此公开全文与审计机构名称。',
      detail: '审计范围计划包括：税率计算逻辑、分红分配合约、销毁权限、增发与暂停权限是否已放弃或移交。',
    },
    explore: {
      title: '代币广场',
      lead: '通过 FLP 协议发射的代币将在这里统一展示。',
      detail: '每个代币会展示合约地址、税率结构、销毁进度与分红数据，全部来自链上读取。',
    },
    account: {
      title: '我的账户',
      lead: '持仓、分红记录与收益明细将在代币正式发射后开放。',
      detail: '届时连接钱包即可查看：持有数量、已领取分红、待领取分红与历史交易记录。',
    },
  },
};

const en: typeof zh = {
  nav: {
    home: 'Home',
    core: 'Core',
    whitepaper: 'Whitepaper',
    audit: 'Audit',
    explore: 'Explore',
    help: 'Help',
    launch: 'Launch a Token',
    connect: 'Connect Wallet',
    langZh: '中文',
    langEn: 'English',
    soon: 'soon',
    auditTip: 'Audit report in progress — not yet available',
    exploreTip: 'Token explorer in development — not yet available',
  },
  footer: {
    tagline: 'FLP Protocol・Solana Fair Launch Token Standard',
    docs: 'Documentation',
    x: 'X (Twitter)',
    discord: 'Discord',
    risk: '⚠️ Crypto is high risk. DYOR. Not investment advice.',
  },
  home: {
    badge: 'PRE-LAUNCH · Token not live yet',
    title: 'FairLaunch Protocol (FLP)',
    subtitle: 'Solana Deflationary Dividend Token Launch Protocol',
    desc: 'One-click deploy Solana tokens with buy/sell tax, auto-burn and holder dividends. Open source, verifiable permissions, Jito Bundle anti-MEV launch.',
    statCa: 'Contract Address',
    statPrice: 'Price',
    statSupply: 'Planned Supply',
    statBurned: 'Burned',
    statDividend: 'Dividends Paid',
    copy: 'COPY',
    note: 'Contract address, price, burn and dividend figures will be read live from chain once the token launches. All values stay pre-launch for now and are not published in advance.',
    coreTitle: 'Core Advantages',
    cards: [
      { t: 'Fee Recycling', d: 'Collected tax is auto-split to liquidity, marketing and the dividend wallet.' },
      { t: 'Auto Burn', d: 'Timed burns at a fixed ratio keep deflation controllable and fully verifiable on chain.' },
      { t: 'Holder Dividends', d: 'SOL is distributed automatically by holding ratio — no manual claim required.' },
    ],
  },
  launch: {
    title: 'Launch a Token',
    sub: 'Deploy a Solana token with built-in tax, burn and dividends',
    notice: 'Configuration preview only: parameters can be validated, but on-chain launch is still in development. No token will actually be created.',
    fName: 'Token Name',
    phName: 'e.g. Fair Token',
    fSymbol: 'Token Symbol',
    phSymbol: 'e.g. FAIR',
    fDecimals: 'Decimals',
    fSupply: 'Total Supply',
    phSupply: '1000000000',
    fImage: 'Image URL',
    phImage: 'https://...',
    fDesc: 'Description',
    fBuy: 'Buy Tax %',
    fSell: 'Sell Tax %',
    fDir: 'Tax Destination',
    dirHolders: 'Holder dividends',
    dirTreasury: 'Treasury',
    btnConnect: 'Connect wallet first',
    btnCheck: 'Validate configuration',
    alertConnect: 'Please connect your wallet first',
    alertDone: 'Configuration validated. On-chain launch is still in development — no token is actually created.',
  },
  help: {
    title: 'Help Center',
    lead: 'Common questions about the FLP protocol, token parameters and wallet connection are collected here.',
    faqs: [
      {
        q: 'When does the token launch?',
        a: 'We are in the pre-launch stage, so the contract address, price, burn and dividend figures are not published in advance. Once live, the homepage reads these values directly from chain.',
      },
      {
        q: 'Nothing happens when I click "Connect Wallet" — what should I do?',
        a: 'The dialog only lists wallets actually installed in your browser. If the list is empty, install a Solana wallet extension such as Phantom, OKX Web3 or Backpack, then refresh the page.',
      },
      {
        q: 'How is the buy and sell tax allocated?',
        a: 'Buy and sell tax are 1% each, but there are two separate sets. On the FLP token, fees split 4:3:2:1 — 40% to the burn pool, 30% to the holder dividend pool, 20% to liquidity buyback and deepening, 10% to operations. On tokens launched through the protocol, fees belong to the issuer: 85% settles to the creator, 10% buys back and burns FLP and 5% goes to that token&apos;s own liquidity vault, with no platform cut. The pool charges a further 0.25% swap fee, so a full round trip costs about 2.5%.',
      },
      {
        q: 'How is a new token launched? Do I need to buy first?',
        a: 'Through an on-chain bonding curve — no presale, allowlist, cap or insider price. 35% of supply is priced publicly on the curve and the price rises automatically with purchases, with the rules fixed in the contract. When the curve sells out it migrates into a trading pool automatically, and that liquidity is the SOL the curve raised, so the issuer never has to fund the pool upfront.',
      },
      {
        q: 'When does the tax get sold?',
        a: 'Tax arrives as tokens while dividends are paid in SOL, so a sale in between is unavoidable. Roughly 50% of the FLP tax is sold for SOL (dividends 30%, operations 10%, liquidity pairing 10%). To avoid a predictable dump schedule, sales are split into 8–12 orders over several hours and the harvest window is randomized across 6–9 days.',
      },
      {
        q: 'When are dividends paid?',
        a: 'A snapshot of holder addresses is taken every 7 days, and SOL received by the contract is distributed by holding ratio automatically — no manual claim needed. Payouts depend on tax revenue and are not guaranteed.',
      },
      {
        q: 'Will supply ever be inflated?',
        a: 'Total supply is fixed at 1,000,000,000. No inflation, no presale, no private sale, no team allocation. At launch 35% is sold on the on-chain curve, 20% forms the main pool together with the SOL raised, and the remaining 45% is a depth reserve added to the pool in batches with the LP burned each time.',
      },
      {
        q: 'How can I verify the contract is safe?',
        a: 'No audit has been completed yet; once it is, the full report and the auditor name will be published here. The contract will be open source, and mint/freeze authorities will be revoked or transferred so anyone can verify on chain.',
      },
    ],
    contactTitle: 'Still have questions?',
    contactDesc: 'Reach us on X (Twitter) or Discord. Full parameters and risk disclosure are in the whitepaper.',
  },
  note: {
    audit: {
      title: 'Audit Report',
      lead: 'No audit has been performed yet. Once completed, the full report and the auditor name will be published here.',
      detail: 'Planned scope: tax calculation logic, dividend distribution contract, burn permission, and whether mint/freeze authorities are revoked or transferred.',
    },
    explore: {
      title: 'Token Explorer',
      lead: 'Tokens launched through the FLP protocol will be listed here.',
      detail: 'Each listing will show contract address, tax structure, burn progress and dividend data, all read directly from chain.',
    },
    account: {
      title: 'My Account',
      lead: 'Holdings, dividend history and earnings will open once the token launches.',
      detail: 'Connect your wallet to view: balance, claimed dividends, pending dividends and transaction history.',
    },
  },
};

export const dict = { zh, en };

export function langFromPath(pathname: string | null | undefined): Lang {
  return pathname && pathname.startsWith('/en') ? 'en' : 'zh';
}

export function pathFor(lang: Lang, path = '/'): string {
  if (lang === 'en') return path === '/' ? '/en' : `/en${path}`;
  return path;
}
