import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { usePhageStore } from '@phage-explorer/state';
import {
  buildGrid,
  getNucleotideColor,
  getAminoAcidColor,
  type GridRow,
  type Theme,
} from '@phage-explorer/core';

interface SequenceGridProps {
  sequence: string;
  width?: number;
  height?: number;
}

// Group consecutive cells with same color for efficient rendering
interface ColorSegment {
  text: string;
  fg: string;
  bg: string;
}

function groupCellsByColor(
  row: GridRow,
  theme: Theme,
  viewMode: 'dna' | 'aa',
  diffEnabled: boolean
): ColorSegment[] {
  const segments: ColorSegment[] = [];
  let currentSegment: ColorSegment | null = null;

  for (const cell of row.cells) {
    const colorPair = viewMode === 'dna'
      ? getNucleotideColor(theme, cell.char)
      : getAminoAcidColor(theme, cell.char);

    // Modify colors for diff highlighting
    let fg = colorPair.fg;
    let bg = colorPair.bg;

    if (diffEnabled && cell.diff === 'different') {
      bg = theme.colors.diffHighlight;
    } else if (diffEnabled && cell.diff === 'same') {
      // Dim same bases
      bg = theme.colors.background;
    }

    // Check if we can extend current segment
    if (currentSegment && currentSegment.fg === fg && currentSegment.bg === bg) {
      currentSegment.text += cell.char;
    } else {
      if (currentSegment) {
        segments.push(currentSegment);
      }
      currentSegment = { text: cell.char, fg, bg };
    }
  }

  if (currentSegment) {
    segments.push(currentSegment);
  }

  return segments;
}

export function SequenceGrid({
  sequence,
  width = 60,
  height = 15,
}: SequenceGridProps): React.ReactElement {
  const theme = usePhageStore(s => s.currentTheme);
  const viewMode = usePhageStore(s => s.viewMode);
  const readingFrame = usePhageStore(s => s.readingFrame);
  const scrollPosition = usePhageStore(s => s.scrollPosition);
  const diffEnabled = usePhageStore(s => s.diffEnabled);

  // Build the grid based on current scroll position
  const grid = useMemo(() => {
    if (!sequence) return [];

    // Calculate effective start based on scroll position
    const effectiveCols = width;
    const effectiveRows = height;
    const charsPerScreen = effectiveCols * effectiveRows;

    // For AA mode, convert amino acid position to DNA position
    // Note: We don't add readingFrame here - buildGrid handles frame offset via translateSequence
    let startIndex = scrollPosition;
    if (viewMode === 'aa') {
      startIndex = scrollPosition * 3;
    }

    // Get the slice of sequence we need
    // For AA mode, add extra bases to account for reading frame offset and partial codons
    const sliceLength = viewMode === 'aa'
      ? charsPerScreen * 3 + readingFrame + 3
      : charsPerScreen;

    const seqSlice = sequence.substring(startIndex, startIndex + sliceLength);

    return buildGrid(seqSlice, startIndex, {
      viewportCols: effectiveCols,
      viewportRows: effectiveRows,
      mode: viewMode,
      frame: readingFrame,
    });
  }, [sequence, scrollPosition, viewMode, readingFrame, width, height]);

  const colors = theme.colors;

  // Calculate position info
  const totalLength = sequence?.length ?? 0;
  const effectiveLength = viewMode === 'aa' ? Math.floor(totalLength / 3) : totalLength;
  const positionPercent = effectiveLength > 0
    ? ((scrollPosition / effectiveLength) * 100).toFixed(1)
    : '0.0';

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={colors.border}
      width={width + 2}
    >
      {/* Title bar */}
      <Box paddingX={1} justifyContent="space-between">
        <Text color={colors.primary} bold>
          {viewMode === 'dna' ? 'DNA Sequence' : `Amino Acids (Frame ${readingFrame + 1})`}
        </Text>
        <Text color={colors.textDim}>
          {scrollPosition.toLocaleString()} / {effectiveLength.toLocaleString()} ({positionPercent}%)
        </Text>
      </Box>

      {/* Sequence grid */}
      <Box flexDirection="column" paddingX={0}>
        {grid.length === 0 ? (
          <Box height={height} alignItems="center" justifyContent="center">
            <Text color={colors.textDim}>No sequence data</Text>
          </Box>
        ) : (
          grid.map((row, rowIdx) => {
            const segments = groupCellsByColor(row, theme, viewMode, diffEnabled);

            return (
              <Box key={rowIdx}>
                {segments.map((seg, segIdx) => (
                  <Text
                    key={segIdx}
                    color={seg.fg}
                    backgroundColor={seg.bg}
                  >
                    {seg.text}
                  </Text>
                ))}
                {/* Pad row to full width */}
                {row.cells.length < width && width > 0 && (
                  <Text>{' '.repeat(Math.max(0, width - row.cells.length))}</Text>
                )}
              </Box>
            );
          })
        )}

        {/* Pad with empty rows if needed */}
        {grid.length < height && width > 0 && (
          Array(height - grid.length).fill(0).map((_, i) => (
            <Text key={`empty-${i}`}>{' '.repeat(Math.max(0, width))}</Text>
          ))
        )}
      </Box>
    </Box>
  );
}
