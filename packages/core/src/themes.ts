import type { Nucleotide, AminoAcid } from './types';

// Color pair for foreground and background
export interface ColorPair {
  fg: string;
  bg: string;
}

// Nucleotide color theme
export type NucleotideTheme = Record<Nucleotide, ColorPair>;

// Amino acid color theme
export type AminoTheme = Record<AminoAcid, ColorPair>;

// HUD/UI color theme
export interface HudTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  textDim: string;
  border: string;
  borderFocus: string;
  success: string;
  warning: string;
  error: string;
  diffHighlight: string;
}

// Complete theme definition
export interface Theme {
  id: string;
  name: string;
  colors: HudTheme;
  nucleotides: NucleotideTheme;
  aminoAcids: AminoTheme;
}

// Classic theme - vibrant colors based on traditional bioinformatics coloring
const classicNucleotides: NucleotideTheme = {
  'A': { fg: '#000000', bg: '#5cb85c' }, // Green
  'C': { fg: '#ffffff', bg: '#0275d8' }, // Blue
  'G': { fg: '#000000', bg: '#f0ad4e' }, // Amber/Yellow
  'T': { fg: '#ffffff', bg: '#d9534f' }, // Red
  'N': { fg: '#ffffff', bg: '#6c757d' }, // Gray
};

// RasMol-inspired amino acid colors (by property)
const classicAminoAcids: AminoTheme = {
  // Hydrophobic - orange/brown tones
  'A': { fg: '#000000', bg: '#c8c8c8' }, // Alanine - light gray
  'V': { fg: '#000000', bg: '#0f820f' }, // Valine - green
  'L': { fg: '#000000', bg: '#0f820f' }, // Leucine - green
  'I': { fg: '#000000', bg: '#0f820f' }, // Isoleucine - green
  'M': { fg: '#000000', bg: '#e6e600' }, // Methionine - yellow
  'F': { fg: '#ffffff', bg: '#3232aa' }, // Phenylalanine - blue
  'W': { fg: '#ffffff', bg: '#b45ab4' }, // Tryptophan - purple
  'P': { fg: '#000000', bg: '#dc9682' }, // Proline - salmon

  // Polar - teal/cyan tones
  'S': { fg: '#000000', bg: '#fa9600' }, // Serine - orange
  'T': { fg: '#000000', bg: '#fa9600' }, // Threonine - orange
  'Y': { fg: '#ffffff', bg: '#3232aa' }, // Tyrosine - blue
  'N': { fg: '#000000', bg: '#00dcdc' }, // Asparagine - cyan
  'Q': { fg: '#000000', bg: '#00dcdc' }, // Glutamine - cyan
  'C': { fg: '#000000', bg: '#e6e600' }, // Cysteine - yellow

  // Basic - blue tones
  'K': { fg: '#ffffff', bg: '#145aff' }, // Lysine - bright blue
  'R': { fg: '#ffffff', bg: '#145aff' }, // Arginine - bright blue
  'H': { fg: '#ffffff', bg: '#8282d2' }, // Histidine - light blue

  // Acidic - red tones
  'D': { fg: '#ffffff', bg: '#e60a0a' }, // Aspartate - red
  'E': { fg: '#ffffff', bg: '#e60a0a' }, // Glutamate - red

  // Special
  'G': { fg: '#000000', bg: '#ebebeb' }, // Glycine - white/light gray

  // Stop codon
  '*': { fg: '#ffffff', bg: '#ff0000' }, // Stop - bright red
};

const classicHud: HudTheme = {
  primary: '#5cb85c',
  secondary: '#0275d8',
  accent: '#f0ad4e',
  background: '#1a1a2e',
  text: '#e0e0e0',
  textDim: '#6c757d',
  border: '#3d3d5c',
  borderFocus: '#5cb85c',
  success: '#5cb85c',
  warning: '#f0ad4e',
  error: '#d9534f',
  diffHighlight: '#ff6b6b',
};

