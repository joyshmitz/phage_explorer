/**
 * GlyphAtlas - Pre-rendered Character Sprites
 *
 * Creates a texture atlas of all nucleotides and amino acids for fast
 * canvas rendering. Instead of using fillText() for each character,
 * we drawImage() from this pre-rendered atlas, which is ~10x faster.
 */

import type { Theme, ColorPair } from '@phage-explorer/core';

// All nucleotides we need to render
const NUCLEOTIDES = ['A', 'C', 'G', 'T', 'N'] as const;
type Nucleotide = (typeof NUCLEOTIDES)[number];

// All amino acids we need to render
const AMINO_ACIDS = [
  'A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L',
  'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'Y',
  'X', '*',
] as const;
type AminoAcid = (typeof AMINO_ACIDS)[number];

export interface GlyphMetrics {
  width: number;
  height: number;
  ascent: number;
  descent: number;
}

export interface GlyphInfo {
  char: string;
  x: number;
  y: number;
  width: number;
  height: number;
  colors: ColorPair;
}

export interface GlyphAtlasOptions {
  cellWidth: number;
  cellHeight: number;
  fontFamily: string;
  fontSize: number;
  devicePixelRatio?: number;
}

const DEFAULT_OPTIONS: GlyphAtlasOptions = {
  cellWidth: 16,
  cellHeight: 20,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  fontSize: 14,
  devicePixelRatio: 1,
};

export class GlyphAtlas {
  private canvas: HTMLCanvasElement | OffscreenCanvas;
  private ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  private options: GlyphAtlasOptions;
  private theme: Theme;
  private nucleotideGlyphs: Map<Nucleotide, GlyphInfo> = new Map();
  private aminoAcidGlyphs: Map<AminoAcid, GlyphInfo> = new Map();
  private metrics: GlyphMetrics;
  private dpr: number;

  // Atlas layout constants
  private readonly COLS = 8; // Characters per row
  private atlasWidth: number;
  private atlasHeight: number;

  constructor(theme: Theme, options: Partial<GlyphAtlasOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.theme = theme;
    this.dpr = options.devicePixelRatio ?? (typeof window !== 'undefined' ? window.devicePixelRatio : 1);

    // Calculate atlas size
    const totalChars = NUCLEOTIDES.length + AMINO_ACIDS.length;
    const rows = Math.ceil(totalChars / this.COLS);
    this.atlasWidth = this.options.cellWidth * this.COLS * this.dpr;
    this.atlasHeight = this.options.cellHeight * rows * this.dpr;

    // Create canvas
    if (typeof OffscreenCanvas !== 'undefined') {
      this.canvas = new OffscreenCanvas(this.atlasWidth, this.atlasHeight);
    } else {
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.atlasWidth;
      this.canvas.height = this.atlasHeight;
    }

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;

    // Calculate metrics
    this.metrics = this.calculateMetrics();

    // Render the atlas
    this.render();
  }

  /**
   * Calculate font metrics
   */
  private calculateMetrics(): GlyphMetrics {
    this.ctx.font = `${this.options.fontSize * this.dpr}px ${this.options.fontFamily}`;
    const textMetrics = this.ctx.measureText('M');

    return {
      width: this.options.cellWidth * this.dpr,
      height: this.options.cellHeight * this.dpr,
      ascent: textMetrics.actualBoundingBoxAscent || this.options.fontSize * 0.8 * this.dpr,
      descent: textMetrics.actualBoundingBoxDescent || this.options.fontSize * 0.2 * this.dpr,
    };
  }

  /**
   * Render all glyphs to the atlas
   */
  private render(): void {
    this.ctx.clearRect(0, 0, this.atlasWidth, this.atlasHeight);

    let index = 0;

    // Render nucleotides
    for (const char of NUCLEOTIDES) {
      const colors = this.theme.nucleotides[char];
      this.renderGlyph(char, colors, index);
      this.nucleotideGlyphs.set(char, this.getGlyphInfo(char, colors, index));
      index++;
    }

    // Render amino acids
    for (const char of AMINO_ACIDS) {
      const colors = this.theme.aminoAcids[char as keyof typeof this.theme.aminoAcids];
      this.renderGlyph(char, colors, index);
      this.aminoAcidGlyphs.set(char, this.getGlyphInfo(char, colors, index));
      index++;
    }
  }

