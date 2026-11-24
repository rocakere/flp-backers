'use client';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
export default function LaunchTokenPage() {
  const { connected } = useWallet();
  const [form, setForm] = useState({
    name: '',
    symbol: '',
    decimals: 9,
    supply: '',
    image: '',
    description: '',
    buyTax: 0,
    sellTax: 0,
    taxDestination: 'holders', // holders / treasury
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  const submit = () => {
    if (!connected) return alert('请先连接钱包');
    console.log('表单数据：', form);
    // 后续这里接入合约交易
  };
  return (
    <main className="min-h-screen bg-black text-white px-4 py-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-2">Launch FLP Token</h1>
      <p className="text-gray-400 text-center mb-8">Solana FLP 代币发行配置</p>
      <div className="space-y-4 border border-gray-700 p-6 rounded-lg">
        <div>
          <label className="block text-sm text-gray-300 mb-1">代币名称 Name</label>
          <input name="name" value={form.name} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2" placeholder="例如 Juice Coin" />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">代币符号 Symbol</label>
          <input name="symbol" value={form.symbol} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2" placeholder="例如 JUICE" />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">小数位 Decimals</label>
          <input type="number" name="decimals" value={form.decimals} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">总供应量 Total Supply</label>
          <input type="number" name="supply" value={form.supply} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2" placeholder="1000000000" />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">图片链接 Image URL</label>
          <input name="image" value={form.image} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2" placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">简介 Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2" rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">买入税 % Buy Tax</label>
            <input type="number" name="buyTax" value={form.buyTax} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">卖出税 % Sell Tax</label>
            <input type="number" name="sellTax" value={form.sellTax} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">税收流向</label>
          <select name="taxDestination" value={form.taxDestination} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2">
            <option value="holders">持有者分红</option>
            <option value="treasury">国库金库</option>
          </select>
        </div>
        <button onClick={submit} disabled={!connected} className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded font-bold disabled:bg-gray-700">
          {connected ? '创建代币 & 发起发射' : '先连接钱包'}
        </button>
      </div>
    </main>
  );
}