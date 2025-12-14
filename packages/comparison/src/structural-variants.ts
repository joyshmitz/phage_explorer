import type { GeneInfo } from '@phage-explorer/core';
import type {
  StructuralVariantCall,
  StructuralVariantReport,
  StructuralVariantType,
} from './types';

interface StructuralVariantOptions {
  minGapBp?: number;
  minConfidence?: number;
  translocationDistance?: number;
  inversionMinFlip?: number;
}

const DEFAULT_OPTIONS: Required<StructuralVariantOptions> = {
  minGapBp: 500, // ignore tiny gaps likely to be annotation jitter
  minConfidence: 0.15,
  translocationDistance: 2000,
  inversionMinFlip: 3, // minimum gene index delta to flag inversion
};

type BlockOrientation = 'forward' | 'reverse';
type SyntenyBlock = {
  startIdxA: number;
  endIdxA: number;
  startIdxB: number;
  endIdxB: number;
  score: number; // 0..1 similarity
  orientation: BlockOrientation;
};

type Anchor = {
  startIdxA: number;
  endIdxA: number;
  startIdxB: number;
  endIdxB: number;
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function geneRange(genes: GeneInfo[], startIdx: number, endIdx: number): [number, number] {
  const loIdx = Math.min(startIdx, endIdx);
  const hiIdx = Math.max(startIdx, endIdx);
  const start = genes[loIdx]?.startPos ?? 0;
  const end = genes[hiIdx]?.endPos ?? start;
  return [Math.min(start, end), Math.max(start, end)];
}

function collectGenes(
  genes: GeneInfo[],
  start: number,
  end: number
): string[] {
  const lo = Math.min(start, end);
  const hi = Math.max(start, end);
  return genes
    .filter((g) => g.startPos <= hi && g.endPos >= lo)
    .map(g => g.name || g.product || g.locusTag || `gene-${g.id ?? 'unknown'}`)
    .slice(0, 8);
}

function makeCall(
  type: StructuralVariantType,
  anchor: Anchor,
  genesA: GeneInfo[],
  genesB: GeneInfo[],
  spans: { startA: number; endA: number; startB: number; endB: number },
  sizeA: number,
  sizeB: number,
  confidence: number,
  evidence: string[]
): StructuralVariantCall {
  return {
    id: `${type}-${spans.startA}-${spans.startB}-${Math.abs(sizeA - sizeB)}`,
    type,
    startA: spans.startA,
    endA: spans.endA,
    startB: spans.startB,
    endB: spans.endB,
    sizeA,
    sizeB,
    confidence: clamp01(confidence),
    anchorA: { startIdx: anchor.startIdxA, endIdx: anchor.endIdxA },
    anchorB: { startIdx: anchor.startIdxB, endIdx: anchor.endIdxB },
    evidence,
    affectedGenesA: collectGenes(genesA, spans.startA, spans.endA),
    affectedGenesB: collectGenes(genesB, spans.startB, spans.endB),
  };
}

interface GeneTokens {
  name: string;
  terms: string[];
}

function preprocessGene(g: GeneInfo): GeneTokens {
  const n = (g.product || g.name || '').toLowerCase();
  const terms = n.split(/[\s-]+/).filter(t => t.length > 3);
  return { name: n, terms };
}

function geneDistanceOptimized(t1: GeneTokens, t2: GeneTokens): number {
  if (!t1.name || !t2.name) return 1.0;
  if (t1.name === t2.name) return 0.0;
  if (t1.name.includes(t2.name) || t2.name.includes(t1.name)) return 0.2;

  const [small, large] = t1.terms.length < t2.terms.length ? [t1.terms, t2.terms] : [t2.terms, t1.terms];
  for (const term of small) {
    if (large.includes(term)) return 0.5;
  }
  return 1.0;
}

type Match = { idxA: number; idxB: number; score: number };

function buildSyntenyBlocks(
  genesA: GeneInfo[],
  genesB: GeneInfo[],
  opts: { minScore: number; maxStepA: number; maxStepB: number; minBlockMatches: number }
): SyntenyBlock[] {
  const tokensA = genesA.map(preprocessGene);
  const tokensB = genesB.map(preprocessGene);

  const candidates: Match[] = [];
  for (let idxA = 0; idxA < tokensA.length; idxA++) {
    const tA = tokensA[idxA];
    if (!tA.name) continue;
    for (let idxB = 0; idxB < tokensB.length; idxB++) {
      const dist = geneDistanceOptimized(tA, tokensB[idxB]);
      const score = 1 - dist;
      if (score >= opts.minScore) {
        candidates.push({ idxA, idxB, score });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const usedA = new Set<number>();
  const usedB = new Set<number>();
  const matches: Match[] = [];

  for (const candidate of candidates) {
    if (usedA.has(candidate.idxA) || usedB.has(candidate.idxB)) continue;
    usedA.add(candidate.idxA);
    usedB.add(candidate.idxB);
    matches.push(candidate);
  }

  matches.sort((a, b) => a.idxA - b.idxA);

  const blocks: SyntenyBlock[] = [];
  let current: {
    startIdxA: number;
    endIdxA: number;
    startIdxB: number;
    endIdxB: number;
    scoreSum: number;
    count: number;
    orientation: BlockOrientation | null;
  } | null = null;

  const flush = () => {
    if (!current) return;
    if (current.count >= opts.minBlockMatches && current.orientation) {
      blocks.push({
        startIdxA: current.startIdxA,
        endIdxA: current.endIdxA,
        startIdxB: current.startIdxB,
        endIdxB: current.endIdxB,
        score: clamp01(current.scoreSum / current.count),
        orientation: current.orientation,
      });
    }
    current = null;
  };

  for (const match of matches) {
    if (!current) {
      current = {
        startIdxA: match.idxA,
        endIdxA: match.idxA,
        startIdxB: match.idxB,
        endIdxB: match.idxB,
        scoreSum: match.score,
        count: 1,
        orientation: null,
      };
      continue;
    }

    const deltaA = match.idxA - current.endIdxA;
    const deltaB = match.idxB - current.endIdxB;
    if (deltaA <= 0) continue;

    const stepAOk = deltaA <= opts.maxStepA;
    const stepBOk = Math.abs(deltaB) <= opts.maxStepB && deltaB !== 0;
    const dir: BlockOrientation = deltaB > 0 ? 'forward' : 'reverse';
    const expected = current.orientation ?? dir;

    if (stepAOk && stepBOk && expected === dir) {
      current.endIdxA = match.idxA;
      current.endIdxB = match.idxB;
      current.scoreSum += match.score;
      current.count += 1;
      current.orientation = expected;
      continue;
    }

    flush();
    current = {
      startIdxA: match.idxA,
      endIdxA: match.idxA,
      startIdxB: match.idxB,
      endIdxB: match.idxB,
      scoreSum: match.score,
      count: 1,
      orientation: null,
    };
  }

  flush();

  return blocks.sort((a, b) => a.startIdxA - b.startIdxA);
}

export function analyzeStructuralVariants(
  sequenceA: string,
  sequenceB: string,
  genesA: GeneInfo[] = [],
  genesB: GeneInfo[] = [],
  options: StructuralVariantOptions = {}
): StructuralVariantReport {
  void sequenceA;
  void sequenceB;

  const cfg = { ...DEFAULT_OPTIONS, ...options };

  if (genesA.length < 2 || genesB.length < 2) {
    return {
      calls: [],
      counts: { deletion: 0, insertion: 0, inversion: 0, duplication: 0, translocation: 0 },
      anchorsUsed: 0,
    };
  }

  const blocks = buildSyntenyBlocks(genesA, genesB, {
    minScore: 0.2, // dist < 0.8 in legacy synteny
    maxStepA: 2,
    maxStepB: 3,
    minBlockMatches: 2,
  });

  if (blocks.length === 0) {
    return {
      calls: [],
      counts: { deletion: 0, insertion: 0, inversion: 0, duplication: 0, translocation: 0 },
      anchorsUsed: blocks.length,
    };
  }

  const calls: StructuralVariantCall[] = [];

  // Inversions: detect reverse-oriented synteny blocks
  for (const block of blocks) {
    if (block.orientation !== 'reverse') continue;
    const flipA = Math.abs(block.endIdxA - block.startIdxA);
    const flipB = Math.abs(block.endIdxB - block.startIdxB);
    if (Math.min(flipA, flipB) < cfg.inversionMinFlip) continue;
    const [startA, endA] = geneRange(genesA, block.startIdxA, block.endIdxA);
    const [startB, endB] = geneRange(genesB, block.startIdxB, block.endIdxB);
    const sizeA = Math.max(0, endA - startA);
    const sizeB = Math.max(0, endB - startB);
    const sizeSimilarity = 1 - Math.abs(sizeA - sizeB) / Math.max(sizeA, sizeB, 1);
    const confidence = clamp01(0.3 + 0.35 * block.score + 0.35 * sizeSimilarity);
    calls.push(
      makeCall(
        'inversion',
        {
          startIdxA: block.startIdxA,
          endIdxA: block.endIdxA,
          startIdxB: block.startIdxB,
          endIdxB: block.endIdxB,
        },
        genesA,
        genesB,
        { startA, endA, startB, endB },
        sizeA,
        sizeB,
        confidence,
        ['reverse-oriented gene block', `score=${block.score.toFixed(2)}`]
      )
    );
  }

  for (let i = 0; i < blocks.length - 1; i++) {
    const current = blocks[i];
    const next = blocks[i + 1];

    // Gap-based calls assume monotonic mapping; skip reverse blocks for now.
    if (current.orientation !== 'forward' || next.orientation !== 'forward') continue;

    const [currStartA, currEndA] = geneRange(genesA, current.startIdxA, current.endIdxA);
    const [currStartB, currEndB] = geneRange(genesB, current.startIdxB, current.endIdxB);
    const [nextStartA] = geneRange(genesA, next.startIdxA, next.endIdxA);
    const [nextStartB] = geneRange(genesB, next.startIdxB, next.endIdxB);

    const gapA = Math.max(0, nextStartA - currEndA);
    const gapB = Math.max(0, nextStartB - currEndB);
    const avgGap = (gapA + gapB) / 2;

    const anchor: Anchor = {
      startIdxA: current.endIdxA,
      endIdxA: next.startIdxA,
      startIdxB: current.endIdxB,
      endIdxB: next.startIdxB,
    };

    // Large asymmetric gaps => insertion/deletion
    if (gapA > cfg.minGapBp || gapB > cfg.minGapBp) {
      const sizeDiff = Math.abs(gapA - gapB);
      const larger = Math.max(gapA, gapB);
      const rel = larger === 0 ? 0 : sizeDiff / larger;
      if (rel > 0.3) {
        const isDeletionInB = gapA > gapB;
        const type: StructuralVariantType = isDeletionInB ? 'deletion' : 'insertion';
        const spanA = [currEndA, nextStartA];
        const spanB = [currEndB, nextStartB];
        const sizeA = gapA;
        const sizeB = gapB;
        const confidence = clamp01(0.5 + rel * 0.5);
        calls.push(
          makeCall(
            type,
            anchor,
            genesA,
            genesB,
            {
              startA: Math.min(...spanA),
              endA: Math.max(...spanA),
              startB: Math.min(...spanB),
              endB: Math.max(...spanB),
            },
            sizeA,
            sizeB,
            confidence,
            [
              `gapA=${gapA}`,
              `gapB=${gapB}`,
              isDeletionInB ? 'missing sequence in genome B' : 'extra sequence in genome B',
            ]
          )
        );
        continue;
      }
    }

    // Re-ordered distant anchors => translocation
    const deltaA = nextStartA - currStartA;
    const deltaB = nextStartB - currStartB;
    const distanceDiff = Math.abs(Math.abs(deltaA) - Math.abs(deltaB));
    if (distanceDiff > cfg.translocationDistance && avgGap > cfg.minGapBp) {
      const spanA = [currEndA, nextStartA];
      const spanB = [currEndB, nextStartB];
      const sizeA = Math.abs(spanA[1] - spanA[0]);
      const sizeB = Math.abs(spanB[1] - spanB[0]);
      const confidence = clamp01(0.4 + Math.min(distanceDiff / 10000, 0.6));
      calls.push(
        makeCall(
          'translocation',
          anchor,
          genesA,
          genesB,
          {
            startA: Math.min(...spanA),
            endA: Math.max(...spanA),
            startB: Math.min(...spanB),
            endB: Math.max(...spanB),
          },
          sizeA,
          sizeB,
          confidence,
          ['anchor spacing mismatch', `|Δ|=${distanceDiff}`]
        )
      );
      continue;
    }

    // Small asymmetric gain suggest duplication
    if (avgGap > 0 && Math.abs(gapA - gapB) / Math.max(avgGap, 1) < 0.25 && avgGap > cfg.minGapBp / 2) {
      const spanA = [currEndA, nextStartA];
      const spanB = [currEndB, nextStartB];
      const sizeA = gapA;
      const sizeB = gapB;
      const confidence = clamp01(0.3 + (avgGap / (cfg.minGapBp * 2)));
      calls.push(
        makeCall(
          'duplication',
          anchor,
          genesA,
          genesB,
          {
            startA: Math.min(...spanA),
            endA: Math.max(...spanA),
            startB: Math.min(...spanB),
            endB: Math.max(...spanB),
          },
          sizeA,
          sizeB,
          confidence,
          ['similar gap sizes, possible tandem duplication']
        )
      );
    }
  }

  // Filter low-confidence calls
  const filtered = calls.filter(c => c.confidence >= cfg.minConfidence);
  const counts = filtered.reduce<Record<StructuralVariantType, number>>(
    (acc, c) => {
      acc[c.type] += 1;
      return acc;
    },
    { deletion: 0, insertion: 0, inversion: 0, duplication: 0, translocation: 0 }
  );

  return {
    calls: filtered,
    counts,
    anchorsUsed: blocks.length,
  };
}
