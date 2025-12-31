/**
 * Dense K-mer Counter Tests
 *
 * Comprehensive test coverage for WASM k-mer kernels and JS fallback.
 *
 * @see phage_explorer-vk7b.7
 */

import { describe, expect, it } from 'bun:test';
import {
  DENSE_KMER_MAX_K,
  canUseDenseKmerCounts,
  countKmersDenseJS,
  countsToFrequencies,
  denseKmerMemoryCost,
  denseKmerMemoryCostHuman,
  getKmerCountingStrategy,
  getMaxKmer,
  indexToKmer,
  kmerToIndex,
  normalizeInPlace,
  topKFromDenseCounts,
} from './dense-kmer';

// ============================================================================
// Constants & Validation
// ============================================================================

describe('Dense K-mer Constants', () => {
  it('DENSE_KMER_MAX_K is 10', () => {
    expect(DENSE_KMER_MAX_K).toBe(10);
  });

  it('canUseDenseKmerCounts validates k range', () => {
    expect(canUseDenseKmerCounts(0)).toBe(false);
    expect(canUseDenseKmerCounts(1)).toBe(true);
    expect(canUseDenseKmerCounts(5)).toBe(true);
    expect(canUseDenseKmerCounts(10)).toBe(true);
    expect(canUseDenseKmerCounts(11)).toBe(false);
    expect(canUseDenseKmerCounts(-1)).toBe(false);
  });
});

// ============================================================================
// Memory Cost Calculations
// ============================================================================

describe('Memory Cost Functions', () => {
  it('denseKmerMemoryCost returns correct values for k=1..10', () => {
    expect(denseKmerMemoryCost(1)).toBe(4 * 4);         // 4^1 * 4 = 16
    expect(denseKmerMemoryCost(2)).toBe(16 * 4);        // 4^2 * 4 = 64
    expect(denseKmerMemoryCost(3)).toBe(64 * 4);        // 4^3 * 4 = 256
    expect(denseKmerMemoryCost(4)).toBe(256 * 4);       // 4^4 * 4 = 1024
    expect(denseKmerMemoryCost(5)).toBe(1024 * 4);      // 4^5 * 4 = 4096
    expect(denseKmerMemoryCost(10)).toBe(1048576 * 4);  // 4^10 * 4 = 4194304
  });

  it('denseKmerMemoryCost handles k>15 without bit shift overflow', () => {
    // 4^16 = 4294967296, which exceeds 32-bit integer
    // JS bit shift would give wrong result: (1 << 32) === 1
    const k16Cost = denseKmerMemoryCost(16);
    expect(k16Cost).toBe(Math.pow(4, 16) * 4);
    expect(k16Cost).toBeGreaterThan(0);
  });

  it('denseKmerMemoryCostHuman formats correctly', () => {
    expect(denseKmerMemoryCostHuman(1)).toBe('16B');
    expect(denseKmerMemoryCostHuman(4)).toBe('1.0KB');
    expect(denseKmerMemoryCostHuman(9)).toBe('1.0MB');
    expect(denseKmerMemoryCostHuman(10)).toBe('4.0MB');
  });
});

// ============================================================================
// Strategy Recommendations
// ============================================================================

describe('K-mer Counting Strategy', () => {
  it('recommends dense for k <= 10', () => {
    expect(getKmerCountingStrategy(1).method).toBe('dense');
    expect(getKmerCountingStrategy(5).method).toBe('dense');
    expect(getKmerCountingStrategy(10).method).toBe('dense');
  });

  it('recommends sparse for 10 < k <= 15', () => {
    expect(getKmerCountingStrategy(11).method).toBe('sparse');
    expect(getKmerCountingStrategy(15).method).toBe('sparse');
  });

  it('recommends minhash for k > 15', () => {
    expect(getKmerCountingStrategy(16).method).toBe('minhash');
    expect(getKmerCountingStrategy(20).method).toBe('minhash');
  });

  it('handles invalid k=0', () => {
    const result = getKmerCountingStrategy(0);
    expect(result.method).toBe('dense');
    expect(result.reason).toContain('Invalid');
  });
});

// ============================================================================
// Index <-> K-mer Conversion
// ============================================================================

