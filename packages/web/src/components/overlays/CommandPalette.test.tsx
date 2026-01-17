import { describe, expect, it } from 'bun:test';
import { ActionRegistry, ActionIds, ActionRegistryList, type ActionDefinition } from '../../keyboard/actionRegistry';
import { formatKeyCombo } from '../../keyboard/types';

function getPrimaryShortcut(def: ActionDefinition): string | undefined {
  if (Array.isArray(def.defaultShortcut)) {
    if (def.defaultShortcut.length === 0) return undefined;
    return formatKeyCombo(def.defaultShortcut[0]);
  }
  return formatKeyCombo(def.defaultShortcut);
}

describe('CommandPalette', () => {
  it('ActionRegistry contains key commands used by the command palette', () => {
    expect(ActionRegistry[ActionIds.NavNextPhage].title).toBe('Next phage');
    expect(ActionRegistry[ActionIds.ViewCycleTheme].title).toBe('Cycle theme');
    expect(ActionRegistry[ActionIds.OverlayHelp].title).toBe('Help overlay');
  });

  it('formats primary shortcuts safely (including empty shortcut arrays)', () => {
    // Regression guard: some contextual actions intentionally ship with no default shortcut.
    // Command palette UI must not crash when encountering them.
    for (const def of Object.values(ActionRegistry)) {
      expect(() => getPrimaryShortcut(def)).not.toThrow();
    }

    expect(getPrimaryShortcut(ActionRegistry[ActionIds.NavNextPhage])).toBe('j');
    expect(getPrimaryShortcut(ActionRegistry[ActionIds.ViewCycleTheme])).toBe('t');
    expect(getPrimaryShortcut(ActionRegistry[ActionIds.OverlayHelp])).toBe('?');

    // Export actions intentionally have no default shortcut today.
    expect(getPrimaryShortcut(ActionRegistry[ActionIds.ExportFasta])).toBeUndefined();
    expect(getPrimaryShortcut(ActionRegistry[ActionIds.ExportCopy])).toBeUndefined();
    expect(getPrimaryShortcut(ActionRegistry[ActionIds.ExportJson])).toBeUndefined();
  });

  describe('Command Palette Shortcut Drift Prevention', () => {
    it('all action IDs in ActionIds are present in ActionRegistry', () => {
      // Regression: ensure no ActionId is defined without a registry entry
      for (const actionId of Object.values(ActionIds)) {
        expect(
          ActionRegistry[actionId],
          `ActionId "${actionId}" is defined but missing from ActionRegistry`
        ).toBeDefined();
      }
    });

    it('ActionRegistry entries have all required fields for command palette display', () => {
      // Command palette requires: id, title, category, defaultShortcut
      for (const def of ActionRegistryList) {
        expect(def.id, `Action missing id`).toBeDefined();
        expect(typeof def.id).toBe('string');
        expect(def.title, `Action ${def.id} missing title`).toBeDefined();
        expect(typeof def.title).toBe('string');
        expect(def.category, `Action ${def.id} missing category`).toBeDefined();
        expect(typeof def.category).toBe('string');
        expect(
          def.defaultShortcut,
          `Action ${def.id} missing defaultShortcut`
        ).toBeDefined();
      }
    });

    it('overlay actions have overlayId and overlayAction for command palette auto-generation', () => {
      // Command palette auto-generates actions for overlays based on overlayId
      const overlayActions = ActionRegistryList.filter(def => def.id.startsWith('overlay.'));

      for (const def of overlayActions) {
        // Skip closeAll which is not an overlay-specific action
        if (def.id === 'overlay.closeAll') continue;

        expect(
          def.overlayId,
          `Overlay action ${def.id} missing overlayId - command palette cannot auto-generate handler`
        ).toBeDefined();
        expect(
          def.overlayAction,
          `Overlay action ${def.id} missing overlayAction - command palette cannot auto-generate handler`
        ).toBeDefined();
        expect(['open', 'toggle']).toContain(def.overlayAction);
      }
    });

    it('shortcut formatting is consistent across all actions', () => {
      // Ensure formatKeyCombo produces consistent output for the same input
      for (const def of ActionRegistryList) {
        const shortcut1 = getPrimaryShortcut(def);
        const shortcut2 = getPrimaryShortcut(def);
        expect(shortcut1).toBe(shortcut2);
      }
    });

    it('no duplicate action IDs exist', () => {
      const seenIds = new Set<string>();
      for (const def of ActionRegistryList) {
        expect(seenIds.has(def.id), `Duplicate action ID: ${def.id}`).toBe(false);
        seenIds.add(def.id);
      }
    });

    it('action ID format matches expected pattern', () => {
      // ActionIds should follow category.action pattern (e.g., "view.cycleMode", "overlay.help")
      const validPattern = /^[a-z]+(\.[a-zA-Z]+)+$/;
      for (const def of ActionRegistryList) {
        expect(
          validPattern.test(def.id),
          `Action ID "${def.id}" doesn't match expected pattern (category.action)`
        ).toBe(true);
      }
    });
  });
});
