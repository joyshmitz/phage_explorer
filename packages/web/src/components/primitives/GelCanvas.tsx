import React, { useEffect, useRef } from 'react';
import type { GelBand, GelLane } from './types';

// Calculate band position from size using log scale (gel electrophoresis)
// Smaller fragments travel further, so we invert
const MIN_BP = 100;
const MAX_BP = 10000;

function getBandPosition(band: GelBand): number {
  if (band.position !== undefined) return band.position;
  // Log scale: smaller fragments travel further (higher position value)
  const logMin = Math.log10(MIN_BP);
  const logMax = Math.log10(MAX_BP);
  const logSize = Math.log10(Math.max(MIN_BP, Math.min(MAX_BP, band.size)));
  return (logMax - logSize) / (logMax - logMin);
}

export interface GelCanvasProps {
  width: number;
  height: number;
  lanes: GelLane[];
  padding?: number;
  background?: string;
  backgroundColor?: string;
  ariaLabel?: string;
}

export function GelCanvas({
  width,
  height,
  lanes,
  padding = 16,
  background = '#0b1224',
  backgroundColor,
  ariaLabel = 'gel electrophoresis',
}: GelCanvasProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = backgroundColor ?? background;
    ctx.fillRect(0, 0, width, height);

    const laneWidth = (width - padding * 2) / Math.max(1, lanes.length);
    const gelHeight = height - padding * 2;

    lanes.forEach((lane, laneIdx) => {
      const x0 = padding + laneIdx * laneWidth + laneWidth * 0.1;
      const usableWidth = laneWidth * 0.8;
      for (const band of lane.bands) {
        const pos = getBandPosition(band);
        const y = padding + (1 - pos) * gelHeight;
        const alpha = Math.min(1, Math.max(0.1, band.intensity));
        const grad = ctx.createLinearGradient(x0, y, x0 + usableWidth, y);
        grad.addColorStop(0, `rgba(56, 189, 248, ${alpha})`);
        grad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.8})`);
        grad.addColorStop(1, `rgba(56, 189, 248, ${alpha})`);
        ctx.fillStyle = grad;
        ctx.fillRect(x0, y, usableWidth, Math.max(2, 6 * alpha));
      }
    });
  }, [background, backgroundColor, height, lanes, padding, width]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      aria-label={ariaLabel}
      role="img"
      style={{ width: `${width}px`, height: `${height}px`, display: 'block' }}
    />
  );
}

export default GelCanvas;

