import puppeteer from 'puppeteer-core';

const CHROME = '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});

async function printIt(url, out, cookies = []) {
  const page = await browser.newPage();
  // The middleware sends every Chinese path to /en unless this cookie is present.
  if (cookies.length) await page.setCookie(...cookies);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.emulateMediaType('print');
  await page.pdf({
    path: out,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
  });
  const text = await page.evaluate(() => document.body.innerText.length);
  const lang = await page.evaluate(() => document.documentElement.lang || 'unknown');
  console.log(out, 'text chars:', text, 'html lang:', lang);
  await page.close();
}

const zhCookie = { name: 'flp_lang', value: 'zh', domain: '127.0.0.1', path: '/' };

await printIt('http://127.0.0.1:3000/whitepaper', '/mnt/d/flpwe3/flp-backers/public/whitepaper.pdf', [zhCookie]);
await printIt('http://127.0.0.1:3000/en/whitepaper', '/mnt/d/flpwe3/flp-backers/public/whitepaper-en.pdf');

await browser.close();
