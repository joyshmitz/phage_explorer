/**
 * IllustrationOverlay - Phage anatomy viewer
 *
 * Displays phage structural diagrams in a clean, centered overlay.
 * Features:
 * - Appropriate sizing (not full-screen)
 * - Download button for educational use
 * - Click outside or ESC to close
 */

import React, { useCallback } from 'react';
import { Overlay } from './Overlay';
import { useOverlay } from './OverlayProvider';
import { IconDownload } from '../ui';

interface IllustrationData {
  slug: string;
  name: string;
  path: string;
}

export function IllustrationOverlay(): React.ReactElement | null {
  const { overlayData, isOpen } = useOverlay();

  const illustration = overlayData.illustration as IllustrationData | undefined;
  const illustrationIsOpen = isOpen('illustration');

  const handleDownload = useCallback(() => {
    if (!illustration) return;
    const link = document.createElement('a');
    link.href = illustration.path;
    link.download = `${illustration.slug}-anatomy.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [illustration]);

  // Don't render content if no illustration (let Overlay handle the shell)
  if (!illustrationIsOpen) {
    return null;
  }

  if (!illustration) {
    return (
      <Overlay id="illustration" title="Phage Anatomy" size="lg">
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-dim)' }}>
          No illustration selected
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay
      id="illustration"
      title={`${illustration.name} - Anatomy`}
      size="xl"
      className="illustration-overlay"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {/* Download button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={handleDownload}
            aria-label="Download illustration"
          >
            <IconDownload size={16} />
            <span style={{ marginLeft: '0.35rem' }}>Download</span>
          </button>
        </div>

        {/* Image container - centered with proper sizing */}
        <div
          style={{
            backgroundColor: '#000',
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <img
            src={illustration.path}
            alt={`Detailed anatomical diagram of ${illustration.name} showing structural components`}
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain',
              borderRadius: '4px',
            }}
            draggable={false}
          />
        </div>

        {/* Caption */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--color-text-muted)',
            padding: '0.25rem',
          }}
        >
          Structural anatomy of {illustration.name}
        </div>
      </div>
    </Overlay>
  );
}

export default IllustrationOverlay;
