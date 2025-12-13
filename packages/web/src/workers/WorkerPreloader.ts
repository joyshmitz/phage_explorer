/**
 * WorkerPreloader - Pre-initialize workers on app mount
 *
 * Creates singleton worker instances for frequently used overlays,
 * making them feel instant when opened.
 */

import * as Comlink from 'comlink';
import type { SearchWorkerAPI } from './types';

// Worker instances and their Comlink-wrapped APIs
let searchWorker: Worker | null = null;
let searchWorkerAPI: Comlink.Remote<SearchWorkerAPI> | null = null;
let searchWorkerReady = false;

// Track initialization state
let preloadStarted = false;
let preloadComplete = false;

/**
 * Get the preloaded search worker API
 * Returns null if worker hasn't been preloaded yet
 */
export function getSearchWorker(): {
  worker: Worker;
  api: Comlink.Remote<SearchWorkerAPI>;
  ready: boolean;
} | null {
  if (!searchWorker || !searchWorkerAPI) {
    return null;
  }
  return {
    worker: searchWorker,
    api: searchWorkerAPI,
    ready: searchWorkerReady,
  };
}

/**
 * Initialize all overlay workers
 * Call this on app mount to preload workers before overlays are opened.
 * Returns a promise that resolves when all workers are ready.
 */
export async function preloadWorkers(): Promise<void> {
  if (preloadStarted) {
    // Already started, wait for completion
    if (preloadComplete) return;
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (preloadComplete) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    });
  }

  preloadStarted = true;

  try {
    // Initialize search worker
    searchWorker = new Worker(
      new URL('./search.worker.ts', import.meta.url),
      { type: 'module' }
    );
    searchWorkerAPI = Comlink.wrap<SearchWorkerAPI>(searchWorker);

    // Verify worker is ready
    try {
      await searchWorkerAPI.ping();
      searchWorkerReady = true;
    } catch (e) {
      console.warn('Search worker failed to initialize:', e);
    }

    // Add more workers here as needed:
    // - CRISPR worker
    // - Anomaly worker
    // - Hilbert worker
    // - DotPlot worker
    // etc.

  } catch (error) {
    console.error('Worker preload failed:', error);
  }

  preloadComplete = true;
}

/**
 * Check if workers have been preloaded
 */
export function isPreloaded(): boolean {
  return preloadComplete;
}

/**
 * Terminate all preloaded workers
 * Call this on app unmount or when workers are no longer needed.
 */
export function terminateWorkers(): void {
  if (searchWorker) {
    searchWorker.terminate();
    searchWorker = null;
    searchWorkerAPI = null;
    searchWorkerReady = false;
  }

  preloadStarted = false;
  preloadComplete = false;
}
