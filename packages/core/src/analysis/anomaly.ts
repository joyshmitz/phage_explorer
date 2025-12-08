/**
 * Information-Theoretic Sequence Anomaly Scanner
 *
 * Detects anomalous regions using:
 * 1. Kullback-Leibler (KL) Divergence of k-mer distributions vs global background.
 * 2. Compression Ratio (Lempel-Ziv / Deflate approximation) to find low-complexity or repetitive regions.
 */

import { deflate } from 'pako';

export interface AnomalyResult {
  position: number;
  klDivergence: number;
  compressionRatio: number;
  isAnomalous: boolean;
  anomalyType?: 'HGT' | 'Repetitive' | 'Regulatory' | 'Unknown';
}

export interface AnomalyScanResult {
  windows: AnomalyResult[];
  globalKmerFreq: Map<string, number>;
  thresholds: {
    kl: number;
    compression: number;
  };
}

/**
 * Calculate k-mer frequencies for a sequence
 */
function getKmerFrequencies(sequence: string, k: number): Map<string, number> {
  const freq = new Map<string, number>();
  const total = sequence.length - k + 1;
  if (total <= 0) return freq;

  for (let i = 0; i < total; i++) {
    const kmer = sequence.slice(i, i + k);
    freq.set(kmer, (freq.get(kmer) || 0) + 1);
  }

  // Normalize
  for (const [kmer, count] of freq) {
    freq.set(kmer, count / total);
  }

  return freq;
}

/**
 * Calculate KL Divergence between two distributions (P || Q)
 * D_KL(P || Q) = sum(P(i) * log2(P(i) / Q(i)))
 */
function calculateKLDivergence(p: Map<string, number>, q: Map<string, number>): number {
  let dkl = 0;
  const epsilon = 1e-6; // Smoothing for missing k-mers

  for (const [kmer, pVal] of p) {
    const qVal = q.get(kmer) || epsilon;
    if (pVal > 0) {
      dkl += pVal * Math.log2(pVal / qVal);
    }
  }

  return Math.max(0, dkl);
}

/**
 * Calculate compression ratio (Original Size / Compressed Size)
 * Higher ratio = Lower complexity (more compressible)
 */
function calculateCompressionRatio(sequence: string): number {
  if (sequence.length === 0) return 1;
  try {
    const compressed = deflate(sequence);
    return sequence.length / compressed.length;
  } catch (e) {
    return 1;
  }
}

/**
 * Scan sequence for anomalies
 */
export function scanForAnomalies(
  sequence: string,
  windowSize = 500,
  stepSize = 100,
  k = 4
): AnomalyScanResult {
  const seq = sequence.toUpperCase().replace(/[^ACGT]/g, '');
  
  // 1. Compute global background model
  const globalFreq = getKmerFrequencies(seq, k);

  const windows: AnomalyResult[] = [];
  let sumKL = 0;
  let sumComp = 0;

  // 2. Sliding window scan
  for (let i = 0; i <= seq.length - windowSize; i += stepSize) {
    const windowSeq = seq.slice(i, i + windowSize);
    
    // KL Divergence
    const windowFreq = getKmerFrequencies(windowSeq, k);
    const kl = calculateKLDivergence(windowFreq, globalFreq);
    
    // Compression Ratio
    const comp = calculateCompressionRatio(windowSeq);

    sumKL += kl;
    sumComp += comp;

    windows.push({
      position: i,
      klDivergence: kl,
      compressionRatio: comp,
      isAnomalous: false, // Set later based on thresholds
    });
  }

  // 3. Determine thresholds (e.g., Mean + 2*SD)
  const n = windows.length;
  const meanKL = sumKL / n;
  const meanComp = sumComp / n;
  
  let varKL = 0;
  let varComp = 0;
  
  for (const w of windows) {
    varKL += Math.pow(w.klDivergence - meanKL, 2);
    varComp += Math.pow(w.compressionRatio - meanComp, 2);
  }
  
  const sdKL = Math.sqrt(varKL / n);
  const sdComp = Math.sqrt(varComp / n);

  const thresholdKL = meanKL + 2 * sdKL;
  const thresholdComp = meanComp + 2 * sdComp; // Very compressible = high ratio

  // 4. Classify anomalies
  for (const w of windows) {
    if (w.klDivergence > thresholdKL && w.compressionRatio < thresholdComp) {
      // High KL but normal/low compression -> Unusual composition (HGT?)
      w.isAnomalous = true;
      w.anomalyType = 'HGT';
    } else if (w.compressionRatio > thresholdComp) {
      // Highly compressible -> Repetitive
      w.isAnomalous = true;
      w.anomalyType = 'Repetitive';
    } else if (w.klDivergence > thresholdKL) {
        // High KL -> Generic anomaly
        w.isAnomalous = true;
        w.anomalyType = 'Unknown';
    }
  }

  return {
    windows,
    globalKmerFreq: globalFreq,
    thresholds: {
      kl: thresholdKL,
      compression: thresholdComp,
    },
  };
}
