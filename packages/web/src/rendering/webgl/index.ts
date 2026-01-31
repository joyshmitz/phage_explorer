/**
 * WebGL Rendering Module
 *
 * High-performance GPU-accelerated sequence rendering for Phage Explorer.
 * Provides 60fps scrolling on both desktop and mobile devices.
 */

export { WebGLSequenceRenderer, detectWebGLSupport } from './WebGLSequenceRenderer';
export type { WebGLRendererOptions, WebGLRenderState, VisibleRange } from './WebGLSequenceRenderer';

export { createMSDFAtlas, disposeAtlas, getGlyphUVs, getGlyphIndex, NUCLEOTIDES, AMINO_ACIDS, ATLAS_COLS, GLYPH_SIZE } from './MSDFAtlas';
export type { MSDFAtlasData, MSDFGlyph, Nucleotide, AminoAcid } from './MSDFAtlas';

export { createSequenceTexture, updateSequenceTextureDiffMask, updateSequenceTextureReadingFrame, disposeSequenceTexture } from './SequenceTexture';
export type { SequenceTextureData } from './SequenceTexture';

export { compileShader, createProgram, createSequenceProgram, createSequenceProgramWebGL1 } from './shaders';
