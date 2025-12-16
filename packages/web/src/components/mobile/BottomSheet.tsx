/**
 * BottomSheet - iOS/Android-style modal with gesture physics
 *
 * Features:
 * - Slides up from bottom with spring animation
 * - Swipe down to dismiss with velocity-based snapping
 * - Multiple snap points (half, full)
 * - Drag handle for visual affordance
 * - Haptic feedback on interactions
 * - Backdrop blur effect
 * - Safe area padding for notched devices
 *
 * Uses @use-gesture/react and @react-spring/web for native-feeling physics.
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useSpring, animated, config } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { haptics } from '../../utils/haptics';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// =============================================================================
// Types
// =============================================================================

export type SnapPoint = 'closed' | 'half' | 'full';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Optional footer content (e.g., action buttons) */
  footer?: ReactNode;
  /** Whether to show the drag handle (default: true) */
  showHandle?: boolean;
  /** Whether to close on backdrop tap (default: true) */
  closeOnBackdropTap?: boolean;
  /** Whether to enable swipe-to-dismiss (default: true) */
  swipeToDismiss?: boolean;
  /** Initial snap point (default: 'half') */
  initialSnapPoint?: SnapPoint;
  /** Minimum height as percentage of viewport (default: 30) */
  minHeight?: number;
  /** Maximum height as percentage of viewport (default: 90) */
  maxHeight?: number;
  /** Callback when snap point changes */
  onSnapPointChange?: (snapPoint: SnapPoint) => void;
}

// =============================================================================
// Constants
// =============================================================================

/** Height percentages for each snap point */
const SNAP_HEIGHTS: Record<SnapPoint, number> = {
  closed: 0,
  half: 50,
  full: 90,
};

/** Velocity threshold to trigger snap on release (px/ms) */
const VELOCITY_THRESHOLD = 0.5;

