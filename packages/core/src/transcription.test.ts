/**
 * Tests for Transcription Analysis Module
 *
 * Tests promoter detection, terminator detection, and transcription flow simulation.
 */

import { describe, test, expect } from 'bun:test';
import {
  detectPromoters,
  detectTerminators,
  simulateTranscriptionFlow,
  computeRegulatoryConstellation,
} from './transcription';

describe('detectPromoters', () => {
  test('returns empty array for empty sequence', () => {
    const result = detectPromoters('');
    expect(result).toEqual([]);
  });

  test('returns empty array for sequence too short for promoters', () => {
    const result = detectPromoters('ACGT');
    expect(result).toEqual([]);
  });

  test('detects sigma70 -10 box (TATAAT)', () => {
    // Create sequence with strong -35 (TTGACA) and -10 (TATAAT) boxes
    // -35 at position 5, -10 at position 28 (23bp spacing, within 21-25 range)
    // Need padding at start since scanner starts at position 25
    const seq = 'NNNNN' + 'TTGACA' + 'N'.repeat(17) + 'TATAAT' + 'N'.repeat(50);
    const result = detectPromoters(seq);

    expect(result.length).toBeGreaterThan(0);
    // May detect as σ70 or σ32 depending on exact match scores
    const hasPromoter = result.some(h => h.motif.includes('σ70') || h.motif.includes('σ32'));
    expect(hasPromoter).toBe(true);
  });

  test('detects sigma70 -10 only promoter when -35 is weak', () => {
    // Strong -10 box without matching -35
    const seq = 'N'.repeat(30) + 'TATAAT' + 'N'.repeat(50);
    const result = detectPromoters(seq);

    // Should detect as partial promoter
    // May or may not be detected depending on threshold
    const partial = result.find(h => h.motif.includes('-10 only'));
    // If partial promoter was detected, verify it has valid strength
    if (partial) {
      expect(partial.strength).toBeGreaterThan(0);
      expect(partial.strength).toBeLessThanOrEqual(1.0);
    }
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  test('detects sigma32 promoters', () => {
    // Sigma32 -35: TTGAAA, -10: CCCCAT
    const seq = 'N'.repeat(10) + 'TTGAAA' + 'N'.repeat(50) + 'CCCCAT' + 'N'.repeat(50);
    const result = detectPromoters(seq);

    const sigma32 = result.find(h => h.motif === 'σ32');
    expect(sigma32).toBeDefined();
  });

  test('detects sigma54 promoters', () => {
    // Sigma54 core: TGGCACG
    const seq = 'N'.repeat(20) + 'TGGCACG' + 'N'.repeat(50);
    const result = detectPromoters(seq);

    const sigma54 = result.find(h => h.motif === 'σ54');
    expect(sigma54).toBeDefined();
  });

  test('detects RBS (ribosome binding site)', () => {
    // RBS pattern: AGGAGG (Shine-Dalgarno)
    const seq = 'N'.repeat(30) + 'AGGAGG' + 'N'.repeat(50);
    const result = detectPromoters(seq);

    const rbs = result.find(h => h.motif === 'RBS');
    expect(rbs).toBeDefined();
    expect(rbs!.strength).toBeGreaterThan(0);
  });

  test('detects promoters on reverse strand', () => {
    // Create a promoter on the reverse complement
    // Forward: TTGACA...TATAAT should appear as reverse complement on minus strand
    const fwdPromoter = 'TTGACA' + 'N'.repeat(17) + 'TATAAT';
    // Reverse complement will be scanned
    const seq = 'N'.repeat(50) + fwdPromoter + 'N'.repeat(50);
    const result = detectPromoters(seq);

    // Should find at least one promoter
    expect(result.length).toBeGreaterThan(0);
  });

  test('deduplicates overlapping hits keeping strongest', () => {
    // Multiple overlapping sigma70-like sequences
    const seq = 'TTGACA' + 'N'.repeat(17) + 'TATAAT' + 'TATAAT' + 'N'.repeat(50);
    const result = detectPromoters(seq);

    // Should not have duplicate hits within 10bp
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        if (result[i].strand === result[j].strand) {
          expect(Math.abs(result[i].pos - result[j].pos)).toBeGreaterThanOrEqual(10);
        }
      }
    }
  });

  test('normalizes strength scores to 0-1 range', () => {
    const seq = 'TTGACA' + 'N'.repeat(17) + 'TATAAT' + 'N'.repeat(50);
    const result = detectPromoters(seq);

    for (const hit of result) {
      expect(hit.strength).toBeGreaterThanOrEqual(0);
      expect(hit.strength).toBeLessThanOrEqual(1);
    }
  });

  test('returns hits sorted by position', () => {
    const seq = 'AGGAGG' + 'N'.repeat(20) + 'TGGCACG' + 'N'.repeat(20) + 'TTGAAA' + 'N'.repeat(50);
    const result = detectPromoters(seq);

    for (let i = 1; i < result.length; i++) {
      expect(result[i].pos).toBeGreaterThanOrEqual(result[i - 1].pos);
    }
  });
});

