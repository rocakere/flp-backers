'use client';
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import type { Adapter } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { useStandardWalletAdapters } from '@solana/wallet-standard-wallet-adapter-react';
import '@solana/wallet-adapter-react-ui/styles.css';
import { DEFAULT_NETWORK, getNetwork, isNetworkId, type NetworkId, type NetworkInfo } from '@/lib/networks';

const STORAGE_KEY = 'flp.network';

type NetworkContextValue = {
  network: NetworkInfo;
  setNetwork: (id: NetworkId) => void;
};

const NetworkContext = createContext<NetworkContextValue | null>(null);

/** 当前网络（RPC 与合约地址成套切换）。 */
export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used inside SolanaProvider');
  return ctx;
}

export function SolanaProvider({ children }: { children: ReactNode }) {
  const [netId, setNetId] = useState<NetworkId>(DEFAULT_NETWORK);

  // 记住上次选择；首屏先按默认网络连，读到 localStorage 再切，避免 SSR 不一致
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) || '';
    if (isNetworkId(saved)) setNetId(saved);
  }, []);

  const setNetwork = useCallback((id: NetworkId) => {
    setNetId(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* 隐私模式下 localStorage 可能不可用，忽略 */
    }
  }, []);

  const network = useMemo(() => getNetwork(netId), [netId]);

  // 只保留真正装了插件的旧版适配器，未安装的不列出来，避免点击后抛 WalletNotReadyError
  const legacyWallets = useMemo(() => {
    const candidates = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
    return candidates.filter(
      (w) => String((w as unknown as { readyState: string }).readyState) === 'Installed'
    );
  }, []);

  // 自动发现浏览器里所有 Wallet Standard 钱包（Phantom / OKX / Backpack / Solflare 等）
  // 同名钱包会自动去重，优先使用 Standard 版本
  const standardWallets = useStandardWalletAdapters(legacyWallets);

  // 手机浏览器里没有插件，靠 Mobile Wallet Adapter 唤起 Phantom/Solflare App
  const [mobileAdapter, setMobileAdapter] = useState<Adapter | null>(null);
  useEffect(() => {
    if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return;
    let cancelled = false;
    import('@solana-mobile/wallet-adapter-mobile')
      .then((m) => {
        if (cancelled) return;
        const adapter = new m.SolanaMobileWalletAdapter({
          addressSelector: m.createDefaultAddressSelector(),
          appIdentity: {
            name: 'FLP Backers',
            uri: typeof window !== 'undefined' ? window.location.origin : 'https://flp-backers.vercel.app',
            icon: '/logo.png',
          },
          authorizationResultCache: m.createDefaultAuthorizationResultCache(),
          chain: `solana:${network.id}` as `${string}:${string}`,
          onWalletNotFound: m.createDefaultWalletNotFoundHandler(),
        });
        setMobileAdapter(adapter as unknown as Adapter);
      })
      .catch(() => {
        /* 手机上没装钱包 App 就静默跳过 */
      });
    return () => {
      cancelled = true;
    };
  }, [network.id]);

  const wallets = useMemo(
    () => (mobileAdapter ? [...standardWallets, mobileAdapter] : standardWallets),
    [standardWallets, mobileAdapter],
  );

  return (
    <NetworkContext.Provider value={{ network, setNetwork }}>
      {/* key 让连接跟着网络整体重建，避免旧连接残留 */}
      <ConnectionProvider key={network.id} endpoint={network.rpc}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </NetworkContext.Provider>
  );
}
