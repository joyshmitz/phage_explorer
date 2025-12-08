/**
 * AAKeyOverlay - Amino acid color reference
 *
 * Shows the amino acid palette grouped by property, mirroring the TUI key.
 * Keeps scope minimal: static grouping, uses theme colors, hotkey toggle.
 */

import React, { useEffect } from 'react';
import { AMINO_ACIDS, type AminoAcid } from '@phage-explorer/core';
import { useTheme } from '../../hooks/useTheme';
import { Overlay } from './Overlay';
import { useOverlay } from './OverlayProvider';

const GROUPS: Array<{ id: string; label: string; members: AminoAcid[] }> = [
  { id: 'hydrophobic', label: 'Hydrophobic', members: ['A', 'V', 'L', 'I', 'M', 'F', 'W', 'P'] },
  { id: 'polar', label: 'Polar', members: ['S', 'T', 'Y', 'N', 'Q', 'C'] },
  { id: 'basic', label: 'Basic (+)', members: ['K', 'R', 'H'] },
  { id: 'acidic', label: 'Acidic (-)', members: ['D', 'E'] },
  { id: 'special', label: 'Special', members: ['G', '*'] },
];

export function AAKeyOverlay(): React.ReactElement | null {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { isOpen, toggle } = useOverlay();

  // Hotkey toggle: K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toggle('aaKey');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  if (!isOpen('aaKey')) {
    return null;
  }

  return (
    <Overlay
      id="aaKey"
      title="AMINO ACID KEY"
      icon="🧬"
      hotkey="k"
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {GROUPS.map(group => (
          <div
            key={group.id}
            style={{
              border: `1px solid ${colors.borderLight}`,
              borderRadius: '6px',
              padding: '0.75rem',
              backgroundColor: colors.backgroundAlt,
            }}
          >
            <div style={{ color: colors.primary, fontWeight: 700, marginBottom: '0.5rem' }}>
              {group.label}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
              {group.members.map(code => {
                const info = AMINO_ACIDS[code];
                const palette = theme.aminoAcids[code];
                return (
                  <div
                    key={code}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      backgroundColor: colors.background,
                      border: `1px solid ${colors.borderLight}`,
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '6px',
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
                      <span style={{ color: colors.text, fontWeight: 600 }}>
                        {info.name} ({info.threeCode})
                      </span>
                      <span style={{ color: colors.textDim, fontSize: '0.85rem' }}>
                        Property: {info.property}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div style={{ color: colors.textMuted, fontSize: '0.85rem', textAlign: 'center' }}>
          Colors use the active theme palette. Press K or ESC to close.
        </div>
      </div>
    </Overlay>
  );
}

export default AAKeyOverlay;

