import { test, expect } from '@playwright/test';

test('mobile: welcome sheet visible and Lenis disabled', async ({ page }) => {
  // iPhone 14-ish viewport
  await page.setViewportSize({ width: 393, height: 852 });

  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#root > div', { timeout: 30000 });
  await page.waitForTimeout(1500);

  // On touch devices we should not initialize Lenis at all.
  const htmlClassName = await page.evaluate(() => document.documentElement.className);
  expect(htmlClassName).not.toMatch(/\blenis\b/);

  // Welcome overlay should show on first run and be reachable on mobile.
  const sheet = page.locator('.bottom-sheet__container');
  await expect(sheet).toBeVisible();

  const welcomeOverlay = page.locator('.overlay-welcome');
  await expect(welcomeOverlay).toBeVisible();

  const skip = page.locator('.welcome-footer__skip');
  await expect(skip).toBeVisible();
  await expect(skip).toBeEnabled();

  const [skipBox, viewport] = await Promise.all([skip.boundingBox(), page.viewportSize()]);
  expect(skipBox).not.toBeNull();
  expect(viewport).not.toBeNull();

  if (skipBox && viewport) {
    expect(skipBox.y + skipBox.height).toBeLessThanOrEqual(viewport.height + 1);
  }

  // Mobile scroll flicker mitigation: backdrop-filter should be disabled on touch devices.
  const headerBackdrop = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>('.app-header');
    if (!header) return null;
    const style = window.getComputedStyle(header);
    return {
      backdropFilter: (style as unknown as { backdropFilter?: string }).backdropFilter ?? '',
      webkitBackdropFilter: (style as unknown as { webkitBackdropFilter?: string }).webkitBackdropFilter ?? '',
    };
  });

  expect(headerBackdrop).not.toBeNull();
  if (headerBackdrop) {
    expect(headerBackdrop.backdropFilter.includes('blur')).toBe(false);
    expect(headerBackdrop.webkitBackdropFilter.includes('blur')).toBe(false);
  }

  // Dismiss welcome and ensure other overlays can open on mobile.
  await skip.click();
  await expect(welcomeOverlay).toBeHidden({ timeout: 5000 });

  const settingsButton = page.getByRole('button', { name: 'Open settings' });
  await expect(settingsButton).toBeVisible();
  await settingsButton.click();

  const settingsOverlay = page.locator('.overlay-settings');
  await expect(settingsOverlay).toBeVisible();

  const settingsClose = page.locator('.bottom-sheet__close').first();
  await expect(settingsClose).toBeVisible();
  await settingsClose.click();
  await expect(settingsOverlay).toBeHidden({ timeout: 5000 });

  // No uncaught JS errors.
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);

  await page.screenshot({ path: 'test-results/repro-mobile-welcome.png' });
});
