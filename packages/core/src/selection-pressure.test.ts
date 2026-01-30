import { describe, it, expect } from 'bun:test';
import { calculateSelectionPressure } from './selection-pressure';
import type { GeneInfo } from './types';

describe('calculateSelectionPressure', () => {
  it('should ignore gapped codons', () => {
    // Gap vs Adenine
    // codonA = ---
    // codonB = AAA
    // Before fix, this counted as synonymous (X equals X). After fix, it returns no windows.
    const result = calculateSelectionPressure('---', 'AAA', 3);

    // Should be no valid windows because the window is invalid due to gaps
    expect(result.windows.length).toBe(0);
  });

  it('should handle gaps correctly in longer sequence', () => {
    const seqA = 'ATG---TTC';
    const seqB = 'ATGAAATTC';
    const result = calculateSelectionPressure(seqA, seqB, 9);

    // Should produce 1 window covering indices 0-9
    expect(result.windows.length).toBe(1);

    // With the bug, --- vs AAA counts as synonymous (X->X), so dS > 0, dN = 0 -> omega = 0 -> 'purifying'
    // With the fix, --- is skipped. ATG=ATG, TTC=TTC. dS=0, dN=0 -> omega=1.0 -> 'neutral'/'unknown'
    expect(result.windows[0].classification).toBe('unknown');
  });

  it('aligns codon frame to + strand gene start', () => {
    const gene: GeneInfo = {
      id: 1,
      name: null,
      locusTag: null,
      startPos: 1,
      endPos: 10,
      strand: '+',
      product: null,
      type: 'CDS',
    };

    // Gene starts at pos 1, so reading frame should begin at window index 1.
    // The change (A->G) at index 6 is a synonymous mutation in-frame (AAA -> AAG).
    // A misaligned frame would instead interpret a non-synonymous codon change (AAA -> AGA).
    const seqA = 'AAAAAAAAAAAA';
    const seqB = 'AAAAAAGAAAAA';
    const result = calculateSelectionPressure(seqA, seqB, 12, [gene]);

    expect(result.windows.length).toBe(1);
    expect(result.windows[0].dS).toBeGreaterThan(0);
    expect(result.windows[0].dN).toBeCloseTo(0);
    expect(result.windows[0].classification).toBe('purifying');
  });

  it('aligns codon frame to - strand gene end after reverse-complement', () => {
    const gene: GeneInfo = {
      id: 1,
      name: null,
      locusTag: null,
      startPos: 0,
      endPos: 10,
      strand: '-',
      product: null,
      type: 'CDS',
    };

    // On the reverse strand, the coding direction is the reverse complement of the genomic window.
    // These sequences are chosen so that in the correctly aligned reverse-complement frame,
    // the mutation is synonymous (AAA -> AAG). A misaligned frame would read AAA -> GAA (non-synonymous).
    const seqA = 'TTTTTTTTTTTT';
    const seqB = 'TTTTTTTCTTTT';
    const result = calculateSelectionPressure(seqA, seqB, 12, [gene]);

    expect(result.windows.length).toBe(1);
    expect(result.windows[0].dS).toBeGreaterThan(0);
    expect(result.windows[0].dN).toBeCloseTo(0);
    expect(result.windows[0].classification).toBe('purifying');
  });
});
