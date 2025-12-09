/**
 * Comprehensive Amino Acid Database
 *
 * Scientific reference data for all 20 standard amino acids.
 * Used for educational HUD display and detailed amino acid information.
 */

import type { AminoAcid, AminoAcidProperty } from '../types';
import { CODON_TABLE } from '../codons';

/**
 * Detailed amino acid information for educational display
 */
export interface AminoAcidDetailedInfo {
  /** Single letter code (e.g., 'M') */
  code1: string;
  /** Three letter code (e.g., 'Met') */
  code3: string;
  /** Full name (e.g., 'Methionine') */
  name: string;
  /** Molecular formula with subscripts */
  formula: string;
  /** Molecular weight in g/mol */
  molecularWeight: number;
  /** Isoelectric point */
  pI: number;
  /** Chemical classification */
  classification: AminoAcidProperty;
  /** Charge at physiological pH (7.4) */
  chargeAtPh7: 'neutral' | 'positive' | 'negative';
  /** Contains aromatic ring */
  isAromatic: boolean;
  /** Contains sulfur atom */
  containsSulfur: boolean;
  /** Essential for humans (must be obtained from diet) */
  isEssential: boolean;
  /** Approximate ATP equivalents needed for biosynthesis */
  synthesisAtp: number;
  /** DNA codons that encode this amino acid */
  codons: string[];
  /** Special notes (e.g., start codon) */
  specialNotes?: string;
  /** Hydropathy index (Kyte-Doolittle scale) */
  hydropathyIndex: number;
  /** Side chain description */
  sideChain: string;
}

/**
 * Complete database of all 20 standard amino acids
 *
 * Data sources:
 * - Molecular weights: IUPAC standard atomic weights
 * - pI values: Experimentally determined isoelectric points
 * - ATP costs: Estimated biosynthesis costs from E. coli metabolism
 * - Hydropathy: Kyte-Doolittle hydropathy scale (1982)
 */