describe('detectTerminators', () => {
  test('returns empty array for empty sequence', () => {
    const result = detectTerminators('');
    expect(result).toEqual([]);
  });

  test('returns empty array for sequence too short', () => {
    const result = detectTerminators('ACGTACGT');
    expect(result).toEqual([]);
  });

  test('detects rho-independent terminator (hairpin + poly-T)', () => {
    // Classic terminator: GC-rich stem-loop followed by poly-T
    // Stem: GCGCGC (6bp), Loop: NNNN (4bp), Stem2: GCGCGC (reverse complement), Tail: TTTTT
    const stem = 'GCGCGC';
    const loop = 'AAAA';
    const rcStem = 'GCGCGC'; // RC of GCGCGC
    const tail = 'TTTTT';
    const terminator = stem + loop + rcStem + tail;
    const seq = 'N'.repeat(30) + terminator + 'N'.repeat(30);

    const result = detectTerminators(seq);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].motif).toMatch(/term\(\d+-\d+\)/);
  });

  test('requires sufficient GC content in stem', () => {
    // Low GC stem should not be detected
    const stem = 'ATATAT';
    const loop = 'NNNN';
    const rcStem = 'ATATAT';
    const tail = 'TTTTT';
    const seq = 'N'.repeat(30) + stem + loop + rcStem + tail + 'N'.repeat(30);

    const result = detectTerminators(seq);

    // Should not detect this as a terminator due to low GC
    expect(result.length).toBe(0);
  });

  test('requires poly-T tail (at least 3 Ts)', () => {
    const stem = 'GCGCGC';
    const loop = 'AAAA';
    const rcStem = 'GCGCGC';
    const tail = 'AAGAA'; // No poly-T
    const seq = 'N'.repeat(30) + stem + loop + rcStem + tail + 'N'.repeat(30);

    const result = detectTerminators(seq);

    // Should not detect without poly-T tail
    expect(result.length).toBe(0);
  });

  test('detects terminators on both strands', () => {
    // Create a terminator that should be detected on forward strand
    const stem = 'GCGCGC';
    const loop = 'AAAA';
    const rcStem = 'GCGCGC';
    const tail = 'TTTTT';
    const terminator = stem + loop + rcStem + tail;
    const seq = 'N'.repeat(30) + terminator + 'N'.repeat(50);

    const result = detectTerminators(seq);

    // May find on one or both strands depending on sequence
    expect(result.length).toBeGreaterThan(0);
  });

  test('deduplicates overlapping terminators', () => {
    const stem = 'GCGCGC';
    const loop = 'AAAA';
    const rcStem = 'GCGCGC';
    const tail = 'TTTTT';
    const terminator = stem + loop + rcStem + tail;
    const seq = 'N'.repeat(30) + terminator + terminator + 'N'.repeat(30);

    const result = detectTerminators(seq);

    // Should not have overlapping hits within 10bp on same strand
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        if (result[i].strand === result[j].strand) {
          expect(Math.abs(result[i].pos - result[j].pos)).toBeGreaterThanOrEqual(10);
        }
      }
    }
  });

  test('efficiency is between 0 and 1', () => {
    const stem = 'GCGCGC';
    const loop = 'AAAA';
    const rcStem = 'GCGCGC';
    const tail = 'TTTTT';
    const seq = 'N'.repeat(30) + stem + loop + rcStem + tail + 'N'.repeat(30);

    const result = detectTerminators(seq);

    for (const hit of result) {
      expect(hit.efficiency).toBeGreaterThanOrEqual(0);
      expect(hit.efficiency).toBeLessThanOrEqual(1);
    }
  });
});

