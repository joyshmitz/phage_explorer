/**
 * EnvironmentalProvenanceOverlay
 *
 * Interactive visualization of phage environmental provenance:
 * - Novelty score and classification
 * - Biome distribution chart
 * - Geographic hit map
 * - Top metagenome hits list
 *
 * Hotkey: Ctrl+Shift+E (environmental)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { PhageFull } from '@phage-explorer/core';
import type { PhageRepository } from '../../db';
import { useTheme } from '../../hooks/useTheme';
import { Overlay } from './Overlay';
import { useOverlay } from './OverlayProvider';
import { useHotkey } from '../../hooks/useHotkey';
import {
  analyzeProvenance,
  generateDemoProvenanceData,
  type ProvenanceResult,
  BIOME_NAMES,
  BIOME_COLORS,
} from '@phage-explorer/core';
import { AnalysisPanelSkeleton } from '../ui/Skeleton';

interface EnvironmentalProvenanceOverlayProps {
  repository: PhageRepository | null;
  currentPhage: PhageFull | null;
}

type ViewMode = 'overview' | 'biomes' | 'geography' | 'hits';

/** Novelty badge color based on classification */
const NOVELTY_COLORS: Record<string, string> = {
  novel: '#e74c3c',
  rare: '#e67e22',
  uncommon: '#f1c40f',
  known: '#3498db',
  well_characterized: '#27ae60',
};

