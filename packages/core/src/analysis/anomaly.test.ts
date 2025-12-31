import { describe, it, expect } from 'bun:test';
import { scanForAnomalies } from './anomaly';

function makeDeterministicSequence(length: number, seed = 1): string {
  // Simple LCG for deterministic pseudo-random bases.
  // This keeps tests stable while still behaving like "random" background.
  let state = seed >>> 0;
  const alphabet = ['A', 'C', 'G', 'T'];
  const out = new Array<string>(length);

  for (let i = 0; i < length; i++) {
    state = (1664525 * state + 1013904223) >>> 0;
    out[i] = alphabet[state & 3];
  }

  return out.join('');
}

describe('Anomaly Scanner', () => {
  it('should return empty result for short sequences', () => {
    const result = scanForAnomalies('ACGT', 500, 100, 4);
    expect(result.windows).toHaveLength(0);
  });

  it('should preserve window coordinates when sequence contains ambiguous bases', () => {
    // Previously we dropped non-ACGT bases, which shifted window positions.
    // Replacing with 'N' preserves the original coordinate space.
    const result = scanForAnomalies('ACGTNACGT', 5, 2, 2);
    expect(result.windows).toHaveLength(3);
    expect(result.windows.map(w => w.position)).toEqual([0, 2, 4]);
  });

  it('should handle RNA sequences by treating U as T', () => {
    // RNA uses U instead of T. The scanner should normalize U→T.
    // Without this fix, "ACGU" would become "ACGN" and all k-mers would be skipped.
    const dnaSeq = 'ACGTACGTACGTACGTACGTACGTACGTACGT'; // 32 bases
    const rnaSeq = 'ACGUACGUACGUACGUACGUACGUACGUACGU'; // Same but with U

    const dnaResult = scanForAnomalies(dnaSeq, 16, 8, 2);
    const rnaResult = scanForAnomalies(rnaSeq, 16, 8, 2);

    // Both should produce the same number of windows with valid KL values
    expect(rnaResult.windows.length).toBe(dnaResult.windows.length);
    expect(rnaResult.windows.length).toBeGreaterThan(0);

    // KL divergence should be identical (U and T are equivalent)
    for (let i = 0; i < dnaResult.windows.length; i++) {
      expect(rnaResult.windows[i].klDivergence).toBeCloseTo(dnaResult.windows[i].klDivergence, 5);
    }
  });

  it('should detect anomalies in synthetic data', () => {
    // Deterministic background + a highly-compressible repetitive region.
    // The pure window at position 5000 is intentionally sized to match windowSize
    // so at least one window is "all A", which should strongly stand out.
    const background = makeDeterministicSequence(10000, 123);
    const anomaly = 'A'.repeat(500);
    const sequence = background.slice(0, 5000) + anomaly + background.slice(5000);

    const result = scanForAnomalies(sequence, 500, 100, 4);
    expect(result.windows.length).toBeGreaterThan(0);

    const anomalyWindow = result.windows.find(w => w.position === 5000);
    expect(anomalyWindow).toBeDefined();
    expect(anomalyWindow?.isAnomalous).toBe(true);
    expect(anomalyWindow?.anomalyType).toBe('Repetitive');
  });

  it('should use percentile-based thresholds', () => {
    const seq = Array(5000).fill('A').join(''); // Highly repetitive
    const result = scanForAnomalies(seq, 100, 50, 2);
    
    // Thresholds should be defined
    expect(result.thresholds.kl).toBeGreaterThanOrEqual(0);
    expect(result.thresholds.compression).toBeGreaterThanOrEqual(0);
  });
});
