import { test, expect, type Page } from '@playwright/test';

type AxeViolationNode = {
  target: string[];
  failureSummary?: string;
};

type AxeViolation = {
  id: string;
  impact?: string;
  help: string;
  helpUrl: string;
  nodes: AxeViolationNode[];
};

type AxeResults = {
  violations: AxeViolation[];
};

const AXE_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/axe-core@4.11.0/axe.min.js';

async function setExperienceLevel(page: Page, level: 'novice' | 'intermediate' | 'power'): Promise<void> {
  await page.addInitScript((requestedLevel: string) => {
    try {
      const STORAGE_KEY = 'phage-explorer-main-prefs';
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...parsed,
          experienceLevel: requestedLevel,
        })
      );
    } catch {
      // Ignore storage failures in restricted environments
    }
  }, level);
}

function formatViolations(label: string, violations: AxeViolation[]): string {
  if (violations.length === 0) return '';

  const lines: string[] = [`axe-core violations in "${label}":`];

  for (const v of violations.slice(0, 10)) {
    lines.push(`- ${v.id} (${v.impact ?? 'unknown'}): ${v.help}`);
    lines.push(`  ${v.helpUrl}`);
    for (const node of v.nodes.slice(0, 5)) {
      const target = node.target.join(', ');
      const summary = node.failureSummary?.replace(/\s+/g, ' ').trim();
      lines.push(`  • ${target}${summary ? ` — ${summary}` : ''}`);
    }
  }

  if (violations.length > 10) {
    lines.push(`…and ${violations.length - 10} more violation(s).`);
  }

  return lines.join('\n');
}

async function waitForAppReady(page: Page): Promise<void> {
  // The keyboard manager registers hotkeys during React mount; avoid flakiness on slow CI.
  await page.waitForSelector('button.btn', { state: 'attached', timeout: 10000 });
}

async function ensureAxeLoaded(page: Page): Promise<void> {
  const alreadyLoaded = await page.evaluate(() => {
    const axe = (window as unknown as { axe?: { run?: unknown } }).axe;
    return typeof axe?.run === 'function';
  }).catch(() => false);

  if (alreadyLoaded) return;
  try {
    await page.addScriptTag({ url: AXE_SCRIPT_URL });
  } catch (err) {
    throw new Error(
      `Failed to inject axe-core from ${AXE_SCRIPT_URL}. Ensure network access is available when running this test.\n${String(err)}`
    );
  }
}

async function runA11yAudit(page: Page): Promise<AxeResults> {
  await ensureAxeLoaded(page);
  return await page.evaluate(async (): Promise<AxeResults> => {
    const axe = (window as unknown as { axe?: { run?: (context?: unknown, options?: unknown) => Promise<AxeResults> } }).axe;
    if (typeof axe?.run !== 'function') throw new Error('axe-core failed to load');
    return await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag21a', 'wcag21aa'] },
    });
  });
}

async function expectNoA11yViolations(page: Page, label: string): Promise<void> {
  const results = await runA11yAudit(page);
  expect(results.violations, formatViolations(label, results.violations)).toEqual([]);
}

test('WCAG 2.1 A/AA: base + key overlays', async ({ page }) => {
  // Keep this test stable even when experience level gating changes.
  await setExperienceLevel(page, 'power');

  // `networkidle` can hang on Vite (HMR websocket).
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForAppReady(page);

  // If the Welcome modal auto-opens (fresh storage), audit it first.
  const welcome = page.locator('.overlay-welcome');
  const welcomeVisible = await welcome
    .waitFor({ state: 'visible', timeout: 2500 })
    .then(() => true)
    .catch(() => false);

  if (welcomeVisible) {
    await expectNoA11yViolations(page, 'Welcome modal');
    await page.keyboard.press('Escape');
    await welcome.waitFor({ state: 'detached', timeout: 5000 }).catch(() => null);
    await page.waitForTimeout(200);
  }

  await expectNoA11yViolations(page, 'Base');

  // Help overlay (?)
  await page.keyboard.press('Shift+Slash');
  const help = page.locator('.overlay-help');
  await help.waitFor({ state: 'visible', timeout: 5000 });
  await expectNoA11yViolations(page, 'Help overlay');
  await page.keyboard.press('Escape');
  await help.waitFor({ state: 'detached', timeout: 5000 }).catch(() => null);
  await page.waitForTimeout(200);

  // Command palette (:)
  await page.keyboard.press('Shift+Semicolon');
  const palette = page.locator('.overlay-commandPalette');
  await palette.waitFor({ state: 'visible', timeout: 5000 });
  await expectNoA11yViolations(page, 'Command palette');
  await page.keyboard.press('Escape');
  await palette.waitFor({ state: 'detached', timeout: 5000 }).catch(() => null);
  await page.waitForTimeout(200);

  // Search overlay (/)
  await page.keyboard.press('Slash');
  const search = page.locator('.overlay-search');
  await search.waitFor({ state: 'visible', timeout: 10000 });
  await expectNoA11yViolations(page, 'Search overlay');
  await page.keyboard.press('Escape');
  await search.waitFor({ state: 'detached', timeout: 5000 }).catch(() => null);
  await page.waitForTimeout(200);

  // Analysis menu (a)
  await page.keyboard.press('a');
  const analysis = page.locator('.overlay-analysisMenu');
  await analysis.waitFor({ state: 'visible', timeout: 5000 });
  await expectNoA11yViolations(page, 'Analysis menu');
  await page.keyboard.press('Escape');
  await analysis.waitFor({ state: 'detached', timeout: 5000 }).catch(() => null);
  await page.waitForTimeout(200);

  // Settings overlay (Ctrl+,)
  await page.keyboard.press('Control+,');
  const settings = page.locator('.overlay-settings');
  await settings.waitFor({ state: 'visible', timeout: 5000 });
  await expectNoA11yViolations(page, 'Settings overlay');
  await page.keyboard.press('Escape');
  await settings.waitFor({ state: 'detached', timeout: 5000 }).catch(() => null);
});