export function EnvironmentalProvenanceOverlay({
  currentPhage,
}: EnvironmentalProvenanceOverlayProps): React.ReactElement | null {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { isOpen, toggle } = useOverlay();

  const biomeCanvasRef = useRef<HTMLCanvasElement>(null);
  const geoCanvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [result, setResult] = useState<ProvenanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wasOpenRef = useRef(false);
  const lastAnalyzedKeyRef = useRef<string | null>(null);

  // Hotkey: Ctrl+Shift+E
  useHotkey(
    { key: 'e', modifiers: { ctrl: true, shift: true } },
    'Environmental Provenance Map',
    useCallback(() => toggle('environmentalProvenance'), [toggle]),
    { modes: ['NORMAL'], category: 'Analysis', minLevel: 'intermediate' }
  );

  const overlayIsOpen = isOpen('environmentalProvenance');

  // Run analysis when overlay opens or phage changes
  useEffect(() => {
    const justOpened = overlayIsOpen && !wasOpenRef.current;
    wasOpenRef.current = overlayIsOpen;

    if (!overlayIsOpen) return;

    const phageKey = currentPhage?.id ?? 'demo';
    const shouldRun = justOpened || lastAnalyzedKeyRef.current !== phageKey || !result;
    if (!shouldRun) return;

    setLoading(true);
    setError(null);

    const runAnalysis = async () => {
      try {
        lastAnalyzedKeyRef.current = phageKey;
        const hits = generateDemoProvenanceData(phageKey);
        const analysisResult = analyzeProvenance(hits);
        setResult(analysisResult);
      } catch (err) {
        setResult(null);
        setError(err instanceof Error ? err.message : 'Provenance analysis failed.');
      } finally {
        setLoading(false);
      }
    };

    runAnalysis();
  }, [overlayIsOpen, result, currentPhage]);

  // Draw biome distribution chart
  useEffect(() => {
    if (!isOpen('environmentalProvenance') || viewMode !== 'biomes') return;
    if (!biomeCanvasRef.current || !result) return;

    const canvas = biomeCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, width, height);

      const { biomeDistribution } = result;
      if (biomeDistribution.length === 0) {
        ctx.fillStyle = colors.textMuted;
        ctx.textAlign = 'center';
        ctx.font = '14px monospace';
        ctx.fillText('No biome data available', width / 2, height / 2);
        return;
      }

      const padding = 20;
      const barHeight = 30;
      const barGap = 10;
      const labelWidth = 120;
      const barMaxWidth = width - padding * 2 - labelWidth - 60;

      const maxContainment = Math.max(...biomeDistribution.map(b => b.maxContainment));

      biomeDistribution.slice(0, 8).forEach((biome, i) => {
        const y = padding + i * (barHeight + barGap);
        const barWidth = (biome.maxContainment / maxContainment) * barMaxWidth;

        // Label
        ctx.fillStyle = colors.text;
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(BIOME_NAMES[biome.biome], padding, y + barHeight / 2);

        // Bar background
        ctx.fillStyle = colors.backgroundAlt;
        ctx.fillRect(padding + labelWidth, y, barMaxWidth, barHeight);

        // Bar fill
        ctx.fillStyle = BIOME_COLORS[biome.biome];
        ctx.fillRect(padding + labelWidth, y, barWidth, barHeight);

        // Percentage
        ctx.fillStyle = colors.text;
        ctx.textAlign = 'left';
        const pct = `${Math.round(biome.maxContainment * 100)}%`;
        ctx.fillText(pct, padding + labelWidth + barMaxWidth + 10, y + barHeight / 2);
      });
    };

    draw();

    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [overlayIsOpen, viewMode, result, colors]);

  // Draw geographic map
  useEffect(() => {
    if (!isOpen('environmentalProvenance') || viewMode !== 'geography') return;
    if (!geoCanvasRef.current || !result) return;

    const canvas = geoCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, width, height);

      const { geoHeatmap } = result;

      // Draw simplified world map outline
      ctx.strokeStyle = colors.borderLight;
      ctx.lineWidth = 1;

      // Equirectangular projection helpers
      const latToY = (lat: number) => height / 2 - (lat / 90) * (height / 2);
      const lonToX = (lon: number) => width / 2 + (lon / 180) * (width / 2);

      // Draw grid
      ctx.strokeStyle = colors.borderLight + '40';
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        ctx.moveTo(0, latToY(lat));
        ctx.lineTo(width, latToY(lat));
        ctx.stroke();
      }
      for (let lon = -150; lon <= 150; lon += 30) {
        ctx.beginPath();
        ctx.moveTo(lonToX(lon), 0);
        ctx.lineTo(lonToX(lon), height);
        ctx.stroke();
      }

      // Draw hits
      for (const hit of geoHeatmap) {
        const x = lonToX(hit.lon);
        const y = latToY(hit.lat);

        // Circle size based on intensity
        const radius = 5 + hit.intensity * 15;

        // Color based on intensity
        const alpha = 0.3 + hit.intensity * 0.5;
        ctx.fillStyle = `rgba(231, 76, 60, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = colors.error;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw legend
      ctx.fillStyle = colors.textDim;
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Circle size = containment strength', 10, height - 10);
    };

    draw();

    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [overlayIsOpen, viewMode, result, colors]);

  if (!overlayIsOpen) return null;

  return (
    <Overlay id="environmentalProvenance" title="ENVIRONMENTAL PROVENANCE MAP" size="xl">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
        {/* Novelty badge */}
        {result && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              backgroundColor: NOVELTY_COLORS[result.novelty.classification] + '22',
              border: `1px solid ${NOVELTY_COLORS[result.novelty.classification]}`,
              borderRadius: '4px',
            }}
          >
            <div>
              <strong style={{ color: NOVELTY_COLORS[result.novelty.classification] }}>
                Novelty Score: {(result.novelty.score * 100).toFixed(0)}%
              </strong>
              <span
                style={{
                  marginLeft: '1rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: NOVELTY_COLORS[result.novelty.classification],
                  color: '#fff',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                }}
              >
                {result.novelty.classification.replace('_', ' ')}
              </span>
            </div>
            <span style={{ color: colors.textDim, fontSize: '0.85rem' }}>
              {result.novelty.totalHits} metagenome hits
            </span>
          </div>
        )}

        {/* View mode tabs */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['overview', 'biomes', 'geography', 'hits'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '0.5rem 1rem',
                border: `1px solid ${viewMode === mode ? colors.accent : colors.borderLight}`,
                borderRadius: '4px',
                backgroundColor: viewMode === mode ? colors.accent + '22' : 'transparent',
                color: viewMode === mode ? colors.accent : colors.text,
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
              }}
            >
              {mode === 'overview' && 'Overview'}
              {mode === 'biomes' && 'Biomes'}
              {mode === 'geography' && 'Geography'}
              {mode === 'hits' && 'Top Hits'}
            </button>
          ))}
        </div>

        {/* Content area */}
        {loading ? (
          <AnalysisPanelSkeleton />
        ) : error ? (
          <div style={{ padding: '1rem', color: colors.error }}>{error}</div>
        ) : !result ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: colors.textMuted }}>
            No provenance data available.
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto' }}>
            {viewMode === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Primary habitat */}
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: colors.backgroundAlt,
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ color: colors.textDim, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    PRIMARY HABITAT
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: BIOME_COLORS[result.primaryHabitat],
                      }}
                    />
                    <strong style={{ color: colors.text, fontSize: '1.1rem' }}>
                      {BIOME_NAMES[result.primaryHabitat]}
                    </strong>
                  </div>
                </div>

                {/* Ecological context */}
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: colors.backgroundAlt,
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ color: colors.textDim, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    ECOLOGICAL CONTEXT
                  </div>
                  <p style={{ color: colors.text, margin: 0, lineHeight: 1.5 }}>
                    {result.ecologicalContext}
                  </p>
                </div>

                {/* Novelty interpretation */}
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: colors.backgroundAlt,
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ color: colors.textDim, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    NOVELTY INTERPRETATION
                  </div>
                  <p style={{ color: colors.text, margin: 0, lineHeight: 1.5 }}>
                    {result.novelty.interpretation}
                  </p>
                </div>

                {/* Quick biome summary */}
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: colors.backgroundAlt,
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ color: colors.textDim, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    BIOME DISTRIBUTION
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {result.biomeDistribution.slice(0, 5).map(b => (
                      <span
                        key={b.biome}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: BIOME_COLORS[b.biome] + '33',
                          border: `1px solid ${BIOME_COLORS[b.biome]}`,
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                        }}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: BIOME_COLORS[b.biome],
                          }}
                        />
                        {BIOME_NAMES[b.biome]}: {Math.round(b.maxContainment * 100)}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'biomes' && (
              <div
                style={{
                  height: '350px',
                  border: `1px solid ${colors.borderLight}`,
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <canvas ref={biomeCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
              </div>
            )}

            {viewMode === 'geography' && (
              <div
                style={{
                  height: '350px',
                  border: `1px solid ${colors.borderLight}`,
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <canvas ref={geoCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
              </div>
            )}

            {viewMode === 'hits' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {result.topHits.map((hit, i) => (
                  <div
                    key={hit.metagenomeId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      backgroundColor: i % 2 === 0 ? colors.backgroundAlt : 'transparent',
                      borderRadius: '4px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: BIOME_COLORS[hit.biome],
                          }}
                        />
                        <strong style={{ color: colors.text }}>{hit.source}</strong>
                        <span style={{ color: colors.textDim, fontSize: '0.85rem' }}>
                          {hit.metagenomeId}
                        </span>
                      </div>
                      <div style={{ color: colors.textMuted, fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        {hit.description}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: colors.accent, fontWeight: 'bold' }}>
                        {Math.round(hit.containment * 100)}%
                      </div>
                      <div style={{ color: colors.textDim, fontSize: '0.8rem' }}>
                        {hit.location.country}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Overlay>
  );
}

export default EnvironmentalProvenanceOverlay;
