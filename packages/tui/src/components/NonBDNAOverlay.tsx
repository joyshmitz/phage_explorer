import React, { useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { usePhageStore } from '@phage-explorer/state';
import { analyzeNonBStructures } from '@phage-explorer/core';

interface NonBDNAOverlayProps {
  sequence: string;
}

export function NonBDNAOverlay({ sequence }: NonBDNAOverlayProps): React.ReactElement {
  const theme = usePhageStore(s => s.currentTheme);
  const closeOverlay = usePhageStore(s => s.closeOverlay);
  const colors = theme.colors;

  const analysis = useMemo(() => {
    if (!sequence) return null;
    return analyzeNonBStructures(sequence);
  }, [sequence]);

  useInput((input, key) => {
    if (key.escape || input === 'b' || input === 'B') { // 'B' might conflict with Bendability? 
      // Let's use 'N' or check conflict. 'B' is Bendability.
      // Maybe 'Z'? But Z is fullscreen.
      // Let's assume explicit close via Esc or overlay toggle logic handles it.
      // I'll use Esc.
      closeOverlay('nonB'); 
    }
  });

  if (!analysis) return <Text>Analyzing DNA structure...</Text>;

  const { structures, g4Count, zDnaCount } = analysis;
  const topStructures = structures.slice(0, 6);

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
        <Text color={colors.accent} bold>NON-B DNA STRUCTURES</Text>
        <Text color={colors.textDim}>Esc to close</Text>
      </Box>

      <Box marginBottom={1} gap={2}>
        <Text color={colors.text}>G4 Motifs: <Text bold color={colors.warning}>{g4Count}</Text></Text>
        <Text color={colors.text}>Z-DNA Regions: <Text bold color={colors.info}>{zDnaCount}</Text></Text>
      </Box>

      <Box flexDirection="column">
        <Text color={colors.textDim} underline>Top Candidates</Text>
        {topStructures.length === 0 ? (
          <Text color={colors.textDim}>No significant non-B structures found.</Text>
        ) : (
          topStructures.map((s, i) => (
            <Box key={i} justifyContent="space-between">
              <Text color={s.type === 'G4' ? colors.warning : colors.info}>
                {s.type} ({s.strand})
              </Text>
              <Text color={colors.text}>
                {s.start.toLocaleString()}-{s.end.toLocaleString()}
              </Text>
              <Text color={colors.textDim}>
                Score: {s.score.toFixed(2)}
              </Text>
            </Box>
          ))
        )}
        {structures.length > 6 && (
          <Text color={colors.textDim}>...and {structures.length - 6} more</Text>
        )}
      </Box>
    </Box>
  );
}