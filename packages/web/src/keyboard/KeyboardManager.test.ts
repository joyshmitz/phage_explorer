/**
 * KeyboardManager typing guard tests
 *
 * Ensures global hotkeys do not trigger while typing unless explicitly allowed.
 */

import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { KeyboardManager } from './KeyboardManager';
import { ActionIds, getOverlayHotkeyActions } from './actionRegistry';
import type { HotkeyDefinition } from './types';

type GlobalSnapshot = {
  Element?: typeof Element;
  document?: Document;
  window?: Window & typeof globalThis;
};

function createKeyboardEvent(target: Element): globalThis.KeyboardEvent {
  return {
    key: 'k',
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    target,
    composedPath: () => [target],
    preventDefault: () => undefined,
    stopPropagation: () => undefined,
  } as unknown as globalThis.KeyboardEvent;
}

describe('KeyboardManager typing guards', () => {
  const original: GlobalSnapshot = {};

  beforeEach(() => {
    original.Element = globalThis.Element;
    original.document = globalThis.document;
    original.window = globalThis.window;

    class TestElement {}
    (globalThis as unknown as { Element: typeof Element }).Element = TestElement as unknown as typeof Element;

    (globalThis as unknown as { document: Document }).document = {
      activeElement: null,
    } as Document;

    (globalThis as unknown as { window: Window & typeof globalThis }).window = {
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
    } as Window & typeof globalThis;
  });

  afterEach(() => {
    if (original.Element) {
      (globalThis as unknown as { Element: typeof Element }).Element = original.Element;
    } else {
      delete (globalThis as unknown as { Element?: typeof Element }).Element;
    }

    if (original.document) {
      (globalThis as unknown as { document: Document }).document = original.document;
    } else {
      delete (globalThis as unknown as { document?: Document }).document;
    }

    if (original.window) {
      (globalThis as unknown as { window: Window & typeof globalThis }).window = original.window;
    } else {
      delete (globalThis as unknown as { window?: Window & typeof globalThis }).window;
    }
  });

  it('does not trigger hotkeys while typing by default', () => {
    const manager = new KeyboardManager();
    let fired = 0;

    const definition: HotkeyDefinition = {
      actionId: ActionIds.OverlayHelp,
      combo: { key: 'k' },
      description: 'Test hotkey',
      action: () => {
        fired += 1;
      },
      modes: ['NORMAL'],
    };

    manager.register(definition);

	    const input = new (globalThis as unknown as { Element: typeof Element }).Element();
	    (input as unknown as { tagName: string }).tagName = 'INPUT';
	    (input as unknown as { isContentEditable: boolean }).isContentEditable = false;
	    (globalThis.document as unknown as { activeElement: Element | null }).activeElement = input as unknown as Element;

    const event = createKeyboardEvent(input as unknown as Element);
    (manager as unknown as { handleKeyDown: (event: globalThis.KeyboardEvent) => void }).handleKeyDown(event);

    expect(fired).toBe(0);
  });

  it('allows hotkeys when allowInInput is true', () => {
    const manager = new KeyboardManager();
    let fired = 0;

    const definition: HotkeyDefinition = {
      actionId: ActionIds.OverlayHelp,
      combo: { key: 'k' },
      description: 'Allowed hotkey',
      action: () => {
        fired += 1;
      },
      modes: ['NORMAL'],
      allowInInput: true,
    };

    manager.register(definition);

	    const input = new (globalThis as unknown as { Element: typeof Element }).Element();
	    (input as unknown as { tagName: string }).tagName = 'INPUT';
	    (input as unknown as { isContentEditable: boolean }).isContentEditable = false;
	    (globalThis.document as unknown as { activeElement: Element | null }).activeElement = input as unknown as Element;

    const event = createKeyboardEvent(input as unknown as Element);
    (manager as unknown as { handleKeyDown: (event: globalThis.KeyboardEvent) => void }).handleKeyDown(event);

    expect(fired).toBe(1);
  });
});

