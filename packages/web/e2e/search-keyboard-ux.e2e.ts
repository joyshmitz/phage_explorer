import { test, expect } from '@playwright/test';
import { setupTestHarness } from './e2e-harness';

test.describe('SearchOverlay Keyboard UX', () => {
  test('should autofocus input and support keyboard navigation', async ({ page }, testInfo) => {
    const { finalize } = setupTestHarness(page, testInfo);

    await test.step('Load app', async () => {
      await page.goto('/');
      await expect(page.locator('header')).toBeVisible();
      await page.waitForTimeout(500); // Wait for hydration
    });

    await test.step('Open Search overlay with /', async () => {
      await page.keyboard.press('/');
      const searchOverlay = page.locator('.overlay-search');
      await expect(searchOverlay).toBeVisible();
    });

    await test.step('Input should be autofocused', async () => {
      // The input should be focused automatically
      const input = page.locator('.overlay-search input[type="text"]');
      await expect(input).toBeFocused();
    });

    await test.step('Escape with empty query should close overlay', async () => {
      await page.keyboard.press('Escape');
      await expect(page.locator('.overlay-search')).toBeHidden();
    });

    await test.step('Reopen and test Escape clears query first', async () => {
      await page.keyboard.press('/');
      await expect(page.locator('.overlay-search')).toBeVisible();

      const input = page.locator('.overlay-search input[type="text"]');
      await input.fill('test query');
      await expect(input).toHaveValue('test query');

      // First Escape should clear the query, not close
      await page.keyboard.press('Escape');
      await expect(page.locator('.overlay-search')).toBeVisible();
      await expect(input).toHaveValue('');

      // Second Escape closes
      await page.keyboard.press('Escape');
      await expect(page.locator('.overlay-search')).toBeHidden();
    });

    await finalize();
  });

  test('results list structure should support keyboard navigation', async ({ page }, testInfo) => {
    const { finalize } = setupTestHarness(page, testInfo);

    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();

    await test.step('Open Search overlay', async () => {
      await page.keyboard.press('/');
      await expect(page.locator('.overlay-search')).toBeVisible();
    });

    await test.step('Verify overlay structure is correct', async () => {
      // The search overlay should be present with the input
      const input = page.locator('.overlay-search input[type="text"]');
      await expect(input).toBeVisible();

      // Arrow keys should not cause errors when there are no results
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('Enter');

      // Overlay should still be open (no errors occurred)
      await expect(page.locator('.overlay-search')).toBeVisible();
    });

    await finalize();
  });
});
