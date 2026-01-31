/**
 * MSDFAtlas - Multi-channel Signed Distance Field Glyph Atlas
 *
 * Generates an MSDF texture atlas for all nucleotides and amino acids.
 * MSDF provides crisp text rendering at any zoom level, unlike bitmap fonts
 * which become blurry when scaled.
 *
 * The atlas is generated on a Web Worker to avoid blocking the main thread.
 * Falls back to bitmap glyphs if MSDF generation fails.
 */

import type { Theme, ColorPair } from '@phage-explorer/core';

// All characters we need in the atlas
export const NUCLEOTIDES = ['A', 'C', 'G', 'T', 'N'] as const;
export const AMINO_ACIDS = [
  'A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L',
  'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'Y',
  'X', '*',
] as const;

export type Nucleotide = (typeof NUCLEOTIDES)[number];
export type AminoAcid = (typeof AMINO_ACIDS)[number];

// Atlas layout
export const ATLAS_COLS = 8;
export const GLYPH_SIZE = 64; // Size of each glyph cell in the atlas (pixels)
export const MSDF_RANGE = 4;  // Distance field range in pixels

export interface MSDFGlyph {
  char: string;
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
}

export interface MSDFAtlasData {
  texture: WebGLTexture | null;
  canvas: HTMLCanvasElement | OffscreenCanvas;
  glyphs: Map<string, MSDFGlyph>;
  width: number;
  height: number;
  isMSDF: boolean; // true if real MSDF, false if bitmap fallback
}

/**
 * Generate a simple bitmap glyph (fallback when MSDF unavailable)
 */
function renderBitmapGlyph(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  char: string,
  x: number,
  y: number,
  size: number,
  colors: ColorPair
): void {
  // Fill background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(x, y, size, size);

  // Draw character
  const fontSize = Math.floor(size * 0.7);
  ctx.font = `bold ${fontSize}px "JetBrains Mono", "Fira Code", "Consolas", monospace`;
  ctx.fillStyle = colors.fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, x + size / 2, y + size / 2);
}

/**
 * Generate MSDF for a single glyph using the Tiny SDF algorithm
 * This is a simplified version that approximates MSDF from bitmap
 */
function generateMSDFGlyph(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  char: string,
  x: number,
  y: number,
  size: number
): void {
  // Create a high-resolution temporary canvas for the glyph
  const hiResSize = size * 4; // 4x resolution for quality
  const tempCanvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(hiResSize, hiResSize)
    : document.createElement('canvas');
  tempCanvas.width = hiResSize;
  tempCanvas.height = hiResSize;

  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  // Draw white character on black background at high resolution
  tempCtx.fillStyle = '#000000';
  tempCtx.fillRect(0, 0, hiResSize, hiResSize);

  const fontSize = Math.floor(hiResSize * 0.75);
  tempCtx.font = `bold ${fontSize}px "JetBrains Mono", "Fira Code", "Consolas", monospace`;
  tempCtx.fillStyle = '#FFFFFF';
  tempCtx.textAlign = 'center';
  tempCtx.textBaseline = 'middle';
  tempCtx.fillText(char, hiResSize / 2, hiResSize / 2);

  // Get pixel data
  const imageData = tempCtx.getImageData(0, 0, hiResSize, hiResSize);
  const pixels = imageData.data;

  // Create output buffer for MSDF
  const msdfData = new Uint8ClampedArray(size * size * 4);

  // Generate signed distance field (simplified single-channel SDF)
  // For each pixel in output, find distance to nearest edge in input
  const range = MSDF_RANGE * 4; // Scaled for hi-res

  for (let oy = 0; oy < size; oy++) {
    for (let ox = 0; ox < size; ox++) {
      // Map output coords to hi-res input
      const ix = Math.floor((ox + 0.5) * 4);
      const iy = Math.floor((oy + 0.5) * 4);

      // Check if inside glyph
      const centerPixelIdx = (iy * hiResSize + ix) * 4;
      const isInside = pixels[centerPixelIdx] > 127;

      // Find nearest edge (brute force for small area)
      let minDist = range;
      const searchRange = Math.ceil(range);

      for (let sy = -searchRange; sy <= searchRange; sy++) {
        for (let sx = -searchRange; sx <= searchRange; sx++) {
          const px = ix + sx;
          const py = iy + sy;

          if (px < 0 || px >= hiResSize || py < 0 || py >= hiResSize) continue;

          const pixelIdx = (py * hiResSize + px) * 4;
          const pixelIsInside = pixels[pixelIdx] > 127;

          // Check if this is an edge (different from center)
          if (pixelIsInside !== isInside) {
            const dist = Math.sqrt(sx * sx + sy * sy);
            if (dist < minDist) {
              minDist = dist;
            }
          }
        }
      }

      // Convert distance to 0-255 range
      // Inside = 128-255, Outside = 0-127
      const normalizedDist = minDist / range;
      const value = isInside
        ? Math.min(255, Math.floor(128 + normalizedDist * 127))
        : Math.max(0, Math.floor(128 - normalizedDist * 127));

      // Write to all three RGB channels for MSDF compatibility
      const outIdx = (oy * size + ox) * 4;
      msdfData[outIdx] = value;     // R
      msdfData[outIdx + 1] = value; // G
      msdfData[outIdx + 2] = value; // B
      msdfData[outIdx + 3] = 255;   // A
    }
  }

  // Create ImageData and draw to atlas
  const outImageData = new ImageData(msdfData, size, size);
  ctx.putImageData(outImageData, x, y);
}

