import React, { useMemo, useState } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { usePhageStore } from '@phage-explorer/state';
import type { FoldEmbedding } from '@phage-explorer/core';
import { computeNovelty, buildEmbeddingMap } from '@phage-explorer/core';

interface FoldQuickviewProps {
  embeddings: FoldEmbedding[];
}

function bar(value: number, width = 20): string {
  const fill = Math.round(value * width);
  return '█'.repeat(fill).padEnd(width, '░');
}

export function FoldQuickview({ embeddings }: FoldQuickviewProps): React.ReactElement {
  const theme = usePhageStore(s => s.currentTheme);
  const phage = usePhageStore(s => s.currentPhage);
  const [selectedGeneIdx, setSelectedGeneIdx] = useState(0);
  const closeOverlay = usePhageStore(s => s.closeOverlay);
  const { stdout } = useStdout();

  const genesWithEmbeddings = useMemo(() => {
    const map = buildEmbeddingMap(embeddings);
    return (phage?.genes ?? []).filter(g => map.has(g.id)).map(g => ({
      ...g,
      embedding: map.get(g.id)!,
    }));
  }, [phage, embeddings]);

  useInput((input, key) => {
    if (key.escape || input === 'f' || input === 'F') {
      closeOverlay('foldQuickview' as any);
    }
    if (key.upArrow) {
      setSelectedGeneIdx(i => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setSelectedGeneIdx(i => Math.min(Math.max(0, genesWithEmbeddings.length - 1), i + 1));
    }
  });

  const selected = genesWithEmbeddings[selectedGeneIdx];
  const result = useMemo(() => {
    if (!selected) return null;
    return computeNovelty(selected.embedding!, embeddings, 8);
  }, [selected, embeddings]);

  const windowStart = Math.max(0, selectedGeneIdx - 3);
  const window = genesWithEmbeddings.slice(windowStart, windowStart + 8);

  const colors = theme.colors;
  const width = stdout.columns ?? 80;

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={colors.accent}
      paddingX={2}
      paddingY={1}
      width={Math.min(90, width - 4)}
    >
      <Box justifyContent="space-between" marginBottom={1}>
        <Text color={colors.accent} bold>
          FOLD QUICKVIEW — {phage?.name ?? 'No phage'}
        </Text>
        <Text color={colors.textDim}>Esc/F to close</Text>
      </Box>

      {genesWithEmbeddings.length === 0 ? (
        <Text color={colors.textDim}>No embeddings available for this phage.</Text>
      ) : (
        <>
          <Box marginBottom={1}>
            <Text color={colors.textDim}>Use ↑/↓ to pick a gene with an embedding.</Text>
          </Box>

          {/* Gene list */}
          <Box flexDirection="column" marginBottom={1}>
            {window.map((g, idx) => {
              const absoluteIdx = windowStart + idx;
              const selectedRow = absoluteIdx === selectedGeneIdx;
              return (
                <Box key={g.id}>
                  <Text color={selectedRow ? colors.accent : colors.textDim}>
                    {selectedRow ? '▶' : ' '} {g.name || g.product || g.locusTag || 'unnamed'}
                  </Text>
                </Box>
              );
            })}
          </Box>

          {/* Result */}
          {selected && result && (
            <Box flexDirection="column">
              <Text color={colors.text}>Novelty: {(result.novelty * 100).toFixed(1)}%</Text>
              <Text color={colors.textDim}>{bar(result.novelty)}</Text>
              <Box marginTop={1}>
                <Text color={colors.accent} bold>Nearest folds</Text>
              </Box>
              {result.neighbors.map(n => (
                <Text key={n.geneId} color={colors.text}>
                  • {(1 - n.distance).toFixed(2)} sim — {n.name || n.product || 'neighbor'}
                </Text>
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
