import type { Metadata } from 'next';
import HomeContent from '@/components/pages/home';

export const metadata: Metadata = {
  title: 'FLP Backers | Solana Fair Launch Token Standard',
  description:
    'One-click deploy Solana tokens with buy/sell tax, auto-burn and holder dividends. Jito Bundle anti-MEV launch.',
};

export default function Page() {
  return <HomeContent lang="en" />;
}
