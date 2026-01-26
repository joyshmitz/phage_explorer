import { describe, expect, it } from 'bun:test';
import { ActionRegistry } from './actionRegistry';
import {
  ANALYSIS_SIDEBAR_CATEGORIES,
  ACTION_DRAWER_SECTIONS,
  APP_SHELL_FOOTER_HINTS,
  formatHintKeys,
  formatPrimaryActionShortcut,
  getPrimaryShortcutCombo,
} from './actionSurfaces';
import { formatKeyCombo } from './types';

function flattenAnalysisSidebarActionIds(): string[] {
  return ANALYSIS_SIDEBAR_CATEGORIES.flatMap((category) => category.tools.map((tool) => tool.actionId));
}

function flattenAppShellHintActionIds(): string[] {
  return APP_SHELL_FOOTER_HINTS.flatMap((hint) => hint.actionIds);
}

function flattenActionDrawerActionIds(): string[] {
  return ACTION_DRAWER_SECTIONS.flatMap((section) => section.items.map((item) => item.actionId));
}

describe('actionSurfaces', () => {
  describe('AnalysisSidebar config', () => {
    it('references valid ActionIds (no drift)', () => {
      const missing: string[] = [];

      for (const actionId of flattenAnalysisSidebarActionIds()) {
        if (!ActionRegistry[actionId as keyof typeof ActionRegistry]) {
          missing.push(actionId);
        }
      }

      if (missing.length > 0) {
        console.error('AnalysisSidebar references missing ActionIds:', missing.join(', '));
      }

      expect(missing).toEqual([]);
    });

    it('does not contain duplicate ActionIds', () => {
      const ids = flattenAnalysisSidebarActionIds();
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });

    it('sidebar actions include overlay metadata', () => {
      const problems: string[] = [];

      for (const actionId of flattenAnalysisSidebarActionIds()) {
        const action = ActionRegistry[actionId as keyof typeof ActionRegistry];
        if (!action) continue;

        if (!action.overlayId || !action.overlayAction) {
          problems.push(`${actionId}: missing overlayId/overlayAction`);
        }
      }

      if (problems.length > 0) {
        console.error('AnalysisSidebar overlay metadata problems:\n' + problems.join('\n'));
      }

      expect(problems).toEqual([]);
    });

    it('shortcut badges match ActionRegistry formatting', () => {
      const mismatches: string[] = [];

      for (const actionId of flattenAnalysisSidebarActionIds()) {
        const action = ActionRegistry[actionId as keyof typeof ActionRegistry];
        if (!action) continue;

        const combo = getPrimaryShortcutCombo(action, 'default');
        const expected = combo ? formatKeyCombo(combo) : null;
        const actual = formatPrimaryActionShortcut(action, 'default');

        if (expected !== actual) {
          mismatches.push([
            `ActionId: ${actionId}`,
            `Expected: ${String(expected)}`,
            `Actual:   ${String(actual)}`,
          ].join('\n'));
        }
      }

      if (mismatches.length > 0) {
        console.error('AnalysisSidebar shortcut mismatches:\n\n' + mismatches.join('\n\n'));
      }

      expect(mismatches).toEqual([]);
    });
  });

  describe('App shell hint config', () => {
    it('references valid ActionIds (no drift)', () => {
      const missing: string[] = [];

      for (const actionId of flattenAppShellHintActionIds()) {
        if (!ActionRegistry[actionId as keyof typeof ActionRegistry]) {
          missing.push(actionId);
        }
      }

      if (missing.length > 0) {
        console.error('App shell hints reference missing ActionIds:', missing.join(', '));
      }

      expect(missing).toEqual([]);
    });

    it('hint key strings match ActionRegistry formatting', () => {
      const mismatches: string[] = [];

      for (const hint of APP_SHELL_FOOTER_HINTS) {
        const expectedParts: string[] = [];
        const missingActionIds: string[] = [];

        for (const actionId of hint.actionIds) {
          const action = ActionRegistry[actionId as keyof typeof ActionRegistry];
          if (!action) {
            missingActionIds.push(actionId);
            continue;
          }

          const combo = getPrimaryShortcutCombo(action, 'default');
          const expected = combo ? formatKeyCombo(combo) : null;
          if (expected) {
            expectedParts.push(expected);
          }
        }

        const expected = expectedParts.join(hint.separator ?? '/');
        const actual = formatHintKeys(hint, 'default');

        if (missingActionIds.length > 0) {
          mismatches.push([
            `Hint: ${hint.label}`,
            `Missing ActionIds: ${missingActionIds.join(', ')}`,
          ].join('\n'));
          continue;
        }

        if (expected !== actual) {
          mismatches.push([
            `Hint: ${hint.label}`,
            `Expected: ${expected}`,
            `Actual:   ${actual}`,
          ].join('\n'));
        }
      }

      if (mismatches.length > 0) {
        console.error('App shell hint mismatches:\n\n' + mismatches.join('\n\n'));
      }

      expect(mismatches).toEqual([]);
    });
  });

  describe('ActionDrawer config', () => {
    it('references valid ActionIds (no drift)', () => {
      const missing: string[] = [];

      for (const actionId of flattenActionDrawerActionIds()) {
        if (!ActionRegistry[actionId as keyof typeof ActionRegistry]) {
          missing.push(actionId);
        }
      }

      if (missing.length > 0) {
        console.error('ActionDrawer references missing ActionIds:', missing.join(', '));
      }

      expect(missing).toEqual([]);
    });

    it('does not contain duplicate ActionIds', () => {
      const ids = flattenActionDrawerActionIds();
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });

    it('only uses label overrides where explicitly intended', () => {
      const unexpected: string[] = [];

      for (const section of ACTION_DRAWER_SECTIONS) {
        for (const item of section.items) {
          if (item.labelStrategy && !(section.id === 'view' && item.labelStrategy === 'viewMode')) {
            unexpected.push(`${section.id}:${item.actionId}:${item.labelStrategy}`);
          }
        }
      }

      if (unexpected.length > 0) {
        console.error('Unexpected ActionDrawer label strategies:', unexpected.join(', '));
      }

      expect(unexpected).toEqual([]);
    });

    it('shortcut display matches ActionRegistry formatting', () => {
      const mismatches: string[] = [];

      for (const actionId of flattenActionDrawerActionIds()) {
        const action = ActionRegistry[actionId as keyof typeof ActionRegistry];
        if (!action) continue;

        const combo = getPrimaryShortcutCombo(action, 'default');
        const expected = combo ? formatKeyCombo(combo) : null;
        const actual = formatPrimaryActionShortcut(action, 'default');

        if (expected !== actual) {
          mismatches.push([
            `ActionId: ${actionId}`,
            `Expected: ${String(expected)}`,
            `Actual:   ${String(actual)}`,
          ].join('\n'));
        }
      }

      if (mismatches.length > 0) {
        console.error('ActionDrawer shortcut mismatches:\n\n' + mismatches.join('\n\n'));
      }

      expect(mismatches).toEqual([]);
    });
  });
});
