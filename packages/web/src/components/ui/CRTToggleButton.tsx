/**
 * CRTToggleButton - Floating button to toggle CRT effects
 *
 * A cute mini curved screen button in the corner that toggles
 * scanlines (and related CRT post-processing).
 */

import React, { useMemo } from 'react';
import { IconCRT } from './icons';
import { Tooltip } from './Tooltip';
import { allowHeavyFx, detectCoarsePointerDevice, useWebPreferences } from '../../store/createWebStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface CRTToggleButtonProps {
  /** Position of the button */
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
}

export function CRTToggleButton({
  position = 'bottom-right',
  size = 'md',
}: CRTToggleButtonProps): React.ReactElement | null {
  const scanlines = useWebPreferences((s) => s.scanlines);
  const setScanlines = useWebPreferences((s) => s.setScanlines);
  const reducedMotion = useReducedMotion();
  const coarsePointer = useMemo(() => detectCoarsePointerDevice(), []);

  const handleToggle = () => {
    setScanlines(!scanlines);
  };

  if (!allowHeavyFx({ reducedMotion, coarsePointer })) return null;

  const sizeMap = {
    sm: { button: 32, icon: 16 },
    md: { button: 40, icon: 20 },
    lg: { button: 48, icon: 24 },
  };

  const positionMap = {
    'bottom-left': { bottom: 'calc(1rem + env(safe-area-inset-bottom))', left: 'calc(1rem + env(safe-area-inset-left))' },
    'bottom-right': { bottom: 'calc(1rem + env(safe-area-inset-bottom))', right: 'calc(1rem + env(safe-area-inset-right))' },
    'top-left': { top: 'calc(1rem + env(safe-area-inset-top))', left: 'calc(1rem + env(safe-area-inset-left))' },
    'top-right': { top: 'calc(1rem + env(safe-area-inset-top))', right: 'calc(1rem + env(safe-area-inset-right))' },
  };

  const { button: buttonSize, icon: iconSize } = sizeMap[size];
  const positionStyle = positionMap[position];

  return (
    <Tooltip content={scanlines ? 'CRT Scanlines: ON' : 'CRT Scanlines: OFF'} position="left">
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={scanlines}
        aria-label={scanlines ? 'Disable CRT scanlines' : 'Enable CRT scanlines'}
        style={{
          position: 'fixed',
          ...positionStyle,
          width: buttonSize,
          height: buttonSize,
          borderRadius: '50%',
          border: `2px solid ${scanlines ? 'var(--color-accent)' : 'var(--color-border-light)'}`,
          backgroundColor: scanlines ? 'var(--color-accent)' : 'var(--color-background)',
          color: scanlines ? 'var(--color-background)' : 'var(--color-text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          transition: 'all 0.2s ease',
          boxShadow: scanlines
            ? '0 0 12px var(--color-accent), 0 2px 8px rgba(0,0,0,0.3)'
            : '0 2px 8px rgba(0,0,0,0.2)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <IconCRT size={iconSize} />
      </button>
    </Tooltip>
  );
}

export default CRTToggleButton;
