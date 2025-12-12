/**
 * DataLoadingOverlay - Database Loading Screen
 *
 * Displays progress while loading the SQLite database.
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import type { DatabaseLoadProgress } from '../db';
import { Skeleton } from './ui/Skeleton';

interface DataLoadingOverlayProps {
  progress: DatabaseLoadProgress | null;
  error?: string | null;
  onRetry?: () => void;
}

export function DataLoadingOverlay({
  progress,
  error,
  onRetry,
}: DataLoadingOverlayProps): React.ReactElement {
  const { theme } = useTheme();
  const colors = theme.colors;

  // Track if loading is taking longer than expected
  const [isSlowLoad, setIsSlowLoad] = useState(false);

  useEffect(() => {
    // After 15 seconds without completion, show slow load message
    const timer = setTimeout(() => {
      if (!progress || progress.percent < 100) {
        setIsSlowLoad(true);
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, [progress]);

  if (error) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
          zIndex: 9999,
        }}
      >
        <div
          style={{
            border: `1px solid ${colors.error}`,
            padding: '2rem',
            borderRadius: '8px',
            textAlign: 'center',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }} aria-hidden="true">⚠️</div>
          <h2 style={{ color: colors.error, marginBottom: '1rem' }}>Database Load Failed</h2>
          <p style={{ color: colors.text, marginBottom: '1.5rem' }}>{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: colors.primary,
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show initial loading state when no progress data yet
  // This ensures the overlay is never invisible
  const displayProgress = progress ?? {
    percent: 0,
    message: 'Initializing...',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
        zIndex: 9999,
      }}
    >
      <div style={{ width: '320px', textAlign: 'center' }}>
        {/* App title */}
        <div style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: colors.accent }}>
          PHAGE EXPLORER
        </div>

        {/* Animated loading indicator when progress is 0 or unknown */}
        {displayProgress.percent === 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <Skeleton
              variant="rect"
              width="100%"
              height={4}
              animation="shimmer"
              aria-label="Loading"
            />
          </div>
        )}

        {/* Progress bar when we have actual progress */}
        {displayProgress.percent > 0 && (
          <div
            style={{
              height: '4px',
              backgroundColor: colors.border,
              borderRadius: '2px',
              marginBottom: '1rem',
              overflow: 'hidden',
            }}
            role="progressbar"
            aria-valuenow={displayProgress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              style={{
                height: '100%',
                width: `${displayProgress.percent}%`,
                backgroundColor: colors.primary,
                transition: 'width 0.3s ease-out',
              }}
            />
          </div>
        )}

        {/* Status message */}
        <div style={{ color: colors.textDim, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          {displayProgress.message}
          {displayProgress.percent > 0 && ` (${displayProgress.percent}%)`}
        </div>

        {/* Slow load warning */}
        {isSlowLoad && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: colors.backgroundAlt,
              borderRadius: '6px',
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ color: colors.warning, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Taking longer than expected...
            </div>
            <div style={{ color: colors.textMuted, fontSize: '0.8rem' }}>
              This may be due to a slow network or large database.
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                style={{
                  marginTop: '0.75rem',
                  padding: '0.4rem 0.8rem',
                  backgroundColor: 'transparent',
                  color: colors.primary,
                  border: `1px solid ${colors.primary}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Screen reader announcement */}
        <div className="sr-only">
          Loading database: {displayProgress.message},{' '}
          {displayProgress.percent > 0
            ? `${displayProgress.percent}% complete`
            : 'starting up'}
          .
          {isSlowLoad && ' Loading is taking longer than expected.'}
        </div>
      </div>
    </div>
  );
}