  /**
   * Render a single glyph at the given index position
   */
  private renderGlyph(char: string, colors: ColorPair, index: number): void {
    const col = index % this.COLS;
    const row = Math.floor(index / this.COLS);
    const x = col * this.options.cellWidth * this.dpr;
    const y = row * this.options.cellHeight * this.dpr;
    const width = this.options.cellWidth * this.dpr;
    const height = this.options.cellHeight * this.dpr;

    // Draw background
    this.ctx.fillStyle = colors.bg;
    this.ctx.fillRect(x, y, width, height);

    // Draw character
    this.ctx.font = `bold ${this.options.fontSize * this.dpr}px ${this.options.fontFamily}`;
    this.ctx.fillStyle = colors.fg;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(char, x + width / 2, y + height / 2);
  }

  /**
   * Get glyph info for a character at the given index
   */
  private getGlyphInfo(char: string, colors: ColorPair, index: number): GlyphInfo {
    const col = index % this.COLS;
    const row = Math.floor(index / this.COLS);

    return {
      char,
      x: col * this.options.cellWidth * this.dpr,
      y: row * this.options.cellHeight * this.dpr,
      width: this.options.cellWidth * this.dpr,
      height: this.options.cellHeight * this.dpr,
      colors,
    };
  }

  /**
   * Draw a nucleotide to the destination canvas
   */
  drawNucleotide(
    destCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    char: string,
    destX: number,
    destY: number,
    destWidth?: number,
    destHeight?: number
  ): void {
    const glyph = this.nucleotideGlyphs.get(char as Nucleotide);
    if (!glyph) {
      // Fall back to 'N' for unknown
      const fallback = this.nucleotideGlyphs.get('N');
      if (!fallback) return;
      this.drawGlyph(destCtx, fallback, destX, destY, destWidth, destHeight);
      return;
    }
    this.drawGlyph(destCtx, glyph, destX, destY, destWidth, destHeight);
  }

  /**
   * Draw an amino acid to the destination canvas
   */
  drawAminoAcid(
    destCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    char: string,
    destX: number,
    destY: number,
    destWidth?: number,
    destHeight?: number
  ): void {
    const glyph = this.aminoAcidGlyphs.get(char as AminoAcid);
    if (!glyph) {
      // Fall back to 'X' for unknown
      const fallback = this.aminoAcidGlyphs.get('X');
      if (!fallback) return;
      this.drawGlyph(destCtx, fallback, destX, destY, destWidth, destHeight);
      return;
    }
    this.drawGlyph(destCtx, glyph, destX, destY, destWidth, destHeight);
  }

  /**
   * Draw a glyph from the atlas to the destination canvas
   */
  private drawGlyph(
    destCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    glyph: GlyphInfo,
    destX: number,
    destY: number,
    destWidth?: number,
    destHeight?: number
  ): void {
    const dw = destWidth ?? this.options.cellWidth;
    const dh = destHeight ?? this.options.cellHeight;

    destCtx.drawImage(
      this.canvas as CanvasImageSource,
      glyph.x,
      glyph.y,
      glyph.width,
      glyph.height,
      destX,
      destY,
      dw,
      dh
    );
  }

  /**
   * Get the cell dimensions (for layout calculations)
   */
  getCellSize(): { width: number; height: number } {
    return {
      width: this.options.cellWidth,
      height: this.options.cellHeight,
    };
  }

  /**
   * Get the underlying canvas (for debugging/inspection)
   */
  getCanvas(): HTMLCanvasElement | OffscreenCanvas {
    return this.canvas;
  }

  /**
   * Get nucleotide glyph info
   */
  getNucleotideGlyph(char: string): GlyphInfo | undefined {
    return this.nucleotideGlyphs.get(char as Nucleotide);
  }

  /**
   * Get amino acid glyph info
   */
  getAminoAcidGlyph(char: string): GlyphInfo | undefined {
    return this.aminoAcidGlyphs.get(char as AminoAcid);
  }

  /**
   * Update theme (requires re-rendering atlas)
   */
  setTheme(theme: Theme): void {
    this.theme = theme;
    this.render();
  }

  /**
   * Create a new atlas with different options
   */
  static create(
    theme: Theme,
    options?: Partial<GlyphAtlasOptions>
  ): GlyphAtlas {
    return new GlyphAtlas(theme, options);
  }
}

export default GlyphAtlas;