export const AMINO_ACID_DATABASE: Record<string, AminoAcidDetailedInfo> = {
  A: {
    code1: 'A',
    code3: 'Ala',
    name: 'Alanine',
    formula: 'C₃H₇NO₂',
    molecularWeight: 89.09,
    pI: 6.00,
    classification: 'hydrophobic',
    chargeAtPh7: 'neutral',
    isAromatic: false,
    containsSulfur: false,
    isEssential: false,
    synthesisAtp: 11,
    codons: ['GCT', 'GCC', 'GCA', 'GCG'],
    hydropathyIndex: 1.8,
    sideChain: 'Methyl group (-CH₃)',
  },
  R: {
    code1: 'R',
    code3: 'Arg',
    name: 'Arginine',
    formula: 'C₆H₁₄N₄O₂',
    molecularWeight: 174.20,
    pI: 10.76,
    classification: 'basic',
    chargeAtPh7: 'positive',
    isAromatic: false,
    containsSulfur: false,
    isEssential: false, // Conditionally essential
    synthesisAtp: 27,
    codons: ['CGT', 'CGC', 'CGA', 'CGG', 'AGA', 'AGG'],
    hydropathyIndex: -4.5,
    sideChain: 'Guanidinium group',
    specialNotes: 'Most basic amino acid; conditionally essential',
  },
  N: {
    code1: 'N',
    code3: 'Asn',
    name: 'Asparagine',
    formula: 'C₄H₈N₂O₃',
    molecularWeight: 132.12,
    pI: 5.41,
    classification: 'polar',
    chargeAtPh7: 'neutral',
    isAromatic: false,
    containsSulfur: false,
    isEssential: false,
    synthesisAtp: 14,
    codons: ['AAT', 'AAC'],
    hydropathyIndex: -3.5,
    sideChain: 'Carboxamide group',
  },
  D: {
    code1: 'D',
    code3: 'Asp',
    name: 'Aspartic acid',
    formula: 'C₄H₇NO₄',
    molecularWeight: 133.10,
    pI: 2.77,
    classification: 'acidic',
    chargeAtPh7: 'negative',
    isAromatic: false,
    containsSulfur: false,
    isEssential: false,
    synthesisAtp: 12,
    codons: ['GAT', 'GAC'],
    hydropathyIndex: -3.5,
    sideChain: 'Carboxylic acid',
    specialNotes: 'Key in enzyme catalysis',
  },
  C: {
    code1: 'C',
    code3: 'Cys',
    name: 'Cysteine',
    formula: 'C₃H₇NO₂S',
    molecularWeight: 121.16,
    pI: 5.07,
    classification: 'special',
    chargeAtPh7: 'neutral',
    isAromatic: false,
    containsSulfur: true,
    isEssential: false, // Conditionally essential
    synthesisAtp: 24,
    codons: ['TGT', 'TGC'],
    hydropathyIndex: 2.5,
    sideChain: 'Thiol group (-SH)',
    specialNotes: 'Forms disulfide bonds; conditionally essential',
  },
  E: {
    code1: 'E',
    code3: 'Glu',
    name: 'Glutamic acid',
    formula: 'C₅H₉NO₄',
    molecularWeight: 147.13,
    pI: 3.22,
    classification: 'acidic',
    chargeAtPh7: 'negative',
    isAromatic: false,
    containsSulfur: false,
    isEssential: false,
    synthesisAtp: 15,
    codons: ['GAA', 'GAG'],
    hydropathyIndex: -3.5,
    sideChain: 'Carboxylic acid (longer)',
    specialNotes: 'Major excitatory neurotransmitter precursor',
  },
  Q: {
    code1: 'Q',
    code3: 'Gln',
    name: 'Glutamine',
    formula: 'C₅H₁₀N₂O₃',
    molecularWeight: 146.15,
    pI: 5.65,
    classification: 'polar',
    chargeAtPh7: 'neutral',
    isAromatic: false,
    containsSulfur: false,
    isEssential: false, // Conditionally essential
    synthesisAtp: 16,
    codons: ['CAA', 'CAG'],
    hydropathyIndex: -3.5,
    sideChain: 'Carboxamide (longer)',
    specialNotes: 'Most abundant amino acid in blood; conditionally essential',
  },
  G: {
    code1: 'G',
    code3: 'Gly',
    name: 'Glycine',
    formula: 'C₂H₅NO₂',
    molecularWeight: 75.07,
    pI: 5.97,
    classification: 'special',
    chargeAtPh7: 'neutral',
    isAromatic: false,
    containsSulfur: false,
    isEssential: false,
    synthesisAtp: 11,
    codons: ['GGT', 'GGC', 'GGA', 'GGG'],
    hydropathyIndex: -0.4,
    sideChain: 'Hydrogen atom only',
    specialNotes: 'Smallest amino acid; high conformational flexibility',
  },
  H: {
    code1: 'H',
    code3: 'His',
    name: 'Histidine',
    formula: 'C₆H₉N₃O₂',
    molecularWeight: 155.16,
    pI: 7.59,
    classification: 'basic',
    chargeAtPh7: 'neutral', // pKa near physiological pH
    isAromatic: true,
    containsSulfur: false,
    isEssential: true,
    synthesisAtp: 38,
    codons: ['CAT', 'CAC'],
    hydropathyIndex: -3.2,
    sideChain: 'Imidazole ring',
    specialNotes: 'Only amino acid with pKa near physiological pH',
  },
  I: {
    code1: 'I',
    code3: 'Ile',
    name: 'Isoleucine',
    formula: 'C₆H₁₃NO₂',
    molecularWeight: 131.18,
    pI: 6.02,
    classification: 'hydrophobic',
    chargeAtPh7: 'neutral',
    isAromatic: false,
    containsSulfur: false,
    isEssential: true,
    synthesisAtp: 32,
    codons: ['ATT', 'ATC', 'ATA'],
    hydropathyIndex: 4.5,
    sideChain: 'Branched aliphatic',
    specialNotes: 'Branched-chain amino acid (BCAA)',
  },
  L: {
    code1: 'L',
    code3: 'Leu',
    name: 'Leucine',
    formula: 'C₆H₁₃NO₂',
    molecularWeight: 131.18,
    pI: 5.98,
    classification: 'hydrophobic',
    chargeAtPh7: 'neutral',
    isAromatic: false,
    containsSulfur: false,
    isEssential: true,
    synthesisAtp: 27,
    codons: ['TTA', 'TTG', 'CTT', 'CTC', 'CTA', 'CTG'],
    hydropathyIndex: 3.8,
    sideChain: 'Branched aliphatic',
    specialNotes: 'Most abundant amino acid in proteins; BCAA',
  },
  K: {
    code1: 'K',
    code3: 'Lys',
    name: 'Lysine',
    formula: 'C₆H₁₄N₂O₂',
    molecularWeight: 146.19,
    pI: 9.74,
    classification: 'basic',
    chargeAtPh7: 'positive',
    isAromatic: false,
    containsSulfur: false,
    isEssential: true,
    synthesisAtp: 30,
    codons: ['AAA', 'AAG'],
    hydropathyIndex: -3.9,
    sideChain: 'Amino group',
    specialNotes: 'Important for protein cross-linking',
  },
  M: {
    code1: 'M',
    code3: 'Met',
    name: 'Methionine',
    formula: 'C₅H₁₁NO₂S',
    molecularWeight: 149.21,
    pI: 5.74,
    classification: 'hydrophobic',
    chargeAtPh7: 'neutral',
    isAromatic: false,
    containsSulfur: true,
    isEssential: true,
    synthesisAtp: 31,
    codons: ['ATG'],
    hydropathyIndex: 1.9,
    sideChain: 'Thioether group',
    specialNotes: 'Universal START codon; initiates protein synthesis',
  },
  F: {
    code1: 'F',
    code3: 'Phe',
    name: 'Phenylalanine',
    formula: 'C₉H₁₁NO₂',
    molecularWeight: 165.19,
    pI: 5.48,
    classification: 'hydrophobic',
    chargeAtPh7: 'neutral',
    isAromatic: true,
    containsSulfur: false,
    isEssential: true,
    synthesisAtp: 52,
    codons: ['TTT', 'TTC'],
    hydropathyIndex: 2.8,
    sideChain: 'Benzyl group',
    specialNotes: 'Precursor to tyrosine; restricted in PKU',
  },
  P: {
    code1: 'P',
    code3: 'Pro',
    name: 'Proline',
    formula: 'C₅H₉NO₂',
    molecularWeight: 115.13,
    pI: 6.30,
    classification: 'special',
    chargeAtPh7: 'neutral',
    isAromatic: false,
    containsSulfur: false,
    isEssential: false,
    synthesisAtp: 14,
    codons: ['CCT', 'CCC', 'CCA', 'CCG'],
    hydropathyIndex: -1.6,
    sideChain: 'Cyclic pyrrolidine',
    specialNotes: 'Only cyclic amino acid; disrupts secondary structure',
  },
  S: {
    code1: 'S',
    code3: 'Ser',
    name: 'Serine',
    formula: 'C₃H₇NO₃',
    molecularWeight: 105.09,
    pI: 5.68,
    classification: 'polar',
    chargeAtPh7: 'neutral',
    isAromatic: false,
    containsSulfur: false,
    isEssential: false,
    synthesisAtp: 11,
    codons: ['TCT', 'TCC', 'TCA', 'TCG', 'AGT', 'AGC'],
    hydropathyIndex: -0.8,
    sideChain: 'Hydroxyl group',
    specialNotes: 'Common phosphorylation site',
  },
  T: {
    code1: 'T',
    code3: 'Thr',
    name: 'Threonine',
    formula: 'C₄H₉NO₃',
    molecularWeight: 119.12,
    pI: 5.60,
    classification: 'polar',
    chargeAtPh7: 'neutral',
    isAromatic: false,
    containsSulfur: false,
    isEssential: true,
    synthesisAtp: 18,
    codons: ['ACT', 'ACC', 'ACA', 'ACG'],
    hydropathyIndex: -0.7,
    sideChain: 'Hydroxyl group (branched)',
    specialNotes: 'Common phosphorylation and glycosylation site',
  },
  W: {
    code1: 'W',
    code3: 'Trp',
    name: 'Tryptophan',
    formula: 'C₁₁H₁₂N₂O₂',
    molecularWeight: 204.23,
    pI: 5.89,
    classification: 'hydrophobic',
    chargeAtPh7: 'neutral',
    isAromatic: true,
    containsSulfur: false,
    isEssential: true,
    synthesisAtp: 74,
    codons: ['TGG'],
    hydropathyIndex: -0.9,
    sideChain: 'Indole ring',
    specialNotes: 'Largest amino acid; precursor to serotonin',
  },
  Y: {
    code1: 'Y',
    code3: 'Tyr',
    name: 'Tyrosine',
    formula: 'C₉H₁₁NO₃',
    molecularWeight: 181.19,
    pI: 5.66,
    classification: 'polar', // Amphipathic
    chargeAtPh7: 'neutral',
    isAromatic: true,
    containsSulfur: false,
    isEssential: false, // Conditionally essential
    synthesisAtp: 50,
    codons: ['TAT', 'TAC'],
    hydropathyIndex: -1.3,
    sideChain: 'Phenol group',
    specialNotes: 'Common phosphorylation site; conditionally essential',
  },
  V: {
    code1: 'V',
    code3: 'Val',
    name: 'Valine',
    formula: 'C₅H₁₁NO₂',
    molecularWeight: 117.15,
    pI: 5.96,
    classification: 'hydrophobic',
    chargeAtPh7: 'neutral',
    isAromatic: false,
    containsSulfur: false,
    isEssential: true,
    synthesisAtp: 23,
    codons: ['GTT', 'GTC', 'GTA', 'GTG'],
    hydropathyIndex: 4.2,
    sideChain: 'Branched aliphatic',
    specialNotes: 'Branched-chain amino acid (BCAA)',
  },
  '*': {
    code1: '*',
    code3: 'Stop',
    name: 'Stop codon',
    formula: 'N/A',
    molecularWeight: 0,
    pI: 0,
    classification: 'stop',
    chargeAtPh7: 'neutral',
    isAromatic: false,
    containsSulfur: false,
    isEssential: false,
    synthesisAtp: 0,
    codons: ['TAA', 'TAG', 'TGA'],
    hydropathyIndex: 0,
    sideChain: 'N/A',
    specialNotes: 'Terminates protein synthesis (UAA=ochre, UAG=amber, UGA=opal)',
  },
  X: {
    code1: 'X',
    code3: 'Xaa',
    name: 'Unknown',
    formula: 'Unknown',
    molecularWeight: 0,
    pI: 0,
    classification: 'special',
    chargeAtPh7: 'neutral',
    isAromatic: false,
    containsSulfur: false,
    isEssential: false,
    synthesisAtp: 0,
    codons: [],
    hydropathyIndex: 0,
    sideChain: 'Unknown',
    specialNotes: 'Represents an unknown or ambiguous amino acid',
  },
};

