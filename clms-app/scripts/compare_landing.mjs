import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 2200 } });

for (const [name, url] of [
  ['legacy', 'http://localhost:4173/index.html'],
  ['react', 'http://localhost:5173/'],
]) {
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('clms-role', 'barrister');
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `/tmp/${name}_landing.png`, fullPage: true });
  await page.close();
}

await browser.close();
