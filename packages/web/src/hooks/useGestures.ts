/**
 * useGestures - Unified gesture handling hook
 *
 * Wraps @use-gesture/react to provide native-feeling touch interactions.
 * Respects prefers-reduced-motion and provides haptic feedback.
 */

import { useRef, useCallback, useEffect } from 'react';
import { useDrag, usePinch, type Handler } from '@use-gesture/react';
import { useReducedMotion } from './useReducedMotion';
import { haptics } from '../utils/haptics';

// =============================================================================
// Types
// =============================================================================

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface SwipeState {
  direction: SwipeDirection;
  velocity: number;
  distance: number;
  canceled: boolean;
}

export interface DragState {
  /** Current offset from start [x, y] */
  offset: [number, number];
  /** Movement delta since last event [dx, dy] */
  delta: [number, number];
  /** Current velocity [vx, vy] */
  velocity: [number, number];
  /** Whether drag is active */
  active: boolean;
  /** Whether drag was canceled */
  canceled: boolean;
  /** Initial position [x, y] */
  initial: [number, number];
  /** Direction of primary axis movement */
  direction: SwipeDirection | null;
}

export interface PinchState {
  /** Scale factor relative to initial pinch */
  scale: number;
  /** Rotation in degrees */
  rotation: number;
  /** Center point of pinch [x, y] */
  origin: [number, number];
  /** Whether pinch is active */
  active: boolean;
}

export interface UseSwipeOptions {
  /** Minimum swipe distance in px (default: 50) */
  threshold?: number;
  /** Minimum velocity in px/ms (default: 0.3) */
  velocityThreshold?: number;
  /** Callback when swipe is detected */
  onSwipe: (state: SwipeState) => void;
  /** Lock to horizontal or vertical axis */
  axis?: 'x' | 'y';
  /** Enable haptic feedback (default: true) */
  hapticFeedback?: boolean;
}

export interface UseDragOptions {
  /** Callback during drag */
  onDrag: (state: DragState) => void;
  /** Callback when drag ends */
  onDragEnd?: (state: DragState) => void;
  /** Bounds for drag [minX, maxX, minY, maxY] */
  bounds?: { left?: number; right?: number; top?: number; bottom?: number };
  /** Lock to horizontal or vertical axis */
  axis?: 'x' | 'y';
  /** Enable haptic feedback (default: true) */
  hapticFeedback?: boolean;
  /** Rubberband factor at bounds (0 = hard stop, 1 = no resistance) */
  rubberband?: number | boolean;
}

export interface UsePinchOptions {
  /** Callback during pinch */
  onPinch: (state: PinchState) => void;
  /** Callback when pinch ends */
  onPinchEnd?: (state: PinchState) => void;
  /** Scale bounds [min, max] */
  scaleBounds?: { min?: number; max?: number };
  /** Enable haptic feedback (default: true) */
  hapticFeedback?: boolean;
}

// =============================================================================
// useSwipe - Swipe gesture detection
// =============================================================================

/**
 * Detects swipe gestures with velocity and direction.
 *
 * @example
 * ```tsx
 * const bind = useSwipe({
 *   onSwipe: ({ direction, velocity }) => {
 *     if (direction === 'left') navigateNext();
 *     if (direction === 'right') navigatePrev();
 *   },
 *   axis: 'x',
 * });
 *
 * return <div {...bind()} />;
 * ```
 */
export function useSwipe(options: UseSwipeOptions) {
  const {
    threshold = 50,
    velocityThreshold = 0.3,
    onSwipe,
    axis,
    hapticFeedback = true,
  } = options;

  const reducedMotion = useReducedMotion();

  return useDrag(
    ({ movement: [mx, my], velocity: [vx, vy], direction: [dx, dy], canceled, last }) => {
      if (!last || canceled) return;

      const isHorizontal = axis === 'x' || (!axis && Math.abs(mx) > Math.abs(my));
      const distance = isHorizontal ? Math.abs(mx) : Math.abs(my);
      const velocity = isHorizontal ? Math.abs(vx) : Math.abs(vy);
      const dir = isHorizontal ? dx : dy;

      // Check thresholds
      if (distance < threshold || velocity < velocityThreshold) return;

      let direction: SwipeDirection;
      if (isHorizontal) {
        direction = dir > 0 ? 'right' : 'left';
      } else {
        direction = dir > 0 ? 'down' : 'up';
      }

      if (hapticFeedback && !reducedMotion) {
        haptics.light();
      }

      onSwipe({ direction, velocity, distance, canceled: false });
    },
    {
      axis,
      filterTaps: true,
      threshold: 10,
    }
  );
}

