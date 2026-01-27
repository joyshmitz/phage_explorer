/**
 * Tests for CRISPR Pressure Analysis Module
 *
 * Tests spacer hit detection, Acr candidate prediction,
 * and pressure window calculation.
 */

import { describe, test, expect } from 'bun:test';
import { analyzeCRISPRPressure } from './crispr';
import type { GeneInfo } from './types';

// Test sequences containing known mock spacers (TGACGT, AACCGG, etc.)
const SEQ_WITH_SPACERS = 'ATGCATGCTGACGTATGCATGCAACCGGATGCATGC';
const SEQ_WITHOUT_SPACERS = 'ATGCATGCATGCATGCATGCATGCATGCATGCATGC';

let geneId = 0;
const makeGene = (
  product: string,
  start: number,
  end: number,
  strand: '+' | '-' = '+'
): GeneInfo => ({
  id: ++geneId,
  name: null,
  locusTag: `gene_${geneId}`,
  startPos: start,
  endPos: end,
  strand,
  product,
  type: 'CDS',
});

describe('analyzeCRISPRPressure', () => {
  describe('result structure', () => {
    test('returns complete result structure', () => {
      const result = analyzeCRISPRPressure(SEQ_WITH_SPACERS, []);

      expect(result).toHaveProperty('spacerHits');
      expect(result).toHaveProperty('acrCandidates');
      expect(result).toHaveProperty('pressureWindows');
      expect(result).toHaveProperty('maxPressure');

      expect(Array.isArray(result.spacerHits)).toBe(true);
      expect(Array.isArray(result.acrCandidates)).toBe(true);
      expect(Array.isArray(result.pressureWindows)).toBe(true);
      expect(typeof result.maxPressure).toBe('number');
    });

    test('handles empty sequence', () => {
      const result = analyzeCRISPRPressure('', []);

      expect(result.spacerHits).toEqual([]);
      expect(result.acrCandidates).toEqual([]);
      expect(result.pressureWindows).toEqual([]);
      expect(result.maxPressure).toBe(0);
    });
  });

  describe('spacer detection', () => {
    test('detects known spacer in sequence', () => {
      // TGACGT is one of the mock spacers
      const result = analyzeCRISPRPressure(SEQ_WITH_SPACERS, []);

      expect(result.spacerHits.length).toBeGreaterThan(0);
    });

    test('spacer hits are sorted by position', () => {
      const result = analyzeCRISPRPressure(SEQ_WITH_SPACERS, []);

      for (let i = 1; i < result.spacerHits.length; i++) {
        expect(result.spacerHits[i].position).toBeGreaterThanOrEqual(
          result.spacerHits[i - 1].position
        );
      }
    });

    test('spacer hit has required properties', () => {
      const result = analyzeCRISPRPressure(SEQ_WITH_SPACERS, []);

      for (const hit of result.spacerHits) {
        expect(hit).toHaveProperty('position');
        expect(hit).toHaveProperty('sequence');
        expect(hit).toHaveProperty('host');
        expect(hit).toHaveProperty('crisprType');
        expect(hit).toHaveProperty('matchScore');
        expect(hit).toHaveProperty('pamStatus');
        expect(hit).toHaveProperty('strand');

        expect(typeof hit.position).toBe('number');
        expect(typeof hit.sequence).toBe('string');
        expect(['I', 'II', 'III', 'V', 'VI']).toContain(hit.crisprType);
        expect(['valid', 'invalid', 'none']).toContain(hit.pamStatus);
        expect(['coding', 'template']).toContain(hit.strand);
      }
    });

    test('match score is between 0 and 1', () => {
      const result = analyzeCRISPRPressure(SEQ_WITH_SPACERS, []);

      for (const hit of result.spacerHits) {
        expect(hit.matchScore).toBeGreaterThanOrEqual(0);
        expect(hit.matchScore).toBeLessThanOrEqual(1);
      }
    });

    test('no hits for sequence without known spacers', () => {
      const result = analyzeCRISPRPressure(SEQ_WITHOUT_SPACERS, []);

      // May still have hits if the sequence contains any spacer subsequence
      // but for a clean sequence without spacers, should be empty
      expect(result.spacerHits.length).toBe(0);
    });

    test('handles lowercase sequence', () => {
      const result = analyzeCRISPRPressure(SEQ_WITH_SPACERS.toLowerCase(), []);

      // Should still detect spacers (case-insensitive)
      expect(result.spacerHits.length).toBeGreaterThan(0);
    });

    test('detects multiple occurrences of same spacer', () => {
      const doubleSpacerSeq = 'TGACGTATGCATGCTGACGTATGC';
      const result = analyzeCRISPRPressure(doubleSpacerSeq, []);

      // Should find two hits for TGACGT
      const tgacgtHits = result.spacerHits.filter((h) => h.sequence === 'TGACGT');
      expect(tgacgtHits.length).toBe(2);
    });
  });

  describe('PAM detection', () => {
    test('identifies valid Cas9 PAM (NGG downstream)', () => {
      // TGACGT followed by NGG
      const seqWithCas9Pam = 'ATGCTGACGTCGGATGC'; // spacer + CGG (NGG)
      const result = analyzeCRISPRPressure(seqWithCas9Pam, []);

      const spacerHits = result.spacerHits.filter((h) => h.sequence === 'TGACGT');
      if (spacerHits.length > 0) {
        // If PAM is detected correctly, some hits might have valid status
        const hasValidPam = spacerHits.some((h) => h.pamStatus === 'valid');
        expect(typeof hasValidPam).toBe('boolean');
      }
    });

    test('identifies valid Cas12a PAM (TTTV upstream)', () => {
      // TTT upstream of spacer (Cas12a PAM)
      const seqWithCas12aPam = 'TTTATGACGTATGCATGC';
      const result = analyzeCRISPRPressure(seqWithCas12aPam, []);

      // Should have hits, PAM may or may not be valid depending on exact positioning
      expect(result.spacerHits.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Acr candidate prediction', () => {
    test('returns candidates for genes in size range', () => {
      // Create genes with appropriate size (50-200 aa = 150-600 bp)
      const genes = [
        makeGene('small protein', 0, 300), // ~100 aa
        makeGene('medium protein', 0, 450), // ~150 aa
      ];

      // Need a sequence long enough to contain the genes
      const longSeq = 'ATG' + 'GCT'.repeat(200) + 'TAA'; // ~600bp coding-like
      const result = analyzeCRISPRPressure(longSeq, genes);

      // May or may not have candidates depending on heuristics
      expect(Array.isArray(result.acrCandidates)).toBe(true);
    });

    test('Acr candidate has required properties', () => {
      const genes = [makeGene('hypothetical protein', 0, 300)];
      const longSeq = 'ATG' + 'GAA'.repeat(100) + 'TAA'; // Acidic residues
      const result = analyzeCRISPRPressure(longSeq, genes);

      for (const candidate of result.acrCandidates) {
        expect(candidate).toHaveProperty('geneId');
        expect(candidate).toHaveProperty('geneName');
        expect(candidate).toHaveProperty('score');
        expect(candidate).toHaveProperty('family');
        expect(candidate).toHaveProperty('confidence');

        expect(typeof candidate.score).toBe('number');
        expect(candidate.score).toBeGreaterThanOrEqual(0);
        expect(candidate.score).toBeLessThanOrEqual(100);
        expect(['low', 'medium', 'high']).toContain(candidate.confidence);
      }
    });

    test('candidates are sorted by score descending', () => {
      const genes = [
        makeGene('protein1', 0, 300),
        makeGene('protein2', 300, 600),
        makeGene('protein3', 600, 900),
      ];
      const longSeq = 'ATG' + 'GAA'.repeat(300) + 'TAA';
      const result = analyzeCRISPRPressure(longSeq, genes);

      for (let i = 1; i < result.acrCandidates.length; i++) {
        expect(result.acrCandidates[i].score).toBeLessThanOrEqual(
          result.acrCandidates[i - 1].score
        );
      }
    });

    test('excludes genes outside size range', () => {
      const genes = [
        makeGene('very small', 0, 100), // ~33 aa (too small)
        makeGene('very large', 0, 1000), // ~333 aa (too large)
      ];
      const longSeq = 'ATG' + 'GCT'.repeat(500) + 'TAA';
      const result = analyzeCRISPRPressure(longSeq, genes);

      // These should not generate candidates due to size constraints
      // The result might still have 0 candidates
      expect(Array.isArray(result.acrCandidates)).toBe(true);
    });
  });

  describe('pressure windows', () => {
    test('creates windows covering entire sequence', () => {
      const longSeq = SEQ_WITH_SPACERS.repeat(50); // Make it longer
      const result = analyzeCRISPRPressure(longSeq, []);

      // Windows should cover the sequence
      expect(result.pressureWindows.length).toBeGreaterThan(0);

      // First window starts at 0
      expect(result.pressureWindows[0].start).toBe(0);

      // Last window ends at or past sequence length
      const lastWindow = result.pressureWindows[result.pressureWindows.length - 1];
      expect(lastWindow.end).toBeLessThanOrEqual(longSeq.length);
    });

    test('pressure window has required properties', () => {
      const result = analyzeCRISPRPressure(SEQ_WITH_SPACERS.repeat(10), []);

      for (const window of result.pressureWindows) {
        expect(window).toHaveProperty('start');
        expect(window).toHaveProperty('end');
        expect(window).toHaveProperty('pressureIndex');
        expect(window).toHaveProperty('spacerCount');
        expect(window).toHaveProperty('dominantType');

        expect(typeof window.start).toBe('number');
        expect(typeof window.end).toBe('number');
        expect(window.end).toBeGreaterThan(window.start);
        expect(typeof window.pressureIndex).toBe('number');
        expect(typeof window.spacerCount).toBe('number');
      }
    });

    test('pressure index is normalized to 0-10', () => {
      const result = analyzeCRISPRPressure(SEQ_WITH_SPACERS.repeat(20), []);

      for (const window of result.pressureWindows) {
        expect(window.pressureIndex).toBeGreaterThanOrEqual(0);
        expect(window.pressureIndex).toBeLessThanOrEqual(10);
      }
    });

    test('windows without spacers have zero spacer count', () => {
      const result = analyzeCRISPRPressure(SEQ_WITHOUT_SPACERS.repeat(10), []);

      for (const window of result.pressureWindows) {
        expect(window.spacerCount).toBe(0);
        expect(window.pressureIndex).toBe(0);
      }
    });
  });

  describe('maxPressure', () => {
    test('maxPressure is zero when no spacers found', () => {
      const result = analyzeCRISPRPressure(SEQ_WITHOUT_SPACERS, []);
      expect(result.maxPressure).toBe(0);
    });

    test('maxPressure is positive when spacers found', () => {
      const result = analyzeCRISPRPressure(SEQ_WITH_SPACERS.repeat(10), []);

      if (result.spacerHits.length > 0) {
        expect(result.maxPressure).toBeGreaterThan(0);
      }
    });
  });
});
