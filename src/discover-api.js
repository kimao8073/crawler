const { chromium } = require('playwright');

/**
 * Launches a headless browser, scrolls the fundraising list page,
 * and prints candidate API requests/responses used to load more items.
 *
 * Usage:
 *   node src/discover-api.js
 */

const TARGET_URL = 'https://together.kakao.com/fundraisings/now';

function looksLikeListApi(url) {
  try {
    const u = new URL(url);
    return (
      u.hostname.endsWith('together.kakao.com') &&
      (u.pathname.includes('/fundraisings/api/') || u.pathname.includes('/api/'))
    );
  } catch {
    return false;
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  /** @type {Array<{url: string, method: string, status?: number}>} */
  const seen = [];
  const seenSet = new Set();

  page.on('response', async (res) => {
    const req = res.request();
    const url = req.url();
    if (!looksLikeListApi(url)) return;

    const key = `${req.method()} ${url}`;
    if (seenSet.has(key)) return;
    seenSet.add(key);
    seen.push({ url, method: req.method(), status: res.status() });

    // Only try to parse JSON for smaller responses
    const ct = (res.headers()['content-type'] || '').toLowerCase();
    if (!ct.includes('application/json')) return;
    try {
      const json = await res.json();
      const preview = JSON.stringify(json).slice(0, 800);
      // eslint-disable-next-line no-console
      console.log(`\n[API] ${req.method()} ${url} -> ${res.status()}`);
      // eslint-disable-next-line no-console
      console.log(preview + (preview.length >= 800 ? '…' : ''));
    } catch {
      // ignore
    }
  });

  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Scroll a few times to trigger infinite loading.
  for (let i = 0; i < 12; i++) {
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(1200);
  }

  // eslint-disable-next-line no-console
  console.log('\n=== Seen candidate APIs ===');
  for (const s of seen) {
    // eslint-disable-next-line no-console
    console.log(`${s.method} ${s.url} -> ${s.status}`);
  }

  await browser.close();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
