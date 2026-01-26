/**
 * Unit tests for Selection Guard - stale async result prevention.
 *
 * @fileoverview
 * Tests the selection guard pattern that ensures last-selection-wins semantics.
 * Simulates race conditions where async operations complete out of order.
 *
 * Test scenarios:
 * 1. Single request applies correctly
 * 2. Sequential requests (first completes, then second) - both apply
 * 3. Race condition: request A starts, request B starts, A completes last - only B applies
 * 4. Multiple rapid requests - only last one applies
 *
 * Logs request IDs and resolution order on failure for easy debugging.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { createSelectionGuard, runGuardedOperation, type SelectionGuard } from './selection-guard';

describe('createSelectionGuard', () => {
  let guard: SelectionGuard;

  beforeEach(() => {
    guard = createSelectionGuard();
  });

  describe('token management', () => {
    it('starts with ID 0', () => {
      expect(guard.getCurrentId()).toBe(0);
    });

    it('increments ID on each startRequest', () => {
      const token1 = guard.startRequest();
      const token2 = guard.startRequest();
      const token3 = guard.startRequest();

      expect(token1).toBe(1);
      expect(token2).toBe(2);
      expect(token3).toBe(3);
      expect(guard.getCurrentId()).toBe(3);
    });

    it('isCurrentRequest returns true only for latest token', () => {
      const token1 = guard.startRequest();
      expect(guard.isCurrentRequest(token1)).toBe(true);

      const token2 = guard.startRequest();
      expect(guard.isCurrentRequest(token1)).toBe(false);
      expect(guard.isCurrentRequest(token2)).toBe(true);

      const token3 = guard.startRequest();
      expect(guard.isCurrentRequest(token1)).toBe(false);
      expect(guard.isCurrentRequest(token2)).toBe(false);
      expect(guard.isCurrentRequest(token3)).toBe(true);
    });
  });
});

describe('runGuardedOperation', () => {
  let guard: SelectionGuard;
  let appliedResults: Array<{ token: number; value: string }>;
  let staleResults: Array<{ token: number; value: string }>;

  beforeEach(() => {
    guard = createSelectionGuard();
    appliedResults = [];
    staleResults = [];
  });

  /**
   * Helper to create a delayed async operation.
   */
  function createDelayedOperation(value: string, delayMs: number): () => Promise<string> {
    return async () => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return value;
    };
  }

  it('applies single request correctly', async () => {
    const result = await runGuardedOperation(
      guard,
      async () => 'value-A',
      value => appliedResults.push({ token: guard.getCurrentId(), value }),
      (token, value) => staleResults.push({ token, value })
    );

    expect(result.applied).toBe(true);
    expect(appliedResults).toHaveLength(1);
    expect(appliedResults[0]).toEqual({ token: 1, value: 'value-A' });
    expect(staleResults).toHaveLength(0);
  });

  it('applies sequential requests (no overlap)', async () => {
    // First request completes
    await runGuardedOperation(
      guard,
      async () => 'value-A',
      value => appliedResults.push({ token: guard.getCurrentId(), value }),
      (token, value) => staleResults.push({ token, value })
    );

    // Second request starts after first completes
    await runGuardedOperation(
      guard,
      async () => 'value-B',
      value => appliedResults.push({ token: guard.getCurrentId(), value }),
      (token, value) => staleResults.push({ token, value })
    );

    expect(appliedResults).toHaveLength(2);
    expect(appliedResults[0].value).toBe('value-A');
    expect(appliedResults[1].value).toBe('value-B');
    expect(staleResults).toHaveLength(0);
  });

  it('discards stale result when newer request started (race condition)', async () => {
    // Scenario: Request A starts, Request B starts, A completes last
    // Expected: B wins, A is discarded

    const operationAPromise = runGuardedOperation(
      guard,
      createDelayedOperation('value-A', 50), // Slower
      value => appliedResults.push({ token: guard.getCurrentId(), value }),
      (token, value) => staleResults.push({ token, value })
    );

    // Wait a bit then start B (faster completion)
    await new Promise(resolve => setTimeout(resolve, 10));

    const operationBPromise = runGuardedOperation(
      guard,
      createDelayedOperation('value-B', 10), // Faster
      value => appliedResults.push({ token: guard.getCurrentId(), value }),
      (token, value) => staleResults.push({ token, value })
    );

    // Wait for both to complete
    const [resultA, resultB] = await Promise.all([operationAPromise, operationBPromise]);

    // Log for debugging on failure
    const debugInfo = {
      resultA,
      resultB,
      appliedResults,
      staleResults,
      finalGuardId: guard.getCurrentId(),
    };

    try {
      // B should have applied (it was the most recent request)
      expect(resultB.applied).toBe(true);

      // A should be discarded (it was superseded by B)
      expect(resultA.applied).toBe(false);

      // Only B's value should be in appliedResults
      expect(appliedResults).toHaveLength(1);
      expect(appliedResults[0].value).toBe('value-B');

      // A should be in staleResults
      expect(staleResults).toHaveLength(1);
      expect(staleResults[0].value).toBe('value-A');
    } catch (error) {
      console.error('[selection-determinism] Race condition test failed:', debugInfo);
      throw error;
    }
  });

  it('handles multiple rapid requests (only last applies)', async () => {
    // Simulate rapid clicking through 5 items
    const operations = [
      createDelayedOperation('phage-1', 100),
      createDelayedOperation('phage-2', 80),
      createDelayedOperation('phage-3', 60),
      createDelayedOperation('phage-4', 40),
      createDelayedOperation('phage-5', 20), // Last one, fastest
    ];

    const promises = operations.map((op) =>
      runGuardedOperation(
        guard,
        op,
        value => appliedResults.push({ token: guard.getCurrentId(), value }),
        (token, value) => staleResults.push({ token, value })
      )
    );

    const results = await Promise.all(promises);

    const debugInfo = {
      results,
      appliedResults,
      staleResults,
      finalGuardId: guard.getCurrentId(),
    };

    try {
      // Only the last request should apply
      const appliedCount = results.filter(r => r.applied).length;
      expect(appliedCount).toBe(1);

      // The applied result should be phage-5 (the last selection)
      expect(appliedResults).toHaveLength(1);
      expect(appliedResults[0].value).toBe('phage-5');

      // All others should be stale
      expect(staleResults).toHaveLength(4);
      expect(staleResults.map(s => s.value).sort()).toEqual([
        'phage-1',
        'phage-2',
        'phage-3',
        'phage-4',
      ]);
    } catch (error) {
      console.error('[selection-determinism] Rapid requests test failed:', debugInfo);
      throw error;
    }
  });

  it('handles errors correctly for current request', async () => {
    const errorMessage = 'Network error';

    await expect(
      runGuardedOperation(
        guard,
        async () => {
          throw new Error(errorMessage);
        },
        () => {},
        () => {}
      )
    ).rejects.toThrow(errorMessage);
  });

  it('silently discards errors for stale requests', async () => {
    // Start a slow operation that will error
    const errorOpPromise = runGuardedOperation(
      guard,
      async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        throw new Error('This error should be discarded');
      },
      value => appliedResults.push({ token: guard.getCurrentId(), value }),
      (token) => staleResults.push({ token, value: 'error' })
    );

    // Immediately start another operation, making the first stale
    await new Promise(resolve => setTimeout(resolve, 10));
    const successOpPromise = runGuardedOperation(
      guard,
      async () => 'success',
      value => appliedResults.push({ token: guard.getCurrentId(), value }),
      (token, value) => staleResults.push({ token, value })
    );

    // Both should resolve without throwing
    const [errorResult, successResult] = await Promise.all([errorOpPromise, successOpPromise]);

    expect(errorResult.applied).toBe(false);
    expect(successResult.applied).toBe(true);
    expect(appliedResults).toHaveLength(1);
    expect(appliedResults[0].value).toBe('success');
  });
});

