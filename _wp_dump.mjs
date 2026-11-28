import puppeteer from 'puppeteer-core';
import fs from 'fs';

const browser = await puppeteer.launch({
  executablePath: '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new', args: ['--no-sandbox', '--disable-gpu'],
});
const out = [];
for (const [name, url] of [['zh', 'http://localhost:3000/whitepaper'], ['en', 'http://localhost:3000/en/whitepaper']]) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
  await page.emulateMediaType('print');
  const t = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync(`/tmp/wp_${name}.txt`, t);
  const flags = {
    '1%转账税': t.includes('1% 转账税') || t.includes('1% transfer tax'),
    '15个月': t.includes('15 个月') || t.includes('15 months'),
    '4.975': t.includes('4.975'),
    '4.9999': t.includes('4.9999'),
    '480': t.includes('480'),
    '0.5%': t.includes('0.5%'),
    '5000万': t.includes('5000 万') || t.includes('50,000,000'),
    'under1%': (t.match(/(?<![\d.])1(?:\.0)?%/g) || []).length,
  };
  out.push(name + ' ' + JSON.stringify(flags));
  await page.close();
}
console.log(out.join('\n'));
await browser.close();
