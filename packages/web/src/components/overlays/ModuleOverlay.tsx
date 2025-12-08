import React, { useMemo } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Overlay } from './Overlay';
import { useOverlay } from './OverlayProvider';
import { usePhageStore } from '@phage-explorer/state';
import { computeModuleCoherence } from '@phage-explorer/core';

const GRADIENT = ['░', '▒', '▓', '█'];

function scoreColor(score: number, colors: { success: string; warning: string; error: string }): string {
  if (score >= 0.9) return colors.success;
  if (score >= 0.6) return colors.warning;
  return colors.error;
}

export function ModuleOverlay(): React.ReactElement | null {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { isOpen } = useOverlay();
  const phage = usePhageStore(s => s.currentPhage);

  const report = useMemo(() => {
    if (!phage) {
      return null;
    }
    return computeModuleCoherence(phage.genes || []);
  }, [phage]);

  if (!isOpen('modules')) {
    return null;
  }

  if (!report || !phage) {
    return (
      <Overlay id="modules" title="MODULE COHERENCE" icon="🧩" hotkey="l">
        <div style={{ color: colors.textDim }}>No phage loaded.</div>
      </Overlay>
    );
  }

  return (
    <Overlay id="modules" title={`MODULE COHERENCE — ${phage.name}`} icon="🧩" hotkey="l" size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Score Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: colors.backgroundAlt,
          padding: '0.75rem',
          borderRadius: '4px'
        }}>
          <span style={{ color: colors.textDim }}>Overall Score</span>
          <span style={{ 
            color: scoreColor(report.overall, colors), 
            fontSize: '1.5rem', 
            fontWeight: 'bold' 
          }}>
            {(report.overall * 100).toFixed(0)}%
          </span>
        </div>

        {/* Ribbon Visualization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ color: colors.textDim, fontSize: '0.8rem' }}>Module Ribbon</div>
          <div style={{ display: 'flex', fontFamily: 'monospace', fontSize: '1.2rem' }}>
            {report.statuses.map((s) => {
              const c = scoreColor(s.score, colors);
              const gIdx = Math.min(GRADIENT.length - 1, Math.max(0, Math.round(s.score * (GRADIENT.length - 1))));
              return (
                <span key={s.id} style={{ color: c, flex: 1, textAlign: 'center' }}>
                  {GRADIENT[gIdx]}
                </span>
              );
            })}
          </div>
          <div style={{ display: 'flex', fontFamily: 'monospace', fontSize: '0.7rem' }}>
            {report.statuses.map((s) => (
              <span key={`${s.id}-label`} style={{ color: colors.textDim, flex: 1, textAlign: 'center' }}>
                {s.label.slice(0, 3)}
              </span>
            ))}
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {report.statuses.map((s) => (
            <div key={s.id} style={{ 
              backgroundColor: colors.backgroundAlt, 
              padding: '0.75rem', 
              borderRadius: '4px',
              borderLeft: `3px solid ${scoreColor(s.score, colors)}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: colors.text, fontWeight: 'bold' }}>{s.label}</span>
                <span style={{ color: scoreColor(s.score, colors), fontFamily: 'monospace' }}>
                  {s.count} / {s.min}{s.max ? `–${s.max}` : '+'}
                </span>
              </div>
              
              {s.issues.length === 0 ? (
                <div style={{ color: colors.success, fontSize: '0.9rem' }}>✓ Coherent</div>
              ) : (
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: colors.warning, fontSize: '0.9rem' }}>
                  {s.issues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              )}

              {s.matchedGenes.length > 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: colors.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.matchedGenes.map(g => g.name || g.product || g.locusTag || 'unnamed').join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </Overlay>
  );
}
