/**
 * RNA Structure & Packaging Signal Explorer
 *
 * Analyzes how synonymous changes affect mRNA folding/ΔG along coding regions
 * to identify structure-constrained segments. Uses simplified folding heuristics
 * (no ViennaRNA dependency) for estimating MFE and synonymous stress.
 */

import { CODON_TABLE, reverseComplement } from '../codons';
import { CODON_FAMILIES } from './codon-bias';

// ============================================================================
// Types
// ============================================================================

export interface RNAWindow {
  start: number;
  end: number;
  sequence: string;
  mfe: number;           // Minimum Free Energy (kcal/mol estimate)
  gcContent: number;
  pairingDensity: number; // Fraction of bases in predicted pairs
}

export interface SynonymousVariant {
  codon: string;
  aminoAcid: string;
  deltaG: number;        // Estimated ΔG change from wild-type
}

export interface CodonStress {
  position: number;       // Codon position (0-indexed)
  codon: string;
  aminoAcid: string;
  wildTypeDeltaG: number;
  variants: SynonymousVariant[];
  stress: number;         // Variance of ΔΔG across synonymous variants (0-1 normalized)
  stressPercentile: number;
  isConstrained: boolean; // High stress = structure-constrained
}

export interface RegulatoryHypothesis {
  start: number;
  end: number;
  type: 'stem-loop' | 'riboswitch' | 'attenuator' | 'packaging-signal' | 'slippery-site';
  confidence: number;    // 0-1
  description: string;
  sequence: string;
  structure?: string;    // Dot-bracket notation if available
}

export interface RNAStructureAnalysis {
  windows: RNAWindow[];
  codonStress: CodonStress[];
  highStressRegions: Array<{ start: number; end: number; avgStress: number }>;
  regulatoryHypotheses: RegulatoryHypothesis[];
  globalMFE: number;
  avgSynonymousStress: number;
}

// ============================================================================
// Constants
// ============================================================================

// Base-pairing energies (simplified, kcal/mol at 37°C)
const BASE_PAIR_ENERGIES: Record<string, number> = {
  'AU': -0.9,
  'UA': -0.9,
  'GC': -2.1,
  'CG': -2.1,
  'GU': -0.5,
  'UG': -0.5,
};

// Stacking energies (simplified nearest-neighbor)
const STACK_BONUS = -0.4;

// Loop penalties
const HAIRPIN_PENALTY = 4.0;  // Base penalty for hairpin loops
// Reserved for future: BULGE_PENALTY = 3.5, INTERNAL_PENALTY = 2.0

// Minimum hairpin loop size
const MIN_HAIRPIN_LOOP = 3;

// Known regulatory motifs
const SLIPPERY_SITES = [
  'UUUAAAC', 'UUUAAAU', 'UUUUUUA', 'AAAAAAC', 'AAAUUUU',
  'GGGAAAC', 'UUUAAAG', 'AAAUUUA',
];

const RIBOSWITCH_MOTIFS = [
  'GGCGU', // TPP riboswitch fragment
  'GGGAU', // SAM riboswitch fragment
  'GCGAA', // FMN riboswitch fragment
];

// ============================================================================
// Helper Functions
// ============================================================================

function dnaToRna(seq: string): string {
  return seq.toUpperCase().replace(/T/g, 'U');
}

function canPair(a: string, b: string): boolean {
  const pair = a + b;
  return pair in BASE_PAIR_ENERGIES;
}

function pairEnergy(a: string, b: string): number {
  return BASE_PAIR_ENERGIES[a + b] ?? 0;
}

/**
 * Estimate GC content of a sequence
 */
function gcContent(seq: string): number {
  const upper = seq.toUpperCase();
  let gc = 0;
  let total = 0;
  for (const c of upper) {
    if (c === 'G' || c === 'C') gc++;
    if (c === 'A' || c === 'U' || c === 'G' || c === 'C' || c === 'T') total++;
  }
  return total > 0 ? gc / total : 0;
}

/**
 * Find potential stem-loops using a greedy approach
 * Returns array of [start, end] pairs for predicted base pairs
 */
