/**
 * CanvasSequenceGridRenderer - Main Rendering Engine
 *
 * High-performance canvas renderer for genome sequence grids.
 * Features: double-buffering, dirty region tracking, color batching,
 * high-DPI support, and 60fps target rendering.
 */

import type { Theme, ViewMode, ReadingFrame } from '@phage-explorer/core';
import { GlyphAtlas } from './GlyphAtlas';
import { VirtualScroller, type VisibleRange } from './VirtualScroller';
import { PostProcessPipeline, type PostProcessOptions } from './PostProcessPipeline';

export interface SequenceGridOptions {
  /** Canvas element to render to */
  canvas: HTMLCanvasElement;
  /** Initial theme */
  theme: Theme;
  /** Cell width in CSS pixels */
  cellWidth?: number;
  /** Cell height in CSS pixels */
  cellHeight?: number;
  /** Enable scanline effect */
  scanlines?: boolean;
  /** Enable glow effect */
  glow?: boolean;
  /** Optional post-processing pipeline */
  postProcess?: PostProcessPipeline;
  /** Reduced motion flag */
  reducedMotion?: boolean;
  /** Initial zoom scale (0.1 to 4.0, default 1.0) */
  zoomScale?: number;
  /** Enable pinch-to-zoom on mobile */
  enablePinchZoom?: boolean;
  /** Callback when zoom changes */
  onZoomChange?: (scale: number, preset: ZoomPreset) => void;
}

export interface GridRenderState {
  sequence: string;
  viewMode: ViewMode;
  readingFrame: ReadingFrame;
  diffSequence: string | null;
  diffEnabled: boolean;
  diffMask: Uint8Array | null;
}

// Zoom level presets for mobile sequence grid
// Users can pinch-to-zoom between these levels
export type ZoomLevel = 'genome' | 'region' | 'codon' | 'base';

export interface ZoomPreset {
  cellWidth: number;
  cellHeight: number;
  showText: boolean;
  showAA: boolean;  // Show amino acid row below DNA
  label: string;
}

// Zoom presets - from ultra-dense genome overview to single-base detail
const ZOOM_PRESETS: Record<ZoomLevel, ZoomPreset> = {
  genome: { cellWidth: 1, cellHeight: 1, showText: false, showAA: false, label: 'Genome' },
  region: { cellWidth: 3, cellHeight: 3, showText: false, showAA: false, label: 'Region' },
  codon: { cellWidth: 8, cellHeight: 10, showText: true, showAA: true, label: 'Codon' },
  base: { cellWidth: 16, cellHeight: 20, showText: true, showAA: true, label: 'Base' },
};

// Get zoom preset based on scale factor (0.25 to 4.0)
function getZoomPresetForScale(scale: number): ZoomPreset {
  if (scale <= 0.3) return ZOOM_PRESETS.genome;
  if (scale <= 0.6) return ZOOM_PRESETS.region;
  if (scale <= 1.5) return ZOOM_PRESETS.codon;
  return ZOOM_PRESETS.base;
}

// Orientation detection for mobile devices
function isLandscape(viewportWidth: number, viewportHeight: number): boolean {
  return viewportWidth > viewportHeight;
}

// Responsive BASE cell sizes - these get multiplied by zoom scale
// Mobile-first with orientation awareness for maximum utility
function getResponsiveCellSize(
  viewportWidth: number,
  viewportHeight?: number
): { width: number; height: number } {
  const height = viewportHeight ?? viewportWidth * 0.6; // Assume portrait if no height
  const landscape = isLandscape(viewportWidth, height);

  // Mobile devices (< 768px width in portrait, < 1024px in landscape)
  if (viewportWidth < 375) {
    // Tiny phones - use micro-text optimized cells
    return landscape
      ? { width: 5, height: 6 }   // Landscape: dense, many columns
      : { width: 6, height: 8 };  // Portrait: slightly larger for touch
  }
  if (viewportWidth < 480) {
    // Small phones (iPhone SE, etc.)
    return landscape
      ? { width: 5, height: 6 }
      : { width: 7, height: 9 };
  }
  if (viewportWidth < 640) {
    // Standard phones
    return landscape
      ? { width: 6, height: 7 }
      : { width: 7, height: 9 };
  }
  if (viewportWidth < 768) {
    // Large phones / small tablets portrait
    return landscape
      ? { width: 6, height: 8 }
      : { width: 8, height: 10 };
  }
  if (viewportWidth < 1024) {
    // Tablets
    return landscape
      ? { width: 8, height: 10 }
      : { width: 10, height: 12 };
  }
  if (viewportWidth < 1440) {
    // Small laptops / tablets landscape
    return { width: 12, height: 14 };
  }
  // Large screens - full readability
  return { width: 16, height: 20 };
}

