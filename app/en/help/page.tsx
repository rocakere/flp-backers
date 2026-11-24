import type { Metadata } from 'next';
import HelpPage from '@/components/pages/help';

export const metadata: Metadata = {
  title: 'Help Center | FLP',
  description: 'FAIR / FLP protocol FAQ: token parameters, tax allocation, dividend cycle and wallet connection.',
};

export default function Page() {
  return <HelpPage lang="en" />;
}
