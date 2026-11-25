// 本地测 /api/upload：合法 png、伪装 png、超限文件、连续请求触发限流
const fs = require('fs');

const url = 'http://127.0.0.1:3000/api/upload';

function pngBytes(size) {
  const head = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([head, Buffer.alloc(Math.max(0, size - 8))]);
}

async function post(buf, filename, extra = {}) {
  const fd = new FormData();
  fd.append('file', new Blob([buf], { type: 'image/png' }), filename);
  fd.append('name', extra.name ?? 'Test Coin');
  fd.append('symbol', 'TST');
  const res = await fetch(url, { method: 'POST', body: fd });
  let body;
  try {
    body = await res.json();
  } catch {
    body = await res.text();
  }
  return { status: res.status, body };
}

(async () => {
  console.log('1 合法 png 1KB:', JSON.stringify(await post(pngBytes(1024), 'a.png')));
  console.log('2 伪装成 png 的文本:', JSON.stringify(await post(Buffer.from('this is not an image'), 'b.png')));
  console.log('3 2.5MB png:', JSON.stringify((await post(pngBytes(2.5 * 1024 * 1024), 'c.png')).status));
  for (let i = 4; i <= 10; i++) {
    const r = await post(pngBytes(2048), `d${i}.png`, { name: `N${i}` });
    console.log(`${i} 第 ${i} 次:`, r.status);
  }
})();
