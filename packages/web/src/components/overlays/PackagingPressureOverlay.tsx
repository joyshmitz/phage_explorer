import React, { useMemo } from 'react';
import { useHotkey } from '../../hooks';
import { ActionIds } from '../../keyboard';
import { Overlay } from './Overlay';
import { useOverlay } from './OverlayProvider';
import { usePhageStore } from '../../store';
import {
  OverlayDescription,
  OverlayEmptyState,
  OverlaySection,
  OverlaySectionHeader,
  OverlayStack,
  OverlayStatCard,
  OverlayStatGrid,
} from './primitives';

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function progressBar(fraction: number, color: string): React.ReactElement {
  const safeFraction = clamp01(fraction);
  return (
    <div
      style={{
        width: '100%',
        height: '10px',
        backgroundColor: 'var(--color-background-alt)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        border: 'var(--overlay-border)',
      }}
    >
      <div
        style={{
          width: `${(safeFraction * 100).toFixed(1)}%`,
          height: '100%',
          background: color,
          transition: 'width var(--duration-fast) var(--ease-out)',
        }}
      />
    </div>
  );
}

export function PackagingPressureOverlay(): React.ReactElement | null {
  const { isOpen, toggle } = useOverlay();
  const phage = usePhageStore((s) => s.currentPhage);
  const scrollPosition = usePhageStore((s) => s.scrollPosition);
  const viewMode = usePhageStore((s) => s.viewMode);

  // Hotkey: Shift+V (matches TUI)
  useHotkey(
    ActionIds.OverlayPackagingPressure,
    () => toggle('pressure'),
    { modes: ['NORMAL'] }
  );

  const metrics = useMemo(() => {
    const genomeLength = phage?.genomeLength ?? 0;
    if (!genomeLength) {
      return {
        fillFraction: 0,
        positionBp: 0,
        forcePn: 0,
        pressureAtm: 0,
        atpCount: 0,
      };
    }

    const scrollBp = viewMode === 'aa' ? scrollPosition * 3 : scrollPosition;
    const clampedBp = Math.max(0, Math.min(genomeLength, scrollBp));
    const fillFraction = clamp01(clampedBp / genomeLength);
    const forcePn = 5 + 50 * Math.pow(fillFraction, 3);
    const pressureAtm = Math.min(60, 5 + 55 * fillFraction);
    const atpCount = Math.floor(clampedBp / 2);

    return {
      fillFraction,
      positionBp: clampedBp,
      forcePn,
      pressureAtm,
      atpCount,
    };
  }, [phage?.genomeLength, scrollPosition, viewMode]);

  if (!isOpen('pressure')) {
    return null;
  }

  const genomeLength = phage?.genomeLength ?? 0;
  const fillPercent = (metrics.fillFraction * 100).toFixed(1);
  const pressureFraction = metrics.pressureAtm / 60;

  return (
    <Overlay
      id="pressure"
      title="PACKAGING PRESSURE"
      hotkey="Shift+V"
      size="md"
    >
      <OverlayStack>
        <OverlayDescription title="Capsid filling model">
          Force = 5 + 50·φ³ pN, pressure capped at 60 atm, ATP ≈ 1 per 2 bp.
        </OverlayDescription>

        {genomeLength > 0 ? (
          <>
            <OverlayStatGrid>
              <OverlayStatCard
                label="Position"
                value={`${metrics.positionBp.toLocaleString()} / ${genomeLength.toLocaleString()} bp`}
              />
              <OverlayStatCard label="Fill" value={`${fillPercent}%`} />
              <OverlayStatCard label="Force" value={`${metrics.forcePn.toFixed(1)} pN`} />
              <OverlayStatCard
                label="Pressure"
                value={
                  <span
                    style={{
                      color: pressureFraction > 0.8 ? 'var(--color-error)' : 'var(--color-text)',
                    }}
                  >
                    {metrics.pressureAtm.toFixed(1)} atm
                  </span>
                }
              />
              <OverlayStatCard label="ATP consumed" value={metrics.atpCount.toLocaleString()} />
            </OverlayStatGrid>

            <OverlaySection
              header={<OverlaySectionHeader title="Trajectory" description={`${fillPercent}% full`} />}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--chrome-gap)',
                  padding: 'var(--chrome-padding-y) var(--chrome-padding-x)',
                }}
              >
                <div>
                  <div
                    style={{
                      color: 'var(--color-text-muted)',
                      marginBottom: 'var(--chrome-gap-compact)',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    Fill fraction
                  </div>
                  {progressBar(metrics.fillFraction, 'var(--color-success)')}
                </div>
                <div>
                  <div
                    style={{
                      color: 'var(--color-text-muted)',
                      marginBottom: 'var(--chrome-gap-compact)',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    Pressure (warn above 50 atm)
                  </div>
                  {progressBar(
                    pressureFraction,
                    pressureFraction > 0.83 ? 'var(--color-error)' : 'var(--color-accent)'
                  )}
                </div>
              </div>
            </OverlaySection>
          </>
        ) : (
          <OverlayEmptyState
            message="No phage loaded."
            hint="Load a phage genome to visualize packaging pressure along the sequence."
          />
        )}
      </OverlayStack>
    </Overlay>
  );
}

export default PackagingPressureOverlay;
