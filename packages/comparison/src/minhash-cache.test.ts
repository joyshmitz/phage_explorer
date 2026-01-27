/**
 * Tests for MinHash Signature Cache Module
 *
 * Tests LRU cache behavior, memory bounds, eviction policies,
 * and global cache management.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  MinHashCache,
  makeCacheKeyFromId,
  getMinHashCache,
  initMinHashCache,
  clearMinHashCache,
} from './minhash-cache';

describe('MinHashCache', () => {
  let cache: MinHashCache;

  beforeEach(() => {
    cache = new MinHashCache({ maxEntries: 10, maxBytes: 1024 });
  });

  describe('basic operations', () => {
    test('get returns null for non-existent key', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    test('set and get work correctly', () => {
      const sig = new Uint32Array([1, 2, 3, 4]);
      cache.set('key1', sig);
      expect(cache.get('key1')).toEqual(sig);
    });

    test('has returns true for existing key', () => {
      const sig = new Uint32Array([1, 2, 3]);
      cache.set('key1', sig);
      expect(cache.has('key1')).toBe(true);
    });

    test('has returns false for non-existent key', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    test('delete removes entry', () => {
      const sig = new Uint32Array([1, 2, 3]);
      cache.set('key1', sig);
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeNull();
      expect(cache.has('key1')).toBe(false);
    });

    test('delete returns false for non-existent key', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });

    test('clear removes all entries', () => {
      cache.set('key1', new Uint32Array([1]));
      cache.set('key2', new Uint32Array([2]));
      cache.clear();
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.getStats().entries).toBe(0);
    });
  });

  describe('getOrCompute', () => {
    test('returns cached value if present', () => {
      const expectedSig = new Uint32Array([1, 2, 3]);

      // First call - computes and caches
      let firstComputeCalled = false;
      const firstResult = cache.getOrCompute('GATTACA', 5, 128, true, () => {
        firstComputeCalled = true;
        return expectedSig;
      });
      expect(firstComputeCalled).toBe(true);
      expect(firstResult).toEqual(expectedSig);

      // Second call with same params - should return cached value without computing
      let secondComputeCalled = false;
      const secondResult = cache.getOrCompute('GATTACA', 5, 128, true, () => {
        secondComputeCalled = true;
        return new Uint32Array([9, 9, 9]); // Different value to prove it's not called
      });
      expect(secondComputeCalled).toBe(false);
      expect(secondResult).toEqual(expectedSig);
    });

    test('calls compute function on cache miss', () => {
      let computeCalled = false;
      const expectedSig = new Uint32Array([5, 6, 7]);

      const result = cache.getOrCompute('ATCGATCG', 5, 128, true, () => {
        computeCalled = true;
        return expectedSig;
      });

      expect(computeCalled).toBe(true);
      expect(result).toEqual(expectedSig);
    });

    test('caches computed value', () => {
      let computeCount = 0;
      const computeFn = () => {
        computeCount++;
        return new Uint32Array([1, 2, 3]);
      };

      cache.getOrCompute('ATCGATCG', 5, 128, true, computeFn);
      cache.getOrCompute('ATCGATCG', 5, 128, true, computeFn);

      expect(computeCount).toBe(1);
    });

    test('handles null from compute function', () => {
      const result = cache.getOrCompute('ATCG', 5, 128, true, () => null);
      expect(result).toBeNull();
    });
  });

  describe('statistics', () => {
    test('tracks hits and misses', () => {
      cache.set('key1', new Uint32Array([1]));
      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('nonexistent'); // miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(2 / 3, 5);
    });

    test('tracks entry count', () => {
      cache.set('key1', new Uint32Array([1]));
      cache.set('key2', new Uint32Array([2]));
      expect(cache.getStats().entries).toBe(2);
    });

    test('tracks bytes used', () => {
      const sig1 = new Uint32Array([1, 2, 3, 4]); // 16 bytes
      const sig2 = new Uint32Array([5, 6]); // 8 bytes
      cache.set('key1', sig1);
      cache.set('key2', sig2);
      expect(cache.getStats().bytes).toBe(24);
    });

    test('resetStats clears hit/miss counters', () => {
      cache.set('key1', new Uint32Array([1]));
      cache.get('key1');
      cache.get('nonexistent');

      cache.resetStats();

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.entries).toBe(1); // entries not reset
    });
  });

  describe('LRU eviction', () => {
    test('evicts entries when max entries exceeded', () => {
      const smallCache = new MinHashCache({ maxEntries: 3, maxBytes: 10000 });

      smallCache.set('key1', new Uint32Array([1]));
      smallCache.set('key2', new Uint32Array([2]));
      smallCache.set('key3', new Uint32Array([3]));

      // Cache is now full (3 entries)
      expect(smallCache.getStats().entries).toBe(3);

      // Add key4, should trigger eviction to maintain max entries
      smallCache.set('key4', new Uint32Array([4]));

      // Should still have at most maxEntries items
      expect(smallCache.getStats().entries).toBeLessThanOrEqual(3);
      expect(smallCache.has('key4')).toBe(true); // new entry is present
    });

    test('maintains max entries limit after multiple additions', () => {
      const smallCache = new MinHashCache({ maxEntries: 2, maxBytes: 10000 });

      smallCache.set('key1', new Uint32Array([1]));
      smallCache.set('key2', new Uint32Array([2]));
      smallCache.set('key3', new Uint32Array([3]));
      smallCache.set('key4', new Uint32Array([4]));
      smallCache.set('key5', new Uint32Array([5]));

      // Should never exceed maxEntries
      expect(smallCache.getStats().entries).toBeLessThanOrEqual(2);

      // Most recent entries should be present
      expect(smallCache.has('key5')).toBe(true);
    });
  });

  describe('memory bound eviction', () => {
    test('evicts when max bytes exceeded', () => {
      // Max 100 bytes
      const smallCache = new MinHashCache({ maxEntries: 100, maxBytes: 100 });

      // Each Uint32Array element is 4 bytes
      smallCache.set('key1', new Uint32Array(10)); // 40 bytes
      smallCache.set('key2', new Uint32Array(10)); // 40 bytes

      expect(smallCache.getStats().bytes).toBe(80);

      // Adding another 40 bytes should trigger eviction
      smallCache.set('key3', new Uint32Array(10)); // 40 bytes

      // Should have evicted to make room
      expect(smallCache.getStats().bytes).toBeLessThanOrEqual(100);
    });

    test('replacing existing key updates bytes correctly', () => {
      cache.set('key1', new Uint32Array([1, 2, 3, 4])); // 16 bytes
      expect(cache.getStats().bytes).toBe(16);

      cache.set('key1', new Uint32Array([1, 2])); // 8 bytes
      expect(cache.getStats().bytes).toBe(8);
    });
  });

  describe('default configuration', () => {
    test('uses default values when no config provided', () => {
      const defaultCache = new MinHashCache();
      // Just verify it works without errors
      defaultCache.set('key', new Uint32Array([1, 2, 3]));
      expect(defaultCache.get('key')).toEqual(new Uint32Array([1, 2, 3]));
    });
  });
});

describe('makeCacheKeyFromId', () => {
  test('generates consistent keys', () => {
    const key1 = makeCacheKeyFromId('seq123', 7, 128, true);
    const key2 = makeCacheKeyFromId('seq123', 7, 128, true);
    expect(key1).toBe(key2);
  });

  test('different parameters produce different keys', () => {
    const key1 = makeCacheKeyFromId('seq123', 7, 128, true);
    const key2 = makeCacheKeyFromId('seq123', 8, 128, true);
    const key3 = makeCacheKeyFromId('seq123', 7, 256, true);
    const key4 = makeCacheKeyFromId('seq123', 7, 128, false);
    const key5 = makeCacheKeyFromId('seq456', 7, 128, true);

    expect(key1).not.toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key1).not.toBe(key4);
    expect(key1).not.toBe(key5);
  });

  test('includes id prefix', () => {
    const key = makeCacheKeyFromId('mySequence', 7, 128, true);
    expect(key.startsWith('id:')).toBe(true);
  });
});

describe('global cache functions', () => {
  afterEach(() => {
    clearMinHashCache();
  });

  test('getMinHashCache returns a cache instance', () => {
    const cache = getMinHashCache();
    expect(cache).toBeInstanceOf(MinHashCache);
  });

  test('getMinHashCache returns same instance on multiple calls', () => {
    const cache1 = getMinHashCache();
    const cache2 = getMinHashCache();
    expect(cache1).toBe(cache2);
  });

  test('initMinHashCache creates new cache with custom config', () => {
    const cache = initMinHashCache({ maxEntries: 5 });
    expect(cache).toBeInstanceOf(MinHashCache);

    // Should return the newly initialized cache
    expect(getMinHashCache()).toBe(cache);
  });

  test('clearMinHashCache removes all entries', () => {
    const cache = getMinHashCache();
    cache.set('key1', new Uint32Array([1]));
    cache.set('key2', new Uint32Array([2]));

    clearMinHashCache();

    expect(cache.getStats().entries).toBe(0);
    expect(cache.getStats().bytes).toBe(0);
  });

  test('clearMinHashCache handles uninitialized cache', () => {
    // Should not throw even if called before cache is initialized
    expect(() => clearMinHashCache()).not.toThrow();
  });
});
