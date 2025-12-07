import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import type { HudTheme } from '@phage-explorer/core';

// Sparkline character sets for different styles
const BARS_8 = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
const BRAILLE_DOTS = ['⠀', '⣀', '⣤', '⣶', '⣿']; // 5 levels
const BLOCKS_4 = ['░', '▒', '▓', '█'];

export type SparklineStyle = 'bars' | 'braille' | 'blocks';

export interface SparklineProps {
  /** Array of numeric values to visualize */
  values: number[];
  /** Width in characters */
  width: number;
  /** Visual style */
  style?: SparklineStyle;
  /** Whether to use gradient coloring */
  gradient?: boolean;
  /** Theme colors */
  colors: HudTheme;
  /** Min value override (auto-calculated if not provided) */
  min?: number;
  /** Max value override (auto-calculated if not provided) */
  max?: number;
  /** Label to show before sparkline */
  label?: string;
  /** Show min/max values */
  showRange?: boolean;
  /** Highlight positions (indices that should be emphasized) */
  highlights?: number[];
}

// Interpolate between two hex colors
function interpolateColor(color1: string, color2: string, factor: number): string {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);

  const r1 = (c1 >> 16) & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = c1 & 0xff;

  const r2 = (c2 >> 16) & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = c2 & 0xff;

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Get color for a normalized value (0-1) using theme gradient
function getGradientColor(value: number, colors: HudTheme): string {
  if (value < 0.5) {
    return interpolateColor(colors.gradientLow, colors.gradientMid, value * 2);
  }
  return interpolateColor(colors.gradientMid, colors.gradientHigh, (value - 0.5) * 2);
}

// Get characters for style
function getChars(style: SparklineStyle): string[] {
  switch (style) {
    case 'braille': return BRAILLE_DOTS;
    case 'blocks': return BLOCKS_4;
    default: return BARS_8;
  }
}

// Map value to character
function valueToChar(
  value: number,
  min: number,
  max: number,
  chars: string[]
): string {
  if (max === min) return chars[0];
  const norm = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const idx = Math.round(norm * (chars.length - 1));
  return chars[idx];
}

// Downsample values to fit width
function downsample(values: number[], targetWidth: number): number[] {
  if (values.length <= targetWidth) return values;

  const step = values.length / targetWidth;
  const result: number[] = [];

  for (let i = 0; i < targetWidth; i++) {
    const startIdx = Math.floor(i * step);
    const endIdx = Math.floor((i + 1) * step);

    // Take average of values in this bucket
    let sum = 0;
    let count = 0;
    for (let j = startIdx; j < endIdx && j < values.length; j++) {
      sum += values[j];
      count++;
    }
    result.push(count > 0 ? sum / count : 0);
  }

  return result;
}

