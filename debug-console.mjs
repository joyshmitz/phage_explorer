import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

const errors = [];
const warnings = [];

page.on('console', msg => {
  const type = msg.type();
  const text = msg.text();
  if (type === 'error') {
    errors.push(text);
  } else if (type === 'warning' && !text.includes('GPU stall')) {
    warnings.push(text);
  }
});

page.on('pageerror', err => {
  errors.push(`PAGE ERROR: ${err.message}`);
});

console.log('Navigating to http://localhost:5173...');
try {
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 30000 });
} catch (e) {
  console.error('Navigation failed:', e.message);
  await browser.close();
  process.exit(1);
}

// Wait for React to render and data to load (12 seconds for full database load)
console.log('Waiting for app to render...');
await page.waitForTimeout(12000);

console.log('\n=== CONSOLE ERRORS ===');
if (errors.length === 0) {
  console.log('No errors!');
} else {
  errors.forEach(e => console.log('ERROR:', e));
}

console.log('\n=== CONSOLE WARNINGS ===');
if (warnings.length === 0) {
  console.log('No warnings!');
} else {
  warnings.forEach(w => console.log('WARN:', w));
}

console.log('\n=== PAGE TITLE ===');
console.log(await page.title());

// Check if main content rendered
const hasContent = await page.$('.panel');
const phageListItems = await page.$$('.list-item');
console.log('\n=== UI CHECK ===');
console.log('Main panels rendered:', hasContent ? 'YES' : 'NO');
console.log('Phage list items:', phageListItems.length);

// Take screenshot
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const screenshotPath = `/tmp/phage-screenshot-${timestamp}.png`;
await page.screenshot({ path: screenshotPath, fullPage: true });
console.log(`\nScreenshot saved to ${screenshotPath}`);

// Also save to a fixed path for easy viewing
await page.screenshot({ path: '/tmp/phage-latest.png', fullPage: true });
console.log('Latest screenshot: /tmp/phage-latest.png');

await browser.close();

// Exit with error code if there were errors
if (errors.length > 0) {
  process.exit(1);
}
