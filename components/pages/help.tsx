import { dict, type Lang } from '@/lib/i18n';

export default function HelpPage({ lang }: { lang: Lang }) {
  const t = dict[lang].help;

  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-3xl font-bold text-black">{t.title}</h1>
      <p className="mt-4 text-black/60">{t.lead}</p>

      <div className="mt-10 space-y-6">
        {t.faqs.map((f, i) => (
          <div key={i} className="rounded-lg border border-black/10 bg-white/60 p-5">
            <h2 className="text-base font-semibold text-black">
              {i + 1}. {f.q}
            </h2>
            <p className="mt-2 text-sm leading-6 text-black/60">{f.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-purple-700/20 bg-purple-50/60 p-5">
        <h2 className="text-base font-semibold text-purple-700">{t.contactTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-black/60">{t.contactDesc}</p>
      </div>
    </section>
  );
}
