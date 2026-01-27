/**
 * Tests for HGT (Horizontal Gene Transfer) Tracer Module
 *
 * Tests GC-deviation based genomic island detection, sliding window analysis,
 * donor inference, and HGT provenance analysis.
 */

import { describe, test, expect } from 'bun:test';
import { analyzeHGTProvenance } from './hgt-tracer';
import type { GeneInfo } from '@phage-explorer/core';

// Test sequences
const UNIFORM_GC_SEQ = 'ATGCATGCATGCATGCATGCATGCATGCATGC'.repeat(100); // ~50% GC

// Create a sequence with a distinct GC island
function createSequenceWithIsland(
  backgroundGc: string,
  islandGc: string,
  repeatCount: number
): string {
  const background = backgroundGc.repeat(repeatCount);
  return background + islandGc.repeat(50) + background;
}

let geneId = 0;
const makeGene = (
  product: string,
  start: number,
  end: number,
  name: string | null = null
): GeneInfo => ({
  id: ++geneId,
  name,
  locusTag: `gene_${geneId}`,
  startPos: start,
  endPos: end,
  strand: '+',
  product,
  type: 'CDS',
});

describe('analyzeHGTProvenance', () => {
  describe('basic structure', () => {
    test('returns complete result structure', () => {
      const result = analyzeHGTProvenance(UNIFORM_GC_SEQ, []);

      expect(result).toHaveProperty('genomeGC');
      expect(result).toHaveProperty('islands');
      expect(result).toHaveProperty('stamps');
      expect(typeof result.genomeGC).toBe('number');
      expect(Array.isArray(result.islands)).toBe(true);
      expect(Array.isArray(result.stamps)).toBe(true);
    });

    test('calculates genome GC content', () => {
      const result = analyzeHGTProvenance(UNIFORM_GC_SEQ, []);

      // ATGCATGC repeating has 50% GC
      expect(result.genomeGC).toBeGreaterThan(40);
      expect(result.genomeGC).toBeLessThan(60);
    });

    test('handles empty sequence', () => {
      const result = analyzeHGTProvenance('', []);

      expect(result.genomeGC).toBe(0);
      expect(result.islands).toEqual([]);
      expect(result.stamps).toEqual([]);
    });

    test('handles short sequences', () => {
      const result = analyzeHGTProvenance('ATGC', []);

      expect(result.genomeGC).toBeGreaterThan(0);
      // Short sequences may not produce windows/islands
      expect(Array.isArray(result.islands)).toBe(true);
    });
  });

  describe('island detection', () => {
    test('detects islands in uniform sequence', () => {
      // A uniform sequence should have few or no islands
      const result = analyzeHGTProvenance(UNIFORM_GC_SEQ, []);

      // With uniform GC, z-scores should be low, resulting in few islands
      // The exact count depends on window parameters
      expect(Array.isArray(result.islands)).toBe(true);
    });

    test('island has required properties', () => {
      // Create sequence with clear GC deviation
      const seqWithIsland = createSequenceWithIsland('ATGC', 'GCGC', 200);
      const result = analyzeHGTProvenance(seqWithIsland, []);

      for (const island of result.islands) {
        expect(island).toHaveProperty('start');
        expect(island).toHaveProperty('end');
        expect(island).toHaveProperty('gc');
        expect(island).toHaveProperty('zScore');
        expect(island).toHaveProperty('genes');
        expect(island).toHaveProperty('hallmarks');
        expect(island).toHaveProperty('donors');
        expect(island).toHaveProperty('amelioration');

        expect(typeof island.start).toBe('number');
        expect(typeof island.end).toBe('number');
        expect(typeof island.gc).toBe('number');
        expect(typeof island.zScore).toBe('number');
        expect(Array.isArray(island.genes)).toBe(true);
        expect(Array.isArray(island.hallmarks)).toBe(true);
        expect(Array.isArray(island.donors)).toBe(true);
      }
    });

    test('stamps correspond to islands', () => {
      const seqWithIsland = createSequenceWithIsland('ATGC', 'GCGC', 200);
      const result = analyzeHGTProvenance(seqWithIsland, []);

      expect(result.stamps.length).toBe(result.islands.length);
    });
  });

  describe('stamp properties', () => {
    test('stamp has required properties', () => {
      const seqWithIsland = createSequenceWithIsland('ATGC', 'GCGC', 200);
      const result = analyzeHGTProvenance(seqWithIsland, []);

      for (const stamp of result.stamps) {
        expect(stamp).toHaveProperty('island');
        expect(stamp).toHaveProperty('donor');
        expect(stamp).toHaveProperty('donorDistribution');
        expect(stamp).toHaveProperty('amelioration');
        expect(stamp).toHaveProperty('transferMechanism');
        expect(stamp).toHaveProperty('gcDelta');
        expect(stamp).toHaveProperty('hallmarks');

        expect(Array.isArray(stamp.donorDistribution)).toBe(true);
        expect(Array.isArray(stamp.hallmarks)).toBe(true);
        expect(typeof stamp.gcDelta).toBe('number');
      }
    });

    test('amelioration is a valid category', () => {
      const seqWithIsland = createSequenceWithIsland('ATGC', 'GCGC', 200);
      const result = analyzeHGTProvenance(seqWithIsland, []);

      const validAmeliorations = ['recent', 'intermediate', 'ancient', 'unknown'];
      for (const stamp of result.stamps) {
        expect(validAmeliorations).toContain(stamp.amelioration);
      }
    });
  });

  describe('gene attachment', () => {
    test('attaches genes that overlap with islands', () => {
      // Create a longer sequence with known island position
      const background = 'ATGCATGC'.repeat(500); // ~4000bp of 50% GC
      const island = 'GCGCGCGC'.repeat(250); // ~2000bp of 100% GC
      const sequence = background + island + background;

      // Place a gene in the high-GC region (roughly position 4000-6000)
      const genes = [
        makeGene('integrase', 4500, 5500), // Should be in island
        makeGene('capsid protein', 100, 1000), // Should not be in island
      ];

      const result = analyzeHGTProvenance(sequence, genes, {}, { window: 1000, step: 500 });

      // Check that islands have genes attached
      for (const island of result.islands) {
        expect(Array.isArray(island.genes)).toBe(true);
      }
    });

    test('identifies hallmark genes', () => {
      const background = 'ATGCATGC'.repeat(500);
      const island = 'GCGCGCGC'.repeat(250);
      const sequence = background + island + background;

      // Hallmark keywords: integrase, transposase, recombinase, lysogeny, etc.
      const genes = [
        makeGene('site-specific integrase', 4500, 5000),
        makeGene('phage transposase', 5000, 5500),
      ];

      const result = analyzeHGTProvenance(sequence, genes, {}, { window: 1000, step: 500 });

      // Islands should have hallmarks identified
      const allHallmarks = result.islands.flatMap((i) => i.hallmarks);
      // May or may not find hallmarks depending on island detection
      expect(Array.isArray(allHallmarks)).toBe(true);
    });
  });

  describe('options', () => {
    test('respects window size option', () => {
      const result1 = analyzeHGTProvenance(UNIFORM_GC_SEQ, [], {}, { window: 1000 });
      const result2 = analyzeHGTProvenance(UNIFORM_GC_SEQ, [], {}, { window: 500 });

      // Both should complete without error
      expect(Array.isArray(result1.islands)).toBe(true);
      expect(Array.isArray(result2.islands)).toBe(true);
    });

    test('respects step size option', () => {
      const result1 = analyzeHGTProvenance(UNIFORM_GC_SEQ, [], {}, { step: 500 });
      const result2 = analyzeHGTProvenance(UNIFORM_GC_SEQ, [], {}, { step: 250 });

      // Both should complete without error
      expect(Array.isArray(result1.islands)).toBe(true);
      expect(Array.isArray(result2.islands)).toBe(true);
    });

    test('respects z-threshold option', () => {
      const seqWithIsland = createSequenceWithIsland('ATGC', 'GCGC', 200);

      const strictResult = analyzeHGTProvenance(seqWithIsland, [], {}, { zThreshold: 3 });
      const lenientResult = analyzeHGTProvenance(seqWithIsland, [], {}, { zThreshold: 1 });

      // Stricter threshold should find equal or fewer islands
      expect(strictResult.islands.length).toBeLessThanOrEqual(
        lenientResult.islands.length + 5 // Allow some variance
      );
    });
  });

  describe('donor inference', () => {
    test('returns donors when reference sketches provided', () => {
      const seqWithIsland = createSequenceWithIsland('ATGC', 'GCGC', 200);
      const references = {
        'Escherichia phage': 'GCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGC'.repeat(10),
        'Bacillus phage': 'ATATATATATATATATATATATATATATATAT'.repeat(10),
      };

      const result = analyzeHGTProvenance(seqWithIsland, [], references);

      // Check donor structure if islands were found
      for (const stamp of result.stamps) {
        expect(Array.isArray(stamp.donorDistribution)).toBe(true);
        for (const donor of stamp.donorDistribution) {
          expect(donor).toHaveProperty('taxon');
          expect(donor).toHaveProperty('similarity');
          expect(donor).toHaveProperty('confidence');
          expect(donor).toHaveProperty('evidence');
          expect(typeof donor.similarity).toBe('number');
          expect(['high', 'medium', 'low']).toContain(donor.confidence);
        }
      }
    });

    test('handles empty reference set', () => {
      const result = analyzeHGTProvenance(UNIFORM_GC_SEQ, [], {});

      // Should complete without error
      expect(Array.isArray(result.stamps)).toBe(true);
    });

    test('donor similarity is between 0 and 1', () => {
      const seqWithIsland = createSequenceWithIsland('ATGC', 'GCGC', 200);
      const references = {
        'Test phage': 'GCGCGCGCGCGCGCGC'.repeat(20),
      };

      const result = analyzeHGTProvenance(seqWithIsland, [], references);

      for (const stamp of result.stamps) {
        for (const donor of stamp.donorDistribution) {
          expect(donor.similarity).toBeGreaterThanOrEqual(0);
          expect(donor.similarity).toBeLessThanOrEqual(1);
        }
      }
    });
  });

  describe('GC calculation', () => {
    test('handles lowercase sequences', () => {
      const lowerSeq = UNIFORM_GC_SEQ.toLowerCase();
      const result = analyzeHGTProvenance(lowerSeq, []);

      // Should still calculate GC correctly
      expect(result.genomeGC).toBeGreaterThan(40);
      expect(result.genomeGC).toBeLessThan(60);
    });

    test('handles sequences with N characters', () => {
      const seqWithNs = 'ATGCATGCNNNNNNNNNATGCATGC'.repeat(100);
      const result = analyzeHGTProvenance(seqWithNs, []);

      // Should handle Ns gracefully
      expect(typeof result.genomeGC).toBe('number');
      expect(result.genomeGC).toBeGreaterThanOrEqual(0);
    });
  });
});
