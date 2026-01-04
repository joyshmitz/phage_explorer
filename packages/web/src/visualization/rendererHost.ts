import type { Theme } from '@phage-explorer/core';
import type { PhageRepository } from '../db';
import { GlyphAtlas } from './glyphAtlas';
import { RepositorySequenceSource } from './repoSequenceSource';
import { SequenceGridRenderer } from './sequenceGridRenderer';
import type { RenderFrameInput, SequenceSource } from './types';

interface RendererHostOptions {
  canvas: HTMLCanvasElement;
  repo?: PhageRepository;
  source?: SequenceSource;
  phageId?: number;
  theme: Theme;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
}

/**
 * Binds the visualization renderer to a canvas and repository.
 * Handles atlas prep, source wiring, and resize-driven row width updates.
 */
export class RendererHost {
  private atlas: GlyphAtlas | null = null;
  private renderer: SequenceGridRenderer | null = null;
  private source: RepositorySequenceSource | null = null;
  private externalSource: SequenceSource | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private windowResizeHandler: (() => void) | null = null;

  constructor(private opts: RendererHostOptions) {}

  async init(): Promise<void> {
    const dpr = window.devicePixelRatio ?? 1;
    this.atlas = new GlyphAtlas({
      fontFamily: this.opts.fontFamily ?? 'JetBrains Mono, ui-monospace, monospace',
      fontSize: this.opts.fontSize ?? 14,
      lineHeight: this.opts.lineHeight ?? 16,
      theme: this.opts.theme,
      devicePixelRatio: dpr,
    });
    await this.atlas.prepare();

    if (this.opts.source) {
      this.externalSource = this.opts.source;
    } else if (this.opts.repo && this.opts.phageId !== undefined) {
      this.source = new RepositorySequenceSource(this.opts.repo, this.opts.phageId, this.computeRowWidth());
    }
    this.renderer = new SequenceGridRenderer({
      canvas: this.opts.canvas,
      glyphAtlas: this.atlas,
      theme: this.opts.theme,
      devicePixelRatio: dpr,
    });
    if (this.externalSource) {
      this.renderer.attachSource(this.externalSource);
    } else if (this.source) {
      this.renderer.attachSource(this.source);
    }
    this.observeResize();
  }

  setPhage(phageId: number): void {
    this.source?.setPhage(phageId);
  }

  async render(frame: RenderFrameInput): Promise<void> {
    if (!this.renderer) return;
    // Update row width if viewport changed materially
    const nextWidth = this.computeRowWidth();
    this.source?.setRowWidth(nextWidth);
    await this.renderer.renderFrame(frame);
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.windowResizeHandler) {
      window.removeEventListener('resize', this.windowResizeHandler);
      this.windowResizeHandler = null;
    }
    this.source = null;
    this.externalSource = null;
    this.renderer = null;
    this.atlas = null;
  }

  private computeRowWidth(): number {
    const atlasWidth = this.atlas?.getMetrics().width ?? 8;
    const usableWidth = Math.max(1, this.opts.canvas.clientWidth - 80);
    return Math.max(1, Math.floor(usableWidth / atlasWidth));
  }

  private observeResize(): void {
    if (typeof ResizeObserver === 'undefined') {
      this.windowResizeHandler = () => {
        const width = this.computeRowWidth();
        this.source?.setRowWidth(width);
      };
      window.addEventListener('resize', this.windowResizeHandler);
      return;
    }
    this.resizeObserver = new ResizeObserver(() => {
      const width = this.computeRowWidth();
      this.source?.setRowWidth(width);
    });
    this.resizeObserver.observe(this.opts.canvas);
  }
}
