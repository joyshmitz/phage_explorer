import React, { useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { usePhageStore } from '@phage-explorer/state';
import type { NumericOverlay } from '../overlay-computations';
import { Sparkline } from './Sparkline';

interface GCOverlayProps {
  sequence: string;
}

function computeCumulativeSkew(sequence: string) {
  let cum = 0;
  const values: number[] = new Array(sequence.length);
  let gCount = 0;
  let cCount = 0;

  for (let i = 0; i < sequence.length; i++) {
    const ch = sequence[i];
    if (ch === 'G') {
      cum += 1;
      gCount++;
    } else if (ch === 'C') {
      cum -= 1;
      cCount++;
    }
    values[i] = cum;
  }

  let minVal = Number.POSITIVE_INFINITY;
  let maxVal = Number.NEGATIVE_INFINITY;
  let minIdx = 0;
  let maxIdx = 0;

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v < minVal) {
      minVal = v;
      minIdx = i;
    }
    if (v > maxVal) {
      maxVal = v;
      maxIdx = i;
    }
  }

  const gcPercent = sequence.length > 0 ? ((gCount + cCount) / sequence.length) * 100 : 0;
  const atPercent = 100 - gcPercent;

  return { values, minIdx, maxIdx, gcPercent, atPercent, gCount, cCount };
}

export function GCOverlay({ sequence }: GCOverlayProps): React.ReactElement {
  const theme = usePhageStore(s => s.currentTheme);
  const closeOverlay = usePhageStore(s => s.closeOverlay);
  const overlayData = usePhageStore(s => s.overlayData.gcSkew) as NumericOverlay | undefined;

  const result = useMemo(() => {
    return computeCumulativeSkew(sequence.toUpperCase());
  }, [sequence]);

  // Get values for sparkline
  const sparklineValues = useMemo(() => {
    if (overlayData && 'values' in overlayData) {
      return overlayData.values;
    }
    return result.values;
  }, [overlayData, result.values]);

  useInput((input, key) => {
    if (key.escape || input === 'g' || input === 'G') {
      closeOverlay('gcSkew');
    }
  });

  const colors = theme.colors;
  const originPos = result.minIdx + 1; // 1-based
  const terminusPos = result.maxIdx + 1;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.borderFocus}
      paddingX={2}
      paddingY={1}
      width={80}
    >
      {/* Header with close hint */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Box gap={1}>
          <Text color={colors.primary} bold>◉ GC SKEW ANALYSIS</Text>
          <Text color={colors.accent}>[G]</Text>
        </Box>
        <Text color={colors.textMuted}>ESC or G to close</Text>
      </Box>

      {/* Separator */}
      <Box marginBottom={1}>
        <Text color={colors.borderLight}>{'─'.repeat(74)}</Text>
      </Box>

      {sequence.length === 0 ? (
        <Text color={colors.textDim}>No sequence loaded</Text>
      ) : (
        <>
          {/* Stats row */}
          <Box gap={3} marginBottom={1}>
            <Box gap={1}>
              <Text color={colors.textDim}>GC Content:</Text>
              <Text color={colors.success} bold>{result.gcPercent.toFixed(1)}%</Text>
            </Box>
            <Box gap={1}>
              <Text color={colors.textDim}>AT Content:</Text>
              <Text color={colors.warning} bold>{result.atPercent.toFixed(1)}%</Text>
            </Box>
            <Box gap={1}>
              <Text color={colors.textDim}>G:</Text>
              <Text color={colors.text}>{result.gCount.toLocaleString()}</Text>
            </Box>
            <Box gap={1}>
              <Text color={colors.textDim}>C:</Text>
              <Text color={colors.text}>{result.cCount.toLocaleString()}</Text>
            </Box>
          </Box>

          {/* GC/AT ratio bar */}
          <Box marginBottom={1}>
            <Text color={colors.textDim}>Ratio: </Text>
            <Text color={colors.success}>{'█'.repeat(Math.round(result.gcPercent / 100 * 40))}</Text>
            <Text color={colors.warning}>{'█'.repeat(Math.round(result.atPercent / 100 * 40))}</Text>
            <Text color={colors.textMuted}> GC│AT</Text>
          </Box>

          {/* Sparkline visualization */}
          <Box flexDirection="column" marginBottom={1}>
            <Text color={colors.textDim} bold>Cumulative GC Skew:</Text>
            <Sparkline
              values={sparklineValues}
              width={70}
              colors={colors}
              gradient={true}
              showRange={true}
            />
          </Box>

          {/* Origin and Terminus markers */}
          <Box flexDirection="column" marginTop={1}>
            <Box gap={2}>
              <Box gap={1}>
                <Text color={colors.info}>▼</Text>
                <Text color={colors.textDim}>Origin (min skew):</Text>
                <Text color={colors.text} bold>{originPos.toLocaleString()} bp</Text>
                <Text color={colors.textMuted}>
                  ({((originPos / sequence.length) * 100).toFixed(1)}%)
                </Text>
              </Box>
            </Box>
            <Box gap={2}>
              <Box gap={1}>
                <Text color={colors.warning}>▲</Text>
                <Text color={colors.textDim}>Terminus (max skew):</Text>
                <Text color={colors.text} bold>{terminusPos.toLocaleString()} bp</Text>
                <Text color={colors.textMuted}>
                  ({((terminusPos / sequence.length) * 100).toFixed(1)}%)
                </Text>
              </Box>
            </Box>
          </Box>

          {/* Explanation */}
          <Box marginTop={1}>
            <Text color={colors.textMuted}>
              GC skew reveals replication asymmetry. Origin typically near minimum,
              terminus near maximum. Useful for identifying replication direction.
            </Text>
          </Box>
        </>
      )}
    </Box>
  );
}
