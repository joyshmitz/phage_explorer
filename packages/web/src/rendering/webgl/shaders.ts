/**
 * WebGL Sequence Renderer Shaders
 *
 * High-performance GLSL shaders for genome sequence rendering.
 * These shaders replicate EXACTLY what the Canvas 2D renderer does:
 * - Use pre-rendered glyph atlas (background + text baked together)
 * - Simple texture blitting, no fancy MSDF
 * - Theme colors come from the atlas, not hardcoded in shader
 */

// Vertex shader for instanced quad rendering
// Each instance is one cell that samples from the glyph atlas
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
uniform sampler2D u_sequenceData; // Sequence encoded as texture (R=base code 0-4)
uniform vec2 u_sequenceSize;    // Sequence texture dimensions
uniform float u_viewMode;       // 0=single, 1=dual (DNA+amino)

// Glyph atlas uniforms
uniform vec2 u_atlasSize;       // Atlas texture dimensions in cells (cols, rows)
uniform float u_nucleotideCount; // Number of nucleotide glyphs (5: A,C,G,T,N)

// Outputs to fragment shader
out vec2 v_atlasTexCoord;       // Where to sample in the glyph atlas
out float v_visible;            // 1.0 if visible, 0.0 if should be discarded

void main() {
  // Calculate which cell this instance represents
  float cellIndex = u_startIndex + a_instanceIndex;

  // Early discard if beyond sequence
  if (cellIndex >= u_totalCells) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0); // Off-screen
    v_visible = 0.0;
    return;
  }
  v_visible = 1.0;

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

  // Sample sequence data texture to get nucleotide code (0-4 for A,C,G,T,N)
  vec2 seqTexCoord = vec2(
    (mod(cellIndex, u_sequenceSize.x) + 0.5) / u_sequenceSize.x,
    (floor(cellIndex / u_sequenceSize.x) + 0.5) / u_sequenceSize.y
  );
  vec4 seqData = texture(u_sequenceData, seqTexCoord);
  float baseCode = floor(seqData.r * 255.0 + 0.5); // 0-4 for A,C,G,T,N
  baseCode = clamp(baseCode, 0.0, 4.0);

  // Calculate UV coordinates in the glyph atlas
  // Atlas layout: nucleotides in first row (indices 0-4)
  // Each glyph occupies 1/atlasSize.x width and 1/atlasSize.y height
  float glyphCol = mod(baseCode, u_atlasSize.x);
  float glyphRow = floor(baseCode / u_atlasSize.x);

  // Calculate the UV rect for this glyph
  float u0 = glyphCol / u_atlasSize.x;
  float v0 = glyphRow / u_atlasSize.y;
  float u1 = (glyphCol + 1.0) / u_atlasSize.x;
  float v1 = (glyphRow + 1.0) / u_atlasSize.y;

  // Interpolate based on quad corner (a_texCoord)
  v_atlasTexCoord = vec2(
    mix(u0, u1, a_texCoord.x),
    mix(v0, v1, a_texCoord.y)
  );
}
`;

// Fragment shader - simple texture sampling from glyph atlas
// This replicates exactly what Canvas drawImage() does
export const FRAGMENT_SHADER_SOURCE = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_atlasTexCoord;
in float v_visible;

uniform sampler2D u_glyphAtlas;  // Pre-rendered glyph atlas (same as Canvas GlyphAtlas)

out vec4 fragColor;

void main() {
  // Discard if not visible
  if (v_visible < 0.5) {
    discard;
  }

  // Simply sample the atlas - it already has background + text baked in
  // This is exactly what Canvas drawImage() does
  fragColor = texture(u_glyphAtlas, v_atlasTexCoord);
}
`;

// WebGL 1 fallback shaders
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
uniform vec2 u_atlasSize;

varying vec2 v_atlasTexCoord;
varying float v_visible;

void main() {
  float cellIndex = u_startIndex + a_instanceIndex;

  if (cellIndex >= u_totalCells) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    v_visible = 0.0;
    return;
  }
  v_visible = 1.0;

  float col = mod(cellIndex, u_cols);
  float row = floor(cellIndex / u_cols);

  vec2 cellPos = vec2(col * u_cellSize.x, row * u_cellSize.y);
  vec2 scrolledPos = cellPos - u_scrollOffset;
  vec2 vertexPos = scrolledPos + a_position * u_cellSize;

  vec2 clipPos = (vertexPos / u_resolution) * 2.0 - 1.0;
  clipPos.y = -clipPos.y;

  gl_Position = vec4(clipPos, 0.0, 1.0);

  // Sample sequence data
  vec2 seqTexCoord = vec2(
    (mod(cellIndex, u_sequenceSize.x) + 0.5) / u_sequenceSize.x,
    (floor(cellIndex / u_sequenceSize.x) + 0.5) / u_sequenceSize.y
  );
  vec4 seqData = texture2D(u_sequenceData, seqTexCoord);
  float baseCode = floor(seqData.r * 255.0 + 0.5);
  baseCode = clamp(baseCode, 0.0, 4.0);

  // Calculate atlas UV
  float glyphCol = mod(baseCode, u_atlasSize.x);
  float glyphRow = floor(baseCode / u_atlasSize.x);

  float u0 = glyphCol / u_atlasSize.x;
  float v0 = glyphRow / u_atlasSize.y;
  float u1 = (glyphCol + 1.0) / u_atlasSize.x;
  float v1 = (glyphRow + 1.0) / u_atlasSize.y;

  v_atlasTexCoord = vec2(
    mix(u0, u1, a_texCoord.x),
    mix(v0, v1, a_texCoord.y)
  );
}
`;

export const FRAGMENT_SHADER_SOURCE_WEBGL1 = /* glsl */ `
precision highp float;

varying vec2 v_atlasTexCoord;
varying float v_visible;

uniform sampler2D u_glyphAtlas;

void main() {
  if (v_visible < 0.5) {
    discard;
  }
  gl_FragColor = texture2D(u_glyphAtlas, v_atlasTexCoord);
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
    u_viewMode: gl.getUniformLocation(program, 'u_viewMode'),
    u_glyphAtlas: gl.getUniformLocation(program, 'u_glyphAtlas'),
    u_atlasSize: gl.getUniformLocation(program, 'u_atlasSize'),
    u_nucleotideCount: gl.getUniformLocation(program, 'u_nucleotideCount'),
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
    u_glyphAtlas: gl.getUniformLocation(program, 'u_glyphAtlas'),
    u_atlasSize: gl.getUniformLocation(program, 'u_atlasSize'),
  };

  return { program, locations };
}
