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

/**
 * Uploads a token image plus its off-chain metadata JSON.
 * Files land in `public/uploads` and `public/meta`; on Vercel that storage is ephemeral,
 * so production needs a real bucket (S3/R2/IPFS) behind this endpoint.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no file' }, { status: 400 });
  }
  const ext = EXT[file.type] || (file.name.split('.').pop() || '').toLowerCase().replace('jpeg', 'jpg');
  if (!['png', 'jpg', 'webp', 'gif'].includes(ext)) {
    return NextResponse.json({ error: 'unsupported image type' }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'image must be under 2MB' }, { status: 400 });
  }

  const origin = req.headers.get('origin') || new URL(req.url).origin;
  const id = crypto.randomBytes(8).toString('hex');

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  const fileName = `${id}.${ext}`;
  await fs.writeFile(path.join(uploadsDir, fileName), Buffer.from(await file.arrayBuffer()));
  const image = `${origin}/uploads/${fileName}`;

  const meta = {
    name: String(form.get('name') || ''),
    symbol: String(form.get('symbol') || ''),
    description: String(form.get('description') || ''),
    image,
    website: String(form.get('website') || ''),
    twitter: String(form.get('x') || ''),
    telegram: String(form.get('telegram') || ''),
  };
  const metaDir = path.join(process.cwd(), 'public', 'meta');
  await fs.mkdir(metaDir, { recursive: true });
  await fs.writeFile(path.join(metaDir, `${id}.json`), JSON.stringify(meta, null, 2), 'utf8');

  return NextResponse.json({ image, uri: `${origin}/meta/${id}.json` });
}
