import React from 'react';
import { Box, Text } from 'ink';
import { usePhageStore } from '@phage-explorer/state';
import type { AminoAcid } from '@phage-explorer/core';

export function AminoAcidHoverInfo(): React.ReactElement | null {
  const viewMode = usePhageStore(s => s.viewMode);
  const hoveredAA = usePhageStore(s => s.hoveredAminoAcid);
  const theme = usePhageStore(s => s.currentTheme);

  // Only show in amino acid view mode
  if (viewMode !== 'aa' || !hoveredAA) {
    return null;
  }

  const colors = theme.colors;
  const aaColorPair = theme.aminoAcids[hoveredAA.letter as AminoAcid];
  const aaColor = aaColorPair?.fg ?? colors.text;

  const aaBg = aaColorPair?.bg ?? colors.background;

  return (
    <Box
      borderStyle="round"
      borderColor={colors.border}
      paddingX={1}
      flexDirection="row"
      gap={1}
    >
      <Text color={colors.textDim}>Pos {hoveredAA.position}:</Text>
      <Text color={aaColor} backgroundColor={aaBg} bold> {hoveredAA.letter} </Text>
      <Text color={aaColor}>{hoveredAA.threeCode}</Text>
      <Text color={colors.text}>-</Text>
      <Text color={aaColor}>{hoveredAA.name}</Text>
      <Text color={colors.textDim}>({hoveredAA.property})</Text>
    </Box>
  );
}
