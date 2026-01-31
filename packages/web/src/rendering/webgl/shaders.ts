/**
 * WebGL Sequence Renderer Shaders
 *
 * High-performance GLSL shaders for genome sequence rendering.
 * Features:
 * - MSDF (Multi-channel Signed Distance Field) text rendering for crisp glyphs
 * - Instanced rendering for 100K+ cells in a single draw call
 * - GPU-side sequence lookup from data texture
 * - Smooth subpixel scrolling via uniform updates
 * - Diff visualization with GPU color blending
 */

// Vertex shader for instanced quad rendering
export const VERTEX_SHADER_SOURCE = /* glsl */ `#version 300 es
precision highp float;

// Per-vertex attributes (unit quad)
in vec2 a_position;      // Quad corner: (0,0), (1,0), (0,1), (1,1)
in vec2 a_texCoord;      // UV for this corner

// Per-instance attributes
in float a_instanceIndex; // Which cell this instance represents (0, 1, 2, ...)

// Uniforms
uniform vec2 u_resolution;      // Canvas size in pixels
uniform vec2 u_cellSize;        // Cell size in pixels
uniform vec2 u_scrollOffset;    // Scroll position in pixels
uniform float u_cols;           // Columns per row
uniform float u_totalCells;     // Total cells in sequence
uniform float u_startIndex;     // First visible cell index
uniform sampler2D u_sequenceData; // Sequence encoded as texture (R=base, G=amino, B=flags)
uniform vec2 u_sequenceSize;    // Sequence texture dimensions
uniform float u_zoomScale;      // Current zoom level
uniform float u_viewMode;       // 0=single, 1=dual (DNA+amino)

// Outputs to fragment shader
out vec2 v_texCoord;
out vec4 v_glyphUV;      // UV rect in atlas: (u0, v0, u1, v1)
out vec4 v_bgColor;
out vec4 v_fgColor;
out float v_glyphType;   // 0=nucleotide, 1=amino acid
out float v_isDiff;      // 1.0 if this is a diff position

// Color palette (hardcoded for performance - matches theme)
// Nucleotides: A=green, C=blue, G=yellow, T=red, N=gray
const vec3 NT_BG[5] = vec3[5](
  vec3(0.0, 0.25, 0.125),   // A - dark green
  vec3(0.0, 0.125, 0.25),   // C - dark blue
  vec3(0.25, 0.2, 0.0),     // G - dark yellow
  vec3(0.25, 0.0, 0.0),     // T - dark red
  vec3(0.15, 0.15, 0.15)    // N - dark gray
);

const vec3 NT_FG[5] = vec3[5](
  vec3(0.4, 1.0, 0.6),      // A - bright green
  vec3(0.4, 0.7, 1.0),      // C - bright blue
  vec3(1.0, 0.85, 0.2),     // G - bright yellow
  vec3(1.0, 0.4, 0.4),      // T - bright red
  vec3(0.6, 0.6, 0.6)       // N - gray
);

// Amino acid colors (grouped by properties)
const vec3 AA_BG[22] = vec3[22](
  vec3(0.0, 0.2, 0.1),   // A - Ala - small hydrophobic
  vec3(0.2, 0.15, 0.0),  // C - Cys - special
  vec3(0.2, 0.0, 0.0),   // D - Asp - acidic
  vec3(0.25, 0.0, 0.0),  // E - Glu - acidic
  vec3(0.15, 0.1, 0.0),  // F - Phe - aromatic
  vec3(0.0, 0.15, 0.1),  // G - Gly - small
  vec3(0.0, 0.1, 0.2),   // H - His - basic
  vec3(0.0, 0.2, 0.0),   // I - Ile - hydrophobic
  vec3(0.0, 0.0, 0.25),  // K - Lys - basic
  vec3(0.0, 0.2, 0.05),  // L - Leu - hydrophobic
  vec3(0.15, 0.15, 0.0), // M - Met - special
  vec3(0.1, 0.15, 0.2),  // N - Asn - polar
  vec3(0.2, 0.1, 0.0),   // P - Pro - special
  vec3(0.1, 0.1, 0.2),   // Q - Gln - polar
  vec3(0.0, 0.0, 0.2),   // R - Arg - basic
  vec3(0.1, 0.2, 0.2),   // S - Ser - polar
  vec3(0.1, 0.15, 0.15), // T - Thr - polar
  vec3(0.0, 0.2, 0.0),   // V - Val - hydrophobic
  vec3(0.15, 0.05, 0.0), // W - Trp - aromatic
  vec3(0.15, 0.1, 0.0),  // Y - Tyr - aromatic
  vec3(0.1, 0.1, 0.1),   // X - unknown
  vec3(0.3, 0.0, 0.0)    // * - stop
);

const vec3 AA_FG[22] = vec3[22](
  vec3(0.5, 0.9, 0.6),   // A
  vec3(0.9, 0.7, 0.3),   // C
  vec3(1.0, 0.4, 0.4),   // D
  vec3(1.0, 0.5, 0.5),   // E
  vec3(0.8, 0.6, 0.3),   // F
  vec3(0.5, 0.8, 0.6),   // G
  vec3(0.5, 0.6, 0.9),   // H
  vec3(0.5, 0.9, 0.5),   // I
  vec3(0.5, 0.5, 1.0),   // K
  vec3(0.5, 0.9, 0.55),  // L
  vec3(0.8, 0.8, 0.3),   // M
  vec3(0.6, 0.75, 0.9),  // N
  vec3(0.9, 0.6, 0.3),   // P
  vec3(0.6, 0.6, 0.9),   // Q
  vec3(0.5, 0.5, 0.95),  // R
  vec3(0.6, 0.9, 0.9),   // S
  vec3(0.6, 0.8, 0.8),   // T
  vec3(0.5, 0.9, 0.5),   // V
  vec3(0.85, 0.5, 0.3),  // W
  vec3(0.8, 0.6, 0.35),  // Y
  vec3(0.6, 0.6, 0.6),   // X
  vec3(1.0, 0.3, 0.3)    // *
);

// Atlas layout constants (must match MSDFAtlas)
const float ATLAS_COLS = 8.0;
const float GLYPH_COUNT_NT = 5.0;  // A,C,G,T,N
const float GLYPH_COUNT_AA = 22.0; // 20 amino acids + X + *

vec4 getGlyphUV(float glyphIndex, float totalGlyphs) {
  float col = mod(glyphIndex, ATLAS_COLS);
  float row = floor(glyphIndex / ATLAS_COLS);
  float totalRows = ceil(totalGlyphs / ATLAS_COLS);

  float u0 = col / ATLAS_COLS;
  float v0 = row / totalRows;
  float u1 = (col + 1.0) / ATLAS_COLS;
  float v1 = (row + 1.0) / totalRows;

  return vec4(u0, v0, u1, v1);
}

void main() {
  // Calculate which cell this instance represents
  float cellIndex = u_startIndex + a_instanceIndex;

  // Early discard if beyond sequence
  if (cellIndex >= u_totalCells) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0); // Off-screen
    return;
  }

  // Calculate row and column for this cell
  float col = mod(cellIndex, u_cols);
  float row = floor(cellIndex / u_cols);

  // Calculate pixel position
  float rowHeight = u_viewMode > 0.5 ? u_cellSize.y * 2.0 : u_cellSize.y;
  vec2 cellPos = vec2(col * u_cellSize.x, row * rowHeight);

  // Apply scroll offset
  vec2 scrolledPos = cellPos - u_scrollOffset;

  // Transform quad vertex to cell position
  vec2 vertexPos = scrolledPos + a_position * u_cellSize;

  // Convert to clip space
  vec2 clipPos = (vertexPos / u_resolution) * 2.0 - 1.0;
  clipPos.y = -clipPos.y; // Flip Y for canvas coordinates

  gl_Position = vec4(clipPos, 0.0, 1.0);

  // Sample sequence data texture
  vec2 seqTexCoord = vec2(
    mod(cellIndex, u_sequenceSize.x) / u_sequenceSize.x,
    floor(cellIndex / u_sequenceSize.x) / u_sequenceSize.y
  );
  vec4 seqData = texture(u_sequenceData, seqTexCoord);

  // Decode sequence data
  float baseCode = seqData.r * 255.0;    // 0-4 for A,C,G,T,N
  float aminoCode = seqData.g * 255.0;   // 0-21 for amino acids
  float flags = seqData.b * 255.0;       // Bit flags (diff, etc.)

  int baseIdx = int(clamp(baseCode, 0.0, 4.0));
  int aminoIdx = int(clamp(aminoCode, 0.0, 21.0));

  // Set colors based on nucleotide
  v_bgColor = vec4(NT_BG[baseIdx], 1.0);
  v_fgColor = vec4(NT_FG[baseIdx], 1.0);

  // Get glyph UV from atlas
  v_glyphUV = getGlyphUV(baseCode, GLYPH_COUNT_NT);
  v_glyphType = 0.0;

  // Check if diff position
  v_isDiff = mod(flags, 2.0); // Bit 0 = isDiff

  // Pass through texture coordinate
  v_texCoord = a_texCoord;
}
`;

