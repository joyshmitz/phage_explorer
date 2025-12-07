/**
 * Browser Database Types
 *
 * Types for the browser SQLite adapter and database loading.
 */

import type { PhageSummary, PhageFull, GeneInfo, CodonUsageData } from '@phage-explorer/core';

/**
 * Repository interface matching db-runtime's PhageRepository
 */
export interface PhageRepository {
  listPhages(): Promise<PhageSummary[]>;
  getPhageByIndex(index: number): Promise<PhageFull | null>;
  getPhageById(id: number): Promise<PhageFull | null>;
  getPhageBySlug(slug: string): Promise<PhageFull | null>;
  getSequenceWindow(phageId: number, start: number, end: number): Promise<string>;
  getFullGenomeLength(phageId: number): Promise<number>;
  getGenes(phageId: number): Promise<GeneInfo[]>;
  getCodonUsage(phageId: number): Promise<CodonUsageData | null>;
  hasModel(phageId: number): Promise<boolean>;
  getModelFrames(phageId: number): Promise<string[] | null>;
  prefetchAround(index: number, radius: number): Promise<void>;
  searchPhages(query: string): Promise<PhageSummary[]>;
  getPreference(key: string): Promise<string | null>;
  setPreference(key: string, value: string): Promise<void>;
  getBiasVector?(phageId: number): Promise<number[] | null>;
  setBiasVector?(phageId: number, vector: number[]): Promise<void>;
  getCodonVector?(phageId: number): Promise<number[] | null>;
  setCodonVector?(phageId: number, vector: number[]): Promise<void>;
  close(): Promise<void>;
}

/**
 * Database loader configuration
 */
export interface DatabaseLoaderConfig {
  /** URL to fetch the database from */
  databaseUrl: string;
  /** URL to fetch the manifest from */
  manifestUrl?: string;
  /** Name for IndexedDB storage */
  dbName?: string;
  /** Callback for load progress */
  onProgress?: (progress: DatabaseLoadProgress) => void;
}

/**
 * Database load progress
 */
export interface DatabaseLoadProgress {
  stage: 'checking' | 'downloading' | 'decompressing' | 'initializing' | 'ready' | 'error';
  percent: number;
  message: string;
  cached?: boolean;
}

/**
 * Database manifest for cache invalidation
 */
export interface DatabaseManifest {
  version: string;
  hash: string;
  size: number;
  compressedSize: number;
  generatedAt: string;
}

/**
 * Cache entry for in-memory caching
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Sequence chunk size (10kb, matches db-runtime)
 */
export const CHUNK_SIZE = 10000;

/**
 * Cache TTL in milliseconds (1 minute)
 */
export const CACHE_TTL = 60000;
