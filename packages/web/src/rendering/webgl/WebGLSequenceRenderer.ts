/**
 * WebGLSequenceRenderer - High-Performance GPU-Accelerated Sequence Renderer
 *
 * State-of-the-art WebGL-based renderer for genome sequence visualization.
 * Provides 60fps scrolling on both desktop and mobile by leveraging:
 *
 * 1. INSTANCED RENDERING - Renders 100K+ cells in a single draw call
 * 2. MSDF TEXT - Crisp text at any zoom level using signed distance fields
 * 3. GPU DATA TEXTURES - Sequence data lives on GPU, no CPU transfer during scroll
 * 4. UNIFORM-BASED SCROLL - Scroll position is a shader uniform, not geometry update
 * 5. AUTOMATIC LOD - Adapts detail level based on zoom for optimal performance
 *
 * Falls back to Canvas 2D renderer if WebGL is unavailable.
 */

import type { Theme, ViewMode, ReadingFrame } from '@phage-explorer/core';
import { VirtualScroller, type VisibleRange, type ScrollState } from '../VirtualScroller';
import { createSequenceProgram, createSequenceProgramWebGL1 } from './shaders';
import { createMSDFAtlas, disposeAtlas, type MSDFAtlasData } from './MSDFAtlas';
import {
  createSequenceTexture,
  updateSequenceTextureDiffMask,
  updateSequenceTextureReadingFrame,
  disposeSequenceTexture,
  type SequenceTextureData,
} from './SequenceTexture';

// Re-export types for convenience
export type { VisibleRange };

export interface WebGLRendererOptions {
  canvas: HTMLCanvasElement;
  theme: Theme;
  cellWidth?: number;
  cellHeight?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  devicePixelRatio?: number;
  zoomScale?: number;
  enablePinchZoom?: boolean;
  snapToCodon?: boolean;
  onZoomChange?: (scale: number) => void;
  onVisibleRangeChange?: (range: VisibleRange) => void;
}

export interface WebGLRenderState {
  sequence: string;
  aminoSequence: string | null;
  viewMode: ViewMode;
  readingFrame: ReadingFrame;
  diffSequence: string | null;
  diffEnabled: boolean;
  diffMask: Uint8Array | null;
}

// WebGL capability detection
export function detectWebGLSupport(): {
  webgl2: boolean;
  webgl1: boolean;
  maxTextureSize: number;
  maxInstances: number;
} {
  const result = {
    webgl2: false,
    webgl1: false,
    maxTextureSize: 0,
    maxInstances: 0,
  };

  // Try WebGL 2
  try {
    const testCanvas = document.createElement('canvas');
    const gl2 = testCanvas.getContext('webgl2');
    if (gl2) {
      result.webgl2 = true;
      result.maxTextureSize = gl2.getParameter(gl2.MAX_TEXTURE_SIZE);

      // Check for instanced arrays (required for our approach)
      const ext = gl2.getExtension('ANGLE_instanced_arrays');
      result.maxInstances = ext ? 1000000 : 100000;

      // Clean up
      const loseContext = gl2.getExtension('WEBGL_lose_context');
      loseContext?.loseContext();
    }
  } catch {
    // WebGL 2 not available
  }

  // Try WebGL 1
  if (!result.webgl2) {
    try {
      const testCanvas = document.createElement('canvas');
      const gl1 = testCanvas.getContext('webgl');
      if (gl1) {
        result.webgl1 = true;
        result.maxTextureSize = gl1.getParameter(gl1.MAX_TEXTURE_SIZE);

        // Check for instanced arrays extension
        const ext = gl1.getExtension('ANGLE_instanced_arrays');
        result.maxInstances = ext ? 65536 : 0;

        const loseContext = gl1.getExtension('WEBGL_lose_context');
        loseContext?.loseContext();
      }
    } catch {
      // WebGL 1 not available
    }
  }

  return result;
}

/**
 * Main WebGL Sequence Renderer
 */
