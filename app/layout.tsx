import type { Metadata } from 'next';
import './globals.css';
import { SolanaProvider } from '@/components/solana-provider';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
export const metadata: Metadata = {
  title: 'FLP Backers | Solana Fair Launch Token Standard',
  description: '一键部署内置买卖税、销毁、分红的Solana代币，Jito Bundle防MEV发射',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        <SolanaProvider>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </SolanaProvider>
      </body>
    </html>
  );
}