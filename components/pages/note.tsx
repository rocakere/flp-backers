import { dict, type Lang } from '@/lib/i18n';

type NoteKind = 'audit' | 'explore' | 'account';

export default function NotePage({ lang, kind }: { lang: Lang; kind: NoteKind }) {
  const t = dict[lang].note[kind];
  const status = (t as { status?: string }).status;

  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-3xl font-bold text-black">{t.title}</h1>
      {status && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs text-purple-700">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
          {status}
        </div>
      )}
      <p className="mt-4 text-black/60">{t.lead}</p>
      <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-black/40">{t.detail}</p>
    </section>
  );
}
