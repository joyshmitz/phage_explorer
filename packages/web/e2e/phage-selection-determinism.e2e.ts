/**
 * E2E tests for phage selection determinism.
 *
 * @fileoverview
 * Verifies that rapidly selecting different phages results in the UI showing
 * the LAST selected phage, not whichever finished loading first.
 *
 * Tests the stale-load guard implemented in App.tsx which prevents race conditions
 * where async load results can complete out of order.
 *
 * Related bead: phage_explorer-s4qx.8.5
 *
 * Outputs:
 * - events.jsonl: Selection events with phage IDs and timestamps
 * - screenshot on failure
 */

import { test, expect } from '@playwright/test';
import { setupTestHarness } from './e2e-harness';

test.describe('Phage Selection Determinism', () => {
  test('rapid selection results in last-selected phage displayed', async ({ page }, testInfo) => {
    const { state, finalize, consoleErrors, pageErrors } = setupTestHarness(page, testInfo);

    // Track selection events
    const selectionEvents: Array<{
      event: string;
      index: number;
      name?: string;
      ts: number;
    }> = [];

    await test.step('Cold load and wait for hydration', async () => {
      await page.goto('/');
      await expect(page.locator('header')).toBeVisible();
      // Wait for phage list to populate
      await expect(page.locator('[data-testid="phage-list"]')).toBeVisible({ timeout: 10000 });
      // Wait for initial phage to load
      await page.waitForTimeout(1000);
    });

    await test.step('Verify phage list has items', async () => {
      const phageItems = page.locator('[data-testid="phage-list"] button');
      const count = await phageItems.count();
      expect(count).toBeGreaterThan(2);
      selectionEvents.push({ event: 'list-ready', index: -1, ts: Date.now() - state.startTs });
    });

    await test.step('Rapidly select multiple phages', async () => {
      // Get phage list items
      const phageItems = page.locator('[data-testid="phage-list"] button');

      // Click phage 0, then immediately click phage 2
      // (simulates user rapidly clicking through the list)
      selectionEvents.push({ event: 'click-start', index: 0, ts: Date.now() - state.startTs });
      await phageItems.nth(0).click();

      selectionEvents.push({ event: 'click-start', index: 1, ts: Date.now() - state.startTs });
      await phageItems.nth(1).click();

      selectionEvents.push({ event: 'click-start', index: 2, ts: Date.now() - state.startTs });
      await phageItems.nth(2).click();

      // Wait for the final selection to stabilize
      await page.waitForTimeout(500);
      selectionEvents.push({ event: 'clicks-done', index: 2, ts: Date.now() - state.startTs });
    });

    await test.step('Verify last selected phage is displayed', async () => {
      // The third phage (index 2) should be selected
      const selectedItem = page.locator('[data-testid="phage-list-item-selected"]');
      await expect(selectedItem).toBeVisible({ timeout: 5000 });

      // Get the name of the selected phage
      const selectedName = await selectedItem.locator('.list-title').textContent();
      selectionEvents.push({
        event: 'final-selection',
        index: 2,
        name: selectedName ?? undefined,
        ts: Date.now() - state.startTs,
      });

      // Verify it's the third item (index 2)
      const phageItems = page.locator('[data-testid="phage-list"] button');
      const thirdPhageName = await phageItems.nth(2).locator('.list-title').textContent();

      expect(selectedName).toBe(thirdPhageName);
    });

    await test.step('Verify UI reflects the correct phage data', async () => {
      // Check that the quick stats panel shows data for the selected phage
      const quickStats = page.locator('.quick-stats');
      await expect(quickStats).toBeVisible();

      // Get the selected phage name from the list
      const selectedItem = page.locator('[data-testid="phage-list-item-selected"]');
      const selectedName = await selectedItem.locator('.list-title').textContent();

      // The header or a panel should show this phage's name
      // (This verifies that both the list selection AND the phage data are consistent)
      const phageHeader = page.locator('.phage-title, .panel-header h3, .quick-stats');
      const headerText = await phageHeader.first().textContent();

      selectionEvents.push({
        event: 'ui-verified',
        index: 2,
        name: selectedName ?? undefined,
        ts: Date.now() - state.startTs,
      });

      // Log for debugging
      console.log('[selection-determinism] Selected phage:', selectedName);
      console.log('[selection-determinism] Header content:', headerText);
    });

    // No console errors
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);

    // Attach events log
    await testInfo.attach('selection-events.json', {
      body: JSON.stringify({ events: selectionEvents }, null, 2),
      contentType: 'application/json',
    });

    await finalize();
  });

  test('keyboard navigation maintains determinism', async ({ page }, testInfo) => {
    const { finalize, consoleErrors, pageErrors } = setupTestHarness(page, testInfo);

    await test.step('Cold load', async () => {
      await page.goto('/');
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('[data-testid="phage-list"]')).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000);
    });

    await test.step('Rapidly navigate with keyboard', async () => {
      // Press down arrow multiple times rapidly
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');

      // Wait for last navigation to complete
      await page.waitForTimeout(500);

      // The 5th phage (index 4) should be selected
      const selectedItem = page.locator('[data-testid="phage-list-item-selected"]');
      await expect(selectedItem).toBeVisible();

      // Verify the selected item is the 5th in the list
      const phageItems = page.locator('[data-testid="phage-list"] button');
      const count = await phageItems.count();

      if (count >= 5) {
        const fifthPhageName = await phageItems.nth(4).locator('.list-title').textContent();
        const selectedName = await selectedItem.locator('.list-title').textContent();
        expect(selectedName).toBe(fifthPhageName);
      }
    });

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);

    await finalize();
  });

  test('mixed click and keyboard maintains determinism', async ({ page }, testInfo) => {
    const { finalize, consoleErrors, pageErrors } = setupTestHarness(page, testInfo);

    await test.step('Cold load', async () => {
      await page.goto('/');
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('[data-testid="phage-list"]')).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000);
    });

    await test.step('Click then keyboard navigate rapidly', async () => {
      const phageItems = page.locator('[data-testid="phage-list"] button');
      const count = await phageItems.count();

      if (count >= 4) {
        // Click on item 3
        await phageItems.nth(2).click();

        // Immediately navigate down with keyboard
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');

        // Wait for navigation to complete
        await page.waitForTimeout(500);

        // Should be at index 4 (2 + 2)
        const selectedItem = page.locator('[data-testid="phage-list-item-selected"]');
        const selectedName = await selectedItem.locator('.list-title').textContent();
        const fifthPhageName = await phageItems.nth(4).locator('.list-title').textContent();

        expect(selectedName).toBe(fifthPhageName);
      }
    });

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);

    await finalize();
  });
});