describe('Index to K-mer Conversion', () => {
  it('indexToKmer converts correctly for k=1', () => {
    expect(indexToKmer(0, 1)).toBe('A');
    expect(indexToKmer(1, 1)).toBe('C');
    expect(indexToKmer(2, 1)).toBe('G');
    expect(indexToKmer(3, 1)).toBe('T');
  });

  it('indexToKmer converts correctly for k=2', () => {
    // Index = base0*4 + base1
    // AA=0, AC=1, AG=2, AT=3, CA=4, CC=5, ...
    expect(indexToKmer(0, 2)).toBe('AA');
    expect(indexToKmer(1, 2)).toBe('AC');
    expect(indexToKmer(2, 2)).toBe('AG');
    expect(indexToKmer(3, 2)).toBe('AT');
    expect(indexToKmer(4, 2)).toBe('CA');
    expect(indexToKmer(15, 2)).toBe('TT');
  });

  it('kmerToIndex is inverse of indexToKmer', () => {
    for (let k = 1; k <= 4; k++) {
      const maxIndex = Math.pow(4, k);
      for (let i = 0; i < maxIndex; i++) {
        const kmer = indexToKmer(i, k);
        expect(kmerToIndex(kmer)).toBe(i);
      }
    }
  });
});

// ============================================================================
// JS Fallback: countKmersDenseJS
// ============================================================================

