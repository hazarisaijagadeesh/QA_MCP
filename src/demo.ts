import { chromium } from 'playwright';

function normalizePrompt(prompt: string) {
  return (prompt || 'open example.com').trim();
}

async function runRealTimeExample(prompt: string) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    const normalized = normalizePrompt(prompt);
    const lower = normalized.toLowerCase();

    if (lower.includes('google')) {
      await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
      const q = normalized.replace(/google/i, '').trim() || 'automation demo';
      await page.locator('textarea[name="q"], input[name="q"]').first().fill(q);
      await page.locator('textarea[name="q"], input[name="q"]').first().press('Enter');
      await page.waitForLoadState('networkidle').catch(() => {});
    } else {
      await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
      await page.locator('body').click().catch(() => {});
    }

    console.log(`Prompt received: ${normalized}`);
    console.log('Browser interaction completed.');
  } finally {
    await context.close();
    await browser.close();
  }
}

const prompt = process.argv.slice(2).join(' ') || 'open google and search for automation demo';
runRealTimeExample(prompt).catch((error) => {
  console.error(error);
  process.exit(1);
});
