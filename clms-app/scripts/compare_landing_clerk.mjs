import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 2200 } });

for (const [name, url] of [
  ['legacy_clerk', 'http://localhost:4173/index.html'],
  ['react_clerk', 'http://localhost:5173/'],
]) {
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('clms-role', 'barrister');
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  await page.evaluate(() => {
    const target = document.querySelector('[data-tab="clerks"]');
    if (target) {
      target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  });

  await page.waitForTimeout(3600);
  await page.screenshot({ path: `/tmp/${name}.png`, fullPage: true });
  await page.close();
}

await browser.close();
