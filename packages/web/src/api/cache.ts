/**
 * API Response Cache
 *
 * Provides localStorage-based caching for API responses to reduce
 * network requests and improve perceived performance.
 */

import type { CacheEntry, CacheConfig } from './types';

const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
  maxEntries: 100,
  storage: 'localStorage',
};

const CACHE_PREFIX = 'phage_api_cache_';
const CACHE_INDEX_KEY = 'phage_api_cache_index';

/**
 * Get storage backend based on config
 */
function getStorage(config: CacheConfig): Storage | null {
  if (typeof window === 'undefined') return null;

  switch (config.storage) {
    case 'localStorage':
      return window.localStorage;
    case 'sessionStorage':
      return window.sessionStorage;
    default:
      return null;
  }
}

/**
 * Generate cache key from API call parameters
 */
export function generateCacheKey(endpoint: string, params: Record<string, unknown>): string {
  const paramStr = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join('&');

  return `${endpoint}:${paramStr}`;
}

/**
 * Get cache index (list of cached keys with timestamps)
 */
function getCacheIndex(storage: Storage): Map<string, number> {
  try {
    const indexStr = storage.getItem(CACHE_INDEX_KEY);
    if (!indexStr) return new Map();

    const indexArr: [string, number][] = JSON.parse(indexStr);
    return new Map(indexArr);
  } catch {
    return new Map();
  }
}

/**
 * Save cache index
 */
function saveCacheIndex(storage: Storage, index: Map<string, number>): void {
  try {
    const indexArr = Array.from(index.entries());
    storage.setItem(CACHE_INDEX_KEY, JSON.stringify(indexArr));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Evict oldest entries if over max entries limit
 */
function evictOldEntries(
  storage: Storage,
  index: Map<string, number>,
  maxEntries: number
): void {
  if (index.size <= maxEntries) return;

  // Sort by timestamp and remove oldest
  const sorted = Array.from(index.entries())
    .sort(([, a], [, b]) => a - b);

  const toRemove = sorted.slice(0, index.size - maxEntries);

  for (const [key] of toRemove) {
    storage.removeItem(CACHE_PREFIX + key);
    index.delete(key);
  }
}

/**
 * Get cached value if it exists and is not expired
 */
export function getCached<T>(
  key: string,
  config: Partial<CacheConfig> = {}
): T | null {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const storage = getStorage(fullConfig);
  if (!storage) return null;

  try {
    const entryStr = storage.getItem(CACHE_PREFIX + key);
    if (!entryStr) return null;

    const entry: CacheEntry<T> = JSON.parse(entryStr);
    const now = Date.now();

    // Check if expired
    if (now > entry.timestamp + entry.ttl) {
      storage.removeItem(CACHE_PREFIX + key);
      const index = getCacheIndex(storage);
      index.delete(key);
      saveCacheIndex(storage, index);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Store value in cache
 */
export function setCache<T>(
  key: string,
  data: T,
  config: Partial<CacheConfig> & { ttl?: number } = {}
): boolean {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const storage = getStorage(fullConfig);
  if (!storage) return false;

  const ttl = config.ttl ?? fullConfig.defaultTTL;
  const now = Date.now();

  const entry: CacheEntry<T> = {
    data,
    timestamp: now,
    ttl,
  };

  try {
    storage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));

    // Update index
    const index = getCacheIndex(storage);
    index.set(key, now);
    evictOldEntries(storage, index, fullConfig.maxEntries);
    saveCacheIndex(storage, index);

    return true;
  } catch {
    // Storage full - try to make room
    const index = getCacheIndex(storage);
    evictOldEntries(storage, index, Math.floor(fullConfig.maxEntries / 2));
    saveCacheIndex(storage, index);

    // Retry
    try {
      storage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Remove a specific cache entry
 */
export function removeCache(
  key: string,
  config: Partial<CacheConfig> = {}
): void {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const storage = getStorage(fullConfig);
  if (!storage) return;

  storage.removeItem(CACHE_PREFIX + key);
  const index = getCacheIndex(storage);
  index.delete(key);
  saveCacheIndex(storage, index);
}

/**
 * Clear all cache entries
 */
export function clearCache(config: Partial<CacheConfig> = {}): void {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const storage = getStorage(fullConfig);
  if (!storage) return;

  const index = getCacheIndex(storage);

  for (const key of index.keys()) {
    storage.removeItem(CACHE_PREFIX + key);
  }

  storage.removeItem(CACHE_INDEX_KEY);
}

/**
 * Get cache statistics
 */
export function getCacheStats(
  config: Partial<CacheConfig> = {}
): { entries: number; totalSize: number; oldestEntry: Date | null } {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const storage = getStorage(fullConfig);
  if (!storage) return { entries: 0, totalSize: 0, oldestEntry: null };

  const index = getCacheIndex(storage);
  let totalSize = 0;
  let oldestTimestamp = Infinity;

  for (const [key, timestamp] of index.entries()) {
    const item = storage.getItem(CACHE_PREFIX + key);
    if (item) {
      totalSize += item.length * 2; // Rough estimate (2 bytes per char)
    }
    if (timestamp < oldestTimestamp) {
      oldestTimestamp = timestamp;
    }
  }

  return {
    entries: index.size,
    totalSize,
    oldestEntry: oldestTimestamp === Infinity ? null : new Date(oldestTimestamp),
  };
}

/**
 * Higher-order function to wrap API calls with caching
 */
export function withCache<T, A extends unknown[]>(
  fn: (...args: A) => Promise<T>,
  keyGenerator: (...args: A) => string,
  options: { ttl?: number } = {}
): (...args: A) => Promise<T> {
  return async (...args: A): Promise<T> => {
    const key = keyGenerator(...args);

    // Try cache first
    const cached = getCached<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const result = await fn(...args);
    setCache(key, result, { ttl: options.ttl });
    return result;
  };
}