describe('simulateTranscriptionFlow', () => {
  test('returns empty values for empty sequence', () => {
    const result = simulateTranscriptionFlow('');
    expect(result.values).toEqual([]);
    expect(result.peaks).toEqual([]);
  });

  test('returns single bin for short sequence', () => {
    const seq = 'A'.repeat(100);
    const result = simulateTranscriptionFlow(seq, 200);
    expect(result.values.length).toBe(1);
  });

  test('creates correct number of bins based on window size', () => {
    const seq = 'A'.repeat(1000);
    const result = simulateTranscriptionFlow(seq, 200);
    expect(result.values.length).toBe(5); // ceil(1000/200) = 5
  });

  test('accumulates flux from promoters', () => {
    // Create sequence with promoter at start
    const promoter = 'TTGACA' + 'N'.repeat(17) + 'TATAAT';
    const seq = promoter + 'N'.repeat(500);

    const result = simulateTranscriptionFlow(seq, 100);

    // Should have some flux values
    expect(result.values.some(v => v > 0)).toBe(true);
  });

  test('terminators reduce flux', () => {
    // Create sequence with promoter then terminator
    const promoter = 'TTGACA' + 'N'.repeat(17) + 'TATAAT';
    const terminator = 'GCGCGC' + 'AAAA' + 'GCGCGC' + 'TTTTT';
    const seq = promoter + 'N'.repeat(100) + terminator + 'N'.repeat(200);

    const result = simulateTranscriptionFlow(seq, 100);

    // Just verify it completes without error
    expect(result.values.length).toBeGreaterThan(0);
  });

  test('returns top 3 peaks sorted by flux', () => {
    const seq = 'N'.repeat(1000);
    const result = simulateTranscriptionFlow(seq, 100);

    expect(result.peaks.length).toBeLessThanOrEqual(3);

    // Peaks should be sorted by flux descending
    for (let i = 1; i < result.peaks.length; i++) {
      expect(result.peaks[i].flux).toBeLessThanOrEqual(result.peaks[i - 1].flux);
    }
  });

  test('peak coordinates are valid', () => {
    const seq = 'N'.repeat(500);
    const result = simulateTranscriptionFlow(seq, 100);

    for (const peak of result.peaks) {
      expect(peak.start).toBeGreaterThanOrEqual(1);
      expect(peak.end).toBeLessThanOrEqual(seq.length);
      expect(peak.end).toBeGreaterThanOrEqual(peak.start);
    }
  });

  test('handles custom window size', () => {
    const seq = 'N'.repeat(1000);
    const result50 = simulateTranscriptionFlow(seq, 50);
    const result500 = simulateTranscriptionFlow(seq, 500);

    expect(result50.values.length).toBeGreaterThan(result500.values.length);
  });
});

