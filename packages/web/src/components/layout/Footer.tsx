/**
 * Footer Component
 *
 * Bottom bar with version info and keyboard hints.
 * Hints are derived from ActionRegistry via APP_SHELL_FOOTER_HINTS for consistency.
 */

import React, { useMemo } from 'react';
import {
  APP_SHELL_FOOTER_HINTS,
  formatHintKeys,
  detectShortcutPlatform,
} from '../../keyboard/actionSurfaces';

export interface KeyHint {
  key: string;
  label: string;
  description?: string;
}

export interface FooterProps {
  version?: string;
  hints?: KeyHint[];
  children?: React.ReactNode;
}

export const Footer: React.FC<FooterProps> = ({
  version,
  hints: customHints,
  children,
}) => {
  // Build hints from ActionRegistry via APP_SHELL_FOOTER_HINTS
  const platform = detectShortcutPlatform();
  const registryHints = useMemo<KeyHint[]>(() => {
    return APP_SHELL_FOOTER_HINTS.map((hint) => ({
      key: formatHintKeys(hint, platform),
      label: hint.label,
      description: hint.description,
    })).filter((h) => h.key); // Skip hints without shortcuts
  }, [platform]);

  const hints = customHints ?? registryHints;

  // Only show version when explicitly provided (not placeholder)
  const showVersion = version && version !== '0.0.0';

  return (
    <footer className="app-footer" role="contentinfo" aria-label="Application Footer">
      {showVersion ? (
        <span className="footer-version" aria-label={`Version ${version}`}>Phage Explorer v{version}</span>
      ) : (
        <span className="footer-version">Phage Explorer</span>
      )}
      <div className="footer-hints" role="list" aria-label="Keyboard Shortcuts">
        {hints.map((hint, i) => (
          <React.Fragment key={hint.key}>
            {i > 0 && <span className="hint-separator" aria-hidden="true">·</span>}
            <span
              className="hint-item"
              role="listitem"
              title={hint.description}
              aria-label={
                hint.description ? `${hint.key}: ${hint.description}` : `${hint.key}: ${hint.label}`
              }
            >
              <kbd className="key-hint">{hint.key}</kbd>
              <span className="hint-label">{hint.label}</span>
            </span>
          </React.Fragment>
        ))}
        {children}
      </div>
    </footer>
  );
};

export default Footer;
