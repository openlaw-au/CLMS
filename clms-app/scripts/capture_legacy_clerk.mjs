import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 2200 } });
await page.goto('http://localhost:4173/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.evaluate(() => {
  const tabs = document.querySelectorAll('[data-tab="clerks"]');
  if (tabs.length > 1) {
    tabs[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
  } else if (tabs.length) {
    tabs[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }
});
await page.waitForTimeout(3800);
await page.screenshot({ path: '/tmp/legacy_clerk_fixed.png', fullPage: true });
await browser.close();
