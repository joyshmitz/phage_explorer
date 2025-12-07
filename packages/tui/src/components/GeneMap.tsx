import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { usePhageStore } from '@phage-explorer/state';
import type { KmerAnomalyOverlay } from '../overlay-computations';

interface GeneMapProps {
  width?: number;
}

// Characters for gene visualization
const GENE_CHARS = {
  forward: '▶',      // Forward strand gene marker
  reverse: '◀',      // Reverse strand gene marker
  both: '◆',         // Overlapping genes
  empty: '·',        // Empty region (subtle dot)
  current: '▼',      // Current position marker
  boundary: '│',     // Gene boundary
} as const;

// K-mer gradient characters (10 levels)
const KMER_GRADIENT = ' ░▒▓█';

export function GeneMap({ width = 80 }: GeneMapProps): React.ReactElement {
  const currentPhage = usePhageStore(s => s.currentPhage);
  const scrollPosition = usePhageStore(s => s.scrollPosition);
  const viewMode = usePhageStore(s => s.viewMode);
  const theme = usePhageStore(s => s.currentTheme);
  const kmerOverlay = usePhageStore(s => s.overlayData.kmerAnomaly) as KmerAnomalyOverlay | undefined;

  const colors = theme.colors;
  const genes = currentPhage?.genes ?? [];
  const genomeLength = currentPhage?.genomeLength ?? 1;

  // Map width for the gene bar (minus borders and labels)
  const barWidth = Math.max(1, width - 10);

  // Build the gene bar visualization with strand information
  const geneBar = useMemo(() => {
    if (genes.length === 0 || genomeLength === 0) {
      return {
        chars: Array(barWidth).fill(GENE_CHARS.empty),
        colors: Array(barWidth).fill(colors.textMuted),
        labels: '',
      };
    }

    // Create arrays for characters and colors
    const barChars: string[] = Array(barWidth).fill(GENE_CHARS.empty);
    const barColors: string[] = Array(barWidth).fill(colors.textMuted);

    // Track gene density per pixel for overlap detection
    const density: { forward: number; reverse: number }[] =
      Array(barWidth).fill(null).map(() => ({ forward: 0, reverse: 0 }));

    // Calculate current view position
    const effectivePos = viewMode === 'aa' ? scrollPosition * 3 : scrollPosition;
    const viewPosInBar = Math.floor((effectivePos / genomeLength) * barWidth);

    // Mark genes with strand information
    for (const gene of genes) {
      const startPos = Math.floor((gene.startPos / genomeLength) * barWidth);
      const endPos = Math.max(startPos + 1, Math.floor((gene.endPos / genomeLength) * barWidth));
      const isForward = gene.strand === '+' || gene.strand === undefined;

      for (let i = startPos; i < endPos && i < barWidth; i++) {
        if (i >= 0) {
          if (isForward) {
            density[i].forward++;
          } else {
            density[i].reverse++;
          }
        }
      }
    }

    // Convert density to characters and colors
    for (let i = 0; i < barWidth; i++) {
      const d = density[i];
      if (d.forward > 0 && d.reverse > 0) {
        // Overlapping genes from both strands
        barChars[i] = GENE_CHARS.both;
        barColors[i] = colors.warning;
      } else if (d.forward > 0) {
        // Forward strand only
        barChars[i] = d.forward > 1 ? '▓' : '█';
        barColors[i] = colors.geneForward;
      } else if (d.reverse > 0) {
        // Reverse strand only
        barChars[i] = d.reverse > 1 ? '▓' : '█';
        barColors[i] = colors.geneReverse;
      }
    }

    // Mark current position (overwrites gene marker)
    if (viewPosInBar >= 0 && viewPosInBar < barWidth) {
      barChars[viewPosInBar] = GENE_CHARS.current;
      barColors[viewPosInBar] = colors.highlight;
    }

    // Generate labels for notable genes
    const labels: { pos: number; name: string }[] = [];
    const usedPositions = new Set<number>();

    for (const gene of genes) {
      if (!gene.name && !gene.locusTag) continue;

      const midPos = Math.floor(((gene.startPos + gene.endPos) / 2 / genomeLength) * barWidth);
      const name = gene.name || gene.locusTag || '';

      // Check if position is available (with some spacing)
      let available = true;
      for (let i = midPos - 3; i <= midPos + name.length + 3; i++) {
        if (usedPositions.has(i)) {
          available = false;
          break;
        }
      }

      if (available && labels.length < 10) {
        labels.push({ pos: midPos, name: name.substring(0, 8) });
        for (let i = midPos; i < midPos + name.length; i++) {
          usedPositions.add(i);
        }
      }
    }

    // Build labels string
    const labelsArr: string[] = Array(barWidth).fill(' ');
    for (const label of labels) {
      for (let i = 0; i < label.name.length && label.pos + i < barWidth; i++) {
        labelsArr[label.pos + i] = label.name[i];
      }
    }

    return {
      chars: barChars,
      colors: barColors,
      labels: labelsArr.join(''),
    };
  }, [genes, genomeLength, scrollPosition, viewMode, barWidth, colors]);

  // K-mer anomaly strip with gradient coloring
  const kmerStrip = useMemo(() => {
    if (!kmerOverlay || !kmerOverlay.values || kmerOverlay.values.length === 0 || genomeLength === 0) {
      return null;
    }

    const values = kmerOverlay.values;
    const chars: string[] = Array(barWidth).fill(' ');
    const stripColors: string[] = Array(barWidth).fill(colors.textMuted);

    for (let i = 0; i < barWidth; i++) {
      const pos = (i / barWidth) * genomeLength;
      const idx = Math.min(
        values.length - 1,
        Math.max(0, Math.floor((pos / genomeLength) * values.length))
      );
      const v = values[idx];

      // Use gradient character
      const gIdx = Math.min(KMER_GRADIENT.length - 1, Math.max(0, Math.round(v * (KMER_GRADIENT.length - 1))));
      chars[i] = KMER_GRADIENT[gIdx];

      // Color based on anomaly level
      if (v > 0.7) {
        stripColors[i] = colors.kmerAnomaly;
      } else if (v > 0.4) {
        stripColors[i] = colors.warning;
      } else {
        stripColors[i] = colors.kmerNormal;
      }
    }

    return { chars, colors: stripColors };
  }, [kmerOverlay, genomeLength, barWidth, colors]);

  // Find current gene
  const currentGene = useMemo(() => {
    const effectivePos = viewMode === 'aa' ? scrollPosition * 3 : scrollPosition;
    return genes.find(g => effectivePos >= g.startPos && effectivePos < g.endPos);
  }, [genes, scrollPosition, viewMode]);

  // Calculate position percentage
  const effectivePos = viewMode === 'aa' ? scrollPosition * 3 : scrollPosition;
  const posPercent = genomeLength > 0 ? ((effectivePos / genomeLength) * 100).toFixed(1) : '0.0';

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.border}
      paddingX={1}
    >
      {/* Title row with position info */}
      <Box justifyContent="space-between">
        <Box gap={1}>
          <Text color={colors.primary} bold>◉ Gene Map</Text>
          <Text color={colors.textMuted}>│</Text>
          <Text color={colors.geneForward}>█ +strand</Text>
          <Text color={colors.geneReverse}>█ -strand</Text>
          <Text color={colors.warning}>◆ overlap</Text>
        </Box>
        <Box gap={1}>
          <Text color={colors.textDim}>Position:</Text>
          <Text color={colors.accent} bold>
            {effectivePos.toLocaleString()}
          </Text>
          <Text color={colors.textMuted}>
            ({posPercent}%)
          </Text>
        </Box>
      </Box>

      {/* Gene bar with individual character coloring */}
      <Box gap={1}>
        <Text color={colors.textDim}>Genes </Text>
        <Box>
          {geneBar.chars.map((char, i) => (
            <Text key={i} color={geneBar.colors[i]}>{char}</Text>
          ))}
        </Box>
      </Box>

      {/* K-mer anomaly strip */}
      {kmerStrip && (
        <Box gap={1}>
          <Text color={colors.textDim}>K-mer </Text>
          <Box>
            {kmerStrip.chars.map((char, i) => (
              <Text key={i} color={kmerStrip.colors[i]}>{char}</Text>
            ))}
          </Box>
        </Box>
      )}

      {/* Gene labels */}
      <Box gap={1}>
        <Text color={colors.textDim}>{'      '}</Text>
        <Text color={colors.textMuted}>{geneBar.labels}</Text>
      </Box>

      {/* Current gene info */}
      {currentGene && (
        <Box gap={1} marginTop={0}>
          <Text color={colors.info}>▶</Text>
          <Text color={colors.text} bold>
            {currentGene.name || currentGene.locusTag || 'Unknown'}
          </Text>
          <Text color={colors.textMuted}>│</Text>
          <Text color={colors.textDim}>
            {currentGene.startPos.toLocaleString()}-{currentGene.endPos.toLocaleString()} bp
          </Text>
          <Text color={currentGene.strand === '+' || currentGene.strand === undefined
            ? colors.geneForward : colors.geneReverse}>
            ({currentGene.strand === '+' || currentGene.strand === undefined ? '+' : '-'})
          </Text>
          {currentGene.product && (
            <>
              <Text color={colors.textMuted}>│</Text>
              <Text color={colors.textDim}>
                {currentGene.product.substring(0, 50)}{currentGene.product.length > 50 ? '…' : ''}
              </Text>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