// Fragment shader with MSDF text rendering
export const FRAGMENT_SHADER_SOURCE = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_texCoord;
in vec4 v_glyphUV;
in vec4 v_bgColor;
in vec4 v_fgColor;
in float v_glyphType;
in float v_isDiff;

uniform sampler2D u_glyphAtlas;
uniform float u_showText;        // 1.0 to show text, 0.0 for color-only mode
uniform float u_cellWidth;       // For anti-aliasing calculation
uniform vec4 u_diffHighlight;    // Diff highlight color

out vec4 fragColor;

// MSDF shader - decode multi-channel signed distance field
float median(float r, float g, float b) {
  return max(min(r, g), min(max(r, g), b));
}

void main() {
  // Start with background color
  vec4 color = v_bgColor;

  // Apply diff highlight if needed
  if (v_isDiff > 0.5) {
    color = mix(color, u_diffHighlight, 0.5);
  }

  // Render text if enabled and cell is large enough
  if (u_showText > 0.5 && v_glyphUV.z > v_glyphUV.x) {
    // Map texture coordinates to glyph UV rect
    vec2 glyphTexCoord = mix(v_glyphUV.xy, v_glyphUV.zw, v_texCoord);

    // Sample MSDF texture
    vec4 msdf = texture(u_glyphAtlas, glyphTexCoord);

    // Calculate signed distance
    float sd = median(msdf.r, msdf.g, msdf.b);

    // Calculate screen-space derivative for anti-aliasing
    float screenPxRange = u_cellWidth * 0.5; // MSDF units per screen pixel
    float screenPxDistance = screenPxRange * (sd - 0.5);
    float opacity = clamp(screenPxDistance + 0.5, 0.0, 1.0);

    // Blend foreground over background
    color = mix(color, v_fgColor, opacity);
  }

  fragColor = color;
}
`;

// Simpler vertex shader for fallback (WebGL 1 compatible)
export const VERTEX_SHADER_SOURCE_WEBGL1 = /* glsl */ `
precision highp float;

