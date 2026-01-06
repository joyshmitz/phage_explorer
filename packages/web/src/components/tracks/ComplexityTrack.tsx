/**
 * ComplexityTrack - Sequence Complexity Analysis Track
 *
 * Displays local sequence complexity (Shannon entropy) as a track.
 * Low complexity regions may indicate repetitive sequences or compositional bias.
 */

import React, { useMemo, memo } from 'react';
import { CanvasTrack, type TrackData } from './CanvasTrack';
import { useTheme } from '../../hooks/useTheme';

interface ComplexityTrackProps {
  /** Sequence to analyze */
  sequence: string;
  /** Window size for complexity calculation */
  windowSize?: number;
  /** Track height */
  height?: number;
  /** Complexity threshold to highlight low complexity regions */
  lowComplexityThreshold?: number;
  /** Click handler - receives base position */
  onClick?: (basePosition: number) => void;
}

// Calculate Shannon entropy for a window
function shannonEntropy(window: string): number {
  const counts = new Map<string, number>();
  let total = 0;

  for (const base of window.toUpperCase()) {
    if (base === 'A' || base === 'C' || base === 'G' || base === 'T') {
      counts.set(base, (counts.get(base) ?? 0) + 1);
      total++;
    }
  }

  if (total === 0) return 0;

  let entropy = 0;
  for (const count of counts.values()) {
    const p = count / total;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
}

// Calculate complexity values along the sequence
function calculateComplexity(
  sequence: string,
  windowSize: number,
  lowComplexityThreshold: number
): { values: number[]; labels: Array<{ position: number; label: string; color?: string }> } {
  if (!sequence || sequence.length === 0) {
    return { values: [], labels: [] };
  }

  const values: number[] = [];
  const lowComplexityRegions: Array<{ start: number; end: number }> = [];
  let inLowComplexity = false;
  let lowComplexityStart = 0;

  for (let i = 0; i <= sequence.length - windowSize; i += windowSize) {
    const window = sequence.slice(i, i + windowSize);
    const entropy = shannonEntropy(window);
    // Normalize to 0-1 (max entropy for DNA is 2 bits)
    const normalizedEntropy = entropy / 2;
    values.push(normalizedEntropy);

    // Track low complexity regions
    if (normalizedEntropy < lowComplexityThreshold) {
      if (!inLowComplexity) {
        inLowComplexity = true;
        lowComplexityStart = i;
      }
    } else if (inLowComplexity) {
      inLowComplexity = false;
      lowComplexityRegions.push({ start: lowComplexityStart, end: i });
    }
  }

  // Close any open low complexity region
  if (inLowComplexity) {
    lowComplexityRegions.push({ start: lowComplexityStart, end: sequence.length });
  }

  // Create labels for significant low complexity regions
  const labels: Array<{ position: number; label: string; color?: string }> = [];
  const significantRegions = lowComplexityRegions.filter(
    (r) => r.end - r.start >= windowSize * 3 // At least 3 windows
  );

  for (const region of significantRegions.slice(0, 5)) {
    // Limit to top 5
    const midpoint = Math.floor((region.start + region.end) / 2);
    labels.push({
      position: midpoint,
      label: 'LC',
      color: '#f59e0b', // amber for low complexity
    });
  }

  return { values, labels };
}

function ComplexityTrackBase({
  sequence,
  windowSize = 500,
  height = 60,
  lowComplexityThreshold = 0.7, // 70% of max entropy
  onClick,
}: ComplexityTrackProps): React.ReactElement {
  const { theme } = useTheme();
  const colors = theme.colors;

  // Calculate complexity data
  const trackData = useMemo<TrackData | null>(() => {
    if (!sequence || sequence.length < windowSize * 2) {
      return null;
    }

    const { values, labels } = calculateComplexity(sequence, windowSize, lowComplexityThreshold);

    if (values.length === 0) {
      return null;
    }

    return {
      values,
      windowSize,
      genomeLength: sequence.length,
      minValue: 0,
      maxValue: 1,
      labels,
    };
  }, [sequence, windowSize, lowComplexityThreshold]);

  return (
    <CanvasTrack
      label="Complexity"
      height={height}
      data={trackData}
      loading={false}
      color={colors.accent}
      fillColor={`${colors.accent}22`}
      showGrid={true}
      showCenterLine={false}
      onClick={onClick}
      formatTooltip={(value, position) =>
        `Complexity: ${(value * 100).toFixed(1)}% at ${position.toLocaleString()} bp`
      }
    />
  );
}

export const ComplexityTrack = memo(ComplexityTrackBase);
export default ComplexityTrack;
