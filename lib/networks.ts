// 网络表：RPC 与合约地址必须成套切换，单换 RPC 会打到错程序上。
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

const env = (k: string) => (process.env[k] ?? '').trim();

export const NETWORKS: Record<NetworkId, NetworkInfo> = {
  localnet: {
    id: 'localnet',
    label: 'Localhost',
    rpc: env('NEXT_PUBLIC_RPC_LOCALNET') || 'http://127.0.0.1:8899',
    programId:
      env('NEXT_PUBLIC_PROGRAM_ID_LOCALNET') ||
      env('NEXT_PUBLIC_PROGRAM_ID') ||
      '3uvGiB1BshLcuLBtGk6bJceYGoYruPo3mxLs39tc4vGT',
    statsPda: env('NEXT_PUBLIC_STATS_LOCALNET') || '5uaGmaVsmVFLytgpK9FeNfGMPTLM1Z4igVV6Wp3eDuG5',
    dbcConfig: env('NEXT_PUBLIC_DBC_CONFIG_LOCALNET'),
  },
  devnet: {
    id: 'devnet',
    label: 'Devnet',
    rpc: env('NEXT_PUBLIC_RPC_DEVNET') || 'https://api.devnet.solana.com',
    programId: env('NEXT_PUBLIC_PROGRAM_ID_DEVNET'),
    statsPda: env('NEXT_PUBLIC_STATS_DEVNET'),
    dbcConfig: env('NEXT_PUBLIC_DBC_CONFIG_DEVNET') || env('NEXT_PUBLIC_DBC_CONFIG'),
  },
  mainnet: {
    id: 'mainnet',
    label: 'Mainnet',
    rpc: env('NEXT_PUBLIC_RPC_MAINNET') || 'https://api.mainnet-beta.solana.com',
    programId: env('NEXT_PUBLIC_PROGRAM_ID_MAINNET'),
    statsPda: env('NEXT_PUBLIC_STATS_MAINNET'),
    dbcConfig: env('NEXT_PUBLIC_DBC_CONFIG_MAINNET'),
  },
};

export const NETWORK_ORDER: NetworkId[] = ['localnet', 'devnet', 'mainnet'];

export const DEFAULT_NETWORK: NetworkId = (() => {
  const v = env('NEXT_PUBLIC_DEFAULT_NETWORK') as NetworkId;
  return NETWORK_ORDER.includes(v) ? v : 'devnet';
})();

export const isNetworkId = (v: string): v is NetworkId => NETWORK_ORDER.includes(v as NetworkId);

export const getNetwork = (id: NetworkId): NetworkInfo => NETWORKS[id];
