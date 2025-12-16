/**
 * Prophage Excision Precision Mapper
 *
 * Predicts exact attL/attR attachment sites for temperate phages.
 * Finds integrase genes, searches for imperfect direct repeats at boundaries,
 * and models the excision product.
 *
 * Part of: phage_explorer-w71 (Layer 2: Prophage Excision Precision Mapper)
 */

import type { GeneInfo } from '../types';

// Keywords that indicate integrase/recombinase genes
const INTEGRASE_KEYWORDS = [
  'integrase',
  'recombinase',
  'tyrosine recombinase',
  'serine recombinase',
  'site-specific recombinase',
  'phage integrase',
  'int',
  'xis',
  'excisionase',
];

// Common att site core sequences (from well-characterized phages)
const KNOWN_ATT_CORES = [
  'TTTTCTTT', // Lambda-like
  'TTTGTAT',  // P2-like
  'GTTTTTTG', // Mu-like
  'ATTGCAT',  // P22-like
];

export interface AttachmentSite {
  /** Position in genome (0-indexed) */
  position: number;
  /** The direct repeat sequence */
  sequence: string;
  /** Length of the repeat */
  length: number;
  /** Which site type: left or right boundary */
  type: 'attL' | 'attR';
  /** Confidence score 0-1 based on proximity to integrase, repeat quality */
  confidence: number;
  /** Whether it matches a known att core motif */
  matchesKnownCore: boolean;
  /** Distance from nearest integrase gene */
  distanceFromIntegrase: number;
}

export interface DirectRepeat {
  /** First occurrence position */
  pos1: number;
  /** Second occurrence position */
  pos2: number;
  /** The repeat sequence */
  sequence: string;
  /** Number of mismatches allowed */
  mismatches: number;
  /** Hamming distance (actual mismatches) */
  hammingDistance: number;
}

export interface IntegraseGene {
  /** The gene info */
  gene: GeneInfo;
  /** Keywords that matched */
  matchedKeywords: string[];
  /** Confidence that this is actually an integrase */
  confidence: number;
}

export interface ExcisionProduct {
  /** attB site in host (circular form after excision) */
  attB: {
    sequence: string;
    reconstructed: boolean;
  };
  /** attP site in phage (circular form) */
  attP: {
    sequence: string;
    reconstructed: boolean;
  };
  /** Estimated circular phage genome size */
  circularGenomeSize: number;
  /** Estimated excised region boundaries in linear form */
  excisedRegion: {
    start: number;
    end: number;
  };
}

export interface ProphageExcisionAnalysis {
  /** Identified integrase genes */
  integrases: IntegraseGene[];
  /** Predicted attachment sites */
  attachmentSites: AttachmentSite[];
  /** Direct repeats found near boundaries */
  directRepeats: DirectRepeat[];
  /** Best attL/attR pair prediction */
  bestPrediction: {
    attL: AttachmentSite | null;
    attR: AttachmentSite | null;
    confidence: number;
    excisionProduct: ExcisionProduct | null;
  };
  /** Is this likely a temperate phage? */
  isTemperate: boolean;
  /** Overall analysis confidence */
  overallConfidence: number;
  /** Diagnostic messages */
  diagnostics: string[];
}

/**
 * Find integrase/recombinase genes from gene annotations
 */