describe('ActionRegistry overlay hotkeys', () => {
  it('keeps overlay open actions globally available for lazy overlays', () => {
    const overlayActions = getOverlayHotkeyActions();
    expect(overlayActions.length).toBeGreaterThan(0);

    const ids = overlayActions.map((action) => action.actionId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(ActionIds.OverlayHelp);
  });
});

/**
 * Overlay First-Load Regression Tests
 *
 * These tests verify that overlay-open hotkeys work on first app load,
 * before any overlay component has been mounted. The key insight is that
 * overlay hotkeys are registered centrally in App.tsx from ActionRegistry,
 * not inside individual overlay components.
 *
 * If these tests fail, overlay hotkeys may require prior component mount.
 */
describe('Overlay first-load hotkey behavior (s4qx.2.5)', () => {
  it('all overlay actions have required fields for central registration', () => {
    const overlayActions = getOverlayHotkeyActions();

    for (const action of overlayActions) {
      // Must have actionId for KeyboardManager registration
      expect(action.actionId).toBeDefined();
      expect(typeof action.actionId).toBe('string');
      expect(action.actionId.length).toBeGreaterThan(0);

      // Must have overlayId for OverlayProvider.toggle/open
      expect(action.overlayId).toBeDefined();
      expect(typeof action.overlayId).toBe('string');
      expect(action.overlayId.length).toBeGreaterThan(0);

      // Must have overlayAction to know whether to toggle or open
      expect(action.overlayAction).toBeDefined();
      expect(['open', 'toggle']).toContain(action.overlayAction);
    }
  });

  it('includes both eager and lazy overlay hotkeys', () => {
    const overlayActions = getOverlayHotkeyActions();
    const overlayIds = new Set(overlayActions.map(a => a.overlayId));

    // Eager overlays (must be present - they're essential)
    expect(overlayIds.has('help')).toBe(true);
    expect(overlayIds.has('search')).toBe(true);
    expect(overlayIds.has('commandPalette')).toBe(true);
    expect(overlayIds.has('analysisMenu')).toBe(true);

    // Lazy overlays (should also be present for first-load)
    expect(overlayIds.has('simulationHub')).toBe(true);
    expect(overlayIds.has('gcSkew')).toBe(true);
  });

  it('overlay actions come from registry, not component mount', () => {
    // This test verifies the architectural pattern:
    // getOverlayHotkeyActions() extracts from ActionRegistry (static data)
    // NOT from overlay component hooks (would require mount)

    // Call getOverlayHotkeyActions multiple times - should be deterministic
    const actions1 = getOverlayHotkeyActions();
    const actions2 = getOverlayHotkeyActions();

    expect(actions1.length).toBe(actions2.length);

    // Same actions in same order
    for (let i = 0; i < actions1.length; i++) {
      expect(actions1[i].actionId).toBe(actions2[i].actionId);
      expect(actions1[i].overlayId).toBe(actions2[i].overlayId);
      expect(actions1[i].overlayAction).toBe(actions2[i].overlayAction);
    }
  });

  it('has substantial number of overlay hotkeys for good UX', () => {
    const overlayActions = getOverlayHotkeyActions();

    // We should have many overlay hotkeys (currently 40+)
    // This guards against accidental removal
    expect(overlayActions.length).toBeGreaterThan(30);
  });

  it('overlay actions are all global scope', () => {
    // Overlay toggle/open actions should be global (always available)
    // This is verified in getOverlayHotkeyActions filter, but double-check
    const overlayActions = getOverlayHotkeyActions();

    // Every action should correspond to a global-scope action in registry
    const { ActionRegistryList } = require('./actionRegistry');
    for (const action of overlayActions) {
      const registryAction = ActionRegistryList.find(
        (a: { id: string }) => a.id === action.actionId
      );
      expect(registryAction).toBeDefined();
      expect(registryAction.scope).toBe('global');
    }
  });

  it('hotkey definitions can be created without overlay component', () => {
    // This simulates what App.tsx does: create hotkey definitions
    // from overlay actions without needing overlay components mounted

    const overlayActions = getOverlayHotkeyActions();

    // Simulate creating definitions (like App.tsx does)
    const definitions = overlayActions.map((action) => ({
      actionId: action.actionId,
      action: () => {
        // This would call toggle/open on OverlayProvider
        // The point is: we can create these without overlay components
      },
      modes: ['NORMAL'] as const,
    }));

    // All definitions should be valid
    expect(definitions.length).toBe(overlayActions.length);
    for (const def of definitions) {
      expect(def.actionId).toBeDefined();
      expect(typeof def.action).toBe('function');
      expect(def.modes).toContain('NORMAL');
    }
  });
});
