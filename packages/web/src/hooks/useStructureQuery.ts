import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  loadStructure,
  type LoadedStructure,
  type ProgressInfo,
  type LoadingStage,
} from '../visualization/structure-loader';

export interface UseStructureQueryOptions {
  idOrUrl?: string | null;
  enabled?: boolean;
  staleTimeMs?: number;
}

export interface StructureQueryResult {
  data: LoadedStructure | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  progress: number;
  loadingStage: LoadingStage | null;
}

const STRUCTURE_STALE_TIME = 5 * 60 * 1000;
const STRUCTURE_GC_TIME = 30 * 60 * 1000;

export function useStructureQuery(options: UseStructureQueryOptions): StructureQueryResult {
  const {
    idOrUrl,
    enabled = true,
    staleTimeMs = STRUCTURE_STALE_TIME,
  } = options;

  const [progress, setProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState<LoadingStage | null>(null);
  const progressCallbackRef = useRef<((info: ProgressInfo) => void) | null>(null);

  // Create a stable progress callback
  progressCallbackRef.current = useCallback((info: ProgressInfo) => {
    setProgress(info.percent);
    setLoadingStage(info.stage);
  }, []);

  const query = useQuery<LoadedStructure>({
    queryKey: ['structure', idOrUrl],
    queryFn: ({ signal }) => {
      if (!idOrUrl) throw new Error('No structure id/url provided');
      // Reset progress on new load
      setProgress(0);
      setLoadingStage(null);
      return loadStructure(idOrUrl, signal, progressCallbackRef.current ?? undefined);
    },
    enabled: Boolean(idOrUrl) && enabled,
    staleTime: staleTimeMs,
    gcTime: STRUCTURE_GC_TIME,
    retry: 1,
  });

  // Reset progress when query succeeds
  useEffect(() => {
    if (query.data && !query.isFetching) {
      setProgress(100);
      setLoadingStage(null);
    }
  }, [query.data, query.isFetching]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    progress,
    loadingStage,
  };
}

/**
 * Prefetch structures for adjacent phages to reduce perceived load time.
 * Runs in the background after a short delay to not block current loading.
 */
export function usePrefetchAdjacentStructures(
  adjacentPdbIds: (string | null | undefined)[],
  enabled = true
): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    // Delay prefetch to not compete with current structure loading
    const timeoutId = setTimeout(() => {
      for (const pdbId of adjacentPdbIds) {
        if (!pdbId) continue;

        // Only prefetch if not already in cache
        const existing = queryClient.getQueryData(['structure', pdbId]);
        if (existing) continue;

        // Prefetch with low priority (won't block UI)
        void queryClient.prefetchQuery({
          queryKey: ['structure', pdbId],
          queryFn: ({ signal }) => loadStructure(pdbId, signal),
          staleTime: STRUCTURE_STALE_TIME,
          gcTime: STRUCTURE_GC_TIME,
        });
      }
    }, 1500); // Wait 1.5s after current phage loads before prefetching

    return () => clearTimeout(timeoutId);
  }, [adjacentPdbIds, enabled, queryClient]);
}

export default useStructureQuery;

