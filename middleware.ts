import { NextResponse, type NextRequest } from 'next/server';

/**
 * The site ships two tree copies: Chinese under `/`, English under `/en`.
 * English is the default entry: a visitor who has not explicitly chosen Chinese
 * (via the navbar toggle, which writes the `flp_lang` cookie) is redirected to
 * the `/en` equivalent. Crawlers and shared links therefore land on English.
 *
 * Opting back into Chinese is one cookie away, so nobody gets stuck.
 */
const ZH_COOKIE = 'flp_lang';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Already English, or an explicit Chinese opt-out: let it through.
  if (pathname.startsWith('/en')) return NextResponse.next();
  if (req.cookies.get(ZH_COOKIE)?.value === 'zh') return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = pathname === '/' ? '/en' : `/en${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/',
    '/whitepaper/:path*',
    '/launch/:path*',
    '/explore/:path*',
    '/audit/:path*',
    '/help/:path*',
    '/account/:path*',
  ],
};
