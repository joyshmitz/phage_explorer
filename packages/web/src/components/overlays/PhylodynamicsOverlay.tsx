/**
 * PhylodynamicsOverlay
 *
 * Interactive visualization of phylodynamic analysis:
 * - Phylogenetic tree (UPGMA)
 * - Root-to-tip regression (molecular clock)
 * - Coalescent skyline (effective population size Ne(t))
 *
 * Hotkey: Ctrl+Shift+Y (phylod[Y]namics)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { PhageFull } from '@phage-explorer/core';
import type { PhageRepository } from '../../db';
import { useTheme } from '../../hooks/useTheme';
import { Overlay } from './Overlay';
import { useOverlay } from './OverlayProvider';
import { useHotkey } from '../../hooks/useHotkey';
import {
  analyzePhylodynamics,
  generateDemoPhylodynamicsData,
  type PhylodynamicsResult,
  type TreeNode,
  type DatedSequence,
} from '@phage-explorer/core';
import { AnalysisPanelSkeleton } from '../ui/Skeleton';

interface PhylodynamicsOverlayProps {
  repository: PhageRepository | null;
  currentPhage: PhageFull | null;
}

type ViewMode = 'tree' | 'clock' | 'skyline';

export function PhylodynamicsOverlay({
  repository,
  currentPhage,
}: PhylodynamicsOverlayProps): React.ReactElement | null {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { isOpen, toggle } = useOverlay();

  const treeCanvasRef = useRef<HTMLCanvasElement>(null);
  const clockCanvasRef = useRef<HTMLCanvasElement>(null);
  const skylineCanvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [result, setResult] = useState<PhylodynamicsResult | null>(null);
  const [useDemoData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track if overlay is open to avoid stale closure issues
  const wasOpenRef = useRef(false);

  // Hotkey: Ctrl+Shift+Y (phylod[Y]namics)
  useHotkey(
    { key: 'y', modifiers: { ctrl: true, shift: true } },
    'Phylodynamic Trajectory Explorer',
    useCallback(() => toggle('phylodynamics'), [toggle]),
    { modes: ['NORMAL'], category: 'Analysis', minLevel: 'intermediate' }
  );

  // Run analysis when overlay opens
  useEffect(() => {
    const nowOpen = isOpen('phylodynamics');
    const justOpened = nowOpen && !wasOpenRef.current;
    wasOpenRef.current = nowOpen;

    if (!nowOpen) {
      return;
    }

    if (!justOpened && result) {
      // Already have data and didn't just open
      return;
    }

    setLoading(true);
    setError(null);

    // Use demo data for now (real data would come from repository)
    const runAnalysis = async () => {
      try {
        let sequences: DatedSequence[];

        if (useDemoData || !repository || !currentPhage) {
          // Generate synthetic dated sequences
          sequences = generateDemoPhylodynamicsData(15, 300, 5);
        } else {
          // TODO: In a real implementation, fetch sequences from repository
          // For now, use demo data
          sequences = generateDemoPhylodynamicsData(15, 300, 5);
        }

        const analysisResult = analyzePhylodynamics(sequences, {
          runClock: true,
          runSkyline: true,
          runSelection: true,
        });

        setResult(analysisResult);
      } catch (err) {
        setResult(null);
        setError(err instanceof Error ? err.message : 'Phylodynamics analysis failed.');
      } finally {
        setLoading(false);
      }
    };

    runAnalysis();
  }, [isOpen, result, useDemoData, repository, currentPhage]);

  // Draw phylogenetic tree
  useEffect(() => {
    if (!isOpen('phylodynamics') || viewMode !== 'tree') return;
    if (!treeCanvasRef.current || !result) return;

    const canvas = treeCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Clear
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, width, height);

      const { tree } = result;
      const padding = 40;
      const treeWidth = width - padding * 2;
      const treeHeight = height - padding * 2;

      // Collect leaf nodes for positioning
      const leaves: TreeNode[] = [];
      const collectLeaves = (node: TreeNode): void => {
        if (node.isLeaf) leaves.push(node);
        node.children.forEach(collectLeaves);
      };
      collectLeaves(tree.root);

      if (leaves.length === 0) return;

      // Assign y positions to leaves
      const leafSpacing = treeHeight / (leaves.length + 1);
      const leafY = new Map<string, number>();
      leaves.forEach((leaf, i) => {
        leafY.set(leaf.id, padding + (i + 1) * leafSpacing);
      });

      // Calculate internal node y as mean of children
      const nodeY = new Map<string, number>();
      const calcY = (node: TreeNode): number => {
        if (node.isLeaf) {
          const y = leafY.get(node.id) ?? height / 2;
          nodeY.set(node.id, y);
          return y;
        }
        const childYs = node.children.map(calcY);
        const y = childYs.reduce((a, b) => a + b, 0) / childYs.length;
        nodeY.set(node.id, y);
        return y;
      };
      calcY(tree.root);

      // Calculate x from heights (normalized)
      const maxHeight = tree.height || 1;
      const scaleX = (h: number) => padding + (h / maxHeight) * treeWidth;

      // Draw tree edges
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 2;

      const drawNode = (node: TreeNode, parentX: number | null, parentY: number | null): void => {
        const x = scaleX(node.height);
        const y = nodeY.get(node.id) ?? height / 2;

        if (parentX !== null && parentY !== null) {
          // Horizontal line from parent
          ctx.beginPath();
          ctx.moveTo(parentX, parentY);
          ctx.lineTo(parentX, y);
          ctx.stroke();

          // Vertical line to node
          ctx.beginPath();
          ctx.moveTo(parentX, y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }

        // Draw children
        node.children.forEach(child => drawNode(child, x, y));

        // Draw leaf labels
        if (node.isLeaf) {
          ctx.fillStyle = colors.accent;
          ctx.font = '10px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          const label = node.sequence?.id ?? node.id;
          ctx.fillText(label.slice(0, 12), x + 5, y);
        } else {
          // Internal node dot
          ctx.fillStyle = colors.primary;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      drawNode(tree.root, null, null);

      // Time axis
      ctx.strokeStyle = colors.textDim;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, height - padding / 2);
      ctx.lineTo(width - padding, height - padding / 2);
      ctx.stroke();

      ctx.fillStyle = colors.textDim;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('← Past', padding + 40, height - padding / 2 + 12);
      ctx.fillText('Present →', width - padding - 40, height - padding / 2 + 12);
    };

    draw();

    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [isOpen, viewMode, result, colors]);

  // Draw root-to-tip regression (molecular clock)
  useEffect(() => {
    if (!isOpen('phylodynamics') || viewMode !== 'clock') return;
    if (!clockCanvasRef.current || !result?.clockRegression) return;

    const canvas = clockCanvasRef.current;
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

      const { clockRegression } = result;
      if (!clockRegression || clockRegression.residuals.length === 0) {
        ctx.fillStyle = colors.textMuted;
        ctx.textAlign = 'center';
        ctx.font = '14px monospace';
        ctx.fillText('Insufficient data for clock analysis', width / 2, height / 2);
        return;
      }

      const padding = 50;
      const plotWidth = width - padding * 2;
      const plotHeight = height - padding * 2;

      // Find data range
      const residuals = clockRegression.residuals;
      const dates = residuals.map(r => r.observed);
      const distances = residuals.map(r => r.expected);
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      const minDist = 0;
      const maxDist = Math.max(...distances, ...residuals.map(r => r.observed)) * 1.1;

      const scaleX = (d: number) => padding + ((d - minDate) / (maxDate - minDate || 1)) * plotWidth;
      const scaleY = (v: number) => height - padding - ((v - minDist) / (maxDist - minDist || 1)) * plotHeight;

      // Draw regression line
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(scaleX(minDate), scaleY(clockRegression.rate * minDate + (clockRegression.rate > 0 ? -clockRegression.rate * clockRegression.rootAge : 0)));
      ctx.lineTo(scaleX(maxDate), scaleY(clockRegression.rate * maxDate + (clockRegression.rate > 0 ? -clockRegression.rate * clockRegression.rootAge : 0)));
      ctx.stroke();

      // Draw data points
      ctx.fillStyle = colors.primary;
      for (const r of residuals) {
        const x = scaleX(r.observed);
        const y = scaleY(r.expected);
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Axes
      ctx.strokeStyle = colors.textDim;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, height - padding);
      ctx.lineTo(width - padding, height - padding);
      ctx.stroke();

      // Labels
      ctx.fillStyle = colors.textDim;
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Collection Date (Year)', width / 2, height - 10);

      ctx.save();
      ctx.translate(15, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Root-to-Tip Distance', 0, 0);
      ctx.restore();

      // R² annotation
      ctx.fillStyle = colors.accent;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`R² = ${clockRegression.r2.toFixed(3)}`, width - padding - 10, padding + 20);
      ctx.fillText(`Rate = ${(clockRegression.rate * 1000).toFixed(3)} ×10⁻³ sub/site/yr`, width - padding - 10, padding + 36);
    };

    draw();

    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [isOpen, viewMode, result, colors]);

  // Draw coalescent skyline
  useEffect(() => {
    if (!isOpen('phylodynamics') || viewMode !== 'skyline') return;
    if (!skylineCanvasRef.current || !result?.skyline) return;

    const canvas = skylineCanvasRef.current;
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

      const { skyline } = result;
      if (!skyline || skyline.intervals.length === 0) {
        ctx.fillStyle = colors.textMuted;
        ctx.textAlign = 'center';
        ctx.font = '14px monospace';
        ctx.fillText('Skyline requires clock-calibrated tree', width / 2, height / 2);
        return;
      }

      const padding = 50;
      const plotWidth = width - padding * 2;
      const plotHeight = height - padding * 2;

      // Data ranges (log scale for Ne)
      const maxTime = skyline.timeSpan || 1;
      const neValues = skyline.intervals.map(i => i.ne).filter(v => v > 0);
      const minNe = Math.max(1, Math.min(...neValues));
      const maxNe = Math.max(...neValues) * 1.2;
      const logMin = Math.log10(minNe);
      const logMax = Math.log10(maxNe);

      const scaleX = (t: number) => padding + (t / maxTime) * plotWidth;
      const scaleY = (ne: number) => {
        const logNe = Math.log10(Math.max(1, ne));
        return height - padding - ((logNe - logMin) / (logMax - logMin || 1)) * plotHeight;
      };

      // Draw skyline as step function
      ctx.strokeStyle = colors.success;
      ctx.lineWidth = 2;
      ctx.beginPath();

      let started = false;
      for (const interval of skyline.intervals) {
        const x1 = scaleX(interval.startTime);
        const x2 = scaleX(interval.endTime);
        const y = scaleY(interval.ne);

        if (!started) {
          ctx.moveTo(x1, y);
          started = true;
        } else {
          ctx.lineTo(x1, y);
        }
        ctx.lineTo(x2, y);
      }
      ctx.stroke();

      // Fill under curve
      ctx.fillStyle = colors.success + '33'; // 20% opacity
      ctx.beginPath();
      started = false;
      for (const interval of skyline.intervals) {
        const x1 = scaleX(interval.startTime);
        const x2 = scaleX(interval.endTime);
        const y = scaleY(interval.ne);

        if (!started) {
          ctx.moveTo(x1, height - padding);
          ctx.lineTo(x1, y);
          started = true;
        } else {
          ctx.lineTo(x1, y);
        }
        ctx.lineTo(x2, y);
      }
      // Close path
      const lastInterval = skyline.intervals[skyline.intervals.length - 1];
      if (lastInterval) {
        ctx.lineTo(scaleX(lastInterval.endTime), height - padding);
      }
      ctx.closePath();
      ctx.fill();

      // Axes
      ctx.strokeStyle = colors.textDim;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, height - padding);
      ctx.lineTo(width - padding, height - padding);
      ctx.stroke();

      // Labels
      ctx.fillStyle = colors.textDim;
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Time (Years Before Present)', width / 2, height - 10);

      ctx.save();
      ctx.translate(15, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Effective Pop. Size Ne (log)', 0, 0);
      ctx.restore();

      // Lineage count annotation
      ctx.fillStyle = colors.accent;
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      for (const interval of skyline.intervals) {
        if (interval.lineages >= 2) {
          const x = scaleX((interval.startTime + interval.endTime) / 2);
          const y = scaleY(interval.ne) - 10;
          ctx.fillText(`k=${interval.lineages}`, x - 10, y);
        }
      }
    };

    draw();

    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [isOpen, viewMode, result, colors]);

  if (!isOpen('phylodynamics')) return null;

  return (
    <Overlay id="phylodynamics" title="PHYLODYNAMIC TRAJECTORY EXPLORER" size="xl">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
        {/* Info banner */}
        <div
          style={{
            padding: '0.75rem',
            backgroundColor: colors.backgroundAlt,
            borderRadius: '4px',
            color: colors.textDim,
            fontSize: '0.9rem',
          }}
        >
          <strong style={{ color: colors.accent }}>Phylodynamics</strong>: Time-scaled
          evolutionary analysis using UPGMA trees, molecular clock regression, and
          coalescent skyline for effective population size.
        </div>

        {/* View mode tabs */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['tree', 'clock', 'skyline'] as ViewMode[]).map(mode => (
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
              {mode === 'tree' && '🌳 Tree'}
              {mode === 'clock' && '⏱ Clock'}
              {mode === 'skyline' && '📈 Skyline'}
            </button>
          ))}
        </div>

        {/* Canvas area */}
        {loading ? (
          <AnalysisPanelSkeleton />
        ) : error ? (
          <div style={{ padding: '1rem', color: colors.error }}>{error}</div>
        ) : !result ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: colors.textMuted }}>
            No analysis data available.
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              minHeight: '300px',
              border: `1px solid ${colors.borderLight}`,
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <canvas
              ref={treeCanvasRef}
              style={{
                width: '100%',
                height: '100%',
                display: viewMode === 'tree' ? 'block' : 'none',
              }}
            />
            <canvas
              ref={clockCanvasRef}
              style={{
                width: '100%',
                height: '100%',
                display: viewMode === 'clock' ? 'block' : 'none',
              }}
            />
            <canvas
              ref={skylineCanvasRef}
              style={{
                width: '100%',
                height: '100%',
                display: viewMode === 'skyline' ? 'block' : 'none',
              }}
            />
          </div>
        )}

        {/* Stats footer */}
        {result && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.5rem',
              backgroundColor: colors.backgroundAlt,
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontFamily: 'monospace',
            }}
          >
            <span style={{ color: colors.textDim }}>
              Leaves: <strong style={{ color: colors.text }}>{result.tree.leafCount}</strong>
            </span>
            <span style={{ color: colors.textDim }}>
              Clock R²:{' '}
              <strong
                style={{
                  color: (result.clockRegression?.r2 ?? 0) > 0.7 ? colors.success : colors.warning,
                }}
              >
                {result.clockRegression?.r2.toFixed(3) ?? 'N/A'}
              </strong>
            </span>
            <span style={{ color: colors.textDim }}>
              dN/dS:{' '}
              <strong
                style={{
                  color:
                    (result.selection?.treeDnDs ?? 1) > 1
                      ? colors.error
                      : (result.selection?.treeDnDs ?? 1) < 1
                        ? colors.primary
                        : colors.text,
                }}
              >
                {result.selection?.treeDnDs.toFixed(3) ?? 'N/A'}
              </strong>
            </span>
          </div>
        )}
      </div>
    </Overlay>
  );
}

export default PhylodynamicsOverlay;