function findStemLoops(rna: string, minStemLength = 4): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  const n = rna.length;

  // Scan for hairpin loops
  for (let loopStart = MIN_HAIRPIN_LOOP; loopStart < n - MIN_HAIRPIN_LOOP - minStemLength; loopStart++) {
    for (let loopEnd = loopStart + MIN_HAIRPIN_LOOP; loopEnd < Math.min(loopStart + 12, n); loopEnd++) {
      // Check for stem on both sides of the loop
      let stemLength = 0;
      for (let k = 0; k < 20; k++) {
        const i = loopStart - k - 1;
        const j = loopEnd + k;
        if (i < 0 || j >= n) break;
        if (canPair(rna[i], rna[j])) {
          stemLength++;
        } else {
          break;
        }
      }

      if (stemLength >= minStemLength) {
        // Record pairs
        for (let k = 0; k < stemLength; k++) {
          pairs.push([loopStart - k - 1, loopEnd + k]);
        }
        break; // Found a good hairpin at this position
      }
    }
  }

  return pairs;
}

/**
 * Estimate Minimum Free Energy (MFE) for an RNA sequence
 * Uses simplified Nussinov-like scoring without full dynamic programming
 */
function estimateMFE(rna: string): { mfe: number; pairingDensity: number } {
  const pairs = findStemLoops(rna);

  if (pairs.length === 0) {
    return { mfe: 0, pairingDensity: 0 };
  }

  let energy = 0;
  const pairedPositions = new Set<number>();

  // Sum base-pairing energies
  for (const [i, j] of pairs) {
    energy += pairEnergy(rna[i], rna[j]);
    pairedPositions.add(i);
    pairedPositions.add(j);
  }

  // Add stacking bonus for consecutive pairs
  const sortedPairs = [...pairs].sort((a, b) => a[0] - b[0]);
  for (let k = 1; k < sortedPairs.length; k++) {
    const [i1, j1] = sortedPairs[k - 1];
    const [i2, j2] = sortedPairs[k];
    if (i2 === i1 + 1 && j2 === j1 - 1) {
      energy += STACK_BONUS;
    }
  }

  // Add loop penalties (simplified)
  const numHairpins = Math.floor(pairs.length / 4); // Rough estimate
  energy += numHairpins * HAIRPIN_PENALTY;

  const pairingDensity = pairedPositions.size / rna.length;

  return { mfe: energy, pairingDensity };
}

/**
 * Get synonymous codons for a given amino acid
 */
function getSynonymousCodons(aminoAcid: string): string[] {
  return CODON_FAMILIES[aminoAcid] ?? [];
}

/**
 * Get amino acid from codon
 */
function getAminoAcid(codon: string): string {
  return CODON_TABLE[codon.toUpperCase()] ?? 'X';
}

/**
 * Compute local ΔG around a codon position using a context window
 */
function computeLocalDeltaG(
  sequence: string,
  codonPosition: number,
  codon: string,
  windowBases = 30
): number {
  const startNt = codonPosition * 3;
  const contextStart = Math.max(0, startNt - windowBases);
  const contextEnd = Math.min(sequence.length, startNt + 3 + windowBases);

  // Build context with the specified codon
  const prefix = sequence.slice(contextStart, startNt);
  const suffix = sequence.slice(startNt + 3, contextEnd);
  const context = prefix + codon + suffix;

  const rna = dnaToRna(context);
  const { mfe } = estimateMFE(rna);

  return mfe;
}

// ============================================================================
// Main Analysis Functions
// ============================================================================

/**
 * Analyze RNA structure along a sequence using sliding windows
 */
export function analyzeRNAWindows(
  sequence: string,
  windowSize = 120,
  stepSize = 30
): RNAWindow[] {
  const windows: RNAWindow[] = [];
  const seq = sequence.toUpperCase();

  for (let start = 0; start + windowSize <= seq.length; start += stepSize) {
    const windowSeq = seq.slice(start, start + windowSize);
    const rna = dnaToRna(windowSeq);
    const { mfe, pairingDensity } = estimateMFE(rna);

    windows.push({
      start,
      end: start + windowSize,
      sequence: windowSeq,
      mfe,
      gcContent: gcContent(rna),
      pairingDensity,
    });
  }

  return windows;
}

/**
 * Calculate synonymous stress for each codon position
 * High stress = structure-constrained (synonymous changes destabilize structure)
 */
