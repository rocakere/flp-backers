import type { Metadata } from 'next';
import NotePage from '@/components/pages/note';

export const metadata: Metadata = {
  title: 'My Account | FLP',
};

export default function Page() {
  return <NotePage lang="en" kind="account" />;
}