attribute vec2 a_position;
attribute vec2 a_texCoord;
attribute float a_instanceIndex;

uniform vec2 u_resolution;
uniform vec2 u_cellSize;
uniform vec2 u_scrollOffset;
uniform float u_cols;
uniform float u_totalCells;
uniform float u_startIndex;
uniform sampler2D u_sequenceData;
uniform vec2 u_sequenceSize;

varying vec2 v_texCoord;
varying vec4 v_bgColor;
varying float v_baseCode;

void main() {
  float cellIndex = u_startIndex + a_instanceIndex;

  if (cellIndex >= u_totalCells) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    return;
  }

  float col = mod(cellIndex, u_cols);
  float row = floor(cellIndex / u_cols);

  vec2 cellPos = vec2(col * u_cellSize.x, row * u_cellSize.y);
  vec2 scrolledPos = cellPos - u_scrollOffset;
  vec2 vertexPos = scrolledPos + a_position * u_cellSize;

  vec2 clipPos = (vertexPos / u_resolution) * 2.0 - 1.0;
  clipPos.y = -clipPos.y;

  gl_Position = vec4(clipPos, 0.0, 1.0);

  // Sample sequence
  vec2 seqTexCoord = vec2(
    mod(cellIndex, u_sequenceSize.x) / u_sequenceSize.x,
    floor(cellIndex / u_sequenceSize.x) / u_sequenceSize.y
  );
  vec4 seqData = texture2D(u_sequenceData, seqTexCoord);
  v_baseCode = seqData.r * 255.0;

  // Nucleotide colors
  vec3 colors[5];
  colors[0] = vec3(0.0, 0.25, 0.125); // A
  colors[1] = vec3(0.0, 0.125, 0.25); // C
  colors[2] = vec3(0.25, 0.2, 0.0);   // G
  colors[3] = vec3(0.25, 0.0, 0.0);   // T
  colors[4] = vec3(0.15, 0.15, 0.15); // N

  int idx = int(clamp(v_baseCode, 0.0, 4.0));
  v_bgColor = vec4(colors[idx], 1.0);

  v_texCoord = a_texCoord;
}
`;

export const FRAGMENT_SHADER_SOURCE_WEBGL1 = /* glsl */ `
precision highp float;

