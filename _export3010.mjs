import puppeteer from 'puppeteer-core';

const CHROME = '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://localhost:3010';
const PAGES = [
  [`${BASE}/whitepaper`, '/mnt/d/flpwe3/flp-backers/public/whitepaper.pdf'],
  [`${BASE}/en/whitepaper`, '/mnt/d/flpwe3/flp-backers/public/whitepaper-en.pdf'],
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
for (const [url, out] of PAGES) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
  await page.emulateMediaType('print');
  const txt = await page.evaluate(() => document.body.innerText);
  await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log(out);
  console.log('  chars:', txt.length,
    '| has 0.5%:', txt.includes('0.5%'),
    '| has 480天:', txt.includes('480'),
    '| has 1% 转账税:', txt.includes('1% 转账税'));
  await page.close();
}
await browser.close();
