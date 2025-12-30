import React, { useState } from 'react';
import { Overlay } from './Overlay';
import { useOverlay } from './OverlayProvider';
import { useTheme } from '../../hooks/useTheme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useBeginnerMode } from '../../education';
import { useWebPreferences } from '../../store/createWebStore';
import { useDatabase } from '../../hooks/useDatabase';
import { IconContrast, IconLearn, IconSettings, IconDatabase } from '../ui';

export function SettingsOverlay(): React.ReactElement | null {
  const { close } = useOverlay();
  const { theme, setTheme, availableThemes } = useTheme();
  const reducedMotion = useReducedMotion();
  const highContrast = useWebPreferences((s) => s.highContrast);
  const setHighContrast = useWebPreferences((s) => s.setHighContrast);
  const backgroundEffects = useWebPreferences((s) => s.backgroundEffects);
  const setBackgroundEffects = useWebPreferences((s) => s.setBackgroundEffects);
  const scanlines = useWebPreferences((s) => s.scanlines);
  const setScanlines = useWebPreferences((s) => s.setScanlines);
  const glow = useWebPreferences((s) => s.glow);
  const setGlow = useWebPreferences((s) => s.setGlow);

  const { reload, isFetching } = useDatabase();
  const [reloadStatus, setReloadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const {
    isEnabled: beginnerModeEnabled,
    enable: enableBeginnerMode,
    disable: disableBeginnerMode,
  } = useBeginnerMode();

  const handleToggleBeginner = () => {
    if (beginnerModeEnabled) {
      disableBeginnerMode();
    } else {
      enableBeginnerMode();
    }
  };

  const handleReloadDatabase = async () => {
    setReloadStatus('loading');
    try {
      await reload();
      setReloadStatus('success');
      // Reload the page to reinitialize with fresh data
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch {
      setReloadStatus('error');
    }
  };

  return (
    <Overlay
      id="settings"
      title="Settings"
      icon={<IconSettings size={18} />}
      size="lg"
      onClose={() => close('settings')}
    >
      <div className="settings-overlay">
        <section
          aria-label="Appearance settings"
          className="panel panel-compact settings-section"
        >
          <div className="settings-section-header">
            <IconContrast size={16} />
            <h3 className="settings-section-title">Appearance</h3>
          </div>

          <div className="settings-row">
            <div className="settings-row-text">
              <div className="settings-row-label">Theme</div>
              <div className="settings-row-desc">Choose the overall color palette.</div>
            </div>
            <select
              value={theme.id}
              onChange={(e) => setTheme(e.target.value)}
              aria-label="Select theme"
              className="input settings-select"
            >
              {availableThemes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="settings-row">
            <div className="settings-row-text">
              <div className="settings-row-label">High contrast</div>
              <div className="settings-row-desc">Increases text and border contrast for readability.</div>
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => setHighContrast(!highContrast)}
              aria-pressed={highContrast}
              aria-label={highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
            >
              {highContrast ? 'On' : 'Off'}
            </button>
          </div>

          <div className="settings-row">
            <div className="settings-row-text">
              <div className="settings-row-label">Background effects</div>
              <div className="settings-row-desc">
                Matrix rain and CRT overlay.
                {reducedMotion ? ' Suppressed by your Reduced Motion preference.' : ''}
              </div>
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => setBackgroundEffects(!backgroundEffects)}
              aria-pressed={backgroundEffects}
              aria-label={backgroundEffects ? 'Disable background effects' : 'Enable background effects'}
            >
              {backgroundEffects ? 'On' : 'Off'}
            </button>
          </div>

          <div className="settings-row">
            <div className="settings-row-text">
              <div className="settings-row-label">Scanlines</div>
              <div className="settings-row-desc">
                Subtle scanline overlay.
                {reducedMotion ? ' Suppressed by your Reduced Motion preference.' : ''}
              </div>
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => setScanlines(!scanlines)}
              aria-pressed={scanlines}
              aria-label={scanlines ? 'Disable scanlines' : 'Enable scanlines'}
            >
              {scanlines ? 'On' : 'Off'}
            </button>
          </div>

          <div className="settings-row">
            <div className="settings-row-text">
              <div className="settings-row-label">Glow</div>
              <div className="settings-row-desc">Adds a subtle glow to diff highlights.</div>
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => setGlow(!glow)}
              aria-pressed={glow}
              aria-label={glow ? 'Disable glow effects' : 'Enable glow effects'}
            >
              {glow ? 'On' : 'Off'}
            </button>
          </div>
        </section>

        <section
          aria-label="Beginner mode setting"
          className="panel panel-compact settings-section"
        >
          <div className="settings-row settings-row--top">
            <div className="settings-row-text">
              <div className="settings-section-header">
                <IconLearn size={16} />
                <h3 className="settings-section-title">Beginner Mode</h3>
              </div>
              <p className="settings-paragraph">
                Shows glossary, context-aware help, guided tours, and learning overlays. Persists to localStorage so
                newcomers keep their learning setup between visits.
              </p>
              <p className="settings-meta">
                Current state: <strong>{beginnerModeEnabled ? 'Enabled' : 'Disabled'}</strong>
              </p>
            </div>
            <div className="settings-row-actions">
              <button
                type="button"
                className="btn"
                onClick={handleToggleBeginner}
                aria-pressed={beginnerModeEnabled}
                aria-label={beginnerModeEnabled ? 'Disable Beginner Mode' : 'Enable Beginner Mode'}
              >
                {beginnerModeEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        </section>

        <section
          aria-label="Database settings"
          className="panel panel-compact settings-section"
        >
          <div className="settings-row settings-row--top">
            <div className="settings-row-text">
              <div className="settings-section-header">
                <IconDatabase size={16} />
                <h3 className="settings-section-title">Database</h3>
              </div>
              <p className="settings-paragraph">
                The phage database is cached locally for offline access. If you&apos;re missing phages or seeing
                stale data, reload the database to fetch the latest version.
              </p>
              <p className="settings-meta">
                {reloadStatus === 'loading' && 'Downloading latest database...'}
                {reloadStatus === 'success' && 'Database updated! Reloading...'}
                {reloadStatus === 'error' && 'Failed to reload database. Check your connection.'}
                {reloadStatus === 'idle' && '24 phages available in the current database.'}
              </p>
            </div>
            <div className="settings-row-actions">
              <button
                type="button"
                className="btn"
                onClick={handleReloadDatabase}
                disabled={reloadStatus === 'loading' || isFetching}
                aria-label="Reload database from server"
              >
                {reloadStatus === 'loading' || isFetching ? 'Reloading...' : 'Reload Database'}
              </button>
            </div>
          </div>
        </section>

        <div className="settings-footer">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => close('settings')}
          >
            Close
          </button>
        </div>
      </div>
    </Overlay>
  );
}
