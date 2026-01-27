/**
 * useContextMenu - Combines useLongPress with context menu state management
 *
 * Provides long-press gesture binding and menu position/visibility state.
 */

import { useState, useCallback } from 'react';
import { useLongPress } from './useGestures';

export interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
}

export interface UseContextMenuOptions {
  /** Long press delay in ms */
  delay?: number;
  /** Whether context menu is enabled */
  enabled?: boolean;
}

export interface UseContextMenuResult {
  /** Current menu state */
  menuState: ContextMenuState;
  /** Close the menu */
  closeMenu: () => void;
  /** Gesture binding for the trigger element */
  bindLongPress: ReturnType<typeof useLongPress>;
}

export function useContextMenu(options: UseContextMenuOptions = {}): UseContextMenuResult {
  const { delay = 500, enabled = true } = options;

  const [menuState, setMenuState] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
  });

  const closeMenu = useCallback(() => {
    setMenuState({ isOpen: false, position: { x: 0, y: 0 } });
  }, []);

  const handleLongPress = useCallback(
    (pos: { x: number; y: number }) => {
      if (!enabled) return;

      // Clamp position to viewport bounds
      const x = Math.min(pos.x, window.innerWidth - 220);
      const y = Math.min(pos.y, window.innerHeight - 200);

      setMenuState({
        isOpen: true,
        position: { x: Math.max(8, x), y: Math.max(8, y) },
      });
    },
    [enabled]
  );

  const bindLongPress = useLongPress({
    onLongPress: handleLongPress,
    delay,
    hapticFeedback: true,
  });

  return { menuState, closeMenu, bindLongPress };
}
