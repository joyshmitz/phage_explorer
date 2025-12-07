import React, { useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { usePhageStore } from '@phage-explorer/state';

const BARS = '▁▂▃▄▅▆▇█';

interface WindowStat {
  start: number;
  end: number;
  flux: number;
}

function sparkline(values: number[], width = 64): string {
  if (values.length === 0) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return BARS[0].repeat(Math.min(width, values.length));
  const step = Math.max(1, Math.floor(values.length / width));
  const out: string[] = [];
  for (let i = 0; i < values.length; i += step) {
    const v = values[i];
    const t = (v - min) / (max - min);
    const idx = Math.min(BARS.length - 1, Math.max(0, Math.round(t * (BARS.length - 1))));
    out.push(BARS[idx]);
  }
  return out.join('');
}

function findPromoters(seq: string): Array<{ pos: number; strength: number; motif: string }> {
  const motifs = ['TATAAT', 'TTGACA', 'AGGAGG'];
  const hits: Array<{ pos: number; strength: number; motif: string }> = [];
  const upper = seq.toUpperCase();
  for (let i = 0; i <= upper.length - 6; i++) {
    const sub = upper.slice(i, i + 6);
    if (motifs.includes(sub)) {
      const strength = sub === 'TTGACA' || sub === 'TATAAT' ? 1 : 0.6;
      hits.push({ pos: i, strength, motif: sub });
    }
  }
  return hits;
}

function findTerminators(seq: string): Array<{ pos: number; efficiency: number }> {
  const hits: Array<{ pos: number; efficiency: number }> = [];
  const upper = seq.toUpperCase();
  const revCompChar = (c: string) => (c === 'A' ? 'T' : c === 'T' ? 'A' : c === 'C' ? 'G' : c === 'G' ? 'C' : c);
  for (let i = 0; i <= upper.length - 6; i++) {
    for (let len = 6; len <= 10 && i + len <= upper.length; len++) {
      const sub = upper.slice(i, i + len);
      const rev = sub.split('').reverse().map(revCompChar).join('');
      if (sub === rev) {
        hits.push({ pos: i, efficiency: 0.6 });
        break;
      }
    }
  }
  return hits;
}

function simulateFlow(seq: string, window = 200): { values: number[]; peaks: WindowStat[] } {
  if (seq.length === 0) return { values: [], peaks: [] };

  const promoters = findPromoters(seq);
  const terminators = findTerminators(seq);

  const bins = Math.max(1, Math.ceil(seq.length / window));
  const values = new Array(bins).fill(0);

  // Seed promoter flux
  for (const p of promoters) {
    const idx = Math.min(bins - 1, Math.floor(p.pos / window));
    values[idx] += p.strength;
  }

  // Propagate downstream with attenuation at terminators
  for (let i = 1; i < bins; i++) {
    values[i] += values[i - 1];
    const binStart = i * window;
    const termHere = terminators.find(t => t.pos >= binStart && t.pos < binStart + window);
    if (termHere) {
      values[i] *= 1 - termHere.efficiency;
    }
  }

  // Peaks: top 3 bins
  const peaks: WindowStat[] = values
    .map((v, i) => ({
      start: i * window + 1,
      end: Math.min(seq.length, (i + 1) * window),
      flux: v,
    }))
    .sort((a, b) => b.flux - a.flux)
    .slice(0, 3);

  return { values, peaks };
}

interface Props {
  sequence: string;
  genomeLength: number;
}

export function TranscriptionFlowOverlay({ sequence, genomeLength }: Props): React.ReactElement {
  const theme = usePhageStore(s => s.currentTheme);
  const colors = theme.colors;
  const closeOverlay = usePhageStore(s => s.closeOverlay);

  const seq = sequence || '';
  const { values, peaks } = useMemo(() => simulateFlow(seq), [seq]);
  const line = useMemo(() => sparkline(values), [values]);

  useInput((input, key) => {
    if (key.escape || input === 'y' || input === 'Y') {
      closeOverlay('transcriptionFlow');
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={colors.accent}
      paddingX={2}
      paddingY={1}
      width={90}
    >
      <Box justifyContent="space-between" marginBottom={1}>
        <Text color={colors.accent} bold>TRANSCRIPTION FLOW (Y KEY)</Text>
        <Text color={colors.textDim}>Esc/Y to close</Text>
      </Box>
      {!seq || genomeLength === 0 ? (
        <Text color={colors.textDim}>No sequence loaded</Text>
      ) : (
        <>
          <Text color={colors.text}>
            Genome length: {genomeLength.toLocaleString()} bp · Windowed flux bins: {values.length}
          </Text>
          <Box flexDirection="column" marginTop={1}>
            <Text color={colors.accent} bold>Flux profile</Text>
            <Text color={colors.text}>{line}</Text>
            <Text color={colors.textDim} dimColor>
              Higher bars ≈ stronger predicted transcription flow (motif-driven heuristic).
            </Text>
          </Box>
          <Box flexDirection="column" marginTop={1}>
            <Text color={colors.primary} bold>Top flow regions</Text>
            {peaks.length === 0 ? (
              <Text color={colors.textDim}>No prominent peaks detected.</Text>
            ) : (
              peaks.map(p => (
                <Text key={p.start} color={colors.text}>
                  ▸ {p.start.toLocaleString()}-{p.end.toLocaleString()} bp · flux {p.flux.toFixed(2)}
                </Text>
              ))
            )}
          </Box>
          <Box marginTop={1}>
            <Text color={colors.textDim} dimColor>
              Heuristic model: promoters seed flow, palindromic repeats attenuate. Future: σ-factor presets, terminator prediction.
            </Text>
          </Box>
        </>
      )}
    </Box>
  );
}