/**
 * Get detailed amino acid information by single letter code
 */
export function getAminoAcidInfo(code: string): AminoAcidDetailedInfo | null {
  const upperCode = code.toUpperCase();
  return AMINO_ACID_DATABASE[upperCode] ?? null;
}

/**
 * Get amino acids by classification
 */
export function getAminoAcidsByClassification(
  classification: AminoAcidProperty
): AminoAcidDetailedInfo[] {
  return Object.values(AMINO_ACID_DATABASE).filter(
    (aa) => aa.classification === classification
  );
}

/**
 * Get all essential amino acids
 */
export function getEssentialAminoAcids(): AminoAcidDetailedInfo[] {
  return Object.values(AMINO_ACID_DATABASE).filter((aa) => aa.isEssential);
}

/**
 * Get all aromatic amino acids
 */
export function getAromaticAminoAcids(): AminoAcidDetailedInfo[] {
  return Object.values(AMINO_ACID_DATABASE).filter((aa) => aa.isAromatic);
}

/**
 * Get all sulfur-containing amino acids
 */
export function getSulfurAminoAcids(): AminoAcidDetailedInfo[] {
  return Object.values(AMINO_ACID_DATABASE).filter((aa) => aa.containsSulfur);
}

/**
 * Get classification display name
 */
