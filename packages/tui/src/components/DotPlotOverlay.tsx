import React, { useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { usePhageStore } from '@phage-explorer/state';
import { computeDotPlot } from '@phage-explorer/core';

interface DotPlotOverlayProps {
  sequence: string;
  threshold?: number; // identity threshold for plotting
  bins?: number;
}

// Braille mapping (2x4)
const DOT_MAP = [0x01, 0x02, 0x04, 0x40, 0x08, 0x10, 0x20, 0x80];

function toBraille(grid: { direct: boolean; inverted: boolean }[][], directColor: string, invertedColor: string) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const out: Array<{ char: string; color: string }[]> = [];
  const charRows = Math.ceil(rows / 4);
  const charCols = Math.ceil(cols / 2);

  for (let cy = 0; cy < charRows; cy++) {
    const line: { char: string; color: string }[] = [];
    for (let cx = 0; cx < charCols; cx++) {
      let mask = 0;
      let hasDirect = false;
      let hasInverted = false;
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const gy = cy * 4 + dy;
          const gx = cx * 2 + dx;
          if (gy >= rows || gx >= cols) continue;
          const cell = grid[gy][gx];
          const idx = dy * 2 + dx;
          if (cell.direct || cell.inverted) {
            mask |= DOT_MAP[idx];
            hasDirect = hasDirect || cell.direct;
            hasInverted = hasInverted || cell.inverted;
          }
        }
      }
      const char = String.fromCharCode(0x2800 + mask);
      const color = hasDirect ? directColor : hasInverted ? invertedColor : 'white';
      line.push({ char, color });
    }
    out.push(line);
  }
  return out;
}

export function DotPlotOverlay({ sequence, threshold = 0.8, bins = 120 }: DotPlotOverlayProps): React.ReactElement {
  const colors = usePhageStore(s => s.currentTheme.colors);
  const closeOverlay = usePhageStore(s => s.closeOverlay);
  useInput((input, key) => {
    if (key.escape) {
      closeOverlay('dotPlot');
    }
  });

  const grid = useMemo(() => {
    const raw = computeDotPlot(sequence, { bins });
    return raw.grid.map(row =>
      row.map(cell => ({
        direct: cell.direct >= threshold,
        inverted: cell.inverted >= threshold,
      }))
    );
  }, [sequence, bins, threshold]);

  const braille = useMemo(
    () => toBraille(grid, colors.accent, colors.info),
    [grid, colors.accent, colors.info]
  );

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.borderFocus}
      paddingX={1}
      paddingY={1}
    >
      <Box justifyContent="space-between" marginBottom={1}>
        <Text color={colors.primary} bold>
          ◉ Self-Homology Dot Plot
        </Text>
        <Text color={colors.textDim}>ESC to close</Text>
      </Box>
      <Box marginBottom={1}>
        <Text color={colors.textDim}>
          Window: {Math.max(20, Math.floor(sequence.length / bins))} bp · Threshold: {Math.round(threshold * 100)}% · ● direct ({colors.accent}) ○ inverted ({colors.info})
        </Text>
      </Box>
      <Box flexDirection="column">
        {braille.map((line, idx) => (
          <Text key={idx}>
            {line.map((cell, j) => (
              <Text key={j} color={cell.color}>{cell.char}</Text>
            ))}
          </Text>
        ))}
      </Box>
    </Box>
  );
}
