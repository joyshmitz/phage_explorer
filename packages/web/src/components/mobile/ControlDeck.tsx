import React from 'react';
import { usePhageStore } from '@phage-explorer/state';
import { useOverlay } from '../overlays/OverlayProvider';
import {
  IconCube,
  IconLayers,
  IconSearch,
  IconSettings,
  IconTarget,
} from '../ui';

/**
 * Mobile Bottom Tab Bar
 *
 * Simple iOS/Android-style navigation with 5 direct action buttons.
 * Each tap performs an action immediately (no nested tabs).
 */
export function ControlDeck(): JSX.Element {
  const viewMode = usePhageStore(s => s.viewMode);
  const toggleViewMode = usePhageStore(s => s.toggleViewMode);
  const show3DModel = usePhageStore(s => s.show3DModel);
  const toggle3DModel = usePhageStore(s => s.toggle3DModel);
  const { open } = useOverlay();

  const viewModeLabel = viewMode === 'dna' ? 'DNA' : viewMode === 'aa' ? 'AA' : 'Both';

  return (
    <nav className="control-deck" aria-label="Mobile navigation">
      {/* Search */}
      <button
        type="button"
        className="tab-btn"
        onClick={() => open('search')}
        aria-label="Search sequence"
      >
        <span className="tab-icon">
          <IconSearch size={20} />
        </span>
        <span className="tab-label">Search</span>
      </button>

      {/* View Mode Toggle */}
      <button
        type="button"
        className="tab-btn"
        onClick={toggleViewMode}
        aria-label={`View mode: ${viewModeLabel}. Tap to cycle.`}
      >
        <span className="tab-icon">
          <IconLayers size={20} />
        </span>
        <span className="tab-label">{viewModeLabel}</span>
      </button>

      {/* Go To Position */}
      <button
        type="button"
        className="tab-btn"
        onClick={() => open('goto')}
        aria-label="Go to position"
      >
        <span className="tab-icon">
          <IconTarget size={20} />
        </span>
        <span className="tab-label">Go To</span>
      </button>

      {/* 3D Toggle */}
      <button
        type="button"
        className={`tab-btn ${show3DModel ? 'active' : ''}`}
        onClick={toggle3DModel}
        aria-label={`3D model: ${show3DModel ? 'on' : 'off'}`}
        aria-pressed={show3DModel}
      >
        <span className="tab-icon">
          <IconCube size={20} />
          {show3DModel && <span className="state-badge" aria-hidden="true" />}
        </span>
        <span className="tab-label">3D</span>
      </button>

      {/* More/Settings - Opens Command Palette */}
      <button
        type="button"
        className="tab-btn"
        onClick={() => open('commandPalette')}
        aria-label="More options"
      >
        <span className="tab-icon">
          <IconSettings size={20} />
        </span>
        <span className="tab-label">More</span>
      </button>
    </nav>
  );
}
