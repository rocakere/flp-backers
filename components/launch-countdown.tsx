'use client';

import { useEffect, useState } from 'react';
import type { Lang } from '@/lib/i18n';

/** 目标时间：UTC 2027-01-01 00:30:00（= 北京时间 2027-01-01 08:30）。写死 UTC 时间戳，不依赖浏览器时区。 */
export const LAUNCH_UTC = Date.parse('2027-01-01T00:30:00Z');

const COPY = {
  zh: {
    label: '距 FAIR 上线',
    units: ['天', '时', '分', '秒'],
    done: 'Launching… 链上确认中',
    hint: '倒计时是预期时间；链上建池与首笔交易确认后，页面状态随之切换。北京时间 2027-01-01 08:30。',
  },
  en: {
    label: 'FAIR launches in',
    units: ['days', 'hrs', 'min', 'sec'],
    done: 'Launching… awaiting on-chain confirmation',
    hint: 'The countdown is the expected time. Page state follows the on-chain pool creation and first trade. 2027-01-01 00:30 UTC.',
  },
} as const;

function parts(ms: number) {
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return [d, h, m, s] as const;
}

export default function LaunchCountdown({ lang }: { lang: Lang }) {
  const t = COPY[lang] ?? COPY.zh;
  // null = 尚未在客户端计时（避免 SSR 与服务端时间不一致造成闪跳）
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      const diff = LAUNCH_UTC - Date.now();
      setLeft(diff > 0 ? diff : 0);
      if (diff > 0) timer = setTimeout(tick, 1000);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const done = left !== null && left <= 0;
  const values = left === null ? null : parts(left);

  return (
    <div className="mt-10 flex flex-col items-center">
      <div className="text-xs tracking-[0.2em] text-purple-700 font-semibold uppercase">{t.label}</div>
      {done ? (
        <div className="mt-3 text-2xl font-bold text-purple-700">{t.done}</div>
      ) : (
        <div className="mt-3 flex items-end gap-3 font-mono">
          {values === null ? (
            <div className="text-4xl font-bold text-black/20 tabular-nums">--</div>
          ) : (
            values.map((v, i) => (
              <div key={t.units[i]} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-black tabular-nums">
                  {i === 0 ? v : String(v).padStart(2, '0')}
                </div>
                <div className="mt-1 text-[11px] text-black/40">{t.units[i]}</div>
              </div>
            ))
          )}
        </div>
      )}
      <p className="mt-4 max-w-xl text-xs leading-6 text-black/40">{t.hint}</p>
    </div>
  );
}
