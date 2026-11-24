import { dict, type Lang } from '@/lib/i18n';

type NoteKind = 'audit' | 'explore' | 'account';

export default function NotePage({ lang, kind }: { lang: Lang; kind: NoteKind }) {
  const t = dict[lang].note[kind];

  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-3xl font-bold text-black">{t.title}</h1>
      <p className="mt-4 text-black/60">{t.lead}</p>
      <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-black/40">{t.detail}</p>
    </section>
  );
}
