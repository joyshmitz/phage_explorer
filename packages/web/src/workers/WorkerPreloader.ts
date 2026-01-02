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
let preloadPromise: Promise<void> | null = null;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return await new Promise<T | null>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      resolve(null);
    }, timeoutMs);

    promise
      .then((value) => {
        if (settled) return;
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        if (settled) return;
        clearTimeout(timer);
        resolve(null);
      });
  });
}

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
    // Already started, return the in-flight promise (or resolve if done)
    if (preloadComplete) return;
    if (preloadPromise) return preloadPromise;
    return;
  }

  preloadStarted = true;
  preloadPromise = (async () => {
    try {
      // Initialize search worker
      const url = new URL('./search.worker.ts', import.meta.url);
      try {
        searchWorker = new Worker(url, { type: 'module' });
      } catch {
        // Fallback for older browsers that support Workers but not module workers.
        searchWorker = new Worker(url);
      }
      searchWorkerAPI = Comlink.wrap<SearchWorkerAPI>(searchWorker);

      // Verify worker is ready
      try {
        const ok = await withTimeout(searchWorkerAPI.ping(), 2500);
        searchWorkerReady = ok === true;
        if (!searchWorkerReady) {
          console.warn('Search worker ping timed out; continuing without preload readiness');
        }
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
  })().finally(() => {
    // Avoid holding on to resolved promises; keep only state flags.
    preloadPromise = null;
  });

  return preloadPromise;
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