describe('selection determinism integration', () => {
  it('simulates phage selection race condition scenario from bead', async () => {
    /**
     * Simulates the exact scenario from phage_explorer-s4qx.8.5:
     * - Request A starts
     * - Request B starts
     * - Request A resolves last
     * - Ensure state reflects B, A is ignored
     */
    const guard = createSelectionGuard();
    const state: { selectedPhage: string | null } = { selectedPhage: null };
    const log: Array<{ event: string; phage: string; token: number; timestamp: number }> = [];
    const startTime = Date.now();

    async function selectPhage(phageId: string, loadTimeMs: number): Promise<void> {
      const token = guard.startRequest();
      log.push({ event: 'start', phage: phageId, token, timestamp: Date.now() - startTime });

      // Simulate async load
      await new Promise(resolve => setTimeout(resolve, loadTimeMs));

      log.push({ event: 'loaded', phage: phageId, token, timestamp: Date.now() - startTime });

      // Check if still current
      if (!guard.isCurrentRequest(token)) {
        log.push({ event: 'discarded', phage: phageId, token, timestamp: Date.now() - startTime });
        return;
      }

      // Apply result
      state.selectedPhage = phageId;
      log.push({ event: 'applied', phage: phageId, token, timestamp: Date.now() - startTime });
    }

    // User clicks Phage A (takes 100ms to load)
    const selectAPromise = selectPhage('phage-A', 100);

    // User immediately clicks Phage B (takes 30ms to load)
    await new Promise(resolve => setTimeout(resolve, 10));
    const selectBPromise = selectPhage('phage-B', 30);

    await Promise.all([selectAPromise, selectBPromise]);

    const debugInfo = {
      finalState: state.selectedPhage,
      log,
      expectation: 'phage-B should win because it was selected last',
    };

    try {
      // The final state should reflect Phage B (the last selection)
      expect(state.selectedPhage).toBe('phage-B');

      // Verify the event log shows A was discarded
      const discardedEvents = log.filter(e => e.event === 'discarded');
      expect(discardedEvents).toHaveLength(1);
      expect(discardedEvents[0].phage).toBe('phage-A');

      // Verify B was applied
      const appliedEvents = log.filter(e => e.event === 'applied');
      expect(appliedEvents).toHaveLength(1);
      expect(appliedEvents[0].phage).toBe('phage-B');
    } catch (error) {
      console.error('[selection-determinism] Integration test failed:', JSON.stringify(debugInfo, null, 2));
      throw error;
    }
  });
});
