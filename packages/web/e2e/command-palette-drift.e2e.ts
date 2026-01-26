import { test, expect } from '@playwright/test';
import { setupTestHarness } from './e2e-harness';
import { ActionRegistry, ActionIds } from '../src/keyboard/actionRegistry';
import { formatPrimaryActionShortcut, type ShortcutPlatform } from '../src/keyboard/actionSurfaces';

test.describe('Command Palette Drift', () => {
  test('should display shortcuts matching ActionRegistry', async ({ page }, testInfo) => {
    const { finalize } = setupTestHarness(page, testInfo);

    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();

    // Open Command Palette
    await page.keyboard.press(':');
    const palette = page.locator('.overlay-commandPalette');
    await expect(palette).toBeVisible();

    // Check a few key actions
    const shortcutPlatform = await page.evaluate((): ShortcutPlatform => {
      const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
      const platform = (nav.userAgentData?.platform ?? navigator.platform ?? '').toLowerCase();
      return platform.includes('mac') ? 'mac' : 'default';
    });

    const checkAction = async (actionId: string) => {
      const action = ActionRegistry[actionId as keyof typeof ActionRegistry];
      if (!action) return;
      
      // Find the item in the palette
      const item = palette.locator('[role="option"]', { hasText: action.title }).first();
      await expect(item).toBeVisible();

      const expected = formatPrimaryActionShortcut(action, shortcutPlatform);
      expect(expected).toBeTruthy();

      const shortcutHint = item.locator('.key-hint').first();
      await expect(shortcutHint).toHaveText(expected!);
    };

    await checkAction(ActionIds.OverlaySettings);
    await checkAction(ActionIds.OverlayHelp);
    await checkAction(ActionIds.ViewToggle3DModel);

    await finalize();
  });
});
