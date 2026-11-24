import type { Metadata } from 'next';
import WhitepaperPage from '@/components/pages/whitepaper';

export const metadata: Metadata = {
  title: 'Whitepaper | FLP Backers',
};

export default function Page() {
  return <WhitepaperPage lang="en" />;
}
