import { test, expect } from '@playwright/test';
import { setupTestHarness } from './e2e-harness';

test.describe('Hotkeys and Overlay Stack', () => {
  test('should enforce overlay stack limit and support undo', async ({ page }, testInfo) => {
    const { finalize } = setupTestHarness(page, testInfo);

    await test.step('Cold load', async () => {
      await page.goto('/');
      await expect(page.locator('header')).toBeVisible();
      await page.waitForTimeout(500); // Wait for hydration
    });

    await test.step('Open 3 overlays (Help, Settings, CommandPalette)', async () => {
      // 1. Open Help (?)
      await page.keyboard.press('?');
      await expect(page.locator('.overlay-help')).toBeVisible();

      // 2. Open Settings (Ctrl+,)
      await page.keyboard.press('Control+,');
      await expect(page.locator('.overlay-settings')).toBeVisible();

      // 3. Open Command Palette (:)
      await page.keyboard.press(':');
      await expect(page.locator('.overlay-commandPalette')).toBeVisible();

      // Assert stack size is 3 (all visible)
      // Note: older overlays might be hidden visually if CSS handles it, but they should be in DOM.
      // OverlayProvider usually renders them all.
      const overlays = page.locator('[role="dialog"][class*="overlay-"]');
      expect(await overlays.count()).toBe(3);
    });

    await test.step('Open 4th overlay (Analysis Menu) - expect replacement', async () => {
      // 4. Open Analysis Menu (a)
      await page.keyboard.press('a');
      
      // Expect Analysis Menu to appear
      await expect(page.locator('.overlay-analysisMenu')).toBeVisible();
      
      // Expect stack size to remain 3 (Help should be evicted)
      const overlays = page.locator('[role="dialog"][class*="overlay-"]');
      expect(await overlays.count()).toBe(3);
      
      // Help should be gone
      await expect(page.locator('.overlay-help')).toBeHidden();
      
      // Check for toast
      const toast = page.locator('[data-testid="overlay-stack-limit-toast"]');
      await expect(toast).toBeVisible();
      await expect(toast).toContainText('Overlay limit');
    });

    await test.step('Undo eviction', async () => {
      const undoBtn = page.locator('[data-testid="overlay-stack-limit-undo"]');
      await undoBtn.click();
      
      // Expect Analysis Menu to disappear
      await expect(page.locator('.overlay-analysisMenu')).toBeHidden();
      
      // Expect Help to reappear
      await expect(page.locator('.overlay-help')).toBeVisible();
      
      // Stack should be back to Help, Settings, CommandPalette
      await expect(page.locator('.overlay-settings')).toBeVisible();
      await expect(page.locator('.overlay-commandPalette')).toBeVisible();
    });

    await finalize();
  });

  test('should close overlays in LIFO order with Escape', async ({ page }, testInfo) => {
    const { finalize } = setupTestHarness(page, testInfo);

    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();

    // Open Help -> Settings
    await page.keyboard.press('?');
    await expect(page.locator('.overlay-help')).toBeVisible();
    
    await page.keyboard.press('Control+,');
    await expect(page.locator('.overlay-settings')).toBeVisible();

    // Verify stack order (visual check not easy, but behavior is key)
    
    // Press Escape -> Should close Settings (top), Help remains
    await page.keyboard.press('Escape');
    await expect(page.locator('.overlay-settings')).toBeHidden();
    await expect(page.locator('.overlay-help')).toBeVisible();

    // Press Escape -> Should close Help
    await page.keyboard.press('Escape');
    await expect(page.locator('.overlay-help')).toBeHidden();

    await finalize();
  });
});
