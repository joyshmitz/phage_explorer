import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { usePhageStore } from '@phage-explorer/state';
import { analyzeCRISPRPressure } from '@phage-explorer/core';
import type { CRISPRAnalysisResult, GeneInfo } from '@phage-explorer/core';

interface CRISPROverlayProps {
  sequence: string;
  genes: GeneInfo[];
}

export function CRISPROverlay({ sequence, genes }: CRISPROverlayProps): React.ReactElement {
  const theme = usePhageStore(s => s.currentTheme);
  const closeOverlay = usePhageStore(s => s.closeOverlay);
  const colors = theme.colors;

  // Run analysis (memoized)
  const analysis = useMemo<CRISPRAnalysisResult | null>(() => {
    if (!sequence) return null;
    return analyzeCRISPRPressure(sequence, genes);
  }, [sequence, genes]);

  const [hotspotIndex, setHotspotIndex] = useState(0);

  useInput((input, key) => {
    if (key.escape || input === 'i' || input === 'I') {
        closeOverlay('crispr');
    }
    if (key.rightArrow) {
        setHotspotIndex(prev => Math.min(prev + 1, (analysis?.acrCandidates.length ?? 0) - 1));
    }
    if (key.leftArrow) {
        setHotspotIndex(prev => Math.max(prev - 1, 0));
    }
  });

  if (!analysis) return <Text>Loading analysis...</Text>;

  const { pressureWindows, spacerHits, acrCandidates, maxPressure } = analysis;

  // Render Pressure Bar
  // Map 0-10 pressure to characters: ' ', '░', '▒', '▓', '█'
  const renderPressureBar = () => {
    const chars = [' ', '░', '▒', '▓', '█'];
    return pressureWindows.map(w => {
      const level = Math.min(4, Math.floor((w.pressureIndex / 10) * 4));
      return chars[level];
    }).join('').slice(0, 60); // Clamp width
  };

  const selectedAcr = acrCandidates[hotspotIndex];

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={colors.accent}
      paddingX={2}
      paddingY={1}
      width={74}
    >
      <Box justifyContent="space-between" marginBottom={1}>
        <Text color={colors.accent} bold>CRISPR PRESSURE & ANTI-CRISPR (I KEY)</Text>
        <Text color={colors.textDim}>ESC to close</Text>
      </Box>

      {/* Pressure Map */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color={colors.text}>CRISPR Pressure Map (Genome-wide)</Text>
        <Text color={colors.error}>{renderPressureBar()}</Text>
        <Box justifyContent="space-between">
            <Text color={colors.textDim}>Start</Text>
            <Text color={colors.textDim}>End</Text>
        </Box>
      </Box>

      {/* Stats */}
      <Box marginBottom={1}>
        <Text color={colors.text}>
          Max Pressure: <Text color={colors.error} bold>{maxPressure.toFixed(1)}</Text> | 
          Spacer Hits: <Text color={colors.warning} bold>{spacerHits.length}</Text> | 
          Acr Candidates: <Text color={colors.success} bold>{acrCandidates.length}</Text>
        </Text>
      </Box>

      {/* Acr Candidates / Hotspots */}
      <Box flexDirection="column">
        <Text bold color={colors.success} underline>Top Anti-CRISPR Candidates (Use ←/→)</Text>
        {acrCandidates.length === 0 ? (
          <Text color={colors.textDim}>No strong Acr candidates found.</Text>
        ) : selectedAcr ? (
          <Box flexDirection="column" borderStyle="single" borderColor={colors.success} paddingX={1}>
            <Text color={colors.success}>
              ★ Gene: {selectedAcr.geneName} (ID: {selectedAcr.geneId})
            </Text>
            <Text>
              Confidence: {selectedAcr.confidence.toUpperCase()} | Score: {selectedAcr.score}
            </Text>
            <Text>
              Family: {selectedAcr.family}
            </Text>
          </Box>
        ) : null}
      </Box>

      {/* Spacer Hits Preview */}
      {spacerHits.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
             <Text bold color={colors.warning} underline>Recent Spacer Hits</Text>
             {spacerHits.slice(0, 3).map((hit, i) => (
                 <Text key={i} color={colors.textDim}>
                     Pos {hit.position}: {hit.host} ({hit.crisprType}) - PAM: {hit.pamStatus}
                 </Text>
             ))}
        </Box>
      )}
    </Box>
  );
}
