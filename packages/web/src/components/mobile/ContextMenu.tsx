/**
 * ContextMenu - Portal-rendered context menu for long-press interactions
 *
 * Features:
 * - Portal to body for proper stacking
 * - Auto-positioning within viewport bounds
 * - Spring entrance animation via CSS
 * - Backdrop tap to dismiss
 * - Haptic feedback on selection
 */

import React, { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { haptics } from '../../utils/haptics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContextMenuItem {
  /** Display label */
  label: string;
  /** Action callback */
  onSelect: () => void;
  /** BEM modifier: 'destructive' makes item red */
  variant?: 'destructive';
  /** Icon element */
  icon?: ReactNode;
  /** Divider before this item */
  dividerBefore?: boolean;
}

export interface ContextMenuProps {
  /** Whether the menu is visible */
  isOpen: boolean;
  /** Position in viewport coordinates */
  position: { x: number; y: number };
  /** Menu items */
  items: ContextMenuItem[];
  /** Close callback */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContextMenu({
  isOpen,
  position,
  items,
  onClose,
}: ContextMenuProps): React.ReactElement | null {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Adjust position if menu would overflow viewport
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const el = menuRef.current;
    const rect = el.getBoundingClientRect();
    const margin = 8;

    let adjustX = 0;
    let adjustY = 0;

    if (rect.right > window.innerWidth - margin) {
      adjustX = window.innerWidth - margin - rect.right;
    }
    if (rect.bottom > window.innerHeight - margin) {
      adjustY = window.innerHeight - margin - rect.bottom;
    }

    if (adjustX !== 0 || adjustY !== 0) {
      el.style.transform = `translate(${adjustX}px, ${adjustY}px)`;
    }
  }, [isOpen, position]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Invisible backdrop for dismiss */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 'var(--z-popover, 8000)' as unknown as number,
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu */}
      <div
        ref={menuRef}
        className="context-menu"
        role="menu"
        aria-label="Context menu"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {item.dividerBefore && <div className="context-menu__divider" role="separator" />}
            <button
              className={`context-menu__item ${item.variant === 'destructive' ? 'context-menu__item--destructive' : ''}`}
              role="menuitem"
              onClick={() => {
                haptics.selection();
                item.onSelect();
                onClose();
              }}
            >
              {item.icon && (
                <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          </React.Fragment>
        ))}
      </div>
    </>,
    document.body
  );
}