// =============================================================================
// Component
// =============================================================================

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
  showHandle = true,
  closeOnBackdropTap = true,
  swipeToDismiss = true,
  initialSnapPoint = 'half',
  minHeight = 30,
  maxHeight = 90,
  onSnapPointChange,
}: BottomSheetProps): React.ReactElement | null {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Current snap point state
  const [snapPoint, setSnapPoint] = useState<SnapPoint>(initialSnapPoint);

  // Calculate actual heights
  const getSnapHeight = useCallback(
    (point: SnapPoint): number => {
      if (point === 'closed') return 0;
      const baseHeight = SNAP_HEIGHTS[point];
      return Math.min(Math.max(baseHeight, minHeight), maxHeight);
    },
    [minHeight, maxHeight]
  );

  // Spring animation for the sheet
  const [spring, api] = useSpring(() => ({
    y: 100, // Start off-screen (100% down)
    config: reducedMotion
      ? { duration: 0 }
      : { ...config.stiff, clamp: false },
  }));

  // Backdrop spring
  const [backdropSpring, backdropApi] = useSpring(() => ({
    opacity: 0,
    config: reducedMotion ? { duration: 0 } : { tension: 300, friction: 30 },
  }));

  // Animate sheet position based on snap point
  const animateToSnapPoint = useCallback(
    (point: SnapPoint, immediate = false) => {
      const targetY = point === 'closed' ? 100 : 100 - getSnapHeight(point);

      if (immediate || reducedMotion) {
        api.set({ y: targetY });
      } else {
        api.start({
          y: targetY,
          config: { tension: 400, friction: 35 },
        });
      }

      // Update backdrop
      backdropApi.start({
        opacity: point === 'closed' ? 0 : 0.5,
      });

      setSnapPoint(point);
      onSnapPointChange?.(point);

      if (point === 'closed') {
        // Small delay before calling onClose to allow animation
        setTimeout(() => onClose(), reducedMotion ? 0 : 200);
      }
    },
    [api, backdropApi, getSnapHeight, onClose, onSnapPointChange, reducedMotion]
  );

  // Find nearest snap point based on current position and velocity
  const findNearestSnapPoint = useCallback(
    (currentY: number, velocityY: number): SnapPoint => {
      // If velocity is high enough, snap based on direction
      if (Math.abs(velocityY) > VELOCITY_THRESHOLD) {
        if (velocityY > 0) {
          // Moving down - close or go to half
          return snapPoint === 'full' ? 'half' : 'closed';
        } else {
          // Moving up - expand to full
          return snapPoint === 'half' ? 'full' : 'half';
        }
      }

      // Otherwise, find nearest snap point based on position
      const currentPercent = currentY;
      const halfY = 100 - getSnapHeight('half');
      const fullY = 100 - getSnapHeight('full');

      // Distance to each snap point
      const distToClosed = Math.abs(currentPercent - 100);
      const distToHalf = Math.abs(currentPercent - halfY);
      const distToFull = Math.abs(currentPercent - fullY);

      // Find minimum
      if (distToClosed <= distToHalf && distToClosed <= distToFull) {
        return 'closed';
      }
      if (distToFull <= distToHalf) {
        return 'full';
      }
      return 'half';
    },
    [getSnapHeight, snapPoint]
  );

  // Drag gesture handler
  const bind = useDrag(
    ({
      movement: [, my],
      velocity: [, vy],
      direction: [, dy],
      active,
      first,
      last,
      memo,
    }) => {
      if (!swipeToDismiss && dy > 0) {
        // If swipe to dismiss is disabled, don't allow downward drag
        return;
      }

      // On first touch, store initial y position
      if (first) {
        return spring.y.get();
      }

      const initialY = memo ?? spring.y.get();
      const windowHeight = window.innerHeight;

      // Calculate new Y position (as percentage)
      const deltaPercent = (my / windowHeight) * 100;
      let newY = initialY + deltaPercent;

      // Apply bounds with rubberband effect
      const minY = 100 - getSnapHeight('full');
      const maxY = 100;

      if (newY < minY) {
        // Rubberband at top
        const overshoot = minY - newY;
        newY = minY - overshoot * 0.2;
      } else if (newY > maxY) {
        // Rubberband at bottom
        const overshoot = newY - maxY;
        newY = maxY + overshoot * 0.2;
      }

      if (active) {
        // During drag, update position immediately
        api.start({
          y: newY,
          immediate: true,
        });

        // Update backdrop opacity based on position
        const progress = Math.max(0, Math.min(1, (100 - newY) / getSnapHeight('half')));
        backdropApi.start({
          opacity: progress * 0.5,
          immediate: true,
        });

        // Haptic feedback when crossing thresholds
        const halfThreshold = 100 - getSnapHeight('half');
        const wasAboveHalf = (memo ?? initialY) < halfThreshold;
        const isAboveHalf = newY < halfThreshold;
        if (wasAboveHalf !== isAboveHalf) {
          haptics.selection();
        }
      }

      if (last) {
        // On release, snap to nearest point
        const targetPoint = findNearestSnapPoint(newY, vy * dy);
        animateToSnapPoint(targetPoint);

        if (targetPoint !== 'closed') {
          haptics.light();
        } else {
          haptics.medium();
        }
      }

      return memo;
    },
    {
      from: () => [0, 0],
      filterTaps: true,
      rubberband: 0.15,
    }
  );

  // Open/close animation
  useEffect(() => {
    if (isOpen) {
      haptics.medium();
      animateToSnapPoint(initialSnapPoint);
    } else {
      animateToSnapPoint('closed', true);
    }
  }, [isOpen, initialSnapPoint, animateToSnapPoint]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        haptics.light();
        animateToSnapPoint('closed');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, animateToSnapPoint]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnBackdropTap && e.target === e.currentTarget) {
        haptics.light();
        animateToSnapPoint('closed');
      }
    },
    [closeOnBackdropTap, animateToSnapPoint]
  );

  // Close button handler
  const handleClose = useCallback(() => {
    haptics.light();
    animateToSnapPoint('closed');
  }, [animateToSnapPoint]);

  // Expand/collapse handlers
  const handleExpand = useCallback(() => {
    haptics.selection();
    animateToSnapPoint(snapPoint === 'full' ? 'half' : 'full');
  }, [snapPoint, animateToSnapPoint]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`bottom-sheet ${isOpen ? 'is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'bottom-sheet-title' : undefined}
    >
      {/* Animated Backdrop */}
      <animated.div
        className="bottom-sheet__backdrop"
        onClick={handleBackdropClick}
        aria-hidden="true"
        style={{ opacity: backdropSpring.opacity }}
      />

      {/* Animated Sheet container */}
      <animated.div
        ref={containerRef}
        className="bottom-sheet__container"
        style={{
          transform: spring.y.to((y) => `translateY(${y}%)`),
          minHeight: `${minHeight}vh`,
          maxHeight: `${maxHeight}vh`,
        }}
        {...bind()}
      >
        {/* Drag handle */}
        {showHandle && (
          <div
            className="bottom-sheet__handle"
            aria-hidden="true"
            onDoubleClick={handleExpand}
          />
        )}

        {/* Header */}
        {title && (
          <header className="bottom-sheet__header">
            <h2 id="bottom-sheet-title" className="bottom-sheet__title">
              {title}
            </h2>
            <button
              type="button"
              className="bottom-sheet__close"
              onClick={handleClose}
              aria-label="Close"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </header>
        )}

        {/* Content */}
        <div ref={contentRef} className="bottom-sheet__content">
          {children}
        </div>

        {/* Footer */}
        {footer && <footer className="bottom-sheet__footer">{footer}</footer>}

        {/* Snap point indicator (visual only) */}
        <div
          className={`bottom-sheet__snap-indicator bottom-sheet__snap-indicator--${snapPoint}`}
          aria-hidden="true"
        />
      </animated.div>
    </div>,
    document.body
  );
}

export default BottomSheet;
