/**
 * SequenceTexture - Encode Genome Sequence as GPU Texture
 *
 * Encodes the genome sequence into a GPU texture for O(1) random access
 * during rendering. Each pixel stores:
 * - R: Nucleotide code (0-4: A,C,G,T,N)
 * - G: Amino acid code (0-21)
 * - B: Flags (bit 0: isDiff, bit 1: isHighlight, etc.)
 * - A: Reserved
 *
 * This allows the GPU to look up any base in the sequence without
 * transferring data from CPU on each frame.
 */

import type { ReadingFrame } from '@phage-explorer/core';
import { translateCodon } from '@phage-explorer/core';

// Character to code mappings (must match shader)
const NUCLEOTIDE_CODE: Record<string, number> = {
  'A': 0, 'a': 0,
  'C': 1, 'c': 1,
  'G': 2, 'g': 2,
  'T': 3, 't': 3,
  'U': 3, 'u': 3, // RNA
  'N': 4, 'n': 4,
};

const AMINO_ACID_CODE: Record<string, number> = {
  'A': 0, 'C': 1, 'D': 2, 'E': 3, 'F': 4,
  'G': 5, 'H': 6, 'I': 7, 'K': 8, 'L': 9,
  'M': 10, 'N': 11, 'P': 12, 'Q': 13, 'R': 14,
  'S': 15, 'T': 16, 'V': 17, 'W': 18, 'Y': 19,
  'X': 20, '*': 21,
};

// Flags
const FLAG_IS_DIFF = 1;
// Bit 1 reserved for future highlights/selection.

export interface SequenceTextureData {
  texture: WebGLTexture | null;
  data: Uint8Array;
  width: number;
  height: number;
  sequenceLength: number;
}

/**
 * Calculate optimal texture dimensions for a sequence
 * WebGL has max texture size limits, so we use 2D layout
 */
function calculateTextureDimensions(sequenceLength: number): { width: number; height: number } {
  // Target power-of-2 dimensions for GPU efficiency
  // Max texture size is typically 4096 or 8192
  const maxSize = 4096;

  if (sequenceLength <= maxSize) {
    return { width: sequenceLength, height: 1 };
  }

  // Calculate optimal 2D layout
  const width = maxSize;
  const height = Math.ceil(sequenceLength / maxSize);

  return { width, height };
}

/**
 * Translate a codon to amino acid code
 */
function getAminoAcidCode(
  sequence: string,
  index: number,
  readingFrame: ReadingFrame
): number {
  // Reading frame offset (0, 1, 2 for forward frames; -1, -2, -3 for reverse)
  // For forward frames: 0 -> offset 0, 1 -> offset 1, 2 -> offset 2
  // For reverse frames: -1 -> offset 0, -2 -> offset 1, -3 -> offset 2
  const frameOffset = readingFrame >= 0 ? readingFrame : Math.abs(readingFrame) - 1;

  // Find codon position
  const codonStart = Math.floor((index - frameOffset) / 3) * 3 + frameOffset;

  if (codonStart < 0 || codonStart + 2 >= sequence.length) {
    return AMINO_ACID_CODE['X']; // Unknown
  }

  // Check if this is the first base of a codon (for display purposes)
  if ((index - frameOffset) % 3 !== 0) {
    return 255; // Not a codon start, no amino acid to display
  }

  const codon = sequence.substring(codonStart, codonStart + 3).toUpperCase();
  const aminoAcid = translateCodon(codon);

  return AMINO_ACID_CODE[aminoAcid] ?? AMINO_ACID_CODE['X'];
}

/**
 * Create sequence data texture
 */