export function computeSynonymousStress(
  codingSequence: string,
  frame = 0
): CodonStress[] {
  const seq = codingSequence.toUpperCase();
  const results: CodonStress[] = [];

  // Process each codon
  const codonCount = Math.floor((seq.length - frame) / 3);
  const allStress: number[] = [];

  for (let i = 0; i < codonCount; i++) {
    const startNt = frame + i * 3;
    const codon = seq.slice(startNt, startNt + 3);
    const aminoAcid = getAminoAcid(codon);

    if (aminoAcid === '*' || aminoAcid === 'X') {
      continue; // Skip stop codons and unknowns
    }

    // Get wild-type ΔG
    const wildTypeDeltaG = computeLocalDeltaG(seq, i, codon);

    // Get synonymous variants
    const synonymousCodons = getSynonymousCodons(aminoAcid);
    const variants: SynonymousVariant[] = [];

    for (const altCodon of synonymousCodons) {
      if (altCodon === codon) continue;

      const altDeltaG = computeLocalDeltaG(seq, i, altCodon);
      variants.push({
        codon: altCodon,
        aminoAcid,
        deltaG: altDeltaG - wildTypeDeltaG, // ΔΔG
      });
    }

    // Calculate stress as variance of ΔΔG values
    let stress = 0;
    if (variants.length > 0) {
      const deltaGs = variants.map(v => Math.abs(v.deltaG));
      const maxDelta = Math.max(...deltaGs, 0.01);
      stress = maxDelta; // Use max ΔΔG as stress measure
    }

    allStress.push(stress);

    results.push({
      position: i,
      codon,
      aminoAcid,
      wildTypeDeltaG,
      variants,
      stress,
      stressPercentile: 0, // Will fill in later
      isConstrained: false,
    });
  }

  // Calculate percentiles
  const sortedStress = [...allStress].sort((a, b) => a - b);
  const maxStress = Math.max(...allStress, 0.01);

  for (const result of results) {
    const rank = sortedStress.filter(s => s <= result.stress).length;
    result.stressPercentile = rank / sortedStress.length;
    result.stress = result.stress / maxStress; // Normalize to 0-1
    result.isConstrained = result.stressPercentile >= 0.8; // Top 20%
  }

  return results;
}

/**
 * Find contiguous high-stress regions
 */
export function findHighStressRegions(
  stressData: CodonStress[],
  minLength = 5,
  minAvgStress = 0.6
): Array<{ start: number; end: number; avgStress: number }> {
  const regions: Array<{ start: number; end: number; avgStress: number }> = [];

  let regionStart: number | null = null;
  let regionStress: number[] = [];

  for (let i = 0; i <= stressData.length; i++) {
    const current = stressData[i];
    const isHigh = current?.isConstrained ?? false;

    if (isHigh && regionStart === null) {
      regionStart = current.position;
      regionStress = [current.stress];
    } else if (isHigh && regionStart !== null) {
      regionStress.push(current.stress);
    } else if (!isHigh && regionStart !== null) {
      // End of region
      if (regionStress.length >= minLength) {
        const avgStress = regionStress.reduce((a, b) => a + b, 0) / regionStress.length;
        if (avgStress >= minAvgStress) {
          regions.push({
            start: regionStart * 3,
            end: (regionStart + regionStress.length) * 3,
            avgStress,
          });
        }
      }
      regionStart = null;
      regionStress = [];
    }
  }

  return regions;
}

/**
 * Detect potential regulatory RNA elements
 */