export const CLASSIC_THEME: Theme = {
  id: 'classic',
  name: 'Classic',
  colors: classicHud,
  nucleotides: classicNucleotides,
  aminoAcids: classicAminoAcids,
};

// Ocean theme - cooler, blue-based palette
const oceanNucleotides: NucleotideTheme = {
  'A': { fg: '#ffffff', bg: '#1a535c' }, // Teal
  'C': { fg: '#ffffff', bg: '#4ecdc4' }, // Cyan
  'G': { fg: '#000000', bg: '#ffe66d' }, // Yellow
  'T': { fg: '#ffffff', bg: '#ff6b6b' }, // Coral
  'N': { fg: '#ffffff', bg: '#495057' }, // Gray
};

const oceanAminoAcids: AminoTheme = {
  'A': { fg: '#000000', bg: '#a8dadc' },
  'V': { fg: '#ffffff', bg: '#457b9d' },
  'L': { fg: '#ffffff', bg: '#457b9d' },
  'I': { fg: '#ffffff', bg: '#457b9d' },
  'M': { fg: '#000000', bg: '#e9c46a' },
  'F': { fg: '#ffffff', bg: '#264653' },
  'W': { fg: '#ffffff', bg: '#6d597a' },
  'P': { fg: '#000000', bg: '#f4a261' },
  'S': { fg: '#000000', bg: '#2a9d8f' },
  'T': { fg: '#000000', bg: '#2a9d8f' },
  'Y': { fg: '#ffffff', bg: '#264653' },
  'N': { fg: '#000000', bg: '#48cae4' },
  'Q': { fg: '#000000', bg: '#48cae4' },
  'C': { fg: '#000000', bg: '#e9c46a' },
  'K': { fg: '#ffffff', bg: '#023e8a' },
  'R': { fg: '#ffffff', bg: '#023e8a' },
  'H': { fg: '#ffffff', bg: '#0077b6' },
  'D': { fg: '#ffffff', bg: '#e63946' },
  'E': { fg: '#ffffff', bg: '#e63946' },
  'G': { fg: '#000000', bg: '#f1faee' },
  '*': { fg: '#ffffff', bg: '#d62828' },
};

const oceanHud: HudTheme = {
  primary: '#4ecdc4',
  secondary: '#1a535c',
  accent: '#ffe66d',
  background: '#0a1628',
  text: '#e0f7fa',
  textDim: '#5c7080',
  border: '#264653',
  borderFocus: '#4ecdc4',
  success: '#4ecdc4',
  warning: '#ffe66d',
  error: '#ff6b6b',
  diffHighlight: '#ff9f1c',
};

export const OCEAN_THEME: Theme = {
  id: 'ocean',
  name: 'Ocean',
  colors: oceanHud,
  nucleotides: oceanNucleotides,
  aminoAcids: oceanAminoAcids,
};

// Matrix theme - classic green terminal style
const matrixNucleotides: NucleotideTheme = {
  'A': { fg: '#00ff00', bg: '#001400' },
  'C': { fg: '#00cc00', bg: '#001100' },
  'G': { fg: '#00ff66', bg: '#001600' },
  'T': { fg: '#33ff33', bg: '#001800' },
  'N': { fg: '#006600', bg: '#000800' },
};

