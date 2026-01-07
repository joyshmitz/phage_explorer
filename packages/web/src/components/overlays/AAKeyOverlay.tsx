/**
 * AAKeyOverlay - Amino acid color reference
 *
 * Shows the amino acid palette grouped by property, mirroring the TUI key.
 * Keeps scope minimal: static grouping, uses theme colors, hotkey toggle.
 */

import React from 'react';
import { AMINO_ACIDS, type AminoAcid } from '@phage-explorer/core';
import { useTheme } from '../../hooks/useTheme';
import { useHotkey } from '../../hooks';
import { ActionIds } from '../../keyboard';
import { Overlay } from './Overlay';
import { useOverlay } from './OverlayProvider';
import { OverlayStack, OverlaySection, OverlaySectionHeader, OverlayGrid } from './primitives';

const GROUPS: Array<{ id: string; label: string; members: AminoAcid[] }> = [
  { id: 'hydrophobic', label: 'Hydrophobic', members: ['A', 'V', 'L', 'I', 'M', 'F', 'W', 'P'] },
  { id: 'polar', label: 'Polar', members: ['S', 'T', 'Y', 'N', 'Q', 'C'] },
  { id: 'basic', label: 'Basic (+)', members: ['K', 'R', 'H'] },
  { id: 'acidic', label: 'Acidic (-)', members: ['D', 'E'] },
  { id: 'special', label: 'Special', members: ['G', '*'] },
];

export function AAKeyOverlay(): React.ReactElement | null {
  const { theme } = useTheme();
  const { isOpen, toggle } = useOverlay();

  // Hotkey toggle: Shift+K
  useHotkey(
    ActionIds.OverlayAAKey,
    () => toggle('aaKey'),
    { modes: ['NORMAL'] }
  );

  if (!isOpen('aaKey')) {
    return null;
  }

  return (
    <Overlay
      id="aaKey"
      title="AMINO ACID KEY"
      hotkey="Shift+K"
      size="lg"
    >
      <OverlayStack>
        {GROUPS.map(group => (
          <OverlaySection
            key={group.id}
            header={<OverlaySectionHeader title={group.label} />}
            style={{ backgroundColor: 'var(--color-background-alt)' }}
          >
            <OverlayGrid minColumnWidth="180px" gap="0.5rem">
              {group.members.map(code => {
                const info = AMINO_ACIDS[code];
                const palette = theme.aminoAcids[code];
                return (
                  <div
                    key={code}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--chrome-gap)',
                      padding: 'var(--chrome-padding-compact-x)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border-light)',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: palette.bg,
                        color: palette.fg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                      }}
                      aria-label={`${info.name} (${info.threeCode})`}
                    >
                      {code}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>
                        {info.name} ({info.threeCode})
                      </span>
                      <span style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
                        Property: {info.property}
                      </span>
                    </div>
                  </div>
                );
              })}
            </OverlayGrid>
          </OverlaySection>
        ))}
        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
          Colors use the active theme palette. Press K or ESC to close.
        </div>
      </OverlayStack>
    </Overlay>
  );
}

export default AAKeyOverlay;