const DEFAULT_CELL_WIDTH = 16;
const DEFAULT_CELL_HEIGHT = 20;

export class CanvasSequenceGridRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private backBuffer: OffscreenCanvas | null = null;
  private backCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;

  private theme: Theme;
  private glyphAtlas: GlyphAtlas;
  private scroller: VirtualScroller;

  private baseCellWidth: number;  // Base cell size before zoom
  private baseCellHeight: number;
  private cellWidth: number;      // Effective cell size after zoom
  private cellHeight: number;
  private dpr: number;
  private zoomScale: number = 1.0;
  private currentZoomPreset: ZoomPreset;
  private enablePinchZoom: boolean;
  private onZoomChange?: (scale: number, preset: ZoomPreset) => void;

  // Pinch-to-zoom state
  private pinchStartDistance: number = 0;
  private pinchStartScale: number = 1.0;
  private isPinching: boolean = false;

  private currentState: GridRenderState | null = null;
  private dirtyRegions: DOMRect[] = [];
  private needsFullRedraw = true;

  private scanlines: boolean;
  private glow: boolean;
  private animationFrameId: number | null = null;
  private isRendering = false;
  private postProcess?: PostProcessPipeline;
  private reducedMotion: boolean;

  constructor(options: SequenceGridOptions) {
    this.canvas = options.canvas;
    this.theme = options.theme;
    this.scanlines = options.scanlines ?? true;
    this.glow = options.glow ?? false;
    this.postProcess = options.postProcess;
    this.reducedMotion = options.reducedMotion ?? false;
    this.enablePinchZoom = options.enablePinchZoom ?? true;
    this.onZoomChange = options.onZoomChange;

    // Get device pixel ratio for high-DPI
    this.dpr = window.devicePixelRatio || 1;

    // Initialize zoom scale
    this.zoomScale = options.zoomScale ?? 1.0;
    this.currentZoomPreset = getZoomPresetForScale(this.zoomScale);

    // Use responsive BASE cell sizes (before zoom) with orientation awareness
    if (options.cellWidth !== undefined && options.cellHeight !== undefined) {
      this.baseCellWidth = options.cellWidth;
      this.baseCellHeight = options.cellHeight;
    } else {
      const responsiveSize = getResponsiveCellSize(
        this.canvas.clientWidth,
        this.canvas.clientHeight
      );
      this.baseCellWidth = responsiveSize.width;
      this.baseCellHeight = responsiveSize.height;
    }

    // Apply zoom to get effective cell sizes
    this.cellWidth = Math.max(1, Math.round(this.baseCellWidth * this.zoomScale));
    this.cellHeight = Math.max(1, Math.round(this.baseCellHeight * this.zoomScale));

    // Get context
    const ctx = this.canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;

    // Create glyph atlas with effective (zoomed) cell sizes
    this.glyphAtlas = new GlyphAtlas(this.theme, {
      cellWidth: this.cellWidth,
      cellHeight: this.cellHeight,
      devicePixelRatio: this.dpr,
    });

    // Create virtual scroller (will be configured when sequence is set)
    this.scroller = new VirtualScroller({
      totalItems: 0,
      itemWidth: this.cellWidth,
      itemHeight: this.cellHeight,
      viewportWidth: this.canvas.clientWidth,
      viewportHeight: this.canvas.clientHeight,
    });

    // Set up scroll callback
    this.scroller.onScroll(() => this.scheduleRender());

    // Initialize canvas size
    this.resize();
  }

  /**
   * Resize canvas to match container and handle DPI
   */
  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Recalculate responsive BASE cell sizes with orientation awareness
    const responsiveSize = getResponsiveCellSize(width, height);
    this.baseCellWidth = responsiveSize.width;
    this.baseCellHeight = responsiveSize.height;

    // Apply zoom to get effective cell sizes
    this.updateCellSizes();

    // Set canvas size with DPI scaling
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;

    // Reset any existing transform then scale for DPI
    if (typeof this.ctx.setTransform === 'function') {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    this.ctx.scale(this.dpr, this.dpr);

    // Create/resize back buffer
    this.createBackBuffer(width, height);

    // Update scroller viewport and cell sizes
    this.scroller.updateOptions({
      viewportWidth: width,
      viewportHeight: height,
      itemWidth: this.cellWidth,
      itemHeight: this.cellHeight,
    });

    // Mark as needing full redraw
    this.needsFullRedraw = true;
    this.scheduleRender();
  }

  /**
   * Update effective cell sizes based on zoom scale
   */
  private updateCellSizes(): void {
    const newCellWidth = Math.max(1, Math.round(this.baseCellWidth * this.zoomScale));
    const newCellHeight = Math.max(1, Math.round(this.baseCellHeight * this.zoomScale));

    if (newCellWidth !== this.cellWidth || newCellHeight !== this.cellHeight) {
      this.cellWidth = newCellWidth;
      this.cellHeight = newCellHeight;

      // Rebuild glyph atlas with new cell sizes
      this.glyphAtlas = new GlyphAtlas(this.theme, {
        cellWidth: this.cellWidth,
        cellHeight: this.cellHeight,
        devicePixelRatio: this.dpr,
      });
    }
  }

  /**
   * Create double-buffer for smooth rendering
   */
  private createBackBuffer(width: number, height: number): void {
    if (typeof OffscreenCanvas !== 'undefined') {
      this.backBuffer = new OffscreenCanvas(width * this.dpr, height * this.dpr);
      const ctx = this.backBuffer.getContext('2d', { alpha: false });
      if (ctx) {
        this.backCtx = ctx;
        if (typeof ctx.setTransform === 'function') {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        ctx.scale(this.dpr, this.dpr);
      }
    }
  }

  /**
   * Set the sequence to render
   */
  setSequence(
    sequence: string,
    viewMode: ViewMode = 'dna',
    readingFrame: ReadingFrame = 0
  ): void {
    this.currentState = {
      sequence,
      viewMode,
      readingFrame,
      diffSequence: null,
      diffEnabled: false,
      diffMask: null,
    };

    // Update scroller for new sequence length
    this.scroller.updateOptions({
      totalItems: sequence.length,
    });

    this.needsFullRedraw = true;
    this.scheduleRender();
  }

  /**
   * Enable diff mode with reference sequence
   */
  setDiffMode(refSequence: string | null, enabled: boolean, diffMask?: Uint8Array | null): void {
    if (this.currentState) {
      this.currentState.diffSequence = refSequence;
      this.currentState.diffEnabled = enabled;
      this.currentState.diffMask = diffMask ?? null;
      this.needsFullRedraw = true;
      this.scheduleRender();
    }
  }

  /**
   * Update theme
   */
  setTheme(theme: Theme): void {
    this.theme = theme;
    this.glyphAtlas.setTheme(theme);
    this.needsFullRedraw = true;
    this.scheduleRender();
  }

  /**
   * Update reduced-motion preference
   */
  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
    this.needsFullRedraw = true;
    this.scheduleRender();
  }

  /**
   * Update post-processing pipeline
   */
  setPostProcess(pipeline?: PostProcessPipeline): void {
    this.postProcess = pipeline;
    this.needsFullRedraw = true;
    this.scheduleRender();
  }

  /**
   * Set zoom scale (0.1 to 4.0)
   * - 0.1-0.3: Ultra-dense genome view (1-3px cells)
   * - 0.3-0.6: Region view (3-7px cells)
   * - 0.6-1.5: Codon view (8-15px cells, text visible)
   * - 1.5-4.0: Base view (16-48px cells, large text)
   */
  setZoomScale(scale: number): void {
    const clampedScale = Math.max(0.1, Math.min(4.0, scale));
    if (clampedScale === this.zoomScale) return;

    this.zoomScale = clampedScale;
    this.currentZoomPreset = getZoomPresetForScale(clampedScale);

    // Update cell sizes based on new zoom
    this.updateCellSizes();

    // Update scroller with new cell sizes
    this.scroller.updateOptions({
      itemWidth: this.cellWidth,
      itemHeight: this.cellHeight,
    });

    // Notify listeners
    if (this.onZoomChange) {
      this.onZoomChange(this.zoomScale, this.currentZoomPreset);
    }

    this.needsFullRedraw = true;
    this.scheduleRender();
  }

  /**
   * Get current zoom scale
   */
  getZoomScale(): number {
    return this.zoomScale;
  }

  /**
   * Get current zoom preset
   */
  getZoomPreset(): ZoomPreset {
    return this.currentZoomPreset;
  }

  /**
   * Zoom in by a factor
   */
  zoomIn(factor = 1.3): void {
    this.setZoomScale(this.zoomScale * factor);
  }

  /**
   * Zoom out by a factor
   */
  zoomOut(factor = 1.3): void {
    this.setZoomScale(this.zoomScale / factor);
  }

  /**
   * Set zoom to a specific preset level
   */
  setZoomLevel(level: ZoomLevel): void {
    const presetScales: Record<ZoomLevel, number> = {
      genome: 0.15,
      region: 0.45,
      codon: 1.0,
      base: 2.0,
    };
    this.setZoomScale(presetScales[level]);
  }

  /**
   * Handle pinch gesture start (two-finger touch)
   */
  handlePinchStart(event: TouchEvent): void {
    if (!this.enablePinchZoom || event.touches.length !== 2) return;

    this.isPinching = true;
    this.pinchStartScale = this.zoomScale;
    this.pinchStartDistance = this.getTouchDistance(event.touches[0], event.touches[1]);
    this.scroller.stopMomentum(); // Stop any ongoing scroll
  }

  /**
   * Handle pinch gesture move
   */
  handlePinchMove(event: TouchEvent): void {
    if (!this.isPinching || event.touches.length !== 2) return;
    event.preventDefault();

    const currentDistance = this.getTouchDistance(event.touches[0], event.touches[1]);
    const scaleRatio = currentDistance / this.pinchStartDistance;
    const newScale = this.pinchStartScale * scaleRatio;

    this.setZoomScale(newScale);
  }

  /**
   * Handle pinch gesture end
   */
  handlePinchEnd(): void {
    this.isPinching = false;
  }

  /**
   * Calculate distance between two touch points
   */
  private getTouchDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Schedule a render on next animation frame
   */
  scheduleRender(): void {
    if (this.animationFrameId !== null) return;

    this.animationFrameId = requestAnimationFrame(() => {
      this.animationFrameId = null;
      this.render();
    });
  }

  /**
   * Main render loop
   */
  private render(): void {
    if (this.isRendering || !this.currentState) return;
    this.isRendering = true;

    const startTime = performance.now();
    const ctx = this.backCtx ?? this.ctx;
    const { sequence, viewMode, diffSequence, diffEnabled, diffMask } = this.currentState;

    // Get visible range from scroller
    const range = this.scroller.getVisibleRange();
    const layout = this.scroller.getLayout();

    // Clear or redraw only dirty regions
    if (this.needsFullRedraw) {
      ctx.fillStyle = this.theme.colors.background;
      ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
      this.needsFullRedraw = false;
    }

    // Render visible characters
    this.renderVisibleRange(ctx, range, layout, sequence, viewMode, diffSequence, diffEnabled, diffMask);

    // Apply scanline effect
    if (this.scanlines && !this.reducedMotion) {
      this.renderScanlines(ctx);
    }

    // Post-processing hook (no-op if not provided)
    if (this.postProcess && !this.reducedMotion) {
      this.postProcess.process(this.canvas);
    }

    // Copy back buffer to main canvas (reset transform to avoid double-scaling)
    if (this.backBuffer && this.backCtx) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.drawImage(this.backBuffer, 0, 0);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); // Restore DPR scaling
    }

    // Performance tracking
    const endTime = performance.now();
    const frameTime = endTime - startTime;

    if (frameTime > 16.67) {
      console.warn(`Frame took ${frameTime.toFixed(2)}ms (target: 16.67ms)`);
    }

    this.isRendering = false;
  }

  /**
   * Render the visible range of characters
   */
  private renderVisibleRange(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    range: VisibleRange,
    layout: { cols: number; rows: number },
    sequence: string,
    viewMode: ViewMode,
    diffSequence: string | null,
    diffEnabled: boolean,
    diffMask: Uint8Array | null
  ): void {
    const { cellWidth, cellHeight } = this;
    const { offsetY, startRow, endRow } = range;

    // Batch rendering by color for performance
    const drawMethod = viewMode === 'aa'
      ? this.glyphAtlas.drawAminoAcid.bind(this.glyphAtlas)
      : this.glyphAtlas.drawNucleotide.bind(this.glyphAtlas);

    // Pre-calculate diff text settings (avoid setting font on every cell)
    const diffFontSize = Math.max(0, Math.floor(cellHeight * 0.7));
    const shouldDrawDiffText = diffFontSize >= 6;

    // Collect diff cells for batch rendering
    const diffCells: Array<{ x: number; y: number; char: string; fillStyle: string }> = [];

    // Render row by row
    for (let row = startRow; row < endRow; row++) {
      const rowY = (row - startRow) * cellHeight + offsetY;
      const rowStart = row * layout.cols;
      const rowEnd = Math.min(rowStart + layout.cols, sequence.length);

      for (let i = rowStart; i < rowEnd; i++) {
        const col = i - rowStart;
        const x = col * cellWidth;
        const char = sequence[i];

        let diffCode = 0;
        if (diffEnabled) {
          if (diffMask && diffMask.length === sequence.length) {
            diffCode = diffMask[i] ?? 0;
          } else if (diffSequence) {
            diffCode = diffSequence[i] && diffSequence[i] !== char ? 1 : 0;
          }
        }

        if (diffCode > 0) {
          let fillStyle: string;
          switch (diffCode) {
            case 1:
              fillStyle = this.theme.colors.diffHighlight ?? '#facc15'; // substitution
              break;
            case 2:
              fillStyle = '#22c55e'; // insertion relative to A
              break;
            case 3:
              fillStyle = '#ef4444'; // deletion from A
              break;
            default:
              fillStyle = this.theme.colors.diffHighlight ?? '#facc15';
          }
          ctx.fillStyle = fillStyle;
          ctx.fillRect(x, rowY, cellWidth, cellHeight);

          // Collect for batch text rendering
          if (shouldDrawDiffText) {
            diffCells.push({ x, y: rowY, char, fillStyle });
          }
        } else {
          drawMethod(ctx, char, x, rowY, cellWidth, cellHeight);
        }
      }
    }

    // Batch render diff text with proper save/restore
    if (diffCells.length > 0) {
      ctx.save();
      ctx.font = `bold ${diffFontSize}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const cell of diffCells) {
        ctx.fillText(cell.char, cell.x + cellWidth / 2, cell.y + cellHeight / 2);
      }

      ctx.restore();
    }
  }

  /**
   * Render scanline overlay effect
   */
  private renderScanlines(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    for (let y = 0; y < height; y += 2) {
      ctx.fillRect(0, y, width, 1);
    }
  }

  /**
   * Mark a region as dirty (needs redraw)
   */
  markDirty(region?: DOMRect): void {
    if (region) {
      this.dirtyRegions.push(region);
    } else {
      this.needsFullRedraw = true;
    }
    this.scheduleRender();
  }

  /**
   * Handle wheel events
   */
  handleWheel(event: WheelEvent): void {
    this.scroller.handleWheel(event);
  }

  /**
   * Handle touch start (for mobile scrolling or pinch-to-zoom)
   */
  handleTouchStart(event: TouchEvent): void {
    // Two fingers = pinch-to-zoom
    if (event.touches.length === 2) {
      this.handlePinchStart(event);
      return;
    }
    // One finger = scroll
    if (event.touches.length === 1) {
      this.scroller.handleTouchStart(event);
    }
  }

  /**
   * Handle touch move (for mobile scrolling or pinch-to-zoom)
   */
  handleTouchMove(event: TouchEvent): void {
    // Handle pinch
    if (this.isPinching && event.touches.length === 2) {
      this.handlePinchMove(event);
      return;
    }
    // Handle scroll
    if (!this.isPinching && event.touches.length === 1) {
      this.scroller.handleTouchMove(event);
      this.scheduleRender();
    }
  }

  /**
   * Handle touch end (for mobile momentum or end pinch)
   */
  handleTouchEnd(event: TouchEvent): void {
    if (this.isPinching) {
      this.handlePinchEnd();
      return;
    }
    this.scroller.handleTouchEnd(event);
  }

  /**
   * Scroll to a specific position in the sequence
   */
  scrollToPosition(position: number): void {
    this.scroller.scrollToIndex(position);
  }

  /**
   * Scroll to start
   */
  scrollToStart(): void {
    this.scroller.scrollToStart();
  }

  /**
   * Scroll to end
   */
  scrollToEnd(): void {
    this.scroller.scrollToEnd();
  }

  /**
   * Get the index at viewport coordinates
   */
  getIndexAtPoint(x: number, y: number): number | null {
    return this.scroller.getIndexAtPoint(x, y);
  }

  /**
   * Get current scroll position
   */
  getScrollPosition(): number {
    const state = this.scroller.getScrollState();
    const layout = this.scroller.getLayout();
    const row = Math.floor(state.scrollY / this.cellHeight);
    return row * layout.cols;
  }

  /**
   * Get visible range info
   */
  getVisibleRange(): VisibleRange {
    return this.scroller.getVisibleRange();
  }

  /**
   * Cleanup
   */
  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.scroller.dispose();
  }
}

export default CanvasSequenceGridRenderer;
