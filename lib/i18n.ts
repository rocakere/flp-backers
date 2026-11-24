export type Lang = 'zh' | 'en';

const zh = {
  nav: {
    core: '核心理念',
    whitepaper: '白皮书',
    audit: '审计报告',
    explore: '代币广场',
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
      { t: '灵活税收分配', d: '买入税与卖出税可分别设置，税金按比例自动拆分到流动性、市场与分红钱包。' },
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
    core: 'Core',
    whitepaper: 'Whitepaper',
    audit: 'Audit',
    explore: 'Explore',
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
      { t: 'Flexible Tax Allocation', d: 'Buy and sell tax are configured separately, and the collected tax is auto-split to liquidity, marketing and the dividend wallet.' },
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
