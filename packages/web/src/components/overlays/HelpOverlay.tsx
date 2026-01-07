/**
 * HelpOverlay - Dynamic Hotkey Reference
 *
 * Shows all available keyboard shortcuts organized by Depth Layer:
 * - Layer 0: Sacred Surface (Navigation, View, Search, Help, Quit)
 * - Layer 1: Quick Overlays (single-key analysis toggles)
 * - Layer 2: Analysis Menu (via 'A' key)
 * - Layer 3: Simulation Hub (via Shift+S)
 * - Layer 4: Command Palette (via ':')
 *
 * Shortcuts are rendered from ActionRegistry - never hardcoded.
 */

import React, { useMemo, useState } from 'react';
import { useHotkey } from '../../hooks';
import { Overlay } from './Overlay';
import { useOverlay } from './OverlayProvider';
import {
  OverlayStack,
  OverlayToolbar,
  OverlaySection,
  OverlaySectionHeader,
  OverlayGrid,
  OverlayRow,
  OverlayKeyValue,
  OverlayBadge,
} from './primitives';
import { ActionIds, ActionRegistryList, formatKeyCombo, type KeyCombo, type ActionScope } from '../../keyboard';

type DepthLayer = 0 | 1 | 2 | 3 | 4;

interface HotkeyInfo {
  key: string;
  description: string;
  category: string;
  layer: DepthLayer;
  scope: ActionScope;
}

const LAYER_LABELS: Record<DepthLayer, { name: string; description: string }> = {
  0: { name: 'Core Controls', description: 'Always available - navigation, view, search' },
  1: { name: 'Quick Overlays', description: 'Single-key analysis toggles' },
  2: { name: 'Analysis Menu', description: 'Advanced analysis tools (A key)' },
  3: { name: 'Simulation Hub', description: 'Interactive simulations (⇧S)' },
  4: { name: 'Power User', description: 'Command palette & dev tools' },
};

/**
 * Determine the Depth Layer for an action based on its category and shortcut complexity.
 * Layer 0 = sacred surface (nav, view, search, help)
 * Layer 1 = single-key quick overlays (g, x, b, p, r, etc.)
 * Layer 2 = analysis menu items (require alt or multiple modifiers)
 * Layer 3 = simulation
 * Layer 4 = command palette, dev tools
 */
function getDepthLayer(category: string, shortcut: KeyCombo | KeyCombo[], actionId: string): DepthLayer {
  // Layer 0: Core controls
  if (['Navigation', 'View', 'Search'].includes(category)) return 0;
  if (actionId.includes('overlay.help') || actionId.includes('overlay.closeAll')) return 0;

  // Layer 3: Simulation
  if (category === 'Simulation') return 3;

  // Layer 4: Dev/Power tools
  if (category === 'Dev') return 4;
  if (actionId.includes('commandPalette')) return 4;

  // Layer 1 vs 2: Check shortcut complexity
  const combos = Array.isArray(shortcut) ? shortcut : [shortcut];
  const hasModifiers = combos.some(c =>
    c.modifiers && (c.modifiers.alt || c.modifiers.ctrl || c.modifiers.meta || c.modifiers.shift)
  );

  // Single key without modifiers = Layer 1 (quick overlays)
  if (!hasModifiers) return 1;

  // With modifiers = Layer 2 (analysis menu depth)
  return 2;
}

function formatShortcut(shortcut: KeyCombo | KeyCombo[]): string {
  const combos = Array.isArray(shortcut) ? shortcut : [shortcut];
  return combos.map(formatKeyCombo).join(' / ');
}

// Group hotkeys by depth layer
function groupByLayer(hotkeys: HotkeyInfo[]): Record<DepthLayer, HotkeyInfo[]> {
  const result: Record<DepthLayer, HotkeyInfo[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
  for (const hotkey of hotkeys) {
    result[hotkey.layer].push(hotkey);
  }
  // Sort within each layer by category then description
  for (const layer of [0, 1, 2, 3, 4] as DepthLayer[]) {
    result[layer].sort((a, b) =>
      a.category.localeCompare(b.category) || a.description.localeCompare(b.description)
    );
  }
  return result;
}

export function HelpOverlay(): React.ReactElement | null {
  const { isOpen, toggle } = useOverlay();
  const [detailLevel, setDetailLevel] = useState<'essential' | 'detailed'>('essential');

  const overlayOpen = isOpen('help');

  useHotkey(
    ActionIds.OverlayHelp,
    () => toggle('help'),
    { modes: ['NORMAL'] }
  );

  useHotkey(
    ActionIds.HelpToggleDetail,
    () => setDetailLevel(prev => prev === 'essential' ? 'detailed' : 'essential'),
    { modes: ['NORMAL'], enabled: overlayOpen }
  );

  const hotkeys = useMemo(() => {
    return ActionRegistryList
      .filter((action) => !action.surfaces || action.surfaces.includes('web'))
      .map((action): HotkeyInfo => ({
        key: formatShortcut(action.defaultShortcut),
        description: action.title,
        category: action.category,
        layer: getDepthLayer(action.category, action.defaultShortcut, action.id),
        scope: action.scope,
      }));
  }, []);

  if (!overlayOpen) {
    return null;
  }

  const grouped = groupByLayer(hotkeys);
  // Essential mode: Layer 0 only; Detailed mode: all layers
  const visibleLayers: DepthLayer[] = detailLevel === 'essential'
    ? [0]
    : [0, 1, 2, 3, 4];

  return (
    <Overlay
      id="help"
      title="KEYBOARD SHORTCUTS"
      hotkey="?"
      size="lg"
    >
      <OverlayStack>
        {/* Detail level toggle */}
        <OverlayToolbar>
          <span style={{ color: 'var(--color-text-dim)' }}>
            Showing: {detailLevel === 'essential' ? 'Essential' : 'All'} shortcuts
          </span>
          <button
            onClick={() => setDetailLevel(prev => prev === 'essential' ? 'detailed' : 'essential')}
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-background)',
              border: 'none',
              padding: '0.25rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Press D to toggle
          </button>
        </OverlayToolbar>

        {/* Depth Layers */}
        <OverlayStack>
          {visibleLayers.map(layer => {
            const layerHotkeys = grouped[layer];
            if (layerHotkeys.length === 0) return null;
            const layerInfo = LAYER_LABELS[layer];

            return (
              <OverlaySection
                key={layer}
                header={
                  <OverlaySectionHeader
                    badge={`L${layer}`}
                    title={layerInfo.name}
                    description={layerInfo.description}
                  />
                }
              >
                <OverlayGrid>
                  {layerHotkeys.map((hotkey, index) => (
                    <OverlayRow key={hotkey.description} alternate={index % 2 !== 0}>
                      <OverlayKeyValue label={hotkey.key} value={hotkey.description} />
                      {hotkey.scope === 'contextual' && (
                        <OverlayBadge variant="muted">contextual</OverlayBadge>
                      )}
                    </OverlayRow>
                  ))}
                </OverlayGrid>
              </OverlaySection>
            );
          })}
        </OverlayStack>
      </OverlayStack>
    </Overlay>
  );
}

export default HelpOverlay;
