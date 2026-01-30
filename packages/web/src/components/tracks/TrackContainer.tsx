/**
 * TrackContainer - Scroll-Synchronized Track Layout
 *
 * Container for genome analysis tracks that synchronizes with the
 * SequenceGrid's horizontal scroll position and zoom level.
 */

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect, type ReactNode } from 'react';
import { usePhageStore } from '@phage-explorer/state';
import { useTheme } from '../../hooks/useTheme';

export interface TrackSyncState {
  /** Scroll position in base pairs */
  scrollPosition: number;
  /** Visible range in base pairs */
  visibleStart: number;
  visibleEnd: number;
  /** Total genome length */
  genomeLength: number;
  /** Zoom scale (0.1 to 4.0) */
  zoomScale: number;
  /** Pixels per base pair */
  pixelsPerBase: number;
  /** Container width in pixels */
  containerWidth: number;
}

interface TrackContextValue extends TrackSyncState {
  /** Set scroll position (for bidirectional sync) */
  setScrollPosition: (position: number) => void;
  /** Whether tracks are currently loading data */
  isLoading: boolean;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
}

const TrackContext = createContext<TrackContextValue | null>(null);

export function useTrackSync(): TrackContextValue {
  const ctx = useContext(TrackContext);
  if (!ctx) {
    throw new Error('useTrackSync must be used within a TrackContainer');
  }
  return ctx;
}

interface TrackContainerProps {
  /** Total genome length for coordinate calculations */
  genomeLength: number;
  /** Children track components */
  children: ReactNode;
  /** Container width (defaults to 100%) */
  width?: number | string;
  /** Whether to show the track header */
  showHeader?: boolean;
  /** Custom header title */
  headerTitle?: string;
  /** Whether tracks are collapsible */
  collapsible?: boolean;
  /** Initially collapsed */
  defaultCollapsed?: boolean;
}

export function TrackContainer({
  genomeLength,
  children,
  width = '100%',
  showHeader = true,
  headerTitle = 'Analysis Tracks',
  collapsible = true,
  defaultCollapsed = false,
}: TrackContainerProps): React.ReactElement {
  const { theme } = useTheme();
  const colors = theme.colors;

  // Get scroll state from global store
  const viewMode = usePhageStore((s) => s.viewMode);
  const readingFrame = usePhageStore((s) => s.readingFrame);
  const scrollPosition = usePhageStore((s) => s.scrollPosition);
  const setScrollPositionRaw = usePhageStore((s) => s.setScrollPosition);
  const zoomScale = usePhageStore((s) => s.zoomScale) ?? 1.0;

  // Local state
  const [containerWidth, setContainerWidth] = useState(800);
  const [isLoading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);

  // Convert store scroll units to base-pair coordinates for tracks.
  const scrollPositionBp = useMemo(() => {
    if (viewMode !== 'aa') return Math.max(0, Math.min(genomeLength, scrollPosition));
    const frameOffset = (readingFrame < 0 ? Math.abs(readingFrame) - 1 : readingFrame) as 0 | 1 | 2;
    const aaLength = Math.max(0, Math.floor((genomeLength - frameOffset) / 3));
    const clampedAa = Math.max(0, Math.min(aaLength, scrollPosition));
    if (readingFrame >= 0) {
      return Math.max(0, Math.min(genomeLength, frameOffset + clampedAa * 3));
    }
    const remainder = (genomeLength - frameOffset) - aaLength * 3;
    return Math.max(0, Math.min(genomeLength, remainder + clampedAa * 3));
  }, [genomeLength, readingFrame, scrollPosition, viewMode]);

  const setScrollPosition = useCallback(
    (positionBp: number) => {
      const clampedBp = Math.max(0, Math.min(genomeLength, positionBp));
      if (viewMode !== 'aa') {
        setScrollPositionRaw(clampedBp);
        return;
      }
      const frameOffset = (readingFrame < 0 ? Math.abs(readingFrame) - 1 : readingFrame) as 0 | 1 | 2;
      const aaLength = Math.max(0, Math.floor((genomeLength - frameOffset) / 3));
      let aaIndex: number;
      if (readingFrame >= 0) {
        aaIndex = Math.floor((clampedBp - frameOffset) / 3);
      } else {
        const remainder = (genomeLength - frameOffset) - aaLength * 3;
        aaIndex = Math.floor((clampedBp - remainder) / 3);
      }
      aaIndex = Math.max(0, Math.min(aaLength, aaIndex));
      setScrollPositionRaw(aaIndex);
    },
    [genomeLength, readingFrame, setScrollPositionRaw, viewMode]
  );

  // Calculate pixels per base based on container width and zoom
  // Assumes typical visible range is ~500 bases at zoom 1.0
  const basesPerView = Math.max(1, Math.round((500 / Math.max(0.1, zoomScale)) * (viewMode === 'aa' ? 3 : 1)));
  const pixelsPerBase = containerWidth / basesPerView;

  // Calculate visible range
  const visibleStart = scrollPositionBp;
  const visibleEnd = Math.min(scrollPositionBp + basesPerView, genomeLength);

  // Container ref callback for measuring width
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainerEl(node);
  }, []);

  useEffect(() => {
    if (!containerEl) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerEl);
    setContainerWidth(containerEl.clientWidth);
    return () => observer.disconnect();
  }, [containerEl]);

  // Build context value
  const contextValue = useMemo<TrackContextValue>(() => ({
    scrollPosition: scrollPositionBp,
    visibleStart,
    visibleEnd,
    genomeLength,
    zoomScale,
    pixelsPerBase,
    containerWidth,
    setScrollPosition,
    isLoading,
    setLoading,
  }), [
    scrollPositionBp,
    visibleStart,
    visibleEnd,
    genomeLength,
    zoomScale,
    pixelsPerBase,
    containerWidth,
    setScrollPosition,
    isLoading,
  ]);

  return (
    <TrackContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className="track-container"
        style={{
          width,
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${colors.border}`,
          borderRadius: '6px',
          overflow: 'hidden',
          backgroundColor: colors.background,
        }}
      >
        {/* Header */}
        {showHeader && (
          <div
            className="track-container-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.4rem 0.75rem',
              borderBottom: collapsed ? 'none' : `1px solid ${colors.borderLight}`,
              backgroundColor: colors.backgroundAlt,
              cursor: collapsible ? 'pointer' : 'default',
            }}
            onClick={() => collapsible && setCollapsed(!collapsed)}
            onKeyDown={(e) => {
              if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                setCollapsed(!collapsed);
              }
            }}
            role={collapsible ? 'button' : undefined}
            tabIndex={collapsible ? 0 : undefined}
            aria-expanded={collapsible ? !collapsed : undefined}
          >
            <span style={{ color: colors.textDim, fontSize: '0.85rem', fontWeight: 500 }}>
              {headerTitle}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Position indicator */}
              <span className="font-data" style={{ fontSize: '0.75rem', color: colors.textMuted }}>
                {visibleStart.toLocaleString()} - {visibleEnd.toLocaleString()} bp
              </span>
              {/* Collapse chevron */}
              {collapsible && (
                <span
                  style={{
                    color: colors.textMuted,
                    transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    fontSize: '0.9rem',
                  }}
                  aria-hidden="true"
                >
                  ▼
                </span>
              )}
            </div>
          </div>
        )}

        {/* Track content */}
        {!collapsed && (
          <div
            className="track-container-content"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            {children}
          </div>
        )}
      </div>
    </TrackContext.Provider>
  );
}

export default TrackContainer;