export function getClassificationLabel(classification: AminoAcidProperty): string {
  const labels: Record<AminoAcidProperty, string> = {
    hydrophobic: 'Hydrophobic (nonpolar)',
    polar: 'Polar (uncharged)',
    acidic: 'Acidic (negative)',
    basic: 'Basic (positive)',
    special: 'Special structure',
    stop: 'Stop codon',
  };
  return labels[classification];
}

/**
 * Get classification color for UI
 */
export function getClassificationColor(classification: AminoAcidProperty): string {
  const colors: Record<AminoAcidProperty, string> = {
    hydrophobic: '#facc15', // Yellow
    polar: '#22c55e',       // Green
    acidic: '#ef4444',      // Red
    basic: '#3b82f6',       // Blue
    special: '#a855f7',     // Purple
    stop: '#6b7280',        // Gray
  };
  return colors[classification];
}

/**
 * Convert DNA codon to RNA codon for display
 */
export function dnaToRnaCodon(dnaCodon: string): string {
  return dnaCodon.replace(/T/g, 'U');
}

/**
 * Get codons as RNA for display
 */
export function getRnaCodons(aminoAcidCode: string): string[] {
  const info = getAminoAcidInfo(aminoAcidCode);
  if (!info) return [];
  return info.codons.map(dnaToRnaCodon);
}