export function detectRegulatoryElements(
  sequence: string,
  stressData: CodonStress[]
): RegulatoryHypothesis[] {
  const hypotheses: RegulatoryHypothesis[] = [];
  const rna = dnaToRna(sequence);

  // Check for slippery sites (frameshift signals)
  for (const motif of SLIPPERY_SITES) {
    let pos = 0;
    while ((pos = rna.indexOf(motif, pos)) !== -1) {
      hypotheses.push({
        start: pos,
        end: pos + motif.length,
        type: 'slippery-site',
        confidence: 0.7,
        description: `Potential programmed frameshift: ${motif}`,
        sequence: rna.slice(pos, pos + motif.length),
      });
      pos++;
    }
  }

  // Check for riboswitch-like motifs
  for (const motif of RIBOSWITCH_MOTIFS) {
    let pos = 0;
    while ((pos = rna.indexOf(motif, pos)) !== -1) {
      hypotheses.push({
        start: pos,
        end: pos + motif.length + 20,
        type: 'riboswitch',
        confidence: 0.3, // Low confidence without full aptamer check
        description: `Potential riboswitch motif fragment`,
        sequence: rna.slice(pos, Math.min(pos + motif.length + 20, rna.length)),
      });
      pos++;
    }
  }

  // Look for strong stem-loops in high-stress regions
  const highStressRegions = findHighStressRegions(stressData);
  for (const region of highStressRegions) {
    const regionSeq = rna.slice(region.start, Math.min(region.end + 60, rna.length));
    const pairs = findStemLoops(regionSeq, 5);

    if (pairs.length >= 5) {
      hypotheses.push({
        start: region.start,
        end: region.end,
        type: 'attenuator',
        confidence: 0.5 + region.avgStress * 0.3,
        description: `High-stress region with stable stem-loop, possible attenuator`,
        sequence: regionSeq.slice(0, 60),
      });
    }
  }

  // Detect packaging signals (high GC, stable structure in terminal regions)
  const terminalWindow = 200;
  const fivePrime = rna.slice(0, Math.min(terminalWindow, rna.length));
  const threePrime = rna.slice(Math.max(0, rna.length - terminalWindow));

  for (const [pos, region, label] of [[0, fivePrime, "5'"], [rna.length - terminalWindow, threePrime, "3'"]] as const) {
    const gc = gcContent(region);
    const { mfe, pairingDensity } = estimateMFE(region);

    if (gc > 0.5 && pairingDensity > 0.3) {
      // Use mfe to boost confidence for very stable structures
      const stabilityBonus = mfe < -5 ? 0.1 : 0;
      hypotheses.push({
        start: pos < 0 ? rna.length + pos : pos,
        end: pos < 0 ? rna.length : pos + terminalWindow,
        type: 'packaging-signal',
        confidence: Math.min(0.9, gc * pairingDensity * 2 + stabilityBonus),
        description: `${label} terminal packaging signal candidate (GC=${(gc * 100).toFixed(1)}%, paired=${(pairingDensity * 100).toFixed(0)}%)`,
        sequence: region.slice(0, 50),
      });
    }
  }

  return hypotheses.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Full RNA structure analysis
 */
export function analyzeRNAStructure(
  sequence: string,
  options: {
    windowSize?: number;
    stepSize?: number;
    frame?: number;
  } = {}
): RNAStructureAnalysis {
  const { windowSize = 120, stepSize = 30, frame = 0 } = options;

  // Sliding window MFE analysis
  const windows = analyzeRNAWindows(sequence, windowSize, stepSize);

  // Synonymous stress analysis
  const codonStress = computeSynonymousStress(sequence, frame);

  // Find high-stress (structure-constrained) regions
  const highStressRegions = findHighStressRegions(codonStress);

  // Detect regulatory elements
  const regulatoryHypotheses = detectRegulatoryElements(sequence, codonStress);

  // Global metrics
  const globalMFE = windows.reduce((sum, w) => sum + w.mfe, 0) / Math.max(windows.length, 1);
  const avgSynonymousStress = codonStress.reduce((sum, c) => sum + c.stress, 0) / Math.max(codonStress.length, 1);

  return {
    windows,
    codonStress,
    highStressRegions,
    regulatoryHypotheses,
    globalMFE,
    avgSynonymousStress,
  };
}

/**
 * Get a detailed analysis for a specific gene region
 */
export function analyzeGeneRNAStructure(
  genomeSequence: string,
  geneStart: number,
  geneEnd: number,
  strand: '+' | '-' = '+'
): RNAStructureAnalysis {
  let geneSeq = genomeSequence.slice(geneStart, geneEnd);

  if (strand === '-') {
    geneSeq = reverseComplement(geneSeq);
  }

  return analyzeRNAStructure(geneSeq, {
    windowSize: Math.min(120, Math.floor(geneSeq.length / 3)),
    stepSize: Math.min(30, Math.floor(geneSeq.length / 10)),
    frame: 0,
  });
}