export function createSequenceTexture(
  gl: WebGL2RenderingContext | WebGLRenderingContext | null,
  sequence: string,
  options: {
    readingFrame?: ReadingFrame;
    diffMask?: Uint8Array | null;
  } = {}
): SequenceTextureData {
  const { readingFrame = 0, diffMask = null } = options;
  const sequenceLength = sequence.length;

  if (sequenceLength === 0) {
    return {
      texture: null,
      data: new Uint8Array(0),
      width: 0,
      height: 0,
      sequenceLength: 0,
    };
  }

  const { width, height } = calculateTextureDimensions(sequenceLength);
  const totalPixels = width * height;

  // Create RGBA data (4 bytes per pixel)
  const data = new Uint8Array(totalPixels * 4);

  // Encode sequence
  for (let i = 0; i < sequenceLength; i++) {
    const pixelOffset = i * 4;
    const char = sequence[i];

    // R: Nucleotide code
    data[pixelOffset] = NUCLEOTIDE_CODE[char] ?? 4; // Default to N

    // G: Amino acid code (for display at codon starts)
    data[pixelOffset + 1] = getAminoAcidCode(sequence, i, readingFrame);

    // B: Flags
    let flags = 0;
    if (diffMask && i < diffMask.length && diffMask[i] !== 0) {
      flags |= FLAG_IS_DIFF;
    }
    data[pixelOffset + 2] = flags;

    // A: Reserved
    data[pixelOffset + 3] = 255;
  }

  // Fill remaining pixels (if any) with default values
  for (let i = sequenceLength; i < totalPixels; i++) {
    const pixelOffset = i * 4;
    data[pixelOffset] = 4;     // N
    data[pixelOffset + 1] = 20; // X
    data[pixelOffset + 2] = 0;  // No flags
    data[pixelOffset + 3] = 255;
  }

  // Create WebGL texture if context provided
  let texture: WebGLTexture | null = null;

  if (gl) {
    texture = gl.createTexture();
    if (texture) {
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Upload data to GPU
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        data
      );

      // Use NEAREST filtering for exact data lookup
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }

  return {
    texture,
    data,
    width,
    height,
    sequenceLength,
  };
}

/**
 * Update sequence texture with new diff mask
 */
export function updateSequenceTextureDiffMask(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  textureData: SequenceTextureData,
  diffMask: Uint8Array | null
): void {
  if (!textureData.texture || textureData.sequenceLength === 0) return;

  // Update flags in data
  for (let i = 0; i < textureData.sequenceLength; i++) {
    const pixelOffset = i * 4;
    let flags = textureData.data[pixelOffset + 2] & ~FLAG_IS_DIFF; // Clear diff flag

    if (diffMask && i < diffMask.length && diffMask[i] !== 0) {
      flags |= FLAG_IS_DIFF;
    }

    textureData.data[pixelOffset + 2] = flags;
  }

  // Re-upload to GPU
  gl.bindTexture(gl.TEXTURE_2D, textureData.texture);
  gl.texSubImage2D(
    gl.TEXTURE_2D,
    0,
    0,
    0,
    textureData.width,
    textureData.height,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    textureData.data
  );
  gl.bindTexture(gl.TEXTURE_2D, null);
}

/**
 * Update sequence texture with new reading frame
 */
export function updateSequenceTextureReadingFrame(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  textureData: SequenceTextureData,
  sequence: string,
  readingFrame: ReadingFrame
): void {
  if (!textureData.texture || textureData.sequenceLength === 0) return;

  // Update amino acid codes in data
  for (let i = 0; i < textureData.sequenceLength; i++) {
    const pixelOffset = i * 4;
    textureData.data[pixelOffset + 1] = getAminoAcidCode(sequence, i, readingFrame);
  }

  // Re-upload to GPU
  gl.bindTexture(gl.TEXTURE_2D, textureData.texture);
  gl.texSubImage2D(
    gl.TEXTURE_2D,
    0,
    0,
    0,
    textureData.width,
    textureData.height,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    textureData.data
  );
  gl.bindTexture(gl.TEXTURE_2D, null);
}

/**
 * Dispose sequence texture resources
 */
export function disposeSequenceTexture(
  gl: WebGL2RenderingContext | WebGLRenderingContext | null,
  textureData: SequenceTextureData
): void {
  if (gl && textureData.texture) {
    gl.deleteTexture(textureData.texture);
    textureData.texture = null;
  }
}