const matrixAminoAcids: AminoTheme = {
  'A': { fg: '#00ff00', bg: '#001000' },
  'V': { fg: '#00ee00', bg: '#000e00' },
  'L': { fg: '#00dd00', bg: '#000c00' },
  'I': { fg: '#00cc00', bg: '#000a00' },
  'M': { fg: '#33ff33', bg: '#001400' },
  'F': { fg: '#00bb00', bg: '#000800' },
  'W': { fg: '#00aa00', bg: '#000600' },
  'P': { fg: '#00ff66', bg: '#001200' },
  'S': { fg: '#66ff66', bg: '#001600' },
  'T': { fg: '#66ff66', bg: '#001600' },
  'Y': { fg: '#00bb00', bg: '#000800' },
  'N': { fg: '#99ff99', bg: '#001a00' },
  'Q': { fg: '#99ff99', bg: '#001a00' },
  'C': { fg: '#33ff33', bg: '#001400' },
  'K': { fg: '#00ffcc', bg: '#001000' },
  'R': { fg: '#00ffcc', bg: '#001000' },
  'H': { fg: '#00ff99', bg: '#000e00' },
  'D': { fg: '#ff3300', bg: '#140000' },
  'E': { fg: '#ff3300', bg: '#140000' },
  'G': { fg: '#ccffcc', bg: '#001c00' },
  '*': { fg: '#ff0000', bg: '#1a0000' },
};

const matrixHud: HudTheme = {
  primary: '#00ff00',
  secondary: '#00cc00',
  accent: '#00ff66',
  background: '#000000',
  text: '#00ff00',
  textDim: '#006600',
  border: '#003300',
  borderFocus: '#00ff00',
  success: '#00ff00',
  warning: '#ffff00',
  error: '#ff0000',
  diffHighlight: '#ff6600',
};

export const MATRIX_THEME: Theme = {
  id: 'matrix',
  name: 'Matrix',
  colors: matrixHud,
  nucleotides: matrixNucleotides,
  aminoAcids: matrixAminoAcids,
};

// Sunset theme - warm colors
const sunsetNucleotides: NucleotideTheme = {
  'A': { fg: '#ffffff', bg: '#ff6b35' }, // Orange
  'C': { fg: '#ffffff', bg: '#f7c59f' }, // Peach
  'G': { fg: '#000000', bg: '#efa00b' }, // Gold
  'T': { fg: '#ffffff', bg: '#d62246' }, // Rose
  'N': { fg: '#ffffff', bg: '#4a4e69' }, // Slate
};

const sunsetAminoAcids: AminoTheme = {
  'A': { fg: '#000000', bg: '#ffd166' },
  'V': { fg: '#ffffff', bg: '#ef476f' },
  'L': { fg: '#ffffff', bg: '#ef476f' },
  'I': { fg: '#ffffff', bg: '#ef476f' },
  'M': { fg: '#000000', bg: '#ffd166' },
  'F': { fg: '#ffffff', bg: '#9b2335' },
  'W': { fg: '#ffffff', bg: '#6b2737' },
  'P': { fg: '#000000', bg: '#f78c6b' },
  'S': { fg: '#000000', bg: '#83c5be' },
  'T': { fg: '#000000', bg: '#83c5be' },
  'Y': { fg: '#ffffff', bg: '#9b2335' },
  'N': { fg: '#000000', bg: '#edf6f9' },
  'Q': { fg: '#000000', bg: '#edf6f9' },
  'C': { fg: '#000000', bg: '#ffd166' },
  'K': { fg: '#ffffff', bg: '#118ab2' },
  'R': { fg: '#ffffff', bg: '#118ab2' },
  'H': { fg: '#ffffff', bg: '#06d6a0' },
  'D': { fg: '#ffffff', bg: '#d62246' },
  'E': { fg: '#ffffff', bg: '#d62246' },
  'G': { fg: '#000000', bg: '#fefae0' },
  '*': { fg: '#ffffff', bg: '#9b2335' },
};

const sunsetHud: HudTheme = {
  primary: '#ff6b35',
  secondary: '#f7c59f',
  accent: '#efa00b',
  background: '#1e1e2f',
  text: '#fefae0',
  textDim: '#9a8c98',
  border: '#4a4e69',
  borderFocus: '#ff6b35',
  success: '#06d6a0',
  warning: '#ffd166',
  error: '#d62246',
  diffHighlight: '#ef476f',
};