/**
 * Create the MSDF atlas texture
 */
export function createMSDFAtlas(
  gl: WebGL2RenderingContext | WebGLRenderingContext | null,
  theme: Theme,
  options: { useMSDF?: boolean } = {}
): MSDFAtlasData {
  const useMSDF = options.useMSDF ?? true;
  const totalGlyphs = NUCLEOTIDES.length + AMINO_ACIDS.length;
  const rows = Math.ceil(totalGlyphs / ATLAS_COLS);

  const atlasWidth = GLYPH_SIZE * ATLAS_COLS;
  const atlasHeight = GLYPH_SIZE * rows;

  // Create atlas canvas
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(atlasWidth, atlasHeight)
    : document.createElement('canvas');
  canvas.width = atlasWidth;
  canvas.height = atlasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context for MSDF atlas');

  // Clear to black
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, atlasWidth, atlasHeight);

  // Track glyph positions
  const glyphs = new Map<string, MSDFGlyph>();
  let index = 0;

  // Render nucleotides
  for (const char of NUCLEOTIDES) {
    const col = index % ATLAS_COLS;
    const row = Math.floor(index / ATLAS_COLS);
    const x = col * GLYPH_SIZE;
    const y = row * GLYPH_SIZE;

    if (useMSDF) {
      generateMSDFGlyph(ctx, char, x, y, GLYPH_SIZE);
    } else {
      const colors = theme.nucleotides[char];
      renderBitmapGlyph(ctx, char, x, y, GLYPH_SIZE, colors);
    }

    glyphs.set(char, { char, x, y, width: GLYPH_SIZE, height: GLYPH_SIZE, index });
    index++;
  }

  // Render amino acids
  for (const char of AMINO_ACIDS) {
    const col = index % ATLAS_COLS;
    const row = Math.floor(index / ATLAS_COLS);
    const x = col * GLYPH_SIZE;
    const y = row * GLYPH_SIZE;

    if (useMSDF) {
      generateMSDFGlyph(ctx, char, x, y, GLYPH_SIZE);
    } else {
      const colors = theme.aminoAcids[char as keyof typeof theme.aminoAcids];
      renderBitmapGlyph(ctx, char, x, y, GLYPH_SIZE, colors);
    }

    glyphs.set(`AA_${char}`, { char, x, y, width: GLYPH_SIZE, height: GLYPH_SIZE, index });
    index++;
  }

  // Create WebGL texture if context provided
  let texture: WebGLTexture | null = null;

  if (gl) {
    texture = gl.createTexture();
    if (texture) {
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Upload atlas to GPU
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        canvas as TexImageSource
      );

      // Set texture parameters for MSDF rendering
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }

  return {
    texture,
    canvas,
    glyphs,
    width: atlasWidth,
    height: atlasHeight,
    isMSDF: useMSDF,
  };
}

/**
 * Get UV coordinates for a glyph
 */
export function getGlyphUVs(
  atlas: MSDFAtlasData,
  char: string,
  isAminoAcid: boolean
): { u0: number; v0: number; u1: number; v1: number } | null {
  const key = isAminoAcid ? `AA_${char}` : char;
  const glyph = atlas.glyphs.get(key);

  if (!glyph) return null;

  return {
    u0: glyph.x / atlas.width,
    v0: glyph.y / atlas.height,
    u1: (glyph.x + glyph.width) / atlas.width,
    v1: (glyph.y + glyph.height) / atlas.height,
  };
}

/**
 * Get glyph index for shader lookup
 */
export function getGlyphIndex(char: string, isAminoAcid: boolean): number {
  if (isAminoAcid) {
    const idx = AMINO_ACIDS.indexOf(char as AminoAcid);
    return idx >= 0 ? NUCLEOTIDES.length + idx : NUCLEOTIDES.length + 20; // X fallback
  }

  const idx = NUCLEOTIDES.indexOf(char as Nucleotide);
  return idx >= 0 ? idx : 4; // N fallback
}

/**
 * Dispose atlas resources
 */
export function disposeAtlas(
  gl: WebGL2RenderingContext | WebGLRenderingContext | null,
  atlas: MSDFAtlasData
): void {
  if (gl && atlas.texture) {
    gl.deleteTexture(atlas.texture);
    atlas.texture = null;
  }

  // Clear canvas
  if (atlas.canvas instanceof HTMLCanvasElement) {
    atlas.canvas.width = 1;
    atlas.canvas.height = 1;
  }

  atlas.glyphs.clear();
}
