import React from 'react';
import { Box, Text } from 'ink';
import { usePhageStore } from '@phage-explorer/state';

interface PhageListProps {
  width?: number;
  height?: number;
}

// Format genome size with appropriate suffix
function formatSize(bp: number | null | undefined): string {
  if (!bp) return '?';
  if (bp >= 100_000) return `${(bp / 1000).toFixed(0)}k`;
  if (bp >= 10_000) return `${(bp / 1000).toFixed(1)}k`;
  return `${(bp / 1000).toFixed(1)}k`;
}

// Truncate host name intelligently
function abbreviateHost(host: string | null): string {
  if (!host) return '';
  // Take first word and abbreviate if needed
  const first = host.split(/[\s,.]+/)[0];
  if (first.length <= 6) return first;
  // Common abbreviations
  if (first.toLowerCase().startsWith('escherichia')) return 'E.coli';
  if (first.toLowerCase().startsWith('salmonella')) return 'Sal.';
  if (first.toLowerCase().startsWith('pseudomonas')) return 'Psd.';
  if (first.toLowerCase().startsWith('bacillus')) return 'Bac.';
  return first.substring(0, 5) + '.';
}

export function PhageList({ width = 30, height = 10 }: PhageListProps): React.ReactElement {
  const phages = usePhageStore(s => s.phages);
  const currentIndex = usePhageStore(s => s.currentPhageIndex);
  const theme = usePhageStore(s => s.currentTheme);
  const colors = theme.colors;

  // Calculate visible window
  const halfWindow = Math.floor(height / 2);
  let startIndex = Math.max(0, currentIndex - halfWindow);
  const endIndex = Math.min(phages.length, startIndex + height);

  // Adjust if we're near the end
  if (endIndex - startIndex < height && startIndex > 0) {
    startIndex = Math.max(0, endIndex - height);
  }

  const visiblePhages = phages.slice(startIndex, endIndex);

  // Calculate max name length (accounting for selection indicator and metadata)
  const maxNameLen = width - 12; // Space for "▶ " + " [size]"

  return (
    <Box
      flexDirection="column"
      width={width}
      borderStyle="round"
      borderColor={colors.border}
    >
      {/* Title with count */}
      <Box paddingX={1} justifyContent="space-between">
        <Text color={colors.primary} bold>◉ Phages</Text>
        <Text color={colors.textMuted}>{phages.length}</Text>
      </Box>

      {/* Separator line */}
      <Box paddingX={1}>
        <Text color={colors.borderLight}>{'─'.repeat(width - 4)}</Text>
      </Box>

      {/* Phage list */}
      <Box flexDirection="column" paddingX={1}>
        {visiblePhages.map((phage, i) => {
          const actualIndex = startIndex + i;
          const isSelected = actualIndex === currentIndex;

          // Truncate name if needed
          let displayName = phage.name;
          if (displayName.length > maxNameLen) {
            displayName = displayName.substring(0, maxNameLen - 1) + '…';
          }

          // Get abbreviated host
          const hostAbbr = abbreviateHost(phage.host);
          const sizeStr = formatSize(phage.genomeLength);

          return (
            <Box key={phage.id} justifyContent="space-between">
              <Box gap={0}>
                {/* Selection indicator */}
                <Text
                  color={isSelected ? colors.accent : colors.textMuted}
                  bold={isSelected}
                >
                  {isSelected ? '▶ ' : '  '}
                </Text>

                {/* Phage name with highlight */}
                <Text
                  color={isSelected ? colors.text : colors.textDim}
                  bold={isSelected}
                  backgroundColor={isSelected ? colors.backgroundAlt : undefined}
                >
                  {displayName}
                </Text>
              </Box>

              {/* Metadata (host + size) */}
              <Box gap={1}>
                {hostAbbr && (
                  <Text color={colors.textMuted}>
                    {hostAbbr}
                  </Text>
                )}
                <Text
                  color={isSelected ? colors.info : colors.textMuted}
                >
                  {sizeStr}
                </Text>
              </Box>
            </Box>
          );
        })}

        {/* Padding for empty space */}
        {visiblePhages.length < height && (
          Array(height - visiblePhages.length).fill(0).map((_, i) => (
            <Text key={`empty-${i}`}> </Text>
          ))
        )}
      </Box>

      {/* Scroll indicators */}
      {phages.length > height && (
        <Box paddingX={1} justifyContent="space-between">
          <Text color={startIndex > 0 ? colors.accent : colors.textMuted}>
            {startIndex > 0 ? '↑ more' : '      '}
          </Text>
          <Text color={endIndex < phages.length ? colors.accent : colors.textMuted}>
            {endIndex < phages.length ? 'more ↓' : '      '}
          </Text>
        </Box>
      )}
    </Box>
  );
}
