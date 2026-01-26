import { test, expect } from '@playwright/test';
import { setupTestHarness } from './e2e-harness';

test.describe('Overlay Lazy Loading', () => {
  test('should not load overlay chunks until opened', async ({ page }, testInfo) => {
    // 1. Setup harness
    const { state, finalize, consoleErrors, pageErrors } = setupTestHarness(page, testInfo);
    let openedHelpAtMs = 0;

    await test.step('Cold load', async () => {
      // Navigate to app
      await page.goto('/');
      
      // Wait for app to be interactive (e.g., header visible)
      await expect(page.locator('header')).toBeVisible();
      
      // Wait a bit to ensure no lingering requests
      await page.waitForTimeout(1000);
    });

    await test.step('Verify no eager overlay loads', async () => {
      // Filter network requests for potential overlay chunks
      // Look for JS files that might be overlays (usually dynamic imports)
      // We expect the main bundle and maybe some vendor chunks, but not specific overlay chunks
      
      const requests = state.network.filter(n => n.type === 'request');
      
      // Heuristic: Check for common overlay names in requested URLs
      const overlayNames = [
        'HelpOverlay',
        'SettingsOverlay', 
        'CommandPalette',
        'AnalysisMenu',
        'GCSkewOverlay'
      ];

      const eagerOverlays = requests.filter(req => 
        overlayNames.some(name => req.url.includes(name))
      );

      if (eagerOverlays.length > 0) {
        console.log('Detected eager overlay requests:', eagerOverlays.map(r => r.url));
      }

      expect(eagerOverlays, 'Should not load overlay chunks eagerly').toHaveLength(0);
    });

    await test.step('Open Help Overlay', async () => {
      openedHelpAtMs = Date.now() - state.startTs;
      // Press '?' to open help
      await page.keyboard.press('?');
      
      // Wait for overlay to appear
      const overlay = page.locator('[role="dialog"][aria-label="Keyboard Shortcuts"]');
      await expect(overlay).toBeVisible();
    });

    await test.step('Verify chunk loaded on demand', async () => {
      // Now we SHOULD see a request for HelpOverlay (or at least a new chunk)
      const requests = state.network.filter(n => n.type === 'request');
      
      // Note: Vite might mangle names in production build, but in dev/preview they often keep names.
      // If names are mangled, we'd check for *any* new JS request.
      // For now, assuming standard Vite behavior where dynamic imports preserve some name hint or we check for a new JS request.
      
      const lazyLoadRequest = requests.find((req) => {
        if (req.ts < openedHelpAtMs) return false;
        // Vite dev uses module URLs that often include source paths; prod uses chunk files.
        if (req.url.includes('HelpOverlay')) return true;
        if (req.url.includes('/overlays/')) return true;
        // Fallback: any JS module request after opening help.
        return /\.([cm]?js)(\\?|$)/.test(req.url);
      });

      expect(lazyLoadRequest, 'Expected an overlay chunk/module request after opening Help').toBeTruthy();
    });

    // 3. Cleanup
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    await finalize();
  });
});
