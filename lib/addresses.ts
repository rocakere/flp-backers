// 部署后把真实地址填进来，首页「资金透明」区块会直接展示；留空则显示 TBA。
export const VAULTS = {
  dividend: '',
  ops: '',
};

// 统计账户（PlatformStats：已发币数量 + 累计募集 lamports）。
// 默认值是本地联调集群上的程序 ID 与统计 PDA；切换到主网时用环境变量覆盖。
export const PROGRAM_ID =
  process.env.NEXT_PUBLIC_PROGRAM_ID || '3uvGiB1BshLcuLBtGk6bJceYGoYruPo3mxLs39tc4vGT';
export const STATS_PDA =
  process.env.NEXT_PUBLIC_STATS_PDA || '5uaGmaVsmVFLytgpK9FeNfGMPTLM1Z4igVV6Wp3eDuG5';

// 前端连的 RPC。生产换成自己的 Helius 端点。
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com';

// DBC（Meteora 动态曲线）的 partner config：建池与首次买入都由它派生。
// 留空则发币只建 mint、跳过建池与首次买入（本地集群就是这样跑 UI 的）。
export const DBC_CONFIG = process.env.NEXT_PUBLIC_DBC_CONFIG || '';