// Helper to test an overlay with a simple hotkey
async function testOverlayA11y(
  page: Page,
  hotkey: string,
  overlayId: string,
  label: string
): Promise<void> {
  await page.keyboard.press(hotkey);
  const overlay = page.locator(`.overlay-${overlayId}`);
  await overlay.waitFor({ state: 'visible', timeout: 8000 });
  await expectNoA11yViolations(page, label);
  await page.keyboard.press('Escape');
  await overlay.waitFor({ state: 'detached', timeout: 5000 }).catch(() => null);
  await page.waitForTimeout(150);
}

test('WCAG 2.1 A/AA: analysis overlays', async ({ page }) => {
  // These overlays are gated behind Intermediate/Power hotkeys.
  await setExperienceLevel(page, 'power');

  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForAppReady(page);

  // Dismiss Welcome modal if present
  const welcome = page.locator('.overlay-welcome');
  const welcomeVisible = await welcome
    .waitFor({ state: 'visible', timeout: 2500 })
    .then(() => true)
    .catch(() => false);
  if (welcomeVisible) {
    await page.keyboard.press('Escape');
    await welcome.waitFor({ state: 'detached', timeout: 5000 }).catch(() => null);
    await page.waitForTimeout(200);
  }

  // GC Skew (g)
  await testOverlayA11y(page, 'g', 'gcSkew', 'GC Skew overlay');

  // Complexity (x)
  await testOverlayA11y(page, 'x', 'complexity', 'Complexity overlay');

  // Bendability (b)
  await testOverlayA11y(page, 'b', 'bendability', 'Bendability overlay');

  // Promoter (p)
  await testOverlayA11y(page, 'p', 'promoter', 'Promoter overlay');

  // Repeats (r)
  await testOverlayA11y(page, 'r', 'repeats', 'Repeats overlay');

  // K-mer Anomaly (Alt+J)
  await testOverlayA11y(page, 'Alt+j', 'kmerAnomaly', 'K-mer Anomaly overlay');

  // Hilbert (Alt+Shift+H)
  await testOverlayA11y(page, 'Alt+Shift+h', 'hilbert', 'Hilbert curve overlay');

  // Gel (Alt+G)
  await testOverlayA11y(page, 'Alt+g', 'gel', 'Gel electrophoresis overlay');

  // Dot Plot (Alt+O)
  await testOverlayA11y(page, 'Alt+o', 'dotPlot', 'Dot plot overlay');

  // Bias Decomposition (Alt+B)
  await testOverlayA11y(page, 'Alt+b', 'biasDecomposition', 'Bias Decomposition overlay');
});

test('WCAG 2.1 A/AA: reference overlays', async ({ page }) => {
  // Keep reference overlays audited under the same "power user" state.
  await setExperienceLevel(page, 'power');

  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForAppReady(page);

  // Dismiss Welcome modal if present
  const welcome = page.locator('.overlay-welcome');
  const welcomeVisible = await welcome
    .waitFor({ state: 'visible', timeout: 2500 })
    .then(() => true)
    .catch(() => false);
  if (welcomeVisible) {
    await page.keyboard.press('Escape');
    await welcome.waitFor({ state: 'detached', timeout: 5000 }).catch(() => null);
    await page.waitForTimeout(200);
  }

  // AA Key (Shift+K)
  await testOverlayA11y(page, 'Shift+K', 'aaKey', 'Amino Acid Key overlay');

  // AA Legend (Shift+L)
  await testOverlayA11y(page, 'Shift+L', 'aaLegend', 'Amino Acid Legend overlay');

  // Goto (Ctrl+g)
  await testOverlayA11y(page, 'Control+g', 'goto', 'Goto overlay');

  // HGT (Alt+H)
  await testOverlayA11y(page, 'Alt+h', 'hgt', 'HGT detection overlay');
});
