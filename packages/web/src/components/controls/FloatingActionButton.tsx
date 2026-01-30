import React, { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { haptics } from '../../utils/haptics';
import { IconPlus, IconX } from '../ui';

interface FloatingActionButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  onLongPress?: () => void;
}

const FAB_HINT_STORAGE_KEY = 'phage-explorer-fab-hint-dismissed';

/**
 * Mobile-first Floating Action Button (FAB)
 * - Renders via portal to avoid stacking issues
 * - Supports long-press gesture for secondary action
 * - Haptic feedback on interactions
 * - SVG icons with smooth rotation animation
 * - Respects reduced motion preference
 */
export function FloatingActionButton({
  isOpen,
  onToggle,
  onLongPress,
}: FloatingActionButtonProps): React.ReactElement {
  // Use state instead of ref to trigger re-render when portal root is ready
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    // Set portal root - this triggers a re-render so createPortal works on subsequent render
    setPortalRoot(document.body);

    // Show hint for new users who haven't dismissed it
    try {
      const dismissed = localStorage.getItem(FAB_HINT_STORAGE_KEY);
      if (!dismissed) {
        setShowHint(true);
      }
    } catch {
      // localStorage not available
    }

    return () => {
      if (longPressTimer.current) {
        window.clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Hide hint when FAB is opened (user has discovered it)
  useEffect(() => {
    if (isOpen && showHint) {
      setShowHint(false);
      try {
        localStorage.setItem(FAB_HINT_STORAGE_KEY, 'true');
      } catch {
        // localStorage not available
      }
    }
  }, [isOpen, showHint]);

  const handleTouchStart = useCallback(() => {
    if (!onLongPress) return;
    longPressTimer.current = window.setTimeout(() => {
      longPressTimer.current = null;
      haptics.heavy();
      onLongPress();
    }, 500);
  }, [onLongPress]);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    haptics.medium();
    onToggle();
  }, [onToggle]);

  const content = (
    <>
      <button
        type="button"
        className={`fab ${isOpen ? 'fab--open' : ''} ${reducedMotion ? 'fab--no-anim' : ''}`}
        aria-label={isOpen ? 'Close control menu' : 'Open control menu'}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="action-drawer"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={clearLongPress}
        onTouchCancel={clearLongPress}
      >
        <span className="fab-icon" aria-hidden="true">
          {isOpen ? <IconX size={24} strokeWidth={2.5} /> : <IconPlus size={24} strokeWidth={2.5} />}
        </span>
      </button>
      {showHint && !isOpen && (
        <span className="fab-hint" aria-hidden="true">
          Quick actions
        </span>
      )}
    </>
  );

  if (portalRoot) {
    return createPortal(content, portalRoot);
  }

  return content;
}
