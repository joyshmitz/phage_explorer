import { test, expect } from '@playwright/test';
import { setupTestHarness } from './e2e-harness';
import { ActionRegistry, ActionIds } from '../src/keyboard/actionRegistry';

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
    const checkAction = async (actionId: string) => {
      const action = ActionRegistry[actionId as keyof typeof ActionRegistry];
      if (!action) return;
      
      // Find the item in the palette
      // Assuming palette items have text matching action title
      const item = palette.locator('[role="option"]', { hasText: action.title }).first();
      await expect(item).toBeVisible();

      // Check for shortcut hint
      // Assuming shortcut is rendered in a kbd or span
      const shortcutHint = item.locator('kbd, .shortcut-hint');
      
      // Note: The app might render "Ctrl+," as "Ctrl ," depending on implementation.
      // This test might need adjustment based on exact rendering logic.
      // For now, we check if it contains the key char.
      
      // Let's assume standard formatting.
      // If this fails, we know the UI is drifting or formatting logic differs.
      
      // Check if text content contains the key parts
      const text = await shortcutHint.textContent();
      
      // Simple check: expected key should be present
      const shortcut = Array.isArray(action.defaultShortcut) ? action.defaultShortcut[0] : action.defaultShortcut;
      // Handle both SingleKeyCombo (has 'key') and SequenceKeyCombo (has 'sequence')
      const keyToCheck = 'key' in shortcut ? shortcut.key : shortcut.sequence?.[0];
      if (keyToCheck) {
        expect(text?.toLowerCase()).toContain(keyToCheck.toLowerCase());
      }
    };

    await checkAction(ActionIds.OverlaySettings);
    await checkAction(ActionIds.OverlayHelp);
    await checkAction(ActionIds.ViewToggle3DModel);

    await finalize();
  });
});
