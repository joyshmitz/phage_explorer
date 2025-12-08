
export interface TranscriptionWindowStat {
  start: number;
  end: number;
  flux: number;
}

export interface TranscriptionAnalysis {
  values: number[];
  peaks: TranscriptionWindowStat[];
}

// --- Regulatory motif detection (lightweight PWMs / heuristics) ---
const SIGMA70_MINUS35 = 'TTGACA';
const SIGMA70_MINUS10 = 'TATAAT';
const SIGMA32_MINUS35 = 'TTGAAA';
const SIGMA32_MINUS10 = 'CCCCAT';
const SIGMA54_CORE = 'TGGCACG';
const RBS_PATTERN = /AGGAGG|GGAGG|AGGA|GGAG/gi;

export interface PromoterHit {
  pos: number;
  strength: number; // 0..1
  motif: string;
}

export interface TerminatorHit {
  pos: number;
  efficiency: number; // 0..1
  motif: string;
}

function scoreExact(seq: string, motif: string): number {
  let score = 0;
  for (let i = 0; i < motif.length; i++) {
    if (seq[i] === motif[i]) score += 1;
  }
  return score / motif.length;
}

export function detectPromoters(seq: string): PromoterHit[] {
  const upper = seq.toUpperCase();
  const hits: PromoterHit[] = [];
  for (let i = 0; i <= upper.length - 6; i++) {
    const window6 = upper.slice(i, i + 6);
    const window7 = upper.slice(i, i + 7);

    const score70_35 = scoreExact(window6, SIGMA70_MINUS35);
    const score70_10 = scoreExact(window6, SIGMA70_MINUS10);
    const score32_35 = scoreExact(window6, SIGMA32_MINUS35);
    const score32_10 = scoreExact(window6, SIGMA32_MINUS10);
    const score54 = scoreExact(window7, SIGMA54_CORE);

    if (score70_35 > 0.75 || score70_10 > 0.75) {
      hits.push({ pos: i, strength: Math.max(score70_35, score70_10), motif: 'σ70' });
    }
    if (score32_35 > 0.75 || score32_10 > 0.75) {
      hits.push({ pos: i, strength: Math.max(score32_35, score32_10) * 0.9, motif: 'σ32' });
    }
    if (score54 > 0.8) {
      hits.push({ pos: i, strength: score54 * 0.85, motif: 'σ54' });
    }
  }

  // RBS (Shine-Dalgarno) as promoter-adjacent signal
  for (const match of upper.matchAll(RBS_PATTERN)) {
    if (match.index === undefined) continue;
    hits.push({ pos: match.index, strength: 0.6 + 0.1 * match[0].length, motif: 'RBS' });
  }

  const max = Math.max(0.001, ...hits.map(h => h.strength));
  return hits
    .map(h => ({ ...h, strength: Math.min(1, h.strength / max) }))
    .sort((a, b) => a.pos - b.pos);
}

export function detectTerminators(seq: string): TerminatorHit[] {
  const upper = seq.toUpperCase();
  const hits: TerminatorHit[] = [];

  const revComp = (s: string) =>
    s
      .split('')
      .reverse()
      .map(c => (c === 'A' ? 'T' : c === 'T' ? 'A' : c === 'C' ? 'G' : c === 'G' ? 'C' : c))
      .join('');

  for (let i = 0; i <= upper.length - 12; i++) {
    const stem = upper.slice(i, i + 6);
    const loop = upper.slice(i + 6, i + 10);
    const tail = upper.slice(i + 10, i + 14);
    const isStem = stem === revComp(stem);
    const polyU = /^T{2,4}$/.test(tail);
    if (isStem && polyU) {
      const gcContent = stem.split('').filter(c => c === 'G' || c === 'C').length / stem.length;
      const loopPenalty = /(GG|CC)/.test(loop) ? 0.2 : 0;
      const eff = Math.min(1, 0.6 + 0.3 * gcContent - loopPenalty);
      hits.push({ pos: i, efficiency: eff, motif: 'terminator' });
    }
  }

  return hits.sort((a, b) => a.pos - b.pos);
}

export function simulateTranscriptionFlow(seq: string, window = 200): TranscriptionAnalysis {
  if (seq.length === 0) return { values: [], peaks: [] };

  const promoters = detectPromoters(seq);
  const terminators = detectTerminators(seq);

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
  const peaks: TranscriptionWindowStat[] = values
    .map((v, i) => ({
      start: i * window + 1,
      end: Math.min(seq.length, (i + 1) * window),
      flux: v,
    }))
    .sort((a, b) => b.flux - a.flux)
    .slice(0, 3);

  return { values, peaks };
}
