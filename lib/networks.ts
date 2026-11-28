// 网络表：RPC 与合约地址必须成套切换，单换 RPC 会打到错程序上。
// 注意：这里必须用 process.env.NEXT_PUBLIC_XXX 的静态字面量写法。
// Next 只在构建时内联静态成员访问；写成 process.env[k] 动态索引，浏览器端会拿到空值，
// 导致 client 组件（navbar / launch）里的 rpc、programId、dbcConfig 全部退化到兜底值。
export type NetworkId = 'localnet' | 'devnet' | 'mainnet';

export type NetworkInfo = {
  id: NetworkId;
  label: string;
  rpc: string;
  /** 空字符串 = 该网络还没部署合约，页面会拦住发射。 */
  programId: string;
  statsPda: string;
  /** DBC partner config；空 = 不建曲线池，只建币。 */
  dbcConfig: string;
};

export const NETWORKS: Record<NetworkId, NetworkInfo> = {
  localnet: {
    id: 'localnet',
    label: 'Localhost',
    rpc: process.env.NEXT_PUBLIC_RPC_LOCALNET || 'http://127.0.0.1:8899',
    programId:
      process.env.NEXT_PUBLIC_PROGRAM_ID_LOCALNET ||
      process.env.NEXT_PUBLIC_PROGRAM_ID ||
      '3uvGiB1BshLcuLBtGk6bJceYGoYruPo3mxLs39tc4vGT',
    statsPda: process.env.NEXT_PUBLIC_STATS_LOCALNET || '5uaGmaVsmVFLytgpK9FeNfGMPTLM1Z4igVV6Wp3eDuG5',
    dbcConfig: process.env.NEXT_PUBLIC_DBC_CONFIG_LOCALNET || '',
  },
  devnet: {
    id: 'devnet',
    label: 'Devnet',
    rpc: process.env.NEXT_PUBLIC_RPC_DEVNET || 'https://api.devnet.solana.com',
    // Devnet 部署地址与 localnet 同一套程序（同一 program id），写成兜底值，
    // 避免 Vercel 变量没生效时页面误判"该网络还没部署合约"而拦住发射。
    programId:
      process.env.NEXT_PUBLIC_PROGRAM_ID_DEVNET ||
      '3uvGiB1BshLcuLBtGk6bJceYGoYruPo3mxLs39tc4vGT',
    statsPda:
      process.env.NEXT_PUBLIC_STATS_DEVNET ||
      '5uaGmaVsmVFLytgpK9FeNfGMPTLM1Z4igVV6Wp3eDuG5',
    // Devnet 的曲线参数表是公开信息，写成兜底值可以避免"变量没配好就发不出曲线池"这个坑。
    // 这是一套小额演练配置：毕业阈值 5 SOL，其余（150bps 曲线 / 23.75% 迁移 / 迁移后 50bps / 0 迁移费）
    // 与主网口径一致，方便先跑通全链路再切主网。
    dbcConfig:
      process.env.NEXT_PUBLIC_DBC_CONFIG_DEVNET ||
      process.env.NEXT_PUBLIC_DBC_CONFIG ||
      'CW7myrfgRucA2q7hqyAR7q4RyMWDGKrHEEEpNQUsmnnq',
  },
  mainnet: {
    id: 'mainnet',
    label: 'Mainnet',
    rpc: process.env.NEXT_PUBLIC_RPC_MAINNET || 'https://api.mainnet-beta.solana.com',
    programId: process.env.NEXT_PUBLIC_PROGRAM_ID_MAINNET || '',
    statsPda: process.env.NEXT_PUBLIC_STATS_MAINNET || '',
    dbcConfig: process.env.NEXT_PUBLIC_DBC_CONFIG_MAINNET || '',
  },
};

export const NETWORK_ORDER: NetworkId[] = ['localnet', 'devnet', 'mainnet'];

export const DEFAULT_NETWORK: NetworkId = (() => {
  const v = process.env.NEXT_PUBLIC_DEFAULT_NETWORK as NetworkId;
  return NETWORK_ORDER.includes(v) ? v : 'devnet';
})();

export const isNetworkId = (v: string): v is NetworkId => NETWORK_ORDER.includes(v as NetworkId);

export const getNetwork = (id: NetworkId): NetworkInfo => NETWORKS[id];
