/**
 * useDatabase Hook for Phage Explorer Web
 *
 * React hook for loading and accessing the phage database.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { DatabaseLoader, createDatabaseLoader } from '../db';
import type { PhageRepository, DatabaseLoadProgress } from '../db';

const DEFAULT_DATABASE_URL = '/phage.db';

export interface UseDatabaseOptions {
  /** URL to load the database from */
  databaseUrl?: string;
  /** Auto-load on mount */
  autoLoad?: boolean;
}

export interface UseDatabaseResult {
  /** The database repository (null if not loaded) */
  repository: PhageRepository | null;
  /** Whether the database is currently loading */
  isLoading: boolean;
  /** Load progress information */
  progress: DatabaseLoadProgress | null;
  /** Error message if loading failed */
  error: string | null;
  /** Whether the database was loaded from cache */
  isCached: boolean;
  /** Manually trigger database load */
  load: () => Promise<void>;
  /** Reload the database (clear cache and download fresh) */
  reload: () => Promise<void>;
}

/**
 * Hook for loading and accessing the phage database
 *
 * @example
 * const { repository, isLoading, progress, error } = useDatabase();
 *
 * if (isLoading) {
 *   return <LoadingScreen progress={progress} />;
 * }
 *
 * if (error) {
 *   return <ErrorScreen message={error} />;
 * }
 *
 * // Use repository to query phages
 * const phages = await repository?.listPhages();
 */
export function useDatabase(options: UseDatabaseOptions = {}): UseDatabaseResult {
  const { databaseUrl = DEFAULT_DATABASE_URL, autoLoad = true } = options;

  const [repository, setRepository] = useState<PhageRepository | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<DatabaseLoadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const loaderRef = useRef<DatabaseLoader | null>(null);

  // Create loader
  useEffect(() => {
    loaderRef.current = createDatabaseLoader(databaseUrl, (p) => {
      setProgress(p);
      if (p.cached !== undefined) {
        setIsCached(p.cached);
      }
    });

    return () => {
      loaderRef.current?.close();
      loaderRef.current = null;
    };
  }, [databaseUrl]);

  // Load function
  const load = useCallback(async () => {
    if (!loaderRef.current || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const repo = await loaderRef.current.load();
      setRepository(repo);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load database';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Reload function (clear cache)
  const reload = useCallback(async () => {
    if (!loaderRef.current) return;

    // Close existing
    await loaderRef.current.close();
    setRepository(null);

    // Clear cache
    await loaderRef.current.clearCache();

    // Reload
    await load();
  }, [load]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && !repository && !isLoading && !error) {
      void load();
    }
  }, [autoLoad, repository, isLoading, error, load]);

  return {
    repository,
    isLoading,
    progress,
    error,
    isCached,
    load,
    reload,
  };
}

export default useDatabase;