export class WebGLSequenceRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | WebGLRenderingContext | null = null;
  private isWebGL2: boolean = false;
  private theme: Theme;

  // Shader program
  private program: WebGLProgram | null = null;
  private locations: Record<string, number | WebGLUniformLocation | null> = {};

  // Geometry buffers
  private quadVAO: WebGLVertexArrayObject | null = null;
  private quadBuffer: WebGLBuffer | null = null;
  private instanceBuffer: WebGLBuffer | null = null;

  // Textures
  private glyphAtlas: MSDFAtlasData | null = null;
  private sequenceTexture: SequenceTextureData | null = null;

  // Virtual scroller for visible range calculation
  private scroller: VirtualScroller;

  // Rendering state
  private currentState: WebGLRenderState | null = null;
  private cellWidth: number;
  private cellHeight: number;
  private zoomScale: number = 1.0;
  private dpr: number;
  private viewportWidth: number;
  private viewportHeight: number;

  // Animation
  private animationFrameId: number | null = null;
  private isRendering = false;
  private needsRedraw = true;
  private paused = false;

  // Scroll state
  private isScrolling = false;
  private scrollEndTimer: ReturnType<typeof setTimeout> | null = null;

  // Callbacks
  private onZoomChange?: (scale: number) => void;
  private onVisibleRangeChange?: (range: VisibleRange) => void;

  // Pinch zoom state
  private isPinching = false;
  private pinchStartDistance = 0;
  private pinchStartScale = 1.0;
  private enablePinchZoom: boolean;
  private snapToCodon: boolean;

  // Instance buffer size (how many cells we can render in one call)
  private maxInstances = 100000;
  private instanceIndices: Float32Array | null = null;

  constructor(options: WebGLRendererOptions) {
    this.canvas = options.canvas;
    this.theme = options.theme;
    this.cellWidth = options.cellWidth ?? 12;
    this.cellHeight = options.cellHeight ?? 14;
    this.zoomScale = options.zoomScale ?? 1.0;
    this.dpr = options.devicePixelRatio ?? window.devicePixelRatio;
    this.viewportWidth = options.viewportWidth ?? this.canvas.clientWidth;
    this.viewportHeight = options.viewportHeight ?? this.canvas.clientHeight;
    this.enablePinchZoom = options.enablePinchZoom ?? true;
    this.snapToCodon = options.snapToCodon ?? false;
    this.onZoomChange = options.onZoomChange;
    this.onVisibleRangeChange = options.onVisibleRangeChange;

    // Initialize WebGL context
    if (!this.initWebGL()) {
      throw new Error('WebGL not available');
    }

    // Initialize virtual scroller
    this.scroller = new VirtualScroller({
      totalItems: 0,
      itemWidth: this.cellWidth,
      itemHeight: this.cellHeight,
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      overscan: 50,
    });

    // Set up scroll callback
    this.scroller.onScroll((range) => {
      this.isScrolling = true;
      if (this.scrollEndTimer) {
        clearTimeout(this.scrollEndTimer);
      }
      this.scrollEndTimer = setTimeout(() => {
        this.scrollEndTimer = null;
        this.isScrolling = false;
        this.scheduleRender();
      }, 400);

      this.onVisibleRangeChange?.(range);
      this.scheduleRender();
    });

    // Initialize shaders and buffers
    this.initShaders();
    this.initBuffers();
    this.initTextures();

    // Initial canvas resize
    this.resize(this.viewportWidth, this.viewportHeight);
  }

  /**
   * Initialize WebGL context
   */
  private initWebGL(): boolean {
    // Try WebGL 2 first
    try {
      const gl2 = this.canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      }) as WebGL2RenderingContext | null;

      if (gl2) {
        this.gl = gl2;
        this.isWebGL2 = true;
        return true;
      }
    } catch {
      // WebGL 2 not available
    }

    // Fall back to WebGL 1
    try {
      const gl1 = this.canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      }) as WebGLRenderingContext | null;

      if (gl1) {
        // Check for required extensions
        const instanceExt = gl1.getExtension('ANGLE_instanced_arrays');
        if (!instanceExt) {
          console.warn('ANGLE_instanced_arrays not available');
          return false;
        }

        this.gl = gl1;
        this.isWebGL2 = false;
        return true;
      }
    } catch {
      // WebGL 1 not available
    }

    return false;
  }

  /**
   * Initialize shader programs
   */
  private initShaders(): void {
    const gl = this.gl;
    if (!gl) return;

    try {
      if (this.isWebGL2) {
        const { program, locations } = createSequenceProgram(gl as WebGL2RenderingContext);
        this.program = program;
        this.locations = locations;
      } else {
        const { program, locations } = createSequenceProgramWebGL1(gl as WebGLRenderingContext);
        this.program = program;
        this.locations = locations;
      }
    } catch (error) {
      console.error('Failed to initialize shaders:', error);
      throw error;
    }
  }

  /**
   * Initialize geometry buffers
   */
  private initBuffers(): void {
    const gl = this.gl;
    if (!gl) return;

    // Create quad vertices (unit quad)
    const quadVertices = new Float32Array([
      // Position (x, y), TexCoord (u, v)
      0, 0, 0, 0,  // Bottom-left
      1, 0, 1, 0,  // Bottom-right
      0, 1, 0, 1,  // Top-left
      1, 1, 1, 1,  // Top-right
    ]);

    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    // Create instance index buffer
    this.instanceIndices = new Float32Array(this.maxInstances);
    for (let i = 0; i < this.maxInstances; i++) {
      this.instanceIndices[i] = i;
    }

    this.instanceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.instanceIndices, gl.DYNAMIC_DRAW);

    // Create VAO for WebGL 2
    if (this.isWebGL2) {
      const gl2 = gl as WebGL2RenderingContext;
      this.quadVAO = gl2.createVertexArray();
      gl2.bindVertexArray(this.quadVAO);
      this.setupVertexAttributes();
      gl2.bindVertexArray(null);
    }
  }

  /**
   * Set up vertex attributes
   */
  private setupVertexAttributes(): void {
    const gl = this.gl;
    if (!gl || !this.program) return;

    const positionLoc = this.locations.a_position as number;
    const texCoordLoc = this.locations.a_texCoord as number;
    const instanceLoc = this.locations.a_instanceIndex as number;

    // Quad buffer attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);

    // Position
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);

    // TexCoord
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 16, 8);

    // Instance indices
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.enableVertexAttribArray(instanceLoc);
    gl.vertexAttribPointer(instanceLoc, 1, gl.FLOAT, false, 0, 0);

    // Set up instancing
    if (this.isWebGL2) {
      (gl as WebGL2RenderingContext).vertexAttribDivisor(instanceLoc, 1);
    } else {
      const ext = gl.getExtension('ANGLE_instanced_arrays');
      ext?.vertexAttribDivisorANGLE(instanceLoc, 1);
    }
  }

  /**
   * Initialize textures
   */
  private initTextures(): void {
    const gl = this.gl;
    if (!gl) return;

    // Create glyph atlas
    this.glyphAtlas = createMSDFAtlas(gl as WebGL2RenderingContext, this.theme, {
      useMSDF: this.isWebGL2, // Only use MSDF for WebGL 2
    });
  }

  /**
   * Resize canvas
   */
  resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;

    // Update canvas size with DPI
    const pixelWidth = Math.round(width * this.dpr);
    const pixelHeight = Math.round(height * this.dpr);

    this.canvas.width = pixelWidth;
    this.canvas.height = pixelHeight;

    // Update WebGL viewport
    if (this.gl) {
      this.gl.viewport(0, 0, pixelWidth, pixelHeight);
    }

    // Update scroller
    this.scroller.updateOptions({
      viewportWidth: width,
      viewportHeight: height,
      itemWidth: this.cellWidth,
      itemHeight: this.cellHeight,
    });

    this.needsRedraw = true;
    this.scheduleRender();
  }

  /**
   * Set render state (sequence, view mode, etc.)
   */
  setState(state: Partial<WebGLRenderState>): void {
    const gl = this.gl;
    if (!gl) return;

    const prevState = this.currentState;
    this.currentState = { ...this.currentState, ...state } as WebGLRenderState;

    // Check if sequence changed
    if (state.sequence !== undefined && state.sequence !== prevState?.sequence) {
      // Dispose old texture
      if (this.sequenceTexture) {
        disposeSequenceTexture(gl, this.sequenceTexture);
      }

      // Create new sequence texture
      this.sequenceTexture = createSequenceTexture(gl as WebGL2RenderingContext, state.sequence, {
        readingFrame: this.currentState.readingFrame,
        diffMask: this.currentState.diffMask,
      });

      // Update scroller
      this.scroller.updateOptions({
        totalItems: state.sequence.length,
      });
    }

    // Update diff mask
    if (state.diffMask !== undefined && this.sequenceTexture) {
      updateSequenceTextureDiffMask(gl as WebGL2RenderingContext, this.sequenceTexture, state.diffMask);
    }

    // Update reading frame
    if (state.readingFrame !== undefined && this.sequenceTexture && this.currentState?.sequence) {
      updateSequenceTextureReadingFrame(
        gl as WebGL2RenderingContext,
        this.sequenceTexture,
        this.currentState.sequence,
        state.readingFrame
      );
    }

    this.needsRedraw = true;
    this.scheduleRender();
  }

  /**
   * Schedule a render on the next animation frame
   */
  private scheduleRender(): void {
    if (this.animationFrameId !== null || this.paused) return;

    this.animationFrameId = requestAnimationFrame(() => {
      this.animationFrameId = null;
      this.render();
    });
  }

  /**
   * Main render function
   */
  private render(): void {
    const gl = this.gl;
    if (!gl || !this.program || this.isRendering || this.paused) return;

    this.isRendering = true;

    try {
      // Clear with background color
      const bgColor = this.hexToRgb(this.theme.colors.background);
      gl.clearColor(bgColor.r, bgColor.g, bgColor.b, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Skip if no sequence
      if (!this.currentState?.sequence || !this.sequenceTexture) {
        this.isRendering = false;
        return;
      }

      // Use shader program
      gl.useProgram(this.program);

      // Get visible range
      const range = this.scroller.getVisibleRange();
      const cols = this.scroller.getLayout().cols;

      // Calculate instance count
      const startCell = range.startRow * cols;
      const endCell = Math.min(range.endRow * cols, this.currentState.sequence.length);
      const instanceCount = Math.min(endCell - startCell, this.maxInstances);

      if (instanceCount <= 0) {
        this.isRendering = false;
        return;
      }

      // Set uniforms
      gl.uniform2f(
        this.locations.u_resolution as WebGLUniformLocation,
        this.viewportWidth,
        this.viewportHeight
      );

      gl.uniform2f(
        this.locations.u_cellSize as WebGLUniformLocation,
        this.cellWidth,
        this.cellHeight
      );

      gl.uniform2f(
        this.locations.u_scrollOffset as WebGLUniformLocation,
        range.offsetX,
        range.startRow * this.cellHeight + range.offsetY
      );

      gl.uniform1f(this.locations.u_cols as WebGLUniformLocation, cols);
      gl.uniform1f(this.locations.u_totalCells as WebGLUniformLocation, this.currentState.sequence.length);
      gl.uniform1f(this.locations.u_startIndex as WebGLUniformLocation, startCell);
      gl.uniform2f(
        this.locations.u_sequenceSize as WebGLUniformLocation,
        this.sequenceTexture.width,
        this.sequenceTexture.height
      );
      gl.uniform1f(this.locations.u_zoomScale as WebGLUniformLocation, this.zoomScale);
      gl.uniform1f(
        this.locations.u_viewMode as WebGLUniformLocation,
        this.currentState.viewMode === 'dual' ? 1.0 : 0.0
      );

      // Show text only when cells are large enough
      const showText = this.cellWidth >= 8 && this.cellHeight >= 10;
      if (this.locations.u_showText) {
        gl.uniform1f(this.locations.u_showText as WebGLUniformLocation, showText ? 1.0 : 0.0);
        gl.uniform1f(this.locations.u_cellWidth as WebGLUniformLocation, this.cellWidth);
      }

      // Diff highlight color
      if (this.locations.u_diffHighlight) {
        gl.uniform4f(this.locations.u_diffHighlight as WebGLUniformLocation, 1.0, 0.5, 0.0, 1.0);
      }

      // Bind textures
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.sequenceTexture.texture);
      gl.uniform1i(this.locations.u_sequenceData as WebGLUniformLocation, 0);

      if (this.glyphAtlas?.texture && this.locations.u_glyphAtlas) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.glyphAtlas.texture);
        gl.uniform1i(this.locations.u_glyphAtlas as WebGLUniformLocation, 1);
      }

      // Bind VAO or set up attributes manually
      if (this.isWebGL2 && this.quadVAO) {
        (gl as WebGL2RenderingContext).bindVertexArray(this.quadVAO);
      } else {
        this.setupVertexAttributes();
      }

      // Draw instanced quads
      if (this.isWebGL2) {
        (gl as WebGL2RenderingContext).drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, instanceCount);
      } else {
        const ext = gl.getExtension('ANGLE_instanced_arrays');
        ext?.drawArraysInstancedANGLE(gl.TRIANGLE_STRIP, 0, 4, instanceCount);
      }

      // Cleanup
      if (this.isWebGL2 && this.quadVAO) {
        (gl as WebGL2RenderingContext).bindVertexArray(null);
      }
    } finally {
      this.isRendering = false;
      this.needsRedraw = false;
    }
  }

  /**
   * Convert hex color to RGB (0-1 range)
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { r: 0, g: 0, b: 0 };

    return {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    };
  }

  // ========== Public API (matching CanvasSequenceGridRenderer) ==========

  setTheme(theme: Theme): void {
    this.theme = theme;

    // Recreate glyph atlas with new theme
    if (this.gl && this.glyphAtlas) {
      disposeAtlas(this.gl, this.glyphAtlas);
      this.glyphAtlas = createMSDFAtlas(this.gl as WebGL2RenderingContext, theme, {
        useMSDF: this.isWebGL2,
      });
    }

    this.needsRedraw = true;
    this.scheduleRender();
  }

  setZoomScale(scale: number): void {
    this.zoomScale = Math.max(0.1, Math.min(4.0, scale));

    // Update cell sizes based on zoom
    const baseWidth = 12;
    const baseHeight = 14;
    this.cellWidth = Math.round(baseWidth * this.zoomScale);
    this.cellHeight = Math.round(baseHeight * this.zoomScale);

    this.scroller.updateOptions({
      itemWidth: this.cellWidth,
      itemHeight: this.cellHeight,
    });

    this.onZoomChange?.(this.zoomScale);
    this.onVisibleRangeChange?.(this.scroller.getVisibleRange());

    this.needsRedraw = true;
    this.scheduleRender();
  }

  getZoomScale(): number {
    return this.zoomScale;
  }

  zoomIn(factor = 1.3): void {
    this.setZoomScale(this.zoomScale * factor);
  }

  zoomOut(factor = 1.3): void {
    this.setZoomScale(this.zoomScale / factor);
  }

  /**
   * Set zoom to a preset level
   */
  setZoomLevel(level: 'genome' | 'micro' | 'region' | 'codon' | 'base'): void {
    // Map zoom levels to scale values matching CanvasSequenceGridRenderer
    const ZOOM_LEVEL_SCALES: Record<string, number> = {
      genome: 0.1,
      region: 0.4,
      micro: 0.75,
      codon: 1.0,
      base: 1.5,
    };
    const scale = ZOOM_LEVEL_SCALES[level] ?? 1.0;
    this.setZoomScale(scale);
  }

  handleWheel(event: WheelEvent): void {
    this.scroller.handleWheel(event);
  }

  handleWheelDelta(deltaX: number, deltaY: number, deltaMode: 0 | 1 | 2 = 0): void {
    this.scroller.handleWheelDelta(deltaX, deltaY, deltaMode);
  }

  handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 2 && this.enablePinchZoom) {
      this.handlePinchStart(event);
      return;
    }
    if (event.touches.length === 1) {
      this.scroller.handleTouchStart(event);
    }
  }

  handleTouchMove(event: TouchEvent): void {
    if (event.touches.length === 2 && this.isPinching) {
      this.handlePinchMove(event);
      return;
    }
    if (event.touches.length === 1) {
      this.scroller.handleTouchMove(event);
    }
  }

  handleTouchEnd(_event?: TouchEvent): void {
    if (this.isPinching) {
      this.handlePinchEnd();
      return;
    }
    this.scroller.handleTouchEnd();
  }

  private handlePinchStart(event: TouchEvent): void {
    if (event.touches.length !== 2) return;

    this.isPinching = true;
    this.pinchStartScale = this.zoomScale;

    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    this.pinchStartDistance = Math.sqrt(dx * dx + dy * dy);

    this.scroller.stopMomentum();
  }

  private handlePinchMove(event: TouchEvent): void {
    if (!this.isPinching || event.touches.length !== 2) return;

    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const scale = this.pinchStartScale * (distance / this.pinchStartDistance);
    this.setZoomScale(scale);
  }

  private handlePinchEnd(): void {
    this.isPinching = false;
  }

  scrollToPosition(position: number, center = true): void {
    this.scroller.scrollToIndex(position, center);
  }

  scrollToStart(): void {
    this.scroller.scrollToStart();
  }

  scrollToEnd(): void {
    this.scroller.scrollToEnd();
  }

  getVisibleRange(): VisibleRange {
    return this.scroller.getVisibleRange();
  }

  getScrollPosition(): number {
    return this.scroller.getScrollState().scrollY;
  }

  getLayout(): { cols: number; rows: number; totalHeight: number; totalWidth: number } {
    const layout = this.scroller.getLayout();
    return {
      cols: layout.cols,
      rows: layout.rows,
      totalHeight: layout.totalHeight,
      totalWidth: layout.totalWidth,
    };
  }

  getCellMetrics(): { cellWidth: number; cellHeight: number; rowHeight: number } {
    const rowHeight = this.currentState?.viewMode === 'dual'
      ? this.cellHeight * 2
      : this.cellHeight;
    return { cellWidth: this.cellWidth, cellHeight: this.cellHeight, rowHeight };
  }

  getIndexAtPoint(x: number, y: number): number | null {
    return this.scroller.getIndexAtPoint(x, y);
  }

  pause(): void {
    this.paused = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resume(): void {
    this.paused = false;
    if (this.needsRedraw) {
      this.scheduleRender();
    }
  }

  isPaused(): boolean {
    return this.paused;
  }

  markDirty(): void {
    this.needsRedraw = true;
    this.scheduleRender();
  }

  setDiffMode(refSequence: string | null, enabled: boolean, diffMask?: Uint8Array | null): void {
    this.setState({
      diffSequence: refSequence,
      diffEnabled: enabled,
      diffMask: diffMask ?? null,
    });
  }

  setSnapToCodon(enabled: boolean): void {
    this.snapToCodon = enabled;
    this.scroller.updateOptions({
      snapToMultiple: enabled ? 3 : null,
    });
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    // Cancel animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Clear scroll timer
    if (this.scrollEndTimer) {
      clearTimeout(this.scrollEndTimer);
      this.scrollEndTimer = null;
    }

    const gl = this.gl;
    if (!gl) return;

    // Dispose textures
    if (this.glyphAtlas) {
      disposeAtlas(gl, this.glyphAtlas);
      this.glyphAtlas = null;
    }

    if (this.sequenceTexture) {
      disposeSequenceTexture(gl, this.sequenceTexture);
      this.sequenceTexture = null;
    }

    // Dispose buffers
    if (this.quadBuffer) {
      gl.deleteBuffer(this.quadBuffer);
      this.quadBuffer = null;
    }

    if (this.instanceBuffer) {
      gl.deleteBuffer(this.instanceBuffer);
      this.instanceBuffer = null;
    }

    // Dispose VAO
    if (this.isWebGL2 && this.quadVAO) {
      (gl as WebGL2RenderingContext).deleteVertexArray(this.quadVAO);
      this.quadVAO = null;
    }

    // Dispose program
    if (this.program) {
      gl.deleteProgram(this.program);
      this.program = null;
    }

    // Dispose scroller
    this.scroller.dispose();

    // Lose context to free GPU resources
    const loseContext = gl.getExtension('WEBGL_lose_context');
    loseContext?.loseContext();

    this.gl = null;
  }
}

export default WebGLSequenceRenderer;
