'use client';
import { ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { useStandardWalletAdapters } from '@solana/wallet-standard-wallet-adapter-react';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

export function SolanaProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => clusterApiUrl('mainnet-beta'), []);

  // 只保留真正装了插件的旧版适配器，未安装的不列出来，避免点击后抛 WalletNotReadyError
  const legacyWallets = useMemo(() => {
    const candidates = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
    return candidates.filter(
      (w) => String((w as unknown as { readyState: string }).readyState) === 'Installed'
    );
  }, []);

  // 自动发现浏览器里所有 Wallet Standard 钱包（Phantom / OKX / Backpack / Solflare 等）
  // 同名钱包会自动去重，优先使用 Standard 版本
  const wallets = useStandardWalletAdapters(legacyWallets);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
