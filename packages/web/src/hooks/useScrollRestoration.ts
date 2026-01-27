/**
 * useScrollRestoration - Preserves and restores scroll position across navigations
 *
 * Uses a module-scoped Map for session-only persistence (no localStorage).
 * rAF-throttled scroll listener saves position. useLayoutEffect restores on mount.
 */

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

/** Session-only scroll position cache keyed by route/identifier */
const scrollPositionCache = new Map<string, number>();

export interface UseScrollRestorationOptions {
  /** Unique key for this scroll context (e.g. route path, list id) */
  key: string;
  /** Whether restoration is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Attach to a scrollable element ref to preserve and restore scroll position.
 *
 * @example
 * ```tsx
 * const listRef = useRef<HTMLDivElement>(null);
 * useScrollRestoration(listRef, { key: 'phage-list' });
 * ```
 */
export function useScrollRestoration(
  ref: RefObject<HTMLElement | null>,
  options: UseScrollRestorationOptions
): void {
  const { key, enabled = true } = options;
  const rafIdRef = useRef<number | null>(null);

  // Restore scroll position on mount
  useLayoutEffect(() => {
    if (!enabled || !ref.current) return;
    const saved = scrollPositionCache.get(key);
    if (saved != null && saved > 0) {
      ref.current.scrollTop = saved;
    }
  }, [key, enabled, ref]);

  // Save scroll position on scroll (rAF-throttled)
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const handleScroll = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (el) {
          scrollPositionCache.set(key, el.scrollTop);
        }
      });
    };

    el.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [key, enabled, ref]);
}
