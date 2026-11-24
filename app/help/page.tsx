import type { Metadata } from 'next';
import HelpPage from '@/components/pages/help';

export const metadata: Metadata = {
  title: '帮助中心 | FLP',
  description: 'FAIR / FLP 协议常见问题：代币参数、税金分配、分红周期与钱包连接。',
};

export default function Page() {
  return <HelpPage lang="zh" />;
}
