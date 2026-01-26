/**
 * Visual Regression E2E Tests
 *
 * @fileoverview
 * Captures baseline screenshots of premium surfaces for visual regression detection.
 * These screenshots are attached as artifacts for human review on CI.
 *
 * Related bead: phage_explorer-s4qx.8.7
 *
 * Captured surfaces:
 * - Welcome overlay (desktop)
 * - Settings overlay
 * - Command palette
 * - Analysis menu
 * - 3D panel with quality menu
 * - Mobile bottom nav + FAB (mobile projects only)
 *
 * Outputs:
 * - Named screenshots attached to test results
 * - events.jsonl with UI state info
 */

import { test, expect, type Page } from '@playwright/test';
import { setupTestHarness } from './e2e-harness';

interface VisualCaptureEvent {
  surface: string;
  state: string;
  viewport: { width: number; height: number };
  ts: number;
}

/**
 * Helper to capture a screenshot with consistent naming and event logging.
 */
async function captureScreenshot(
  page: Page,
  testInfo: { attach: (name: string, options: { body: Buffer; contentType: string }) => Promise<void>; outputPath: (name: string) => string },
  surfaceName: string,
  events: VisualCaptureEvent[],
  startTs: number
): Promise<void> {
  const viewport = page.viewportSize();
  events.push({
    surface: surfaceName,
    state: 'captured',
    viewport: viewport ?? { width: 0, height: 0 },
    ts: Date.now() - startTs,
  });

  const screenshot = await page.screenshot({ fullPage: false });
  await testInfo.attach(`visual-${surfaceName}.png`, {
    body: screenshot,
    contentType: 'image/png',
  });
}

test.describe('Visual Regression - Desktop', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'Visual regression tests run on Chromium only for consistency'
  );

  test('capture premium surfaces', async ({ page }, testInfo) => {
    // Skip on mobile projects
    if (/(^mobile-|^android-|^tablet-)/.test(testInfo.project.name)) {
      test.skip();
      return;
    }

    const { state, finalize, consoleErrors, pageErrors } = setupTestHarness(page, testInfo);
    const events: VisualCaptureEvent[] = [];

    await test.step('Set desktop viewport', async () => {
      await page.setViewportSize({ width: 1600, height: 900 });
    });

    await test.step('Clear localStorage for first-run state', async () => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#root > div', { timeout: 30000 });
      await page.waitForTimeout(500);
    });

    await test.step('Capture: Welcome Overlay', async () => {
      const welcomeOverlay = page.locator('[data-testid="overlay-welcome"], .overlay-welcome');
      await expect(welcomeOverlay).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(300); // Allow animations to settle
      await captureScreenshot(page, testInfo, 'welcome-overlay-desktop', events, state.startTs);

      // Dismiss welcome
      const skip = page.locator('.welcome-footer__skip');
      if (await skip.isVisible()) {
        await skip.click();
        await expect(welcomeOverlay).toBeHidden({ timeout: 5000 });
      }
    });

    await test.step('Wait for app hydration', async () => {
      await page.waitForTimeout(1000);
      const quickStats = page.locator('.quick-stats');
      await expect(quickStats).toBeVisible({ timeout: 30000 });
    });

    await test.step('Capture: Settings Overlay', async () => {
      await page.keyboard.press('Control+,');
      const settingsOverlay = page.locator('[data-testid="overlay-settings"]');
      await expect(settingsOverlay).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(300);
      await captureScreenshot(page, testInfo, 'settings-overlay', events, state.startTs);
      await page.keyboard.press('Escape');
      await expect(settingsOverlay).toBeHidden({ timeout: 5000 });
    });

    await test.step('Capture: Command Palette', async () => {
      await page.keyboard.press(':');
      const palette = page.locator('[data-testid="overlay-commandPalette"]');
      await expect(palette).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(300);
      await captureScreenshot(page, testInfo, 'command-palette', events, state.startTs);
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await expect(palette).toBeHidden({ timeout: 5000 });
    });

    await test.step('Capture: Analysis Menu', async () => {
      await page.keyboard.press('a');
      const analysisMenu = page.locator('[data-testid="overlay-analysisMenu"]');
      await expect(analysisMenu).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(300);
      await captureScreenshot(page, testInfo, 'analysis-menu', events, state.startTs);
      await page.keyboard.press('Escape');
      await expect(analysisMenu).toBeHidden({ timeout: 5000 });
    });

    await test.step('Capture: 3D Panel', async () => {
      // Find and enable 3D toggle
      const toolbar = page.locator('.action-toolbar');
      const toggle3D = toolbar.getByRole('button', { name: '3D' }).first();

      if (await toggle3D.isVisible()) {
        const isPressed = await toggle3D.getAttribute('aria-pressed');
        if (isPressed !== 'true') {
          await toggle3D.click();
          await page.waitForTimeout(500);
        }

        // Scroll to 3D panel
        const threePanel = page.locator('.panel', { hasText: '3D Structure' }).first();
        if (await threePanel.isVisible()) {
          await threePanel.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
          await captureScreenshot(page, testInfo, '3d-panel', events, state.startTs);
        }
      }
    });

    await test.step('Capture: Help Overlay', async () => {
      await page.keyboard.press('?');
      const helpOverlay = page.locator('[data-testid="overlay-help"]');
      await expect(helpOverlay).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(300);
      await captureScreenshot(page, testInfo, 'help-overlay', events, state.startTs);
      await page.keyboard.press('Escape');
      await expect(helpOverlay).toBeHidden({ timeout: 5000 });
    });

    // Attach events log
    await testInfo.attach('visual-capture-events.json', {
      body: Buffer.from(JSON.stringify({ events }, null, 2)),
      contentType: 'application/json',
    });

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);

    await finalize();
  });
});

