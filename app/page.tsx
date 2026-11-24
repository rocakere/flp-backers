'use client';

export default function Home() {
  const stats = [
    { label: 'Contract Address', value: 'TBA', copy: false },
    { label: 'Price', value: '—' },
    { label: 'Planned Supply', value: '950,000,000' },
    { label: 'Burned', value: '—' },
    { label: 'Dividends Paid', value: '—' },
  ];

  const handleCopy = async (val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      alert('Copied!');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <section className="text-center px-6 pt-10 pb-20">
        <div className="inline-block mb-6 rounded-full border border-purple-300 bg-purple-50 px-4 py-1 text-xs font-semibold tracking-wide text-purple-700">
          PRE-LAUNCH · 代币尚未上线
        </div>
        <h1 className="text-6xl md:text-7xl font-extrabold text-black tracking-tight">FairLaunch Protocol (FLP)</h1>
        <p className="mt-6 text-lg text-black/60">Solana Deflationary Dividend Token Launch Protocol</p>
        <p className="mt-6 max-w-3xl mx-auto text-base text-black/60 leading-relaxed">
          One-click deploy Solana tokens with buy/sell tax, auto-burn and holder dividends. Open source, verifiable permissions, Jito Bundle anti-MEV launch.
        </p>

        <div className="mt-12 flex flex-wrap items-start justify-center gap-x-20 gap-y-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-xs text-black/40 mb-1">{s.label}</div>
              <div className="flex items-center justify-center gap-2">
                <div className={`text-base font-semibold text-black/80 ${s.copy ? 'max-w-[180px] truncate' : ''}`} title={s.value}>
                  {s.value}
                </div>
                {s.copy && (
                  <button
                    onClick={() => handleCopy(s.value)}
                    className="text-[10px] px-1.5 py-0.5 border border-black/20 rounded bg-white/50 hover:bg-white text-black/60"
                  >
                    COPY
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 max-w-2xl mx-auto text-xs leading-6 text-black/40">
          合约地址、价格、销毁量与分红额将在代币正式发射后接入链上实时读取，当前一律开放前状态，不做提前公示。
        </p>
      </section>

      <section id="core" className="text-center pb-24">
        <h2 className="text-3xl font-bold text-black">Core Advantages</h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-6">
          {[
            ['Flexible Tax Allocation', 'Customizable buy/sell tax auto-split to liquidity, marketing and dividend wallet.'],
            ['Auto Burn', 'Timed burn at set ratio, controllable deflation, fully on-chain verifiable.'],
            ['Holder Dividends', 'Auto-distribute SOL by holding ratio, no manual claim required.'],
          ].map(([t, d]) => (
            <div key={t} className="bg-white/60 border border-black/10 rounded-xl p-6 text-left">
              <div className="font-bold text-black text-lg">{t}</div>
              <p className="mt-2 text-black/70 text-sm leading-6">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