export function Sparkline({
  values,
  width,
  style = 'bars',
  gradient = true,
  colors,
  min: minOverride,
  max: maxOverride,
  label,
  showRange = false,
  highlights = [],
}: SparklineProps): React.ReactElement {
  const processedData = useMemo(() => {
    if (!values || values.length === 0) {
      return { chars: [], colors: [], min: 0, max: 0 };
    }

    // Calculate min/max
    const computedMin = minOverride ?? Math.min(...values);
    const computedMax = maxOverride ?? Math.max(...values);

    // Downsample to fit width
    const sampled = downsample(values, width);
    const chartChars = getChars(style);

    // Create highlight set for quick lookup
    const highlightSet = new Set(
      highlights.map(h => Math.floor((h / values.length) * sampled.length))
    );

    // Generate characters and colors
    const resultChars: string[] = [];
    const resultColors: string[] = [];

    for (let i = 0; i < sampled.length; i++) {
      const v = sampled[i];
      const norm = computedMax === computedMin ? 0 :
        (v - computedMin) / (computedMax - computedMin);

      resultChars.push(valueToChar(v, computedMin, computedMax, chartChars));

      if (highlightSet.has(i)) {
        resultColors.push(colors.highlight);
      } else if (gradient) {
        resultColors.push(getGradientColor(norm, colors));
      } else {
        resultColors.push(colors.text);
      }
    }

    return {
      chars: resultChars,
      colors: resultColors,
      min: computedMin,
      max: computedMax,
    };
  }, [values, width, style, gradient, colors, minOverride, maxOverride, highlights]);

  if (values.length === 0) {
    return (
      <Box>
        {label && <Text color={colors.textDim}>{label} </Text>}
        <Text color={colors.textMuted}>No data</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box gap={1}>
        {label && <Text color={colors.textDim}>{label}</Text>}
        <Box>
          {processedData.chars.map((char, i) => (
            <Text key={i} color={processedData.colors[i]}>
              {char}
            </Text>
          ))}
        </Box>
      </Box>
      {showRange && (
        <Box gap={1}>
          <Text color={colors.textMuted}>
            min: {processedData.min.toFixed(2)} │ max: {processedData.max.toFixed(2)}
          </Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Mini sparkline for inline use - returns just the colored string
 */
export function MiniSparkline({
  values,
  width,
  colors,
  style = 'bars',
}: {
  values: number[];
  width: number;
  colors: HudTheme;
  style?: SparklineStyle;
}): React.ReactElement {
  // Handle empty array case
  if (!values || values.length === 0) {
    return (
      <Box>
        <Text color={colors.textMuted}>{'─'.repeat(width)}</Text>
      </Box>
    );
  }

  const chars = getChars(style);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sampled = downsample(values, width);

  return (
    <Box>
      {sampled.map((v, i) => {
        const norm = max === min ? 0 : (v - min) / (max - min);
        return (
          <Text key={i} color={getGradientColor(norm, colors)}>
            {valueToChar(v, min, max, chars)}
          </Text>
        );
      })}
    </Box>
  );
}

/**
 * Progress bar style visualization
 */
export function ProgressBar({
  value,
  max = 100,
  width = 20,
  colors,
  label,
  showPercent = true,
}: {
  value: number;
  max?: number;
  width?: number;
  colors: HudTheme;
  label?: string;
  showPercent?: boolean;
}): React.ReactElement {
  const percent = Math.min(1, Math.max(0, value / max));
  const filledWidth = Math.round(percent * width);
  const emptyWidth = width - filledWidth;

  const barColor = percent < 0.3 ? colors.error :
                   percent < 0.7 ? colors.warning : colors.success;

  return (
    <Box gap={1}>
      {label && <Text color={colors.textDim}>{label}</Text>}
      <Text color={barColor}>{'█'.repeat(filledWidth)}</Text>
      <Text color={colors.textMuted}>{'░'.repeat(emptyWidth)}</Text>
      {showPercent && (
        <Text color={colors.text}>{Math.round(percent * 100)}%</Text>
      )}
    </Box>
  );
}

/**
 * Dual-tone bar for showing positive/negative or comparison values
 */
export function DualBar({
  valueA,
  valueB,
  width = 40,
  colors,
  labelA,
  labelB,
}: {
  valueA: number;
  valueB: number;
  width?: number;
  colors: HudTheme;
  labelA?: string;
  labelB?: string;
}): React.ReactElement {
  const total = valueA + valueB;
  const widthA = total > 0 ? Math.round((valueA / total) * width) : width / 2;
  const widthB = width - widthA;

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={colors.geneForward}>{'█'.repeat(widthA)}</Text>
        <Text color={colors.textMuted}>│</Text>
        <Text color={colors.geneReverse}>{'█'.repeat(widthB)}</Text>
      </Box>
      {(labelA || labelB) && (
        <Box justifyContent="space-between" width={width + 1}>
          <Text color={colors.textDim}>{labelA ?? ''}</Text>
          <Text color={colors.textDim}>{labelB ?? ''}</Text>
        </Box>
      )}
    </Box>
  );
}
