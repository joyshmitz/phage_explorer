/**
 * Selection Guard: Prevents stale async results from overwriting the latest selection.
 *
 * Pattern: When rapidly switching between items (e.g., phages), async loads can resolve
 * out of order. Without a guard, the last result to arrive wins—not the last selection.
 *
 * This utility implements a request-token pattern that ensures only the most recent
 * selection's results are applied.
 *
 * @example
 * ```ts
 * const guard = createSelectionGuard();
 *
 * async function loadItem(id: number) {
 *   const token = guard.startRequest();
 *   const data = await fetchData(id);
 *   if (!guard.isCurrentRequest(token)) return; // Stale, discard
 *   applyData(data);
 * }
 * ```
 */

export interface SelectionGuard {
  /** Start a new request and get a token. Invalidates all previous requests. */
  startRequest(): number;
  /** Check if the given token is still the current request. */
  isCurrentRequest(token: number): boolean;
  /** Get the current request ID (for debugging/logging). */
  getCurrentId(): number;
}

/**
 * Create a selection guard to prevent stale async results.
 *
 * @returns A guard object with startRequest, isCurrentRequest, and getCurrentId methods.
 */
export function createSelectionGuard(): SelectionGuard {
  let currentId = 0;

  return {
    startRequest(): number {
      return ++currentId;
    },

    isCurrentRequest(token: number): boolean {
      return token === currentId;
    },

    getCurrentId(): number {
      return currentId;
    },
  };
}

/**
 * Helper type for tracking async operation results with guard integration.
 */
export interface GuardedResult<T> {
  token: number;
  result: T;
  appliedAt: number;
}

/**
 * Run an async operation with selection guard protection.
 *
 * This is a higher-level helper that wraps an async function and automatically
 * discards stale results.
 *
 * @param guard - The selection guard instance
 * @param operation - The async operation to run
 * @param onSuccess - Callback when the result should be applied
 * @param onStale - Optional callback when the result was stale (for logging)
 * @returns Promise that resolves to { applied: boolean, token: number }
 */
export async function runGuardedOperation<T>(
  guard: SelectionGuard,
  operation: () => Promise<T>,
  onSuccess: (result: T) => void,
  onStale?: (token: number, result: T) => void
): Promise<{ applied: boolean; token: number }> {
  const token = guard.startRequest();

  try {
    const result = await operation();

    if (!guard.isCurrentRequest(token)) {
      onStale?.(token, result);
      return { applied: false, token };
    }

    onSuccess(result);
    return { applied: true, token };
  } catch (error) {
    // Re-throw if this is still the current request
    if (guard.isCurrentRequest(token)) {
      throw error;
    }
    // Silently discard errors for stale requests
    return { applied: false, token };
  }
}