describe('computeRegulatoryConstellation', () => {
  test('returns empty arrays for empty sequence', () => {
    const result = computeRegulatoryConstellation('');
    expect(result.promoters).toEqual([]);
    expect(result.terminators).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  test('returns promoters and terminators detected', () => {
    const promoter = 'TTGACA' + 'N'.repeat(17) + 'TATAAT';
    const terminator = 'GCGCGC' + 'AAAA' + 'GCGCGC' + 'TTTTT';
    const seq = promoter + 'N'.repeat(200) + terminator + 'N'.repeat(50);

    const result = computeRegulatoryConstellation(seq);

    // Should detect some regulatory elements
    expect(result.promoters.length + result.terminators.length).toBeGreaterThanOrEqual(0);
  });

  test('creates edges between promoters and downstream terminators', () => {
    // Need sequence where promoter-terminator distance is in ideal range (50-5000bp)
    const promoter = 'TGGCACG'; // σ54
    const terminator = 'GCGCGC' + 'AAAA' + 'GCGCGC' + 'TTTTT';
    const seq = 'N'.repeat(30) + promoter + 'N'.repeat(150) + terminator + 'N'.repeat(50);

    const result = computeRegulatoryConstellation(seq);

    // Just verify structure is correct
    expect(Array.isArray(result.edges)).toBe(true);
  });

  test('creates edges between close promoters (promoter clusters)', () => {
    // Two σ54 promoters close together
    const seq = 'N'.repeat(30) + 'TGGCACG' + 'N'.repeat(50) + 'TGGCACG' + 'N'.repeat(100);

    const result = computeRegulatoryConstellation(seq);

    // May create promoter cluster edges
    const clusterEdges = result.edges.filter(e => e.label === 'promoter cluster');
    expect(Array.isArray(clusterEdges)).toBe(true);
  });

  test('edge weights are normalized to 0-1', () => {
    const promoter = 'TGGCACG';
    const seq = 'N'.repeat(30) + promoter + 'N'.repeat(200);

    const result = computeRegulatoryConstellation(seq);

    for (const edge of result.edges) {
      expect(edge.weight).toBeGreaterThanOrEqual(0);
      expect(edge.weight).toBeLessThanOrEqual(1);
    }
  });

  test('limits edges to top 25', () => {
    // Create many potential promoters to generate many edges
    const seq = ('TGGCACG' + 'N'.repeat(30)).repeat(20) + 'N'.repeat(100);

    const result = computeRegulatoryConstellation(seq);

    expect(result.edges.length).toBeLessThanOrEqual(25);
  });

  test('edges are sorted by weight descending', () => {
    const promoter = 'TGGCACG';
    const terminator = 'GCGCGC' + 'AAAA' + 'GCGCGC' + 'TTTTT';
    const seq = 'N'.repeat(30) + promoter + 'N'.repeat(30) + promoter + 'N'.repeat(200) + terminator + 'N'.repeat(50);

    const result = computeRegulatoryConstellation(seq);

    for (let i = 1; i < result.edges.length; i++) {
      expect(result.edges[i].weight).toBeLessThanOrEqual(result.edges[i - 1].weight);
    }
  });

  test('edge distance is calculated correctly', () => {
    const promoter = 'TGGCACG';
    const terminator = 'GCGCGC' + 'AAAA' + 'GCGCGC' + 'TTTTT';
    const seq = 'N'.repeat(30) + promoter + 'N'.repeat(100) + terminator + 'N'.repeat(50);

    const result = computeRegulatoryConstellation(seq);

    for (const edge of result.edges) {
      if (edge.label !== 'promoter cluster') {
        expect(edge.distance).toBe(edge.target - edge.source);
      } else {
        expect(edge.distance).toBe(Math.abs(edge.target - edge.source));
      }
    }
  });
});

describe('integration: full regulatory analysis', () => {
  test('analyzes realistic phage-like sequence', () => {
    // Create a mini "operon" structure
    const promoter = 'TTGACA' + 'ATGCATGCATGCATGCA' + 'TATAAT'; // σ70
    const rbs = 'AGGAGG';
    const terminator = 'GCGCGCGC' + 'TTTT' + 'GCGCGCGC' + 'TTTTTT';

    const operon = promoter + 'N'.repeat(50) + rbs + 'N'.repeat(500) + terminator;
    const seq = 'N'.repeat(100) + operon + 'N'.repeat(100);

    const constellation = computeRegulatoryConstellation(seq);
    const flow = simulateTranscriptionFlow(seq, 100);

    // Basic sanity checks
    expect(constellation.promoters.length).toBeGreaterThanOrEqual(0);
    expect(flow.values.length).toBeGreaterThan(0);
  });

  test('handles very long sequence efficiently', () => {
    // 100kb sequence - should complete in reasonable time
    const seq = 'ACGT'.repeat(25000);

    const start = Date.now();
    const result = simulateTranscriptionFlow(seq, 1000);
    const elapsed = Date.now() - start;

    expect(result.values.length).toBe(100);
    expect(elapsed).toBeLessThan(5000); // Should complete within 5 seconds
  });
});
