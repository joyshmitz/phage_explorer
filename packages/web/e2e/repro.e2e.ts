import { test, expect } from '@playwright/test';

test('mobile: welcome sheet visible and Lenis disabled', async ({ page }, testInfo) => {
  test.skip(
    !/(^mobile-|^android-|^tablet-)/.test(testInfo.project.name),
    'Mobile-only assertions (touch + coarse pointer)'
  );

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
  const welcomeOverlay = page.locator('.overlay-welcome');
  await expect(welcomeOverlay).toBeVisible();

  const skip = page.locator('.welcome-footer__skip');
  await expect(skip).toBeVisible();
  await expect(skip).toBeEnabled();

  const [isBottomSheet, skipRect, viewport] = await Promise.all([
    page.locator('.bottom-sheet__container').isVisible().catch(() => false),
    skip.evaluate((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, height: rect.height };
    }),
    page.viewportSize(),
  ]);

  expect(viewport).not.toBeNull();
  if (viewport) {
    expect(skipRect.bottom).toBeLessThanOrEqual(viewport.height + 1);
  }

  // On narrow mobile, Welcome should render its footer into the BottomSheet footer slot.
  if (isBottomSheet) {
    const isInBottomSheetFooter = await skip.evaluate((el) => Boolean(el.closest('.bottom-sheet__footer')));
    expect(isInBottomSheetFooter).toBe(true);
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

  const settingsBottomSheetClose = page.locator('.bottom-sheet__close').first();
  if (await settingsBottomSheetClose.isVisible().catch(() => false)) {
    await settingsBottomSheetClose.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await expect(settingsOverlay).toBeHidden({ timeout: 5000 });

  // No uncaught JS errors.
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);

  await page.screenshot({ path: testInfo.outputPath('repro-mobile-welcome.png') });
});

test('desktop: key overlays open and no console errors', async ({ page }, testInfo) => {
  test.skip(
    /(^mobile-|^android-|^tablet-)/.test(testInfo.project.name),
    'Desktop-only assertions'
  );

  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#root > div', { timeout: 30000 });
  await page.waitForTimeout(500);

  // Dismiss welcome modal if present.
  const welcomeOverlay = page.locator('.overlay-welcome');
  const skip = page.locator('.welcome-footer__skip');
  if (await welcomeOverlay.isVisible()) {
    await expect(skip).toBeVisible();
    await skip.click();
    await expect(welcomeOverlay).toBeHidden({ timeout: 5000 });
  }

  // Settings overlay opens and closes.
  const settingsButton = page.getByRole('button', { name: 'Open settings' });
  await expect(settingsButton).toBeVisible();
  await settingsButton.click();

  const settingsOverlay = page.locator('.overlay-settings');
  await expect(settingsOverlay).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(settingsOverlay).toBeHidden({ timeout: 5000 });

  // Command palette opens and closes.
  await page.keyboard.press(':');
  const palette = page.locator('.overlay-commandPalette');
  await expect(palette).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(palette).toBeHidden({ timeout: 5000 });

  // No uncaught JS errors.
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
