'use client';
import { dict, type Lang } from '@/lib/i18n';

export default function HomeContent({ lang }: { lang: Lang }) {
  const t = dict[lang].home;

  const stats = [
    { label: t.statCa, value: 'TBA', copy: false },
    { label: t.statPrice, value: '—' },
    { label: t.statSupply, value: '1,000,000,000' },
    { label: t.statBurned, value: '—' },
    { label: t.statDividend, value: '—' },
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
          {t.badge}
        </div>
        <h1 className="text-6xl md:text-7xl font-extrabold text-black tracking-tight">{t.title}</h1>
        <p className="mt-6 text-lg text-black/60">{t.subtitle}</p>
        <p className="mt-6 max-w-3xl mx-auto text-base text-black/60 leading-relaxed">{t.desc}</p>

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
                    {t.copy}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 max-w-2xl mx-auto text-xs leading-6 text-black/40">{t.note}</p>
      </section>

      <section id="core" className="text-center pb-24">
        <h2 className="text-3xl font-bold text-black">{t.coreTitle}</h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-6">
          {t.cards.map((c) => (
            <div key={c.t} className="bg-white/60 border border-black/10 rounded-xl p-6 text-left">
              <div className="font-bold text-black text-lg">{c.t}</div>
              <p className="mt-2 text-black/70 text-sm leading-6">{c.d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
