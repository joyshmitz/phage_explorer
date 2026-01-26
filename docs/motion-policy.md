# Motion & FX Policy

> Phage Explorer Web - Animation and Visual Effects Guidelines

## Design Principles

1. **Purposeful Motion**: Every animation should have a clear purpose (feedback, orientation, or delight)
2. **Performance First**: Prefer `transform` and `opacity` - properties that can be GPU-accelerated
3. **Respect User Preferences**: Always honor `prefers-reduced-motion`
4. **Mobile-Aware**: Heavy effects are disabled on touch devices to preserve battery and performance

## When to Animate

### DO Animate
- State transitions (open/close, expand/collapse)
- Navigation feedback (page changes, overlay entry/exit)
- Loading states (skeleton shimmer, spinners)
- User feedback (hover, focus, active states)
- Error states (shake animation for validation errors)

### DON'T Animate
- Static content that doesn't change state
- Background elements that don't provide value
- Elements below the fold during initial load
- Anything that would cause layout thrashing

## Duration Guidelines

| Use Case | Token | Value | Notes |
|----------|-------|-------|-------|
| Instant feedback | `--duration-instant` | 50ms | Press states |
| Micro-interactions | `--duration-micro` | 80ms | Tactile feedback |
| Press/release | `--duration-press` | 120ms | Button presses |
| Hover states | `--duration-hover` | 180ms | Hover transitions |
| Focus rings | `--duration-focus` | 200ms | Focus state changes |
| Quick transitions | `--duration-fast` | 150ms | Small element changes |
| Standard transitions | `--duration-normal` | 250ms | Most UI transitions |
| Complex transitions | `--duration-slow` | 400ms | Overlays, modals |
| Dramatic transitions | `--duration-slower` | 600ms | Theme changes |

## Easing Guidelines

| Use Case | Token | Notes |
|----------|-------|-------|
| Linear motion | `--ease-linear` | Progress indicators, continuous motion |
| Enter animations | `--ease-out` | Elements appearing |
| Exit animations | `--ease-in` | Elements disappearing |
| State changes | `--ease-in-out` | Hover, focus transitions |
| Bouncy emphasis | `--ease-spring` | Attention-grabbing elements |
| Gentle spring | `--ease-spring-soft` | Overlay panels, sheets |
| Apple-like smooth | `--ease-smooth` | Premium feel transitions |
| Stripe deceleration | `--ease-expo-out` | Primary action feedback |
| Overshoot emphasis | `--ease-back` | Confirmation, success states |

## Heavy Background FX Rules

The following effects are considered "heavy" and have special handling:

| Effect | Class | Mobile | Reduced Motion |
|--------|-------|--------|----------------|
| Scanlines | `.scanline-overlay`, `.with-scanlines` | Disabled | Disabled |
| CRT flicker | `.crt-flicker` | Disabled | Disabled |
| Matrix rain | `.matrix-rain` | Disabled | Disabled |
| Glow pulse | `.animate-glow-pulse` | Slowed (4s) | Disabled |

**Implementation notes (Web):**
- **Background FX** (Matrix rain + CRT overlay) are gated by the `backgroundEffects` preference and runtime constraints (reduced motion, narrow screens, coarse pointer) (see `packages/web/src/App.tsx` and `packages/web/src/components/layout/AppShell.tsx`).
- **CRT/Post-process FX** (scanlines / bloom / chromatic aberration) are gated by `scanlines` / `glow` preferences and runtime constraints (see `packages/web/src/components/SequenceView.tsx` and `packages/web/src/components/layout/CRTOverlay.tsx`).

### Default States
- **New users**: Heavy FX disabled by default for premium, analysis-first impression
- **Power users**: Can enable via Settings > Visual Effects
- **Mobile / coarse-pointer**: Always suppressed regardless of preference (battery + perf)

## Reduced Motion Requirements

All animations must respect the `prefers-reduced-motion: reduce` media query:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-* {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Enforcement**: See `packages/web/src/styles/animations.css` lines 533-574

### React Hook
Use `useReducedMotion()` for programmatic checks:

```tsx
import { useReducedMotion } from '../hooks/useReducedMotion';

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    // Provide instant state change without animation
  }
}
```

## Mobile/Touch Constraints

Touch devices (`pointer: coarse`, `hover: none`) have special handling:

1. **No continuous animations**: Scanlines, CRT flicker disabled
2. **Reduced intensity**: Glow animations run at 4s instead of 2s
3. **Simpler entry/exit**: Bottom sheets use simpler slide animations
4. **No hover effects**: Use active states instead

**Enforcement**: See `packages/web/src/styles/animations.css` lines 580-597

## Overlay Animation Choreography

Standard overlay entry/exit sequence:

1. **Backdrop**: Fade in with blur (250ms, ease-out)
2. **Panel**: Slide up with spring physics (400ms, ease-spring-soft, 80ms delay)
3. **Content**: Staggered reveal (60ms delay between children)

Exit is faster (180ms) to feel responsive.

## Adding New Animations

1. **Use existing tokens**: Always use `--duration-*` and `--ease-*` tokens
2. **Add reduced-motion override**: Include in the `@media (prefers-reduced-motion)` block
3. **Check mobile impact**: Test on touch devices, add to mobile disable block if continuous
4. **Document purpose**: Add comment explaining why the animation exists

## Token Reference Files

- **Timing tokens**: `packages/web/src/styles/variables.css`
- **Animation keyframes**: `packages/web/src/styles/animations.css`
- **Reduced motion hook**: `packages/web/src/hooks/useReducedMotion.ts`

---

*Last updated: 2026-01-26*
