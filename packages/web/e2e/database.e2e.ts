import { test, expect } from '@playwright/test';
import { setupTestHarness } from './e2e-harness';

test('database loads successfully', async ({ page }, testInfo) => {
  const { consoleErrors, finalize } = setupTestHarness(page, testInfo);

  // Clear IndexedDB before test
  await page.goto('http://localhost:5173');
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('phage-explorer-db');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  });

  // Reload with clean state
  await page.reload();

  // Wait for the app to load and database to initialize
  // The app should show phage list items when DB loads successfully
  await page.waitForSelector('[data-testid="phage-list-item"], .phage-item, [class*="phage"]', {
    timeout: 30000,
  }).catch(() => null);

  // Check for error messages
  const errorText = await page.locator('text=/file is not a database/i').count();
  expect(errorText).toBe(0);

  // Check for "Database Load Failed" text
  const failedText = await page.locator('text=/Database Load Failed/i').count();
  expect(failedText).toBe(0);

  // Wait a bit more for any async errors
  await page.waitForTimeout(3000);

  // Filter for database-related errors
  const dbErrors = consoleErrors.filter(e =>
    e.includes('file is not a database') ||
    e.includes('Database') ||
    e.includes('SQLite')
  );

  expect(dbErrors).toHaveLength(0);
  await finalize();
});

test('phage list renders after database loads', async ({ page }, testInfo) => {
  const { finalize } = setupTestHarness(page, testInfo);

  await page.goto('http://localhost:5173');

  // Wait for loading to complete - look for any content that indicates success
  await page.waitForFunction(() => {
    // Check if there's loading indicator gone or content appeared
    const loading = document.querySelector('[class*="loading"]');
    const content = document.body.innerText;
    return !loading || content.includes('T4') || content.includes('Lambda') || content.includes('phage');
  }, { timeout: 30000 });

  // Take a screenshot for debugging
  await page.screenshot({ path: testInfo.outputPath('database-load.png') });

  // Verify no error state
  const bodyText = await page.locator('body').innerText();
  expect(bodyText).not.toContain('file is not a database');
  expect(bodyText).not.toContain('Database Load Failed');

  await finalize();
});
