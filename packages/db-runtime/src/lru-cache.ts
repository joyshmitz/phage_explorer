/**
 * LRU (Least Recently Used) Cache
 *
 * A bounded cache that automatically evicts the least recently used entries
 * when the maximum size is exceeded. Uses Map's insertion order to track LRU.
 *
 * Performance characteristics:
 * - get: O(1) amortized (Map lookup + delete/set for reordering)
 * - set: O(1) amortized
 * - delete: O(1)
 * - Memory: O(maxSize) bounded
 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  /**
   * Create a new LRU cache
   * @param maxSize Maximum number of entries (default: 100)
   */
  constructor(maxSize: number = 100) {
    if (maxSize < 1) {
      throw new Error('LRU cache maxSize must be at least 1');
    }
    this.maxSize = maxSize;
  }

  /**
   * Get a value from the cache
   * Accessing a key marks it as most recently used
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used) by re-inserting
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  /**
   * Check if a key exists in the cache
   * Does NOT update LRU order (use get() if you need the value)
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Set a value in the cache
   * If the cache is full, evicts the least recently used entry
   */
  set(key: K, value: V): this {
    // If key exists, delete first to ensure it moves to end
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict least recently used (first entry in Map)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
    return this;
  }

  /**
   * Delete a key from the cache
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the current number of entries in the cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Iterate over entries in LRU order (oldest first)
   */
  *entries(): IterableIterator<[K, V]> {
    yield* this.cache.entries();
  }

  /**
   * Iterate over keys in LRU order (oldest first)
   */
  *keys(): IterableIterator<K> {
    yield* this.cache.keys();
  }

  /**
   * Iterate over values in LRU order (oldest first)
   */
  *values(): IterableIterator<V> {
    yield* this.cache.values();
  }

  /**
   * Execute a callback for each entry
   */
  forEach(callback: (value: V, key: K, map: Map<K, V>) => void): void {
    this.cache.forEach(callback);
  }
}

export default LRUCache;