// =============================================================================
// useDragGesture - Drag with physics
// =============================================================================

/**
 * Provides smooth drag handling with optional bounds and rubberband effect.
 *
 * @example
 * ```tsx
 * const bind = useDragGesture({
 *   onDrag: ({ offset: [, y] }) => setSheetY(y),
 *   onDragEnd: ({ offset: [, y], velocity: [, vy] }) => {
 *     if (y > 200 || vy > 0.5) dismiss();
 *   },
 *   axis: 'y',
 *   bounds: { top: 0, bottom: 500 },
 *   rubberband: 0.2,
 * });
 *
 * return <div {...bind()} />;
 * ```
 */
export function useDragGesture(options: UseDragOptions) {
  const {
    onDrag,
    onDragEnd,
    bounds,
    axis,
    hapticFeedback = true,
    rubberband = 0.15,
  } = options;

  const reducedMotion = useReducedMotion();
  const hasStartedRef = useRef(false);

  const handler: Handler<'drag'> = ({
    movement: [mx, my],
    velocity: [vx, vy],
    direction: [dx, dy],
    offset: [ox, oy],
    delta: [ddx, ddy],
    initial,
    active,
    canceled,
    first,
    last,
  }) => {
    // Haptic on drag start
    if (first && hapticFeedback && !reducedMotion) {
      haptics.selection();
      hasStartedRef.current = true;
    }

    // Determine direction
    let direction: SwipeDirection | null = null;
    if (Math.abs(mx) > Math.abs(my)) {
      direction = dx > 0 ? 'right' : 'left';
    } else if (Math.abs(my) > 10) {
      direction = dy > 0 ? 'down' : 'up';
    }

    const state: DragState = {
      offset: [ox, oy],
      delta: [ddx, ddy],
      velocity: [vx, vy],
      active,
      canceled,
      initial: initial as [number, number],
      direction,
    };

    onDrag(state);

    // Call onDragEnd when gesture completes
    if (last && onDragEnd) {
      if (hapticFeedback && !reducedMotion && hasStartedRef.current) {
        haptics.light();
        hasStartedRef.current = false;
      }
      onDragEnd(state);
    }
  };

  return useDrag(handler, {
    axis,
    bounds,
    rubberband: typeof rubberband === 'boolean' ? (rubberband ? 0.15 : 0) : rubberband,
    filterTaps: true,
  });
}

// =============================================================================
// usePinchGesture - Pinch-to-zoom
// =============================================================================

/**
 * Handles pinch gestures for zooming and rotation.
 *
 * @example
 * ```tsx
 * const [scale, setScale] = useState(1);
 *
 * const bind = usePinchGesture({
 *   onPinch: ({ scale }) => setScale(scale),
 *   scaleBounds: { min: 0.5, max: 3 },
 * });
 *
 * return <div {...bind()} style={{ transform: `scale(${scale})` }} />;
 * ```
 */
export function usePinchGesture(options: UsePinchOptions) {
  const {
    onPinch,
    onPinchEnd,
    scaleBounds = { min: 0.5, max: 3 },
    hapticFeedback = true,
  } = options;

  const reducedMotion = useReducedMotion();
  const hasStartedRef = useRef(false);

  return usePinch(
    ({ offset: [scale, rotation], origin, active, first, last }) => {
      // Clamp scale to bounds
      const clampedScale = Math.min(
        Math.max(scale, scaleBounds.min ?? 0.1),
        scaleBounds.max ?? 10
      );

      // Haptic on pinch start
      if (first && hapticFeedback && !reducedMotion) {
        haptics.selection();
        hasStartedRef.current = true;
      }

      const state: PinchState = {
        scale: clampedScale,
        rotation,
        origin: origin as [number, number],
        active,
      };

      onPinch(state);

      if (last && onPinchEnd) {
        if (hapticFeedback && !reducedMotion && hasStartedRef.current) {
          haptics.light();
          hasStartedRef.current = false;
        }
        onPinchEnd(state);
      }
    },
    {
      scaleBounds,
    }
  );
}

// =============================================================================
// useLongPress - Long press detection
// =============================================================================

