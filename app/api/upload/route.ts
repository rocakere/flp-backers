import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/** 单张图上限 2MB；整个请求（图 + 表单文本）留 3MB 余量。 */
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_BODY_BYTES = 3 * 1024 * 1024;

/** 频率限制：同一个 IP 10 分钟内最多 8 次上传（进程内内存，多实例各自计数）。 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  // 顺手清理过期条目，避免 Map 无限增长
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }
  const rec = hits.get(ip);
  if (!rec || rec.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  if (rec.count >= MAX_PER_WINDOW) {
    return { ok: false, retryAfter: Math.ceil((rec.resetAt - now) / 1000) };
  }
  rec.count += 1;
  return { ok: true };
}

/** 按文件头字节判断真实图片类型，防止改扩展名上传任意文件。 */
function sniff(buf: Buffer): 'png' | 'jpg' | 'webp' | 'gif' | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  if (buf.subarray(0, 4).toString('latin1') === 'GIF8') return 'gif';
  return null;
}

const clip = (v: FormDataEntryValue | null, max: number) => String(v ?? '').slice(0, max);

/**
 * Uploads a token image plus its off-chain metadata JSON.
 * Files land in `public/uploads` and `public/meta`; on Vercel that storage is ephemeral,
 * so production needs a real bucket (S3/R2/IPFS) behind this endpoint.
 */
export async function POST(req: Request) {
  const ip =
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const limit = rateLimited(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'too many uploads, try again later' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter ?? 60) } },
    );
  }

  const declared = Number(req.headers.get('content-length') || 0);
  if (declared && declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'request too large (max 3MB)' }, { status: 413 });
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no file' }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'image must be under 2MB' }, { status: 413 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const realExt = sniff(buf);
  const claimed = EXT[file.type] || (file.name.split('.').pop() || '').toLowerCase().replace('jpeg', 'jpg');
  if (!realExt || !['png', 'jpg', 'webp', 'gif'].includes(claimed)) {
    return NextResponse.json({ error: 'unsupported image type' }, { status: 415 });
  }
  const ext = realExt;

  const origin = req.headers.get('origin') || new URL(req.url).origin;
  const id = crypto.randomBytes(8).toString('hex');

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  const fileName = `${id}.${ext}`;
  await fs.writeFile(path.join(uploadsDir, fileName), buf);
  const image = `${origin}/uploads/${fileName}`;

  const meta = {
    name: clip(form.get('name'), 64),
    symbol: clip(form.get('symbol'), 16),
    description: clip(form.get('description'), 600),
    image,
    website: clip(form.get('website'), 200),
    twitter: clip(form.get('x'), 200),
    telegram: clip(form.get('telegram'), 200),
  };
  const metaDir = path.join(process.cwd(), 'public', 'meta');
  await fs.mkdir(metaDir, { recursive: true });
  await fs.writeFile(path.join(metaDir, `${id}.json`), JSON.stringify(meta, null, 2), 'utf8');

  return NextResponse.json({ image, uri: `${origin}/meta/${id}.json` });
}
