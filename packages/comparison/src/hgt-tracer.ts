import { jaccardIndex, extractKmerSet } from './kmer-analysis';
import type { GeneInfo } from '@phage-explorer/core';
import type { HGTAnalysis, GenomicIsland, DonorCandidate, PassportStamp } from './types';

export interface HGTOptions {
  window?: number;
  step?: number;
  zThreshold?: number;
  minValidRatio?: number;
}

interface WindowStat {
  start: number;
  end: number;
  gc: number;
  z: number;
}

const HALLMARK_KEYWORDS = [
  'integrase',
  'transposase',
  'recombinase',
  'lysogeny',
  'tail fiber',
  'tail-spike',
  'tRNA',
  'capsid',
  'portal',
  'terminase',
  'restriction',
  'methyltransferase',
];

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function std(values: number[], m: number): number {
  if (values.length === 0) return 0;
  const v = values.reduce((s, x) => s + Math.pow(x - m, 2), 0) / values.length;
  return Math.sqrt(v);
}

function computeGC(seq: string): { percent: number; total: number } {
  let gc = 0;
  let total = 0;
  for (const c of seq) {
    const u = c.toUpperCase();
    if (u === 'G' || u === 'C') gc++;
    if (u === 'A' || u === 'T' || u === 'G' || u === 'C') total++;
  }
  return {
    percent: total > 0 ? (gc / total) * 100 : 0,
    total,
  };
}

function slidingGC(
  sequence: string,
  window = 2000,
  step = 1000,
  minValidRatio = 0.5
): WindowStat[] {
  const stats: WindowStat[] = [];
  const validWindows: { start: number; end: number; gc: number }[] = [];

  // First pass: Collect valid GC values to compute robust statistics
  for (let start = 0; start < sequence.length; start += step) {
    const slice = sequence.slice(start, start + window);
    if (!slice.length) break;
    
    const { percent, total } = computeGC(slice);
    
    // Skip windows with insufficient valid data (e.g. gaps/Ns)
    if (total < slice.length * minValidRatio) continue;

    validWindows.push({ start, end: start + slice.length, gc: percent });
  }

  const gcValues = validWindows.map(w => w.gc);
  const mu = mean(gcValues);
  const sigma = std(gcValues, mu) || 1;

  // Second pass: Compute Z-scores for valid windows
  for (const w of validWindows) {
    const z = (w.gc - mu) / sigma;
    stats.push({ start: w.start, end: w.end, gc: w.gc, z });
  }

  return stats;
}

function mergeIslands(windows: WindowStat[], zThreshold = 2): GenomicIsland[] {
  const islands: GenomicIsland[] = [];
  // Extend type locally to track count for averaging
  let current: (GenomicIsland & { count: number }) | null = null;

  for (const w of windows) {
    if (Math.abs(w.z) >= zThreshold) {
      if (!current || w.start > current.end) {
        if (current) {
          const island = { ...current } as (GenomicIsland & { count?: number });
          delete island.count;
          islands.push(island);
        }
        current = { 
          start: w.start, 
          end: w.end, 
          gc: w.gc, 
          zScore: w.z, 
          genes: [], 
          hallmarks: [], 
          donors: [], 
          amelioration: 'unknown',
          count: 1 
        };
      } else {
        // Weighted average update
        const n = current.count;
        current.end = w.end;
        current.gc = (current.gc * n + w.gc) / (n + 1);
        current.zScore = (current.zScore * n + w.z) / (n + 1);
        current.count++;
      }
    } else if (current) {
      // Strip internal count property
      const island = { ...current } as (GenomicIsland & { count?: number });
      delete island.count;
      islands.push(island);
      current = null;
    }
  }
  if (current) {
    const island = { ...current } as (GenomicIsland & { count?: number });
    delete island.count;
    islands.push(island);
  }
  return islands;
}

function attachGenes(islands: GenomicIsland[], genes: GeneInfo[]): void {
  for (const island of islands) {
    island.genes = genes.filter(g => g.startPos <= island.end && g.endPos >= island.start);
    island.hallmarks = island.genes
      .filter(g => {
        const text = `${g.name ?? ''} ${g.product ?? ''}`.toLowerCase();
        return HALLMARK_KEYWORDS.some(k => text.includes(k));
      })
      .map(g => g.product?.trim() || g.name || g.locusTag || 'unknown');
  }
}

function inferDonors(
  islandSeq: string,
  referenceSets: Record<string, Set<string>>,
  k = 15
): DonorCandidate[] {
  const islandSet = extractKmerSet(islandSeq, k);
  if (islandSet.size === 0) return [];
  const candidates: DonorCandidate[] = [];

  for (const [taxon, refSet] of Object.entries(referenceSets)) {
    if (refSet.size === 0) continue;
    const j = jaccardIndex(islandSet, refSet);
    // Note: WASM min_hash_jaccard could be used here for better performance if available
    candidates.push({
      taxon,
      similarity: j,
      confidence: j > 0.3 ? 'high' : j > 0.15 ? 'medium' : 'low',
      evidence: 'kmer',
    });
  }

  return candidates.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
}

function estimateAmelioration(gcDelta: number): 'recent' | 'intermediate' | 'ancient' | 'unknown' {
  const abs = Math.abs(gcDelta);
  if (abs > 5) return 'recent';
  if (abs > 2) return 'intermediate';
  if (abs > 0) return 'ancient';
  return 'unknown';
}

export function analyzeHGTProvenance(
  genomeSequence: string,
  genes: GeneInfo[],
  referenceSketches: Record<string, string> = {},
  options?: HGTOptions
): HGTAnalysis {
  const { percent: genomeGC } = computeGC(genomeSequence);
  const windowSize = options?.window ?? 2000;
  const step = options?.step ?? 1000;
  const zThreshold = options?.zThreshold ?? 2;
  const minValidRatio = options?.minValidRatio ?? 0.5;
  
  const windows = slidingGC(genomeSequence, windowSize, step, minValidRatio);
  const islands = mergeIslands(windows, zThreshold);
  attachGenes(islands, genes);

  // Pre-compute reference k-mer sets once to avoid re-computation per island
  // Use k=15 as used in inferDonors
  const k = 15;
  const referenceSets: Record<string, Set<string>> = {};
  for (const [taxon, seq] of Object.entries(referenceSketches)) {
    referenceSets[taxon] = extractKmerSet(seq, k);
  }

  const stamps: PassportStamp[] = islands.map(island => {
    const seq = genomeSequence.slice(island.start, island.end);
    const donors = inferDonors(seq, referenceSets, k);
    const best = donors[0] ?? null;
    const amelioration = estimateAmelioration(island.gc - genomeGC);
    island.donors = donors;

    return {
      island,
      donor: best,
      donorDistribution: donors,
      amelioration,
      transferMechanism: 'unknown',
      gcDelta: island.gc - genomeGC,
      hallmarks: island.hallmarks,
    };
  });

  return {
    genomeGC,
    islands,
    stamps,
  };
}
