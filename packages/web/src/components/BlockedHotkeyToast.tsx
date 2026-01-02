/**
 * BlockedHotkeyToast - Shows a gentle notification when a hotkey is blocked
 * due to experience level restrictions.
 */

import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { usePhageStore } from '@phage-explorer/state';
import type { BlockedHotkeyInfo } from '../hooks/useExperienceLevelSync';
import { getExperienceLevelLabel } from '../hooks/useExperienceLevelSync';
import type { ExperienceLevel } from '../keyboard/types';

interface BlockedHotkeyToastProps {
  info: BlockedHotkeyInfo | null;
  onDismiss: () => void;
  onUpgrade?: () => void;
}

export function BlockedHotkeyToast({
  info,
  onDismiss,
  onUpgrade,
}: BlockedHotkeyToastProps): React.ReactElement | null {
  const { theme } = useTheme();
  const colors = theme.colors;
  const setExperienceLevel = usePhageStore((s) => s.setExperienceLevel);

  if (!info) return null;

  const handleUpgrade = () => {
    setExperienceLevel(info.requiredLevel as ExperienceLevel);
    onDismiss();
    if (onUpgrade) onUpgrade();
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.75rem 1.25rem',
        background: colors.backgroundAlt,
        border: `1px solid ${colors.warning}`,
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 10000,
        maxWidth: '90vw',
        animation: 'slideUp 0.2s ease-out',
      }}
    >
      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
        `}
      </style>

      <div style={{ flex: 1 }}>
        <div style={{
          fontWeight: 600,
          color: colors.warning,
          marginBottom: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span aria-hidden="true">!</span>
          <span>Feature Locked</span>
        </div>
        <div style={{ color: colors.text, fontSize: '0.9rem' }}>
          <strong>{info.description}</strong> ({info.keyDisplay}) requires{' '}
          <strong>{getExperienceLevelLabel(info.requiredLevel)}</strong> experience.
        </div>
        <div style={{
          color: colors.textMuted,
          fontSize: '0.8rem',
          marginTop: '0.25rem',
        }}>
          You're currently at <strong>{getExperienceLevelLabel(info.currentLevel)}</strong> level.
          Upgrade to unlock this feature.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={handleUpgrade}
          style={{
            padding: '0.5rem 1rem',
            background: colors.accent,
            color: colors.background,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem',
            whiteSpace: 'nowrap',
          }}
          aria-label={`Upgrade to ${getExperienceLevelLabel(info.requiredLevel)} experience level`}
        >
          Upgrade
        </button>
        <button
          onClick={onDismiss}
          style={{
            padding: '0.5rem 0.75rem',
            background: 'transparent',
            color: colors.textMuted,
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
          aria-label="Dismiss notification"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default BlockedHotkeyToast;
