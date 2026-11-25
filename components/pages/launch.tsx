'use client';
import { useRef, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { dict, type Lang } from '@/lib/i18n';
import { launchToken } from '@/lib/launch';

type TaxDest = 'creator' | 'fair_vault';

export default function LaunchContent({ lang }: { lang: Lang }) {
  const t = dict[lang].launch;
  const { connection } = useConnection();
  const { connected, publicKey, signTransaction } = useWallet();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [mint, setMint] = useState('');
  const [form, setForm] = useState({
    name: '',
    symbol: '',
    supply: '',
    image: '',
    website: '',
    x: '',
    telegram: '',
    description: '',
    taxDestination: 'creator' as TaxDest,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const pickImage = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert(t.alertImageType);
    if (file.size > 2 * 1024 * 1024) return alert(t.alertImageSize);
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, image: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!connected || !publicKey || !signTransaction) return alert(t.alertConnect);
    if (!form.name.trim() || !form.symbol.trim()) return alert(t.alertName);
    if (!form.image) return alert(t.alertImage);
    if (busy) return;
    setBusy(true);
    try {
      const blob = await (await fetch(form.image)).blob();
      const fd = new FormData();
      fd.append('file', blob, 'token.png');
      fd.append('name', form.name);
      fd.append('symbol', form.symbol);
      fd.append('description', form.description);
      fd.append('website', form.website);
      fd.append('x', form.x);
      fd.append('telegram', form.telegram);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json()).error ?? 'upload failed');
      const { uri } = await res.json();

      const out = await launchToken(connection, publicKey, signTransaction, {
        name: form.name.trim(),
        symbol: form.symbol.trim(),
        uri,
        taxDest: form.taxDestination === 'fair_vault' ? 1 : 0,
      });
      setMint(out.mint);
    } catch (e) {
      alert(`${t.alertFail}: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const field =
    'w-full rounded border border-black/20 bg-white px-3 py-2 text-sm outline-none focus:border-purple-500';
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
            <label className={label}>{t.fSupply}</label>
            <input name="supply" value={form.supply} onChange={handleChange} className={field} placeholder={t.phSupply} />
          </div>
          <div>
            <label className={label}>{t.fDecimals}</label>
            <div className="rounded border border-black/10 bg-black/5 px-3 py-2 text-sm text-black/50">9</div>
          </div>
        </div>

        <div>
          <label className={label}>{t.fImage}</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickImage(e.target.files?.[0])}
          />
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pickImage(e.dataTransfer.files?.[0]);
            }}
            className="flex cursor-pointer items-center gap-4 rounded border border-dashed border-black/20 bg-white px-4 py-4 transition hover:border-purple-500"
          >
            {form.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image} alt="token" className="h-16 w-16 rounded object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded bg-black/5 text-2xl text-black/30">
                +
              </div>
            )}
            <div className="text-xs leading-5 text-black/50">
              <div className="text-sm text-black/70">{form.image ? t.uploadChange : t.uploadPick}</div>
              <div>{t.uploadHint}</div>
            </div>
            {form.image && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setForm((prev) => ({ ...prev, image: '' }));
                }}
                className="ml-auto rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
              >
                {t.uploadRemove}
              </button>
            )}
          </div>
        </div>

        <div>
          <label className={label}>{t.fDesc}</label>
          <textarea name="description" value={form.description} onChange={handleChange} className={field} rows={3} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={label}>{t.fWeb}</label>
            <input name="website" value={form.website} onChange={handleChange} className={field} placeholder="https://" />
          </div>
          <div>
            <label className={label}>{t.fX}</label>
            <input name="x" value={form.x} onChange={handleChange} className={field} placeholder="https://x.com/..." />
          </div>
          <div>
            <label className={label}>{t.fTg}</label>
            <input name="telegram" value={form.telegram} onChange={handleChange} className={field} placeholder="https://t.me/..." />
          </div>
        </div>

        <div className="rounded border border-black/10 bg-black/5 px-4 py-3 text-xs leading-6 text-black/60">
          <div className="text-sm font-semibold text-black/80">{t.taxTitle}</div>
          <div>{t.taxLine}</div>
        </div>

        <div>
          <label className={label}>{t.fDir}</label>
          <select name="taxDestination" value={form.taxDestination} onChange={handleChange} className={field}>
            <option value="creator">{t.dirCreator}</option>
            <option value="fair_vault">{t.dirVault}</option>
          </select>
          <div className="mt-1 text-xs leading-5 text-black/45">{t.dirHint}</div>
        </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-4 text-xs leading-6 text-purple-900">
          <div className="text-sm font-semibold">{t.jitoTitle}</div>
          <div>{t.jitoBody}</div>
          <div className="mt-1 text-purple-700/80">{t.jitoTip}</div>
        </div>

        {mint && (
          <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-xs leading-5 text-green-800">
            <div className="font-semibold">{t.launched}</div>
            <div className="mt-1 break-all font-mono">{mint}</div>
          </div>
        )}

        <button
          onClick={submit}
          disabled={!connected || busy}
          className="w-full rounded bg-purple-600 py-3 font-bold text-white transition hover:bg-purple-700 disabled:bg-black/20"
        >
          {busy ? t.btnBusy : connected ? t.btnLaunch : t.btnConnect}
        </button>
      </div>
    </main>
  );
}
