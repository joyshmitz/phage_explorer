import { describe, expect, it } from 'bun:test';
import { shouldIgnoreMobileSwipeTarget } from './App';

describe('mobile swipe navigation guards', () => {
  it('ignores swipe targets inside QuickStats and DB status bar', () => {
    let selectorSeen = '';

    const quickStatsTarget = {
      closest: (selector: string) => {
        selectorSeen = selector;
        return selector.includes('.quick-stats') ? {} : null;
      },
    };
    expect(shouldIgnoreMobileSwipeTarget(quickStatsTarget as any)).toBe(true);
    expect(selectorSeen).toContain('.quick-stats');

    const dbStatusTarget = {
      closest: (selector: string) => {
        selectorSeen = selector;
        return selector.includes('.db-status-bar') ? {} : null;
      },
    };
    expect(shouldIgnoreMobileSwipeTarget(dbStatusTarget as any)).toBe(true);
    expect(selectorSeen).toContain('.db-status-bar');

    const freeTarget = { closest: () => null };
    expect(shouldIgnoreMobileSwipeTarget(freeTarget as any)).toBe(false);

    expect(shouldIgnoreMobileSwipeTarget(null)).toBe(true);
  });
});
