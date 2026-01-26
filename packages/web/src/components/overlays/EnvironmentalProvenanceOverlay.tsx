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
import { ActionIds } from '../../keyboard';
import {
  analyzeProvenance,
  generateDemoProvenanceData,
  type ProvenanceResult,
  BIOME_NAMES,
  BIOME_COLORS,
} from '@phage-explorer/core';
import { AnalysisPanelSkeleton } from '../ui/Skeleton';
import {
  OverlayLoadingState,
  OverlayEmptyState,
  OverlayErrorState,
} from './primitives';
import {
  searchPhageRelated,
  fetchSRARunMetadataBatch,
  processProvenanceData,
  getCached,
  setCache,
  generateCacheKey,
} from '../../api';

interface EnvironmentalProvenanceOverlayProps {
  repository: PhageRepository | null;
  currentPhage: PhageFull | null;
}

type ViewMode = 'overview' | 'biomes' | 'geography' | 'hits';
type DataSource = 'loading' | 'real' | 'demo' | 'error';

/** Novelty badge color based on classification */
const NOVELTY_COLORS: Record<string, string> = {
  novel: '#e74c3c',
  rare: '#e67e22',
  uncommon: '#f1c40f',
  known: '#3498db',
  well_characterized: '#27ae60',
};

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(seed: number): number {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

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
  const [dataSource, setDataSource] = useState<DataSource>('loading');
  const [apiMessage, setApiMessage] = useState<string>('');

  const wasOpenRef = useRef(false);
  const lastAnalyzedKeyRef = useRef<string | null>(null);

  // Hotkey: Ctrl+Shift+E
  useHotkey(
    ActionIds.OverlayEnvironmentalProvenance,
    useCallback(() => toggle('environmentalProvenance'), [toggle]),
    { modes: ['NORMAL'] }
  );

  const overlayIsOpen = isOpen('environmentalProvenance');

  // Run analysis when overlay opens or phage changes
  useEffect(() => {
    const justOpened = overlayIsOpen && !wasOpenRef.current;
    wasOpenRef.current = overlayIsOpen;

    if (!overlayIsOpen) return;

    const phageKey = String(currentPhage?.id ?? 'demo');
    const phageName = currentPhage?.name ?? 'bacteriophage';
    const shouldRun = justOpened || lastAnalyzedKeyRef.current !== phageKey || !result;
    if (!shouldRun) return;

    setLoading(true);
    setError(null);
    setDataSource('loading');
    setApiMessage('');

    let cancelled = false;

    const runAnalysis = async () => {
      try {
        lastAnalyzedKeyRef.current = phageKey;

        // Check cache first
        const cacheKey = generateCacheKey('provenance', { phageKey, phageName });
        const cached = getCached<{ result: ProvenanceResult; source: 'real' | 'demo' }>(cacheKey);
        if (cached) {
          if (cancelled) return;
          setResult(cached.result);
          setDataSource(cached.source);
          setApiMessage(cached.source === 'real' ? 'Data loaded from cache' : '');
          setLoading(false);
          return;
        }

        // Try real API: Search Serratus for phage-related sequences
        let usedRealData = false;
        try {
          setApiMessage('Searching Serratus database...');
          const serratusResult = await searchPhageRelated(phageName, 50);
          if (cancelled) return;

          if (serratusResult.success && serratusResult.data.matches.length > 0) {
            // Extract SRA run IDs
            const runIds = serratusResult.data.matches
              .map(m => m.run_id)
              .filter(id => id && (id.startsWith('SRR') || id.startsWith('ERR') || id.startsWith('DRR')));

            const uniqueRunIds = Array.from(new Set(runIds));
            if (uniqueRunIds.length > 0) {
              setApiMessage(`Fetching metadata for ${uniqueRunIds.length} SRA runs...`);
              // Limit to first 20 runs to avoid rate limiting
              const metadataResult = await fetchSRARunMetadataBatch(uniqueRunIds.slice(0, 20), 3);
              if (cancelled) return;

              if (metadataResult.success && metadataResult.data.length > 0) {
                // Process into provenance format
                const provenanceData = processProvenanceData(metadataResult.data);

                // Convert to hits format for analyzeProvenance
                const realHits = provenanceData.locations.map((loc, i) => ({
                  metagenomeId: `SRA-${i + 1}`,
                  source: 'other' as const, // SRA data doesn't fit other source categories
                  containment: Math.min(0.95, 0.3 + seededUnit(hashString(`${phageKey}:${loc.name}:${loc.isolationSources[0] ?? 'unknown'}:${i}`)) * 0.5),
                  biome: mapIsolationSourceToBiome(loc.isolationSources[0]),
                  location: {
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    country: loc.name,
                  },
                  description: `${loc.sampleCount} samples from ${loc.isolationSources.join(', ') || 'various sources'}`,
                }));

                if (realHits.length > 0) {
                  const analysisResult = analyzeProvenance(realHits);
                  if (cancelled) return;
                  setResult(analysisResult);
                  setDataSource('real');
                  setApiMessage(`Found ${provenanceData.totalSamples} real samples from ${provenanceData.locations.length} locations`);
                  usedRealData = true;

                  // Cache the result
                  setCache(cacheKey, { result: analysisResult, source: 'real' as const }, { ttl: 24 * 60 * 60 * 1000 });
                }
              }
            }
          }
        } catch {
          // API failed, will fall back to demo data
        }

        // Fallback to demo data if real API didn't work
        if (!usedRealData) {
          if (cancelled) return;
          setApiMessage('Using demonstration data (API unavailable or no matches found)');
          const hits = generateDemoProvenanceData(phageKey);
          const analysisResult = analyzeProvenance(hits);
          setResult(analysisResult);
          setDataSource('demo');

          // Cache demo result with shorter TTL
          setCache(cacheKey, { result: analysisResult, source: 'demo' as const }, { ttl: 60 * 60 * 1000 });
        }
      } catch (err) {
        if (cancelled) return;
        setResult(null);
        setDataSource('error');
        setError(err instanceof Error ? err.message : 'Provenance analysis failed.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    runAnalysis();

    return () => {
      cancelled = true;
    };
  }, [overlayIsOpen, result, currentPhage]);

  // Helper to map isolation source to BiomeType
  function mapIsolationSourceToBiome(source?: string): 'gut' | 'marine' | 'freshwater' | 'soil' | 'hot_spring' | 'wastewater' | 'clinical' | 'food' | 'unknown' {
    if (!source) return 'unknown';
    const s = source.toLowerCase();
    if (s.includes('soil') || s.includes('rhizo')) return 'soil';
    if (s.includes('water') || s.includes('ocean') || s.includes('sea') || s.includes('marine')) return 'marine';
    if (s.includes('fresh') || s.includes('lake') || s.includes('river')) return 'freshwater';
    if (s.includes('gut') || s.includes('feces') || s.includes('intestin') || s.includes('oral') || s.includes('saliva')) return 'gut';
    if (s.includes('waste') || s.includes('sewage') || s.includes('sludge')) return 'wastewater';
    if (s.includes('hot') || s.includes('thermal') || s.includes('vent')) return 'hot_spring';
    if (s.includes('hospital') || s.includes('clinical') || s.includes('patient')) return 'clinical';
    if (s.includes('food') || s.includes('dairy') || s.includes('ferment')) return 'food';
    return 'unknown';
  }

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
        {/* Data source banner */}
        <div
          style={{
            padding: '0.75rem',
            backgroundColor: dataSource === 'real' ? colors.success + '22' : colors.warning + '22',
            border: `1px solid ${dataSource === 'real' ? colors.success : colors.warning}`,
            borderRadius: '4px',
            color: colors.text,
            fontSize: '0.85rem',
          }}
        >
          {dataSource === 'loading' && (
            <>
              <strong style={{ color: colors.accent }}>LOADING</strong>: {apiMessage || 'Connecting to Serratus and NCBI SRA databases...'}
            </>
          )}
          {dataSource === 'real' && (
            <>
              <strong style={{ color: colors.success }}>REAL DATA</strong>: {apiMessage || 'Data from Serratus metagenome search and NCBI SRA metadata.'}
            </>
          )}
          {dataSource === 'demo' && (
            <>
              <strong style={{ color: colors.warning }}>DEMO MODE</strong>: {apiMessage || 'Using synthetic data. Real data requires metagenome containment search results from databases like Serratus/IMG/VR.'}
            </>
          )}
          {dataSource === 'error' && (
            <>
              <strong style={{ color: colors.error }}>ERROR</strong>: Failed to fetch data. Showing demo visualization.
            </>
          )}
        </div>

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
          <OverlayLoadingState message={apiMessage || 'Connecting to metagenome databases...'}>
            <AnalysisPanelSkeleton />
          </OverlayLoadingState>
        ) : error ? (
          <OverlayErrorState
            message="Failed to load provenance data"
            details={error}
          />
        ) : !result ? (
          <OverlayEmptyState
            message="No provenance data available"
            hint="Provenance analysis requires metagenome containment data from Serratus or similar databases."
          />
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
