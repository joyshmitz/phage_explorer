/**
 * SwipeAction - Swipe-to-reveal action buttons on list items
 *
 * Features:
 * - Rubberband resistance beyond action width
 * - Velocity-based snap (threshold: 0.5 px/ms)
 * - Haptic feedback at threshold crossings
 * - Spring-based animations via @react-spring/web
 *
 * Follows PullToRefresh.tsx patterns.
 */

import React, { useCallback, useRef, type ReactNode } from 'react';
import { useSpringValue, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { haptics } from '../../utils/haptics';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SwipeActionItem {
  /** Action label */
  label: string;
  /** Action callback */
  onAction: () => void;
  /** BEM modifier for styling (e.g. 'delete', 'archive', 'favorite') */
  variant?: 'delete' | 'archive' | 'favorite';
  /** Icon element */
  icon?: ReactNode;
}

export interface SwipeActionProps {
  children: ReactNode;
  /** Actions revealed on swipe left */
  rightActions?: SwipeActionItem[];
  /** Actions revealed on swipe right */
  leftActions?: SwipeActionItem[];
  /** Whether swiping is enabled */
  enabled?: boolean;
  /** Width per action button in px */
  actionWidth?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RUBBERBAND_FACTOR = 0.3;
const VELOCITY_THRESHOLD = 0.5; // px/ms
const SPRING_CONFIG = { tension: 300, friction: 28 };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SwipeAction({
  children,
  rightActions = [],
  leftActions = [],
  enabled = true,
  actionWidth = 80,
  className = '',
}: SwipeActionProps): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const translateX = useSpringValue(0, {
    config: reducedMotion ? { duration: 0 } : SPRING_CONFIG,
  });

  const hasPassedThresholdRef = useRef(false);
  const directionRef = useRef<'left' | 'right' | null>(null);

  const rightActionsWidth = rightActions.length * actionWidth;
  const leftActionsWidth = leftActions.length * actionWidth;

  const applyRubberband = useCallback(
    (offset: number, maxOffset: number): number => {
      const abs = Math.abs(offset);
      if (abs <= maxOffset) return offset;
      const sign = offset > 0 ? 1 : -1;
      const over = abs - maxOffset;
      return sign * (maxOffset + over * RUBBERBAND_FACTOR);
    },
    []
  );

  const bind = useDrag(
    ({ movement: [mx], velocity: [vx], active, cancel }) => {
      if (!enabled) return;

      // Determine swipe direction on first move
      if (directionRef.current === null && Math.abs(mx) > 5) {
        directionRef.current = mx > 0 ? 'right' : 'left';
      }

      // Cancel if swiping in a direction with no actions
      if (directionRef.current === 'right' && leftActions.length === 0) {
        cancel();
        directionRef.current = null;
        return;
      }
      if (directionRef.current === 'left' && rightActions.length === 0) {
        cancel();
        directionRef.current = null;
        return;
      }

      if (active) {
        const maxOffset =
          directionRef.current === 'left' ? rightActionsWidth : leftActionsWidth;
        const clamped = applyRubberband(mx, maxOffset);
        translateX.set(clamped);

        // Haptic feedback at threshold crossing
        const pastThreshold = Math.abs(mx) >= maxOffset * 0.5;
        if (pastThreshold && !hasPassedThresholdRef.current) {
          hasPassedThresholdRef.current = true;
          haptics.selection();
        } else if (!pastThreshold && hasPassedThresholdRef.current) {
          hasPassedThresholdRef.current = false;
        }
      } else {
        // On release: decide whether to snap open or closed
        hasPassedThresholdRef.current = false;
        const maxOffset =
          directionRef.current === 'left' ? rightActionsWidth : leftActionsWidth;

        // Velocity assist: check if fast flick in the swipe direction
        const velocityInDirection =
          directionRef.current === 'left' ? -vx : vx;
        const shouldOpen =
          Math.abs(mx) > maxOffset * 0.4 || velocityInDirection > VELOCITY_THRESHOLD;

        if (shouldOpen && maxOffset > 0) {
          const target = directionRef.current === 'left' ? -maxOffset : maxOffset;
          translateX.start(target);
        } else {
          translateX.start(0);
          directionRef.current = null;
        }
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      pointer: { touch: true },
    }
  );

  const reset = useCallback(() => {
    translateX.start(0);
    directionRef.current = null;
  }, [translateX]);

  return (
    <div className={`swipe-container ${className}`}>
      {/* Left actions (revealed on swipe right) */}
      {leftActions.length > 0 && (
        <div className="swipe-actions swipe-actions--left" style={{ width: leftActionsWidth }}>
          {leftActions.map((action, i) => (
            <button
              key={i}
              type="button"
              className={`swipe-action ${action.variant ? `swipe-action--${action.variant}` : ''}`}
              style={{ minWidth: actionWidth }}
              onClick={() => {
                action.onAction();
                reset();
              }}
              aria-label={action.label}
            >
              {action.icon && <span aria-hidden="true">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Right actions (revealed on swipe left) */}
      {rightActions.length > 0 && (
        <div className="swipe-actions swipe-actions--right" style={{ width: rightActionsWidth }}>
          {rightActions.map((action, i) => (
            <button
              key={i}
              type="button"
              className={`swipe-action ${action.variant ? `swipe-action--${action.variant}` : ''}`}
              style={{ minWidth: actionWidth }}
              onClick={() => {
                action.onAction();
                reset();
              }}
              aria-label={action.label}
            >
              {action.icon && <span aria-hidden="true">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Swipeable content */}
      <animated.div
        className="swipe-content"
        style={{ transform: translateX.to((x) => `translateX(${x}px)`) }}
        {...bind()}
      >
        {children}
      </animated.div>
    </div>
  );
}
