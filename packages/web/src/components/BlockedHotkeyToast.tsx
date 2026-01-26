/**
 * BlockedHotkeyToast - Shows a gentle notification when a hotkey is blocked
 * due to experience level restrictions.
 */

import React from 'react';
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
  const setExperienceLevel = usePhageStore((s) => s.setExperienceLevel);

  if (!info) return null;

  const handleUpgrade = () => {
    setExperienceLevel(info.requiredLevel as ExperienceLevel);
    onDismiss();
    if (onUpgrade) onUpgrade();
  };

  return (
    <div role="alert" aria-live="polite" className="toast toast-warning blocked-hotkey-toast">
      <div className="blocked-hotkey-toast__body">
        <div className="blocked-hotkey-toast__title">
          <span aria-hidden="true">!</span>
          <span>Feature locked</span>
        </div>
        <div className="blocked-hotkey-toast__text">
          <strong>{info.description}</strong> ({info.keyDisplay}) requires{' '}
          <strong>{getExperienceLevelLabel(info.requiredLevel)}</strong> experience.
        </div>
        <div className="blocked-hotkey-toast__subtext">
          You're currently at <strong>{getExperienceLevelLabel(info.currentLevel)}</strong> level.
          Upgrade to unlock this feature.
        </div>
      </div>

      <div className="blocked-hotkey-toast__actions">
        <button
          onClick={handleUpgrade}
          className="btn btn-sm btn-primary"
          type="button"
          aria-label={`Upgrade to ${getExperienceLevelLabel(info.requiredLevel)} experience level`}
        >
          Upgrade
        </button>
        <button
          onClick={onDismiss}
          className="btn btn-sm btn-ghost"
          type="button"
          aria-label="Dismiss notification"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default BlockedHotkeyToast;
