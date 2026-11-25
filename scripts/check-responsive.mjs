import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = 'http://127.0.0.1:3000/launch';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});

for (const [name, width, height] of [
  ['mobile390', 390, 844],
  ['mobile414', 414, 896],
  ['desktop1280', 1280, 900],
]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile: width < 500, hasTouch: width < 500 });
  await page.goto(URL, { waitUntil: 'networkidle2' });
  const m = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScroll: document.body.scrollWidth,
    overflowing: Array.from(document.querySelectorAll('*'))
      .filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .slice(0, 6)
      .map((el) => `${el.tagName}.${(el.className || '').toString().slice(0, 40)} right=${Math.round(el.getBoundingClientRect().right)}`),
  }));
  console.log(name, JSON.stringify(m));
  await page.screenshot({ path: `C:/Users/rocakere/AppData/Local/Temp/${name}.png`, fullPage: false });
  await page.close();
}

await browser.close();