export const SUNSET_THEME: Theme = {
  id: 'sunset',
  name: 'Sunset',
  colors: sunsetHud,
  nucleotides: sunsetNucleotides,
  aminoAcids: sunsetAminoAcids,
};

// Forest theme - natural greens and earth tones
const forestNucleotides: NucleotideTheme = {
  'A': { fg: '#ffffff', bg: '#2d6a4f' }, // Forest green
  'C': { fg: '#ffffff', bg: '#40916c' }, // Medium green
  'G': { fg: '#000000', bg: '#95d5b2' }, // Light green
  'T': { fg: '#ffffff', bg: '#8b4513' }, // Saddle brown
  'N': { fg: '#ffffff', bg: '#6b705c' }, // Olive gray
};

const forestAminoAcids: AminoTheme = {
  'A': { fg: '#000000', bg: '#b7e4c7' },
  'V': { fg: '#ffffff', bg: '#2d6a4f' },
  'L': { fg: '#ffffff', bg: '#2d6a4f' },
  'I': { fg: '#ffffff', bg: '#2d6a4f' },
  'M': { fg: '#000000', bg: '#d4a373' },
  'F': { fg: '#ffffff', bg: '#1b4332' },
  'W': { fg: '#ffffff', bg: '#081c15' },
  'P': { fg: '#000000', bg: '#ccd5ae' },
  'S': { fg: '#000000', bg: '#95d5b2' },
  'T': { fg: '#000000', bg: '#95d5b2' },
  'Y': { fg: '#ffffff', bg: '#1b4332' },
  'N': { fg: '#000000', bg: '#d8f3dc' },
  'Q': { fg: '#000000', bg: '#d8f3dc' },
  'C': { fg: '#000000', bg: '#d4a373' },
  'K': { fg: '#ffffff', bg: '#344e41' },
  'R': { fg: '#ffffff', bg: '#344e41' },
  'H': { fg: '#ffffff', bg: '#588157' },
  'D': { fg: '#ffffff', bg: '#bc4749' },
  'E': { fg: '#ffffff', bg: '#bc4749' },
  'G': { fg: '#000000', bg: '#f0ead2' },
  '*': { fg: '#ffffff', bg: '#9b2226' },
};

const forestHud: HudTheme = {
  primary: '#40916c',
  secondary: '#2d6a4f',
  accent: '#95d5b2',
  background: '#0d1b0f',
  text: '#d8f3dc',
  textDim: '#6b705c',
  border: '#344e41',
  borderFocus: '#40916c',
  success: '#40916c',
  warning: '#d4a373',
  error: '#bc4749',
  diffHighlight: '#e9c46a',
};

export const FOREST_THEME: Theme = {
  id: 'forest',
  name: 'Forest',
  colors: forestHud,
  nucleotides: forestNucleotides,
  aminoAcids: forestAminoAcids,
};

// All available themes
export const THEMES: Theme[] = [
  CLASSIC_THEME,
  OCEAN_THEME,
  MATRIX_THEME,
  SUNSET_THEME,
  FOREST_THEME,
];

// Get theme by ID
export function getThemeById(id: string): Theme {
  return THEMES.find(t => t.id === id) ?? CLASSIC_THEME;
}

// Get next theme in cycle
export function getNextTheme(currentId: string): Theme {
  const currentIndex = THEMES.findIndex(t => t.id === currentId);
  const nextIndex = (currentIndex + 1) % THEMES.length;
  return THEMES[nextIndex];
}

// Get nucleotide color for a character
export function getNucleotideColor(theme: Theme, nucleotide: string): ColorPair {
  const upper = nucleotide.toUpperCase() as Nucleotide;
  return theme.nucleotides[upper] ?? theme.nucleotides['N'];
}

// Get amino acid color for a character
export function getAminoAcidColor(theme: Theme, aminoAcid: string): ColorPair {
  const upper = aminoAcid.toUpperCase() as AminoAcid;
  return theme.aminoAcids[upper] ?? theme.aminoAcids['*'];
}
