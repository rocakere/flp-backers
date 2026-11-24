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
    taxDestination: 'holders',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = () => {
    if (!connected) return alert('请先连接钱包');
    console.log('表单数据：', form);
    alert('配置已校验通过。链上发射功能仍在开发中，暂不会真实创建代币。');
  };

  const field = 'w-full rounded border border-black/20 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500';
  const label = 'mb-1 block text-sm text-black/60';

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-center text-3xl font-bold text-black">Launch a Token</h1>
      <p className="mt-2 text-center text-sm text-black/50">在 Solana 上一键部署内置税收、销毁与分红的代币</p>

      <div className="mt-6 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
        当前为配置预览版本：填写参数可校验格式，链上发射功能开发完成后开放，暂不会真实创建代币。
      </div>

      <div className="mt-6 space-y-4 rounded-xl border border-black/10 bg-white/60 p-6">
        <div>
          <label className={label}>代币名称 Name</label>
          <input name="name" value={form.name} onChange={handleChange} className={field} placeholder="例如 Fair Token" />
        </div>
        <div>
          <label className={label}>代币符号 Symbol</label>
          <input name="symbol" value={form.symbol} onChange={handleChange} className={field} placeholder="例如 FAIR" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>小数位 Decimals</label>
            <input type="number" name="decimals" value={form.decimals} onChange={handleChange} className={field} />
          </div>
          <div>
            <label className={label}>总供应量 Total Supply</label>
            <input type="number" name="supply" value={form.supply} onChange={handleChange} className={field} placeholder="950000000" />
          </div>
        </div>
        <div>
          <label className={label}>图片链接 Image URL</label>
          <input name="image" value={form.image} onChange={handleChange} className={field} placeholder="https://..." />
        </div>
        <div>
          <label className={label}>简介 Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} className={field} rows={3} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>买入税 % Buy Tax</label>
            <input type="number" name="buyTax" value={form.buyTax} onChange={handleChange} className={field} />
          </div>
          <div>
            <label className={label}>卖出税 % Sell Tax</label>
            <input type="number" name="sellTax" value={form.sellTax} onChange={handleChange} className={field} />
          </div>
        </div>
        <div>
          <label className={label}>税收流向</label>
          <select name="taxDestination" value={form.taxDestination} onChange={handleChange} className={field}>
            <option value="holders">持有者分红</option>
            <option value="treasury">国库金库</option>
          </select>
        </div>
        <button
          onClick={submit}
          disabled={!connected}
          className="w-full rounded bg-purple-600 py-3 font-bold text-white transition hover:bg-purple-700 disabled:bg-black/20"
        >
          {connected ? '校验配置' : '先连接钱包'}
        </button>
      </div>
    </main>
  );
}
