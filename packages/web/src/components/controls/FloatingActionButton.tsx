import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { haptics } from '../../utils/haptics';
import { IconPlus, IconX } from '../ui';

interface FloatingActionButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  onLongPress?: () => void;
}

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
  const portalRootRef = useRef<HTMLElement | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    portalRootRef.current = document.body;
    return () => {
      if (longPressTimer.current) {
        window.clearTimeout(longPressTimer.current);
      }
    };
  }, []);

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
  );

  if (portalRootRef.current) {
    return createPortal(content, portalRootRef.current);
  }

  return content;
}