varying vec2 v_texCoord;
varying vec4 v_bgColor;
varying float v_baseCode;

void main() {
  gl_FragColor = v_bgColor;
}
`;

/**
 * Compile a shader from source
 */
export function compileShader(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  source: string,
  type: number
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Failed to create shader');

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}`);
  }

  return shader;
}

/**
 * Create a shader program from vertex and fragment shaders
 */
export function createProgram(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error('Failed to create program');

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${info}`);
  }

  return program;
}

/**
 * Create the main rendering program
 */
export function createSequenceProgram(
  gl: WebGL2RenderingContext
): { program: WebGLProgram; locations: Record<string, number | WebGLUniformLocation | null> } {
  const vertexShader = compileShader(gl, VERTEX_SHADER_SOURCE, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(gl, FRAGMENT_SHADER_SOURCE, gl.FRAGMENT_SHADER);
  const program = createProgram(gl, vertexShader, fragmentShader);

  // Get all attribute and uniform locations
  const locations: Record<string, number | WebGLUniformLocation | null> = {
    // Attributes
    a_position: gl.getAttribLocation(program, 'a_position'),
    a_texCoord: gl.getAttribLocation(program, 'a_texCoord'),
    a_instanceIndex: gl.getAttribLocation(program, 'a_instanceIndex'),

    // Uniforms
    u_resolution: gl.getUniformLocation(program, 'u_resolution'),
    u_cellSize: gl.getUniformLocation(program, 'u_cellSize'),
    u_scrollOffset: gl.getUniformLocation(program, 'u_scrollOffset'),
    u_cols: gl.getUniformLocation(program, 'u_cols'),
    u_totalCells: gl.getUniformLocation(program, 'u_totalCells'),
    u_startIndex: gl.getUniformLocation(program, 'u_startIndex'),
    u_sequenceData: gl.getUniformLocation(program, 'u_sequenceData'),
    u_sequenceSize: gl.getUniformLocation(program, 'u_sequenceSize'),
    u_zoomScale: gl.getUniformLocation(program, 'u_zoomScale'),
    u_viewMode: gl.getUniformLocation(program, 'u_viewMode'),
    u_glyphAtlas: gl.getUniformLocation(program, 'u_glyphAtlas'),
    u_showText: gl.getUniformLocation(program, 'u_showText'),
    u_cellWidth: gl.getUniformLocation(program, 'u_cellWidth'),
    u_diffHighlight: gl.getUniformLocation(program, 'u_diffHighlight'),
  };

  return { program, locations };
}

/**
 * Create WebGL 1 fallback program
 */
export function createSequenceProgramWebGL1(
  gl: WebGLRenderingContext
): { program: WebGLProgram; locations: Record<string, number | WebGLUniformLocation | null> } {
  const vertexShader = compileShader(gl, VERTEX_SHADER_SOURCE_WEBGL1, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(gl, FRAGMENT_SHADER_SOURCE_WEBGL1, gl.FRAGMENT_SHADER);
  const program = createProgram(gl, vertexShader, fragmentShader);

  const locations: Record<string, number | WebGLUniformLocation | null> = {
    a_position: gl.getAttribLocation(program, 'a_position'),
    a_texCoord: gl.getAttribLocation(program, 'a_texCoord'),
    a_instanceIndex: gl.getAttribLocation(program, 'a_instanceIndex'),
    u_resolution: gl.getUniformLocation(program, 'u_resolution'),
    u_cellSize: gl.getUniformLocation(program, 'u_cellSize'),
    u_scrollOffset: gl.getUniformLocation(program, 'u_scrollOffset'),
    u_cols: gl.getUniformLocation(program, 'u_cols'),
    u_totalCells: gl.getUniformLocation(program, 'u_totalCells'),
    u_startIndex: gl.getUniformLocation(program, 'u_startIndex'),
    u_sequenceData: gl.getUniformLocation(program, 'u_sequenceData'),
    u_sequenceSize: gl.getUniformLocation(program, 'u_sequenceSize'),
  };

  return { program, locations };
}