export function findIntegrases(genes: GeneInfo[]): IntegraseGene[] {
  const results: IntegraseGene[] = [];

  for (const gene of genes) {
    const fields = [gene.name, gene.product, gene.locusTag]
      .filter((f): f is string => f !== null)
      .map((f) => f.toLowerCase());

    const matchedKeywords: string[] = [];

    for (const keyword of INTEGRASE_KEYWORDS) {
      if (fields.some((f) => f.includes(keyword))) {
        matchedKeywords.push(keyword);
      }
    }

    if (matchedKeywords.length > 0) {
      // Higher confidence if multiple keywords match or specific terms
      let confidence = 0.5 + matchedKeywords.length * 0.15;
      if (matchedKeywords.includes('integrase')) confidence += 0.2;
      if (matchedKeywords.includes('site-specific recombinase')) confidence += 0.15;

      results.push({
        gene,
        matchedKeywords,
        confidence: Math.min(1, confidence),
      });
    }
  }

  // Sort by confidence descending
  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Find direct repeats in sequence with allowed mismatches
 *
 * Searches for pairs of similar sequences that could be att sites.
 * Focus on regions near genome termini for prophages.
 */
export function findDirectRepeats(
  sequence: string,
  minLength: number = 15,
  maxLength: number = 25,
  maxMismatches: number = 3,
  searchRegionSize: number = 5000
): DirectRepeat[] {
  const seq = sequence.toUpperCase();
  const len = seq.length;
  const results: DirectRepeat[] = [];

  // Search in terminal regions
  const leftRegion = seq.slice(0, Math.min(searchRegionSize, len));
  const rightRegion = seq.slice(Math.max(0, len - searchRegionSize));
  const rightOffset = Math.max(0, len - searchRegionSize);

  // Compare kmers from left region to right region
  for (let kmerLen = maxLength; kmerLen >= minLength; kmerLen--) {
    for (let i = 0; i <= leftRegion.length - kmerLen; i++) {
      const kmer1 = leftRegion.slice(i, i + kmerLen);

      for (let j = 0; j <= rightRegion.length - kmerLen; j++) {
        const kmer2 = rightRegion.slice(j, j + kmerLen);
        const hd = hammingDistance(kmer1, kmer2);

        if (hd <= maxMismatches) {
          results.push({
            pos1: i,
            pos2: rightOffset + j,
            sequence: kmer1,
            mismatches: maxMismatches,
            hammingDistance: hd,
          });
        }
      }
    }
  }

  // Deduplicate overlapping repeats, keeping best
  const filtered = deduplicateRepeats(results);

  return filtered.slice(0, 20); // Return top candidates
}

/**
 * Calculate Hamming distance between two equal-length strings
 */
function hammingDistance(s1: string, s2: string): number {
  let dist = 0;
  for (let i = 0; i < s1.length; i++) {
    if (s1[i] !== s2[i]) dist++;
  }
  return dist;
}

/**
 * Remove overlapping repeats, keeping highest quality
 */
function deduplicateRepeats(repeats: DirectRepeat[]): DirectRepeat[] {
  // Sort by quality: longer length, fewer mismatches
  const sorted = [...repeats].sort((a, b) => {
    const scoreA = a.sequence.length - a.hammingDistance * 3;
    const scoreB = b.sequence.length - b.hammingDistance * 3;
    return scoreB - scoreA;
  });

  const kept: DirectRepeat[] = [];
  const usedPositions = new Set<number>();

  for (const repeat of sorted) {
    // Check if positions overlap with already kept repeats
    let overlaps = false;
    for (let p = repeat.pos1; p < repeat.pos1 + repeat.sequence.length; p++) {
      if (usedPositions.has(p)) {
        overlaps = true;
        break;
      }
    }
    for (let p = repeat.pos2; p < repeat.pos2 + repeat.sequence.length; p++) {
      if (usedPositions.has(p + 1000000)) {
        // Offset to avoid collision
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      kept.push(repeat);
      for (let p = repeat.pos1; p < repeat.pos1 + repeat.sequence.length; p++) {
        usedPositions.add(p);
      }
      for (let p = repeat.pos2; p < repeat.pos2 + repeat.sequence.length; p++) {
        usedPositions.add(p + 1000000);
      }
    }
  }

  return kept;
}

/**
 * Check if a sequence matches known att core motifs
 */
function matchesKnownAttCore(sequence: string): boolean {
  const seq = sequence.toUpperCase();
  return KNOWN_ATT_CORES.some(
    (core) => seq.includes(core) || reverseComplement(seq).includes(core)
  );
}

/**
 * Get reverse complement of a DNA sequence
 */
function reverseComplement(seq: string): string {
  const complement: Record<string, string> = {
    A: 'T',
    T: 'A',
    G: 'C',
    C: 'G',
    N: 'N',
  };
  return seq
    .toUpperCase()
    .split('')
    .map((b) => complement[b] || 'N')
    .reverse()
    .join('');
}

/**
 * Convert direct repeats to attachment site predictions
 */
function repeatsToAttSites(
  repeats: DirectRepeat[],
  integrases: IntegraseGene[],
  genomeLength: number
): AttachmentSite[] {
  const sites: AttachmentSite[] = [];

  for (const repeat of repeats) {
    // Find closest integrase to each position
    const distL = minIntegraseDistance(repeat.pos1, integrases);
    const distR = minIntegraseDistance(repeat.pos2, integrases);

    // Calculate confidence based on repeat quality and integrase proximity
    const repeatQuality =
      (repeat.sequence.length - 10) / 15 - repeat.hammingDistance * 0.15;
    const integraseBonus = distL < 10000 || distR < 10000 ? 0.2 : 0;
    const knownCoreBonus = matchesKnownAttCore(repeat.sequence) ? 0.25 : 0;

    const baseConfidence = Math.max(
      0,
      Math.min(1, 0.3 + repeatQuality + integraseBonus + knownCoreBonus)
    );

    // Left site (closer to start)
    sites.push({
      position: repeat.pos1,
      sequence: repeat.sequence,
      length: repeat.sequence.length,
      type: 'attL',
      confidence: baseConfidence,
      matchesKnownCore: matchesKnownAttCore(repeat.sequence),
      distanceFromIntegrase: distL,
    });

    // Right site (closer to end)
    sites.push({
      position: repeat.pos2,
      sequence: repeat.sequence,
      length: repeat.sequence.length,
      type: 'attR',
      confidence: baseConfidence,
      matchesKnownCore: matchesKnownAttCore(repeat.sequence),
      distanceFromIntegrase: distR,
    });
  }

  return sites.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Find minimum distance from a position to any integrase gene
 */
function minIntegraseDistance(
  position: number,
  integrases: IntegraseGene[]
): number {
  if (integrases.length === 0) return Infinity;

  let minDist = Infinity;
  for (const int of integrases) {
    const geneStart = int.gene.startPos;
    const geneEnd = int.gene.endPos;
    const dist = Math.min(
      Math.abs(position - geneStart),
      Math.abs(position - geneEnd)
    );
    minDist = Math.min(minDist, dist);
  }

  return minDist;
}

/**
 * Model the excision product from predicted att sites
 */
function modelExcisionProduct(
  attL: AttachmentSite,
  attR: AttachmentSite,
  genomeLength: number
): ExcisionProduct {
  // After excision, attL and attR recombine:
  // - attB forms in the host chromosome
  // - attP forms in the circular phage

  // The att sites share a core sequence - during recombination
  // the crossover happens within this core

  const excisedStart = attL.position;
  const excisedEnd = attR.position + attR.length;

  // Circular genome size is the prophage region
  const circularGenomeSize = excisedEnd - excisedStart;

  return {
    attB: {
      sequence: attL.sequence, // Core remains in host
      reconstructed: true,
    },
    attP: {
      sequence: attR.sequence, // Core forms in phage circle
      reconstructed: true,
    },
    circularGenomeSize,
    excisedRegion: {
      start: excisedStart,
      end: excisedEnd,
    },
  };
}

/**
 * Main analysis function: predict prophage excision sites
 */
export function analyzeProphageExcision(
  sequence: string,
  genes: GeneInfo[]
): ProphageExcisionAnalysis {
  const diagnostics: string[] = [];

  // Step 1: Find integrase genes
  const integrases = findIntegrases(genes);
  if (integrases.length === 0) {
    diagnostics.push('No integrase/recombinase genes found');
  } else {
    diagnostics.push(
      `Found ${integrases.length} potential integrase gene(s): ${integrases.map((i) => i.gene.name || i.gene.locusTag || 'unnamed').join(', ')}`
    );
  }

  // Step 2: Find direct repeats in terminal regions
  const directRepeats = findDirectRepeats(sequence);
  if (directRepeats.length === 0) {
    diagnostics.push('No direct repeats found at genome boundaries');
  } else {
    diagnostics.push(`Found ${directRepeats.length} candidate direct repeat pair(s)`);
  }

  // Step 3: Convert repeats to attachment site predictions
  const attachmentSites = repeatsToAttSites(
    directRepeats,
    integrases,
    sequence.length
  );

  // Step 4: Find best attL/attR pair
  let bestAttL: AttachmentSite | null = null;
  let bestAttR: AttachmentSite | null = null;
  let bestPairConfidence = 0;

  // Group sites by their underlying repeat
  const attLSites = attachmentSites.filter((s) => s.type === 'attL');
  const attRSites = attachmentSites.filter((s) => s.type === 'attR');

  // Find best matching pair
  for (const attL of attLSites) {
    for (const attR of attRSites) {
      // Must be same sequence (from same repeat)
      if (attL.sequence !== attR.sequence) continue;

      const pairConfidence = (attL.confidence + attR.confidence) / 2;
      if (pairConfidence > bestPairConfidence) {
        bestAttL = attL;
        bestAttR = attR;
        bestPairConfidence = pairConfidence;
      }
    }
  }

  // Step 5: Model excision product if we have a pair
  let excisionProduct: ExcisionProduct | null = null;
  if (bestAttL && bestAttR) {
    excisionProduct = modelExcisionProduct(bestAttL, bestAttR, sequence.length);
    diagnostics.push(
      `Best att site pair: attL@${bestAttL.position}, attR@${bestAttR.position} (${bestAttL.sequence.slice(0, 10)}...)`
    );
    diagnostics.push(
      `Predicted circular phage size: ${excisionProduct.circularGenomeSize.toLocaleString()} bp`
    );
  } else {
    diagnostics.push('Could not identify confident attL/attR pair');
  }

  // Determine if this is likely a temperate phage
  const isTemperate = integrases.length > 0 && bestPairConfidence > 0.3;

  // Overall confidence
  const integraseScore = integrases.length > 0 ? integrases[0].confidence : 0;
  const repeatScore = bestPairConfidence;
  const overallConfidence = (integraseScore * 0.4 + repeatScore * 0.6);

  return {
    integrases,
    attachmentSites,
    directRepeats,
    bestPrediction: {
      attL: bestAttL,
      attR: bestAttR,
      confidence: bestPairConfidence,
      excisionProduct,
    },
    isTemperate,
    overallConfidence,
    diagnostics,
  };
}

/**
 * Quick check if phage is likely temperate (has integrase)
 */
export function isLikelyTemperate(genes: GeneInfo[]): boolean {
  return findIntegrases(genes).length > 0;
}