export interface UseLongPressOptions {
  /** Callback when long press is detected */
  onLongPress: (position: { x: number; y: number }) => void;
  /** Duration in ms before triggering (default: 500) */
  delay?: number;
  /** Enable haptic feedback (default: true) */
  hapticFeedback?: boolean;
}

/**
 * Detects long press gestures.
 *
 * @example
 * ```tsx
 * const bind = useLongPress({
 *   onLongPress: ({ x, y }) => showContextMenu(x, y),
 *   delay: 400,
 * });
 *
 * return <div {...bind()} />;
 * ```
 */
export function useLongPress(options: UseLongPressOptions) {
  const { onLongPress, delay = 500, hapticFeedback = true } = options;
  const reducedMotion = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const positionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const triggeredRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);

  return useDrag(
    ({ xy: [x, y], first, active, canceled, movement: [mx, my] }) => {
      if (first) {
        positionRef.current = { x, y };
        triggeredRef.current = false;

        timerRef.current = setTimeout(() => {
          if (!triggeredRef.current) {
            triggeredRef.current = true;
            if (hapticFeedback && !reducedMotion) {
              haptics.medium();
            }
            onLongPress(positionRef.current);
          }
        }, delay);
      }

      // Cancel if moved too much or released
      if (!active || canceled || Math.abs(mx) > 10 || Math.abs(my) > 10) {
        clear();
      }
    },
    { filterTaps: false }
  );
}

// =============================================================================
// Utility: Combined gesture handler
// =============================================================================

export interface UseGesturesOptions {
  onSwipe?: UseSwipeOptions['onSwipe'];
  onDrag?: UseDragOptions['onDrag'];
  onDragEnd?: UseDragOptions['onDragEnd'];
  onPinch?: UsePinchOptions['onPinch'];
  onPinchEnd?: UsePinchOptions['onPinchEnd'];
  onLongPress?: UseLongPressOptions['onLongPress'];
  swipeThreshold?: number;
  swipeVelocityThreshold?: number;
  axis?: 'x' | 'y';
  bounds?: UseDragOptions['bounds'];
  scaleBounds?: UsePinchOptions['scaleBounds'];
  hapticFeedback?: boolean;
}

/**
 * Combined gesture handler for multiple gesture types.
 * Useful when you need multiple gestures on the same element.
 *
 * Note: For simple use cases, prefer the individual hooks (useSwipe, useDragGesture, etc.)
 * as they are more optimized.
 *
 * IMPORTANT: All gesture hooks are called unconditionally to comply with React's
 * Rules of Hooks. Unused handlers are given no-op callbacks.
 */
export function useGestures(options: UseGesturesOptions) {
  const {
    onSwipe,
    onDrag,
    onDragEnd,
    onPinch,
    onPinchEnd,
    onLongPress,
    swipeThreshold = 50,
    swipeVelocityThreshold = 0.3,
    axis,
    bounds,
    scaleBounds,
    hapticFeedback = true,
  } = options;

  // Always call all hooks unconditionally (React Rules of Hooks).
  // Use no-op callbacks when the gesture type isn't needed.
  const swipeBind = useSwipe({
    onSwipe: onSwipe || (() => {}),
    threshold: swipeThreshold,
    velocityThreshold: swipeVelocityThreshold,
    axis,
    hapticFeedback: onSwipe ? hapticFeedback : false, // Disable haptics for no-op
  });

  const dragBind = useDragGesture({
    onDrag: onDrag || (() => {}),
    onDragEnd,
    axis,
    bounds,
    hapticFeedback: onDrag || onDragEnd ? hapticFeedback : false,
  });

  const pinchBind = usePinchGesture({
    onPinch: onPinch || (() => {}),
    onPinchEnd,
    scaleBounds,
    hapticFeedback: onPinch || onPinchEnd ? hapticFeedback : false,
  });

  const longPressBind = useLongPress({
    onLongPress: onLongPress || (() => {}),
    hapticFeedback: onLongPress ? hapticFeedback : false,
  });

  // Merge bindings - only include enabled gesture types
  return useCallback(
    () => ({
      ...(onSwipe ? swipeBind() : {}),
      ...(onDrag || onDragEnd ? dragBind() : {}),
      ...(onPinch || onPinchEnd ? pinchBind() : {}),
      ...(onLongPress ? longPressBind() : {}),
    }),
    [swipeBind, dragBind, pinchBind, longPressBind, onSwipe, onDrag, onDragEnd, onPinch, onPinchEnd, onLongPress]
  );
}
