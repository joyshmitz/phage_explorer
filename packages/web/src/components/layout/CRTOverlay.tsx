import React, { useMemo } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  detectCoarsePointerDevice,
  getEffectiveScanlines,
  useWebPreferences,
} from '../../store/createWebStore';

export const CRTOverlay: React.FC = () => {
  const scanlines = useWebPreferences(s => s.scanlines);
  const reducedMotion = useReducedMotion();
  const coarsePointer = useMemo(() => detectCoarsePointerDevice(), []);

  if (!getEffectiveScanlines(scanlines, { reducedMotion, coarsePointer })) return null;

  return (
    <div className="crt-overlay" aria-hidden="true">
      <div className="scanlines" />
      <div className="vignette" />
      <div className="noise" />
    </div>
  );
};