describe('countKmersDenseJS', () => {
  describe('Invalid k values', () => {
    it('returns empty result for k=0', () => {
      const result = countKmersDenseJS('ACGT', 0);
      expect(result.counts.length).toBe(0);
      expect(result.totalValid).toBe(0);
      expect(result.k).toBe(0);
    });

    it('returns empty result for k > DENSE_KMER_MAX_K', () => {
      const result = countKmersDenseJS('ACGT', 11);
      expect(result.counts.length).toBe(0);
      expect(result.totalValid).toBe(0);
    });

    it('returns empty result for negative k', () => {
      const result = countKmersDenseJS('ACGT', -1);
      expect(result.counts.length).toBe(0);
    });
  });

  describe('Small sequences with known counts', () => {
    it('counts single-base k-mers (k=1)', () => {
      const result = countKmersDenseJS('ACGT', 1);
      expect(result.counts.length).toBe(4);
      expect(result.counts[0]).toBe(1); // A
      expect(result.counts[1]).toBe(1); // C
      expect(result.counts[2]).toBe(1); // G
      expect(result.counts[3]).toBe(1); // T
      expect(result.totalValid).toBe(4);
      expect(result.uniqueCount).toBe(4);
    });

    it('counts di-nucleotides (k=2)', () => {
      const result = countKmersDenseJS('ACGT', 2);
      expect(result.counts.length).toBe(16);
      // AC, CG, GT each appear once
      expect(result.counts[kmerToIndex('AC')]).toBe(1);
      expect(result.counts[kmerToIndex('CG')]).toBe(1);
      expect(result.counts[kmerToIndex('GT')]).toBe(1);
      expect(result.totalValid).toBe(3);
      expect(result.uniqueCount).toBe(3);
    });

    it('counts repeated k-mers correctly', () => {
      const result = countKmersDenseJS('AAAA', 2);
      expect(result.counts[kmerToIndex('AA')]).toBe(3);
      expect(result.totalValid).toBe(3);
      expect(result.uniqueCount).toBe(1);
    });

    it('handles poly-A sequence', () => {
      const result = countKmersDenseJS('AAAAAAAA', 3);
      // 8 bases, k=3 -> 6 valid 3-mers, all AAA
      expect(result.counts[kmerToIndex('AAA')]).toBe(6);
      expect(result.totalValid).toBe(6);
      expect(result.uniqueCount).toBe(1);
    });
  });

  describe('Mixed case inputs', () => {
    it('treats lowercase same as uppercase', () => {
      const upper = countKmersDenseJS('ACGT', 2);
      const lower = countKmersDenseJS('acgt', 2);
      const mixed = countKmersDenseJS('AcGt', 2);

      expect(upper.totalValid).toBe(lower.totalValid);
      expect(upper.totalValid).toBe(mixed.totalValid);

      for (let i = 0; i < upper.counts.length; i++) {
        expect(upper.counts[i]).toBe(lower.counts[i]);
        expect(upper.counts[i]).toBe(mixed.counts[i]);
      }
    });
  });

  describe('Ambiguous bases (N resets)', () => {
    it('resets rolling state on N', () => {
      // "AANAA" with k=2: AA, then N resets, then AA again
      const result = countKmersDenseJS('AANAA', 2);
      expect(result.counts[kmerToIndex('AA')]).toBe(2);
      expect(result.totalValid).toBe(2);
      // AN and NA should NOT be counted
    });

    it('handles N at start', () => {
      const result = countKmersDenseJS('NACGT', 2);
      // N resets, then AC, CG, GT
      expect(result.counts[kmerToIndex('AC')]).toBe(1);
      expect(result.counts[kmerToIndex('CG')]).toBe(1);
      expect(result.counts[kmerToIndex('GT')]).toBe(1);
      expect(result.totalValid).toBe(3);
    });

    it('handles N at end', () => {
      const result = countKmersDenseJS('ACGTN', 2);
      // AC, CG, GT, then N resets
      expect(result.totalValid).toBe(3);
    });

    it('handles consecutive Ns', () => {
      const result = countKmersDenseJS('AANNAA', 2);
      expect(result.counts[kmerToIndex('AA')]).toBe(2);
      expect(result.totalValid).toBe(2);
    });

    it('handles other ambiguous bases (R, Y, etc.)', () => {
      // R = purine (A or G), should be treated as invalid
      const result = countKmersDenseJS('AARAA', 2);
      expect(result.counts[kmerToIndex('AA')]).toBe(2);
      expect(result.totalValid).toBe(2);
    });
  });

  describe('Boundary k values', () => {
    it('works with k=1 (minimum)', () => {
      const result = countKmersDenseJS('A', 1);
      expect(result.counts.length).toBe(4);
      expect(result.counts[0]).toBe(1);
      expect(result.totalValid).toBe(1);
    });

    it('works with k=10 (maximum)', () => {
      // 10-base sequence has exactly 1 10-mer
      const seq = 'ACGTACGTAC';
      const result = countKmersDenseJS(seq, 10);
      expect(result.counts.length).toBe(1048576); // 4^10
      expect(result.totalValid).toBe(1);
      expect(result.uniqueCount).toBe(1);
    });
  });

  describe('Empty and too-short sequences', () => {
    it('handles empty string', () => {
      const result = countKmersDenseJS('', 2);
      expect(result.totalValid).toBe(0);
      expect(result.uniqueCount).toBe(0);
    });

    it('handles sequence shorter than k', () => {
      const result = countKmersDenseJS('AC', 3);
      expect(result.totalValid).toBe(0);
      expect(result.uniqueCount).toBe(0);
    });

    it('handles sequence exactly length k', () => {
      const result = countKmersDenseJS('ACG', 3);
      expect(result.totalValid).toBe(1);
      expect(result.counts[kmerToIndex('ACG')]).toBe(1);
    });
  });

  describe('U treated as T (RNA support)', () => {
    it('treats U same as T', () => {
      const dna = countKmersDenseJS('ACGT', 2);
      const rna = countKmersDenseJS('ACGU', 2);

      expect(dna.totalValid).toBe(rna.totalValid);
      for (let i = 0; i < dna.counts.length; i++) {
        expect(dna.counts[i]).toBe(rna.counts[i]);
      }
    });
  });

  describe('Uint8Array input', () => {
    it('accepts Uint8Array input', () => {
      const bytes = new TextEncoder().encode('ACGT');
      const result = countKmersDenseJS(bytes, 2);
      expect(result.totalValid).toBe(3);
      expect(result.counts[kmerToIndex('AC')]).toBe(1);
    });
  });
});

// ============================================================================
// Top-K Extraction
// ============================================================================

describe('topKFromDenseCounts', () => {
  it('returns empty array for topN <= 0', () => {
    const counts = new Uint32Array([1, 2, 3, 4]);
    expect(topKFromDenseCounts(counts, 1, 0)).toEqual([]);
    expect(topKFromDenseCounts(counts, 1, -1)).toEqual([]);
  });

  it('returns empty array for empty counts', () => {
    const counts = new Uint32Array(0);
    expect(topKFromDenseCounts(counts, 1, 10)).toEqual([]);
  });

  it('returns top k-mers sorted by count (descending)', () => {
    const result = countKmersDenseJS('AAACCCGGG', 1);
    const top = topKFromDenseCounts(result.counts, 1, 3);

    expect(top).toHaveLength(3);
    expect(top[0].count).toBeGreaterThanOrEqual(top[1].count);
    expect(top[1].count).toBeGreaterThanOrEqual(top[2].count);
  });

  it('handles case where there are fewer non-zero counts than topN', () => {
    const result = countKmersDenseJS('AA', 1);
    const top = topKFromDenseCounts(result.counts, 1, 10);

    expect(top).toHaveLength(1); // Only 'A' has count > 0
    expect(top[0].kmer).toBe('A');
    expect(top[0].count).toBe(2);
  });

  it('correctly extracts top k-mers from larger counts', () => {
    // AAAA has: AAA x 2
    // CCCC has: CCC x 2
    // Combined: AAAACCCC
    const result = countKmersDenseJS('AAAACCCC', 3);
    const top = topKFromDenseCounts(result.counts, 3, 5);

    // Should have AAA(2), AAC(1), ACC(1), CCC(2), maybe others
    expect(top.length).toBeGreaterThan(0);
    expect(top.every((t) => t.count > 0)).toBe(true);
  });
});