test.describe('Visual Regression - Mobile', () => {
  test('capture mobile surfaces', async ({ page }, testInfo) => {
    // Only run on mobile projects
    if (!/(^mobile-|^android-|^tablet-)/.test(testInfo.project.name)) {
      test.skip();
      return;
    }

    const { state, finalize, consoleErrors, pageErrors } = setupTestHarness(page, testInfo);
    const events: VisualCaptureEvent[] = [];

    await test.step('Cold load', async () => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#root > div', { timeout: 30000 });
      await page.waitForTimeout(500);
    });

    await test.step('Capture: Welcome Overlay (Mobile)', async () => {
      const welcomeOverlay = page.locator('.overlay-welcome');
      if (await welcomeOverlay.isVisible()) {
        await page.waitForTimeout(300);
        await captureScreenshot(page, testInfo, 'welcome-overlay-mobile', events, state.startTs);

        // Check for bottom sheet rendering
        const bottomSheet = page.locator('.bottom-sheet__container');
        if (await bottomSheet.isVisible()) {
          events.push({
            surface: 'welcome-overlay-mobile',
            state: 'rendered-as-bottom-sheet',
            viewport: page.viewportSize() ?? { width: 0, height: 0 },
            ts: Date.now() - state.startTs,
          });
        }

        // Dismiss
        const skip = page.locator('.welcome-footer__skip');
        if (await skip.isVisible()) {
          await skip.click();
          await expect(welcomeOverlay).toBeHidden({ timeout: 5000 });
        }
      }
    });

    await test.step('Wait for app hydration', async () => {
      const quickStats = page.locator('.quick-stats');
      await expect(quickStats).toBeVisible({ timeout: 30000 });
    });

    await test.step('Capture: Mobile FAB + Bottom Nav', async () => {
      // Capture the main app view with FAB visible
      const fab = page.getByRole('button', { name: 'Open control menu' });
      if (await fab.isVisible()) {
        await captureScreenshot(page, testInfo, 'mobile-main-with-fab', events, state.startTs);
      }
    });

    await test.step('Capture: Action Drawer', async () => {
      const fab = page.getByRole('button', { name: 'Open control menu' });
      if (await fab.isVisible()) {
        await fab.click();
        const drawer = page.locator('#action-drawer');
        await expect(drawer).toBeVisible({ timeout: 5000 });
        await page.waitForTimeout(300);
        await captureScreenshot(page, testInfo, 'mobile-action-drawer', events, state.startTs);

        // Close drawer
        const sheetClose = page.locator('.bottom-sheet__close').first();
        if (await sheetClose.isVisible()) {
          await sheetClose.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
    });

    await test.step('Capture: Settings (Mobile)', async () => {
      const settingsButton = page.getByRole('button', { name: 'Open settings' });
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        const settingsOverlay = page.locator('.overlay-settings');
        await expect(settingsOverlay).toBeVisible({ timeout: 5000 });
        await page.waitForTimeout(300);
        await captureScreenshot(page, testInfo, 'mobile-settings', events, state.startTs);

        // Close
        const sheetClose = page.locator('.bottom-sheet__close').first();
        if (await sheetClose.isVisible()) {
          await sheetClose.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
    });

    // Attach events log
    await testInfo.attach('visual-capture-events-mobile.json', {
      body: Buffer.from(JSON.stringify({ events }, null, 2)),
      contentType: 'application/json',
    });

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);

    await finalize();
  });
});

test.describe('Visual Regression - Component States', () => {
  test('capture loading and empty states', async ({ page }, testInfo) => {
    // Skip on mobile
    if (/(^mobile-|^android-|^tablet-)/.test(testInfo.project.name)) {
      test.skip();
      return;
    }

    const { state, finalize } = setupTestHarness(page, testInfo);
    const events: VisualCaptureEvent[] = [];

    await test.step('Set viewport', async () => {
      await page.setViewportSize({ width: 1600, height: 900 });
    });

    await test.step('Capture initial loading state (if fast enough)', async () => {
      // Navigate and try to capture loading state
      const startTime = Date.now();
      await page.goto('/');

      // Try to capture loading skeleton if visible
      const skeleton = page.locator('.skeleton, .loading-skeleton');
      const isSkeletonVisible = await skeleton.isVisible().catch(() => false);

      if (isSkeletonVisible) {
        await captureScreenshot(page, testInfo, 'loading-state', events, state.startTs);
      } else {
        events.push({
          surface: 'loading-state',
          state: 'too-fast-to-capture',
          viewport: { width: 1600, height: 900 },
          ts: Date.now() - startTime,
        });
      }
    });

    await test.step('Wait for app', async () => {
      await page.waitForSelector('#root > div', { timeout: 30000 });
      await page.waitForTimeout(500);

      // Dismiss welcome if present
      const welcomeOverlay = page.locator('.overlay-welcome');
      const skip = page.locator('.welcome-footer__skip');
      if (await welcomeOverlay.isVisible()) {
        await skip.click();
        await expect(welcomeOverlay).toBeHidden({ timeout: 5000 });
      }
    });

    // Attach events log
    await testInfo.attach('visual-states-events.json', {
      body: Buffer.from(JSON.stringify({ events }, null, 2)),
      contentType: 'application/json',
    });

    await finalize();
  });
});
