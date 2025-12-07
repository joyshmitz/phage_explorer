import React, { useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { usePhageStore } from '@phage-explorer/state';
import type { KmerAnomalyOverlay } from '../overlay-computations';

const BARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

function toSparkline(values: number[], width = 64): string {
  if (values.length === 0) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) {
    return BARS[0].repeat(Math.min(values.length, width));
  }
  const step = Math.max(1, Math.floor(values.length / width));
  const points: number[] = [];
  for (let i = 0; i < values.length; i += step) {
    points.push(values[i]);
  }
  return points.map(v => {
    const t = (v - min) / (max - min);
    const idx = Math.min(BARS.length - 1, Math.max(0, Math.round(t * (BARS.length - 1))));
    return BARS[idx];
  }).join('');
}

export function KmerAnomalyOverlay(): React.ReactElement {
  const theme = usePhageStore(s => s.currentTheme);
  const overlayData = usePhageStore(s => s.overlayData.kmerAnomaly) as KmerAnomalyOverlay | undefined;
  const phage = usePhageStore(s => s.currentPhage);
  const closeOverlay = usePhageStore(s => s.closeOverlay);
  const colors = theme.colors;

  useInput((input, key) => {
    if (key.escape || input === 'j' || input === 'J') {
      closeOverlay('kmerAnomaly');
    }
  });

  const summary = useMemo(() => {
    if (!overlayData || overlayData.values.length === 0) {
      return { spark: '', hotspots: [] as KmerAnomalyOverlay['hotspots'] };
    }
    return {
      spark: toSparkline(overlayData.values, 64),
      hotspots: overlayData.hotspots,
    };
  }, [overlayData]);

  const phageName = phage?.name ?? 'Current phage';

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={colors.accent}
      paddingX={2}
      paddingY={1}
      width={80}
    >
      <Box justifyContent="space-between" marginBottom={1}>
        <Text color={colors.accent} bold>
          K-MER ANOMALY MAP (J KEY)
        </Text>
        <Text color={colors.textDim}>Esc/J to close</Text>
      </Box>

      {!overlayData || overlayData.values.length === 0 ? (
        <Text color={colors.textDim}>No k-mer data loaded</Text>
      ) : (
        <>
          <Box flexDirection="column" marginBottom={1}>
            <Text color={colors.text}>
              {phageName} · k={overlayData.k} · window {overlayData.window} bp · step {overlayData.step} bp · windows {overlayData.width}
            </Text>
            <Text color={colors.textDim}>
              Jensen–Shannon divergence vs genome-wide k-mer background. Higher = atypical composition (candidate islands).
            </Text>
          </Box>

          <Box flexDirection="column" marginBottom={1}>
            <Text color={colors.accent} bold>Sparkline</Text>
            <Text color={colors.text}>{summary.spark}</Text>
            <Text color={colors.textDim} dimColor>
              ▁ low — █ high divergence
            </Text>
          </Box>

          <Box flexDirection="column">
            <Text color={colors.accent} bold>Hotspots</Text>
            {summary.hotspots.length === 0 ? (
              <Text color={colors.textDim}>None detected</Text>
            ) : summary.hotspots.map((h, idx) => (
              <Text key={idx} color={colors.text}>
                #{idx + 1} {h.start.toLocaleString()}–{h.end.toLocaleString()} · score {(h.score * 100).toFixed(1)}%
                {h.topKmers.length > 0 ? ` · top k-mers: ${h.topKmers.join(', ')}` : ''}
              </Text>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
