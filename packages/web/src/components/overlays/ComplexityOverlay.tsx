/**
 * ComplexityOverlay - Sequence Complexity Analysis
 *
 * Displays Shannon entropy and linguistic complexity visualization.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { PhageFull } from '@phage-explorer/core';
import type { PhageRepository } from '../../db';
import { useTheme } from '../../hooks/useTheme';
import { useHotkey } from '../../hooks';
import { getOverlayContext, useBeginnerMode } from '../../education';
import { Overlay } from './Overlay';
import { useOverlay } from './OverlayProvider';
import { AnalysisPanelSkeleton } from '../ui/Skeleton';
import { InfoButton } from '../ui';
import { getOrchestrator } from '../../workers/ComputeOrchestrator';
import type { ComplexityResult } from '../../workers/types';

interface ComplexityOverlayProps {
  repository: PhageRepository | null;
  currentPhage: PhageFull | null;
}

export function ComplexityOverlay({
  repository,
  currentPhage,
}: ComplexityOverlayProps): React.ReactElement | null {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { isOpen, toggle } = useOverlay();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sequenceCache = useRef<Map<number, string>>(new Map());
  const [sequence, setSequence] = useState<string>('');
  const [sequenceLoading, setSequenceLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [entropy, setEntropy] = useState<number[]>([]);
  const [linguistic, setLinguistic] = useState<number[]>([]);
  const { isEnabled: beginnerModeEnabled, showContextFor } = useBeginnerMode();
  const overlayHelp = getOverlayContext('complexity');

  // Hotkey to toggle overlay
  useHotkey(
    { key: 'x' },
    'Sequence Complexity',
    () => toggle('complexity'),
    { modes: ['NORMAL'], category: 'Analysis', minLevel: 'intermediate' }
  );

  // Fetch sequence when overlay opens
  useEffect(() => {
    if (!isOpen('complexity')) return;
    if (!repository || !currentPhage) {
      setSequence('');
      setEntropy([]);
      setLinguistic([]);
      setSequenceLoading(false);
      setAnalysisLoading(false);
      return;
    }

    const phageId = currentPhage.id;

    // Check cache
    if (sequenceCache.current.has(phageId)) {
      setSequence(sequenceCache.current.get(phageId) ?? '');
      setSequenceLoading(false);
      return;
    }

    setSequenceLoading(true);
    repository
      .getFullGenomeLength(phageId)
      .then((length: number) => repository.getSequenceWindow(phageId, 0, length))
      .then((seq: string) => {
        sequenceCache.current.set(phageId, seq);
        setSequence(seq);
      })
      .catch(() => setSequence(''))
      .finally(() => setSequenceLoading(false));
  }, [isOpen, repository, currentPhage]);

  // Compute complexity in the analysis worker (WASM-accelerated) to avoid main-thread jank.
  useEffect(() => {
    if (!isOpen('complexity')) return;
    if (!currentPhage) return;

    if (!sequence) {
      setEntropy([]);
      setLinguistic([]);
      setAnalysisLoading(false);
      return;
    }

    let cancelled = false;
    setAnalysisLoading(true);

    (async () => {
      try {
        const result = await getOrchestrator().runAnalysisWithSharedBuffer(
          currentPhage.id,
          sequence,
          'complexity',
          { windowSize: 100 }
        ) as ComplexityResult;

        if (cancelled) return;
        setEntropy(result.entropy);
        setLinguistic(result.linguistic);
      } catch {
        if (cancelled) return;
        setEntropy([]);
        setLinguistic([]);
      } finally {
        if (!cancelled) setAnalysisLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, currentPhage, sequence]);

  // Draw the visualization
  useEffect(() => {
    // Need at least 2 data points to draw lines and avoid division by zero
    if (!isOpen('complexity') || !canvasRef.current || entropy.length < 2) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    // Draw entropy
    ctx.beginPath();
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;

    for (let i = 0; i < entropy.length; i++) {
      const x = (i / (entropy.length - 1)) * width;
      const y = height - entropy[i] * height;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw linguistic complexity
    ctx.beginPath();
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    for (let i = 0; i < linguistic.length; i++) {
      const x = (i / (linguistic.length - 1)) * width;
      const y = height - linguistic[i] * height;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Mark low complexity regions
    ctx.fillStyle = 'rgba(231, 111, 81, 0.2)';
    for (let i = 0; i < entropy.length; i++) {
      if (entropy[i] < 0.5) {
        const x = (i / (entropy.length - 1)) * width;
        const barWidth = width / entropy.length;
        ctx.fillRect(x, 0, barWidth, height);
      }
    }
  }, [isOpen, entropy, linguistic, colors]);

  if (!isOpen('complexity')) {
    return null;
  }

  const avgEntropy = entropy.length > 0
    ? (entropy.reduce((a, b) => a + b, 0) / entropy.length).toFixed(3)
    : '0.000';
  const avgLinguistic = linguistic.length > 0
    ? (linguistic.reduce((a, b) => a + b, 0) / linguistic.length).toFixed(3)
    : '0.000';
  const lowComplexityCount = entropy.filter(e => e < 0.5).length;

  return (
    <Overlay
      id="complexity"
      title="SEQUENCE COMPLEXITY"
      hotkey="x"
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Loading State */}
        {sequenceLoading && (
          <AnalysisPanelSkeleton message="Loading sequence data..." rows={3} />
        )}
        {!sequenceLoading && analysisLoading && (
          <AnalysisPanelSkeleton message="Computing complexity..." rows={3} />
        )}

        {/* Description */}
        {!sequenceLoading && !analysisLoading && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: colors.backgroundAlt,
            borderRadius: '4px',
            color: colors.textDim,
            fontSize: '0.9rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <strong style={{ color: colors.primary }}>Sequence Complexity</strong>
              {beginnerModeEnabled && (
                <InfoButton
                  size="sm"
                  label="Learn about sequence complexity"
                  tooltip={overlayHelp?.summary ?? 'Sequence complexity measures how repetitive or information-dense a window is.'}
                  onClick={() => showContextFor(overlayHelp?.glossary?.[0] ?? 'sequence-complexity')}
                />
              )}
            </div>
            <div>
              Measures information content. Low complexity regions (highlighted in red) may indicate repetitive
              sequences, biased composition, or functional elements like promoters.
            </div>
          </div>
        )}

        {/* Stats */}
        {!sequenceLoading && !analysisLoading && entropy.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
          }}>
            <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: colors.backgroundAlt, borderRadius: '4px' }}>
              <div style={{ color: colors.primary, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                Avg Shannon Entropy
                {beginnerModeEnabled && (
                  <InfoButton
                    size="sm"
                    label="What is Shannon entropy?"
                    tooltip="Shannon entropy measures how unpredictable the base composition is within a window (higher = more diverse)."
                    onClick={() => showContextFor('shannon-entropy')}
                  />
                )}
              </div>
              <div style={{ color: colors.text, fontFamily: 'monospace', fontSize: '1.25rem' }}>{avgEntropy}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: colors.backgroundAlt, borderRadius: '4px' }}>
              <div style={{ color: colors.accent, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                Avg Linguistic Complexity
                {beginnerModeEnabled && (
                  <InfoButton
                    size="sm"
                    label="What is linguistic complexity?"
                    tooltip="Here, linguistic complexity approximates how many unique k-mers appear in the window (higher = less repetitive)."
                    onClick={() => showContextFor('k-mer')}
                  />
                )}
              </div>
              <div style={{ color: colors.text, fontFamily: 'monospace', fontSize: '1.25rem' }}>{avgLinguistic}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: colors.backgroundAlt, borderRadius: '4px' }}>
              <div style={{ color: colors.error, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                Low Complexity Regions
                {beginnerModeEnabled && (
                  <InfoButton
                    size="sm"
                    label="What does low complexity mean?"
                    tooltip="Low-complexity windows are more repetitive or compositionally biased; they can coincide with repeats or regulatory motifs."
                    onClick={() => showContextFor('sequence-complexity')}
                  />
                )}
              </div>
              <div style={{ color: colors.text, fontFamily: 'monospace', fontSize: '1.25rem' }}>{lowComplexityCount}</div>
            </div>
          </div>
        )}

        {/* Canvas */}
        {!sequenceLoading && !analysisLoading && entropy.length >= 2 && (
          <div style={{
            border: `1px solid ${colors.borderLight}`,
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: '200px', display: 'block' }}
            />
          </div>
        )}

        {/* Legend */}
        {!sequenceLoading && !analysisLoading && entropy.length >= 2 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            color: colors.textMuted,
            fontSize: '0.85rem',
          }}>
            <span><span style={{ color: colors.primary }}>━</span> Shannon Entropy</span>
            <span><span style={{ color: colors.accent }}>┄</span> Linguistic Complexity</span>
            <span style={{ color: colors.error }}>▌ Low Complexity</span>
          </div>
        )}

        {!sequenceLoading && !analysisLoading && sequence.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>
            No sequence data available. Select a phage to analyze.
          </div>
        )}
      </div>
    </Overlay>
  );
}

export default ComplexityOverlay;
