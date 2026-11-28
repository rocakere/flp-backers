import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { put } from '@vercel/blob';

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

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

/**
 * 存一份二进制，返回可公开访问的 URL。
 *
 * 线上（Vercel）运行时文件系统只读，必须落到对象存储；这里用 Vercel Blob。
 * 本地 `npm run dev` 没有 BLOB_READ_WRITE_TOKEN 时退回写 public/ 目录，
 * 保证本地链路也能跑通。
 */
async function store(bytes: Buffer, key: string, contentType: string, origin: string): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(key, bytes, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return blob.url;
  }
  if (process.env.VERCEL) {
    throw new Error('BLOB_READ_WRITE_TOKEN missing');
  }
  const localPath = path.join(process.cwd(), 'public', key);
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, bytes);
  return `${origin}/${key}`;
}

/**
 * 上传代币图片与链下 metadata JSON。
 *
 * 图片和 JSON 都存到 Vercel Blob（公开可读），返回的 `uri` 直接写进
 * Token-2022 的 metadata 扩展 —— 所以这个 URL 必须是长期有效的，
 * 不能指向临时文件或只读文件系统。
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

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'bad form body' }, { status: 400 });
  }
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

  let image: string;
  let uri: string;
  try {
    image = await store(buf, `uploads/${id}.${ext}`, MIME[ext], origin);

    const meta = {
      name: clip(form.get('name'), 64),
      symbol: clip(form.get('symbol'), 16),
      description: clip(form.get('description'), 600),
      image,
      website: clip(form.get('website'), 200),
      twitter: clip(form.get('x'), 200),
      telegram: clip(form.get('telegram'), 200),
    };
    uri = await store(
      Buffer.from(JSON.stringify(meta, null, 2), 'utf8'),
      `meta/${id}.json`,
      'application/json',
      origin,
    );
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === 'BLOB_READ_WRITE_TOKEN missing') {
      return NextResponse.json(
        { error: '图片存储未配置（缺 BLOB_READ_WRITE_TOKEN），暂时无法发射' },
        { status: 503 },
      );
    }
    console.error('upload failed', e);
    return NextResponse.json({ error: `upload failed: ${msg}` }, { status: 500 });
  }

  return NextResponse.json({ image, uri });
}
