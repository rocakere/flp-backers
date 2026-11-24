'use client';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { dict, type Lang } from '@/lib/i18n';

export default function LaunchContent({ lang }: { lang: Lang }) {
  const t = dict[lang].launch;
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = () => {
    if (!connected) return alert(t.alertConnect);
    console.log('form:', form);
    alert(t.alertDone);
  };

  const field = 'w-full rounded border border-black/20 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500';
  const label = 'mb-1 block text-sm text-black/60';

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-center text-3xl font-bold text-black">{t.title}</h1>
      <p className="mt-2 text-center text-sm text-black/50">{t.sub}</p>

      <div className="mt-6 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
        {t.notice}
      </div>

      <div className="mt-6 space-y-4 rounded-xl border border-black/10 bg-white/60 p-6">
        <div>
          <label className={label}>{t.fName}</label>
          <input name="name" value={form.name} onChange={handleChange} className={field} placeholder={t.phName} />
        </div>
        <div>
          <label className={label}>{t.fSymbol}</label>
          <input name="symbol" value={form.symbol} onChange={handleChange} className={field} placeholder={t.phSymbol} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>{t.fDecimals}</label>
            <input type="number" name="decimals" value={form.decimals} onChange={handleChange} className={field} />
          </div>
          <div>
            <label className={label}>{t.fSupply}</label>
            <input type="number" name="supply" value={form.supply} onChange={handleChange} className={field} placeholder={t.phSupply} />
          </div>
        </div>
        <div>
          <label className={label}>{t.fImage}</label>
          <input name="image" value={form.image} onChange={handleChange} className={field} placeholder={t.phImage} />
        </div>
        <div>
          <label className={label}>{t.fDesc}</label>
          <textarea name="description" value={form.description} onChange={handleChange} className={field} rows={3} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>{t.fBuy}</label>
            <input type="number" name="buyTax" value={form.buyTax} onChange={handleChange} className={field} />
          </div>
          <div>
            <label className={label}>{t.fSell}</label>
            <input type="number" name="sellTax" value={form.sellTax} onChange={handleChange} className={field} />
          </div>
        </div>
        <div>
          <label className={label}>{t.fDir}</label>
          <select name="taxDestination" value={form.taxDestination} onChange={handleChange} className={field}>
            <option value="holders">{t.dirHolders}</option>
            <option value="treasury">{t.dirTreasury}</option>
          </select>
        </div>
        <button
          onClick={submit}
          disabled={!connected}
          className="w-full rounded bg-purple-600 py-3 font-bold text-white transition hover:bg-purple-700 disabled:bg-black/20"
        >
          {connected ? t.btnCheck : t.btnConnect}
        </button>
      </div>
    </main>
  );
}