// ============================================================================
// getMaxKmer
// ============================================================================

describe('getMaxKmer', () => {
  it('returns null for all-zero counts', () => {
    const counts = new Uint32Array(16);
    expect(getMaxKmer(counts, 2)).toBeNull();
  });

  it('returns the k-mer with highest count', () => {
    const result = countKmersDenseJS('AAAACC', 1);
    const max = getMaxKmer(result.counts, 1);

    expect(max).not.toBeNull();
    expect(max!.kmer).toBe('A');
    expect(max!.count).toBe(4);
  });

  it('handles tie by returning first occurrence', () => {
    const result = countKmersDenseJS('AACCGGTT', 1);
    const max = getMaxKmer(result.counts, 1);

    // All have count 2, first is A at index 0
    expect(max).not.toBeNull();
    expect(max!.count).toBe(2);
    expect(max!.kmer).toBe('A'); // First in index order when tied
    expect(max!.index).toBe(0);
  });
});

// ============================================================================
// Normalization Helpers
// ============================================================================

describe('countsToFrequencies', () => {
  it('returns all zeros when totalValid is 0', () => {
    const counts = new Uint32Array([1, 2, 3]);
    const freqs = countsToFrequencies(counts, 0);
    expect(freqs.every((f) => f === 0)).toBe(true);
  });

  it('normalizes counts to sum to 1.0', () => {
    const counts = new Uint32Array([10, 20, 30, 40]);
    const freqs = countsToFrequencies(counts, 100);

    let sum = 0;
    for (const f of freqs) sum += f;
    expect(sum).toBeCloseTo(1.0, 5);

    expect(freqs[0]).toBeCloseTo(0.1, 5);
    expect(freqs[1]).toBeCloseTo(0.2, 5);
    expect(freqs[2]).toBeCloseTo(0.3, 5);
    expect(freqs[3]).toBeCloseTo(0.4, 5);
  });
});

describe('normalizeInPlace', () => {
  it('modifies array in place', () => {
    const freqs = new Float32Array([1, 2, 3, 4]);
    const result = normalizeInPlace(freqs);

    expect(result).toBe(freqs); // Same reference

    let sum = 0;
    for (const f of freqs) sum += f;
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('handles all-zero array', () => {
    const freqs = new Float32Array([0, 0, 0]);
    normalizeInPlace(freqs);
    expect(freqs.every((f) => f === 0)).toBe(true);
  });
});

// ============================================================================
// Parity Check: JS should produce consistent results
// ============================================================================

describe('Parity and Consistency', () => {
  it('produces deterministic results', () => {
    const seq = 'ACGTACGTACGT';
    const result1 = countKmersDenseJS(seq, 4);
    const result2 = countKmersDenseJS(seq, 4);

    expect(result1.totalValid).toBe(result2.totalValid);
    expect(result1.uniqueCount).toBe(result2.uniqueCount);
    for (let i = 0; i < result1.counts.length; i++) {
      expect(result1.counts[i]).toBe(result2.counts[i]);
    }
  });

  it('totalValid equals sum of counts', () => {
    const result = countKmersDenseJS('ACGTACGTACGT', 3);
    let sum = 0;
    for (const c of result.counts) sum += c;
    expect(sum).toBe(result.totalValid);
  });

  it('uniqueCount equals number of non-zero counts', () => {
    const result = countKmersDenseJS('ACGTACGTACGT', 3);
    let nonZero = 0;
    for (const c of result.counts) {
      if (c > 0) nonZero++;
    }
    expect(nonZero).toBe(result.uniqueCount);
  });
});
