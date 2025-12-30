/// <reference lib="webworker" />

/**
 * Sequence Render Worker
 *
 * Offloads CanvasSequenceGridRenderer to a worker via OffscreenCanvas.
 * Keeps the main thread responsive during heavy scrolling.
 */

import { CanvasSequenceGridRenderer } from '../rendering/CanvasSequenceGridRenderer';
import { PostProcessPipeline, type PostProcessOptions } from '../rendering/PostProcessPipeline';
import type { Theme, ViewMode, ReadingFrame } from '@phage-explorer/core';

type WorkerMessage =
  | {
      type: 'init';
      canvas: OffscreenCanvas;
      theme: Theme;
      viewport: { width: number; height: number };
      options: {
        scanlines: boolean;
        glow: boolean;
        reducedMotion: boolean;
        zoomScale: number;
        enablePinchZoom: boolean;
        snapToCodon: boolean;
        densityMode: 'compact' | 'standard';
        devicePixelRatio: number;
        postProcess?: PostProcessOptions | null;
      };
    }
  | { type: 'resize'; width: number; height: number }
  | { type: 'setSequence'; sequence: string; viewMode: ViewMode; readingFrame: ReadingFrame; aminoSequence: string | null }
  | { type: 'setDiff'; diffSequence: string | null; diffEnabled: boolean; diffMask: Uint8Array | null }
  | { type: 'setTheme'; theme: Theme }
  | { type: 'setReducedMotion'; reducedMotion: boolean }
  | { type: 'setEffects'; scanlines: boolean; glow: boolean }
  | { type: 'setSnapToCodon'; enabled: boolean }
  | { type: 'setDensityMode'; mode: 'compact' | 'standard' }
  | { type: 'setPostProcess'; options: PostProcessOptions | null }
  | { type: 'wheel'; deltaX: number; deltaY: number; deltaMode: 0 | 1 | 2 }
  | { type: 'touchStart'; points: Array<{ x: number; y: number }> }
  | { type: 'touchMove'; points: Array<{ x: number; y: number }> }
  | { type: 'touchEnd' }
  | { type: 'scrollTo'; position: number; center: boolean }
  | { type: 'scrollToStart' }
  | { type: 'scrollToEnd' }
  | { type: 'zoomScale'; scale: number }
  | { type: 'zoomIn'; factor: number }
  | { type: 'zoomOut'; factor: number }
  | { type: 'zoomLevel'; level: 'genome' | 'micro' | 'region' | 'codon' | 'base' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'markDirty' }
  | { type: 'dispose' };

type WorkerResponse =
  | {
      type: 'visibleRange';
      range: ReturnType<CanvasSequenceGridRenderer['getVisibleRange']>;
      scrollPosition: number;
      layout: ReturnType<CanvasSequenceGridRenderer['getLayout']>;
      cellMetrics: ReturnType<CanvasSequenceGridRenderer['getCellMetrics']>;
    }
  | {
      type: 'zoom';
      scale: number;
      preset: ReturnType<CanvasSequenceGridRenderer['getZoomPreset']>;
    }
  | { type: 'ready' }
  | { type: 'error'; message: string };

let renderer: CanvasSequenceGridRenderer | null = null;
let postProcess: PostProcessPipeline | undefined;

const post = (message: WorkerResponse) => {
  self.postMessage(message);
};

const initRenderer = (msg: Extract<WorkerMessage, { type: 'init' }>) => {
  try {
    const { canvas, theme, viewport, options } = msg;
    postProcess = options.postProcess ? new PostProcessPipeline(options.postProcess) : undefined;
    renderer = new CanvasSequenceGridRenderer({
      canvas,
      theme,
      scanlines: options.scanlines,
      glow: options.glow,
      reducedMotion: options.reducedMotion,
      zoomScale: options.zoomScale,
      enablePinchZoom: options.enablePinchZoom,
      snapToCodon: options.snapToCodon,
      densityMode: options.densityMode,
      devicePixelRatio: options.devicePixelRatio,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      postProcess,
      onVisibleRangeChange: (range) => {
        if (!renderer) return;
        post({
          type: 'visibleRange',
          range,
          scrollPosition: renderer.getScrollPosition(),
          layout: renderer.getLayout(),
          cellMetrics: renderer.getCellMetrics(),
        });
      },
      onZoomChange: (scale, preset) => {
        post({ type: 'zoom', scale, preset });
      },
    });

    renderer.resize(viewport.width, viewport.height);
    post({ type: 'ready' });
    post({
      type: 'zoom',
      scale: renderer.getZoomScale(),
      preset: renderer.getZoomPreset(),
    });
    post({
      type: 'visibleRange',
      range: renderer.getVisibleRange(),
      scrollPosition: renderer.getScrollPosition(),
      layout: renderer.getLayout(),
      cellMetrics: renderer.getCellMetrics(),
    });
  } catch (error) {
    post({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
};

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;
  if (msg.type === 'init') {
    initRenderer(msg);
    return;
  }

  if (!renderer) return;

  switch (msg.type) {
    case 'resize':
      renderer.resize(msg.width, msg.height);
      post({
        type: 'visibleRange',
        range: renderer.getVisibleRange(),
        scrollPosition: renderer.getScrollPosition(),
        layout: renderer.getLayout(),
        cellMetrics: renderer.getCellMetrics(),
      });
      break;
    case 'setSequence':
      renderer.setSequence(msg.sequence, msg.viewMode, msg.readingFrame, msg.aminoSequence);
      break;
    case 'setDiff':
      renderer.setDiffMode(msg.diffSequence, msg.diffEnabled, msg.diffMask ?? null);
      break;
    case 'setTheme':
      renderer.setTheme(msg.theme);
      break;
    case 'setReducedMotion':
      renderer.setReducedMotion(msg.reducedMotion);
      break;
    case 'setEffects':
      renderer.setScanlines(msg.scanlines);
      renderer.setGlow(msg.glow);
      break;
    case 'setSnapToCodon':
      renderer.setSnapToCodon(msg.enabled);
      break;
    case 'setDensityMode':
      renderer.setDensityMode(msg.mode);
      break;
    case 'setPostProcess':
      postProcess = msg.options ? new PostProcessPipeline(msg.options) : undefined;
      renderer.setPostProcess(postProcess);
      break;
    case 'wheel':
      renderer.handleWheelDelta(msg.deltaX, msg.deltaY, msg.deltaMode);
      break;
    case 'touchStart':
      renderer.handleTouchStartPoints(msg.points);
      break;
    case 'touchMove':
      renderer.handleTouchMovePoints(msg.points);
      break;
    case 'touchEnd':
      renderer.handleTouchEndPoints();
      break;
    case 'scrollTo':
      renderer.scrollToPosition(msg.position, msg.center);
      break;
    case 'scrollToStart':
      renderer.scrollToStart();
      break;
    case 'scrollToEnd':
      renderer.scrollToEnd();
      break;
    case 'zoomScale':
      renderer.setZoomScale(msg.scale);
      break;
    case 'zoomIn':
      renderer.zoomIn(msg.factor);
      break;
    case 'zoomOut':
      renderer.zoomOut(msg.factor);
      break;
    case 'zoomLevel':
      renderer.setZoomLevel(msg.level);
      break;
    case 'pause':
      renderer.pause();
      break;
    case 'resume':
      renderer.resume();
      break;
    case 'markDirty':
      renderer.markDirty();
      break;
    case 'dispose':
      renderer.dispose();
      renderer = null;
      postProcess = undefined;
      self.close();
      break;
    default:
      break;
  }
};
