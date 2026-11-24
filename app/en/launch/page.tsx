import type { Metadata } from 'next';
import LaunchContent from '@/components/pages/launch';

export const metadata: Metadata = {
  title: 'Launch a Token | FLP',
};

export default function Page() {
  return <LaunchContent lang="en" />;
}
