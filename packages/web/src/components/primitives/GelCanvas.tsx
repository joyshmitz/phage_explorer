import React, { useEffect, useRef } from 'react';
import type { GelLane } from './types';

export interface GelCanvasProps {
  width: number;
  height: number;
  lanes: GelLane[];
  padding?: number;
  background?: string;
  ariaLabel?: string;
}

export function GelCanvas({
  width,
  height,
  lanes,
  padding = 16,
  background = '#0b1224',
  ariaLabel = 'gel electrophoresis',
}: GelCanvasProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    const laneWidth = (width - padding * 2) / Math.max(1, lanes.length);
    const gelHeight = height - padding * 2;

    lanes.forEach((lane, laneIdx) => {
      const x0 = padding + laneIdx * laneWidth + laneWidth * 0.1;
      const usableWidth = laneWidth * 0.8;
      for (const band of lane.bands) {
        const y = padding + (1 - band.position) * gelHeight;
        const alpha = Math.min(1, Math.max(0.1, band.intensity));
        const grad = ctx.createLinearGradient(x0, y, x0 + usableWidth, y);
        grad.addColorStop(0, `rgba(56, 189, 248, ${alpha})`);
        grad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.8})`);
        grad.addColorStop(1, `rgba(56, 189, 248, ${alpha})`);
        ctx.fillStyle = grad;
        ctx.fillRect(x0, y, usableWidth, Math.max(2, 6 * alpha));
      }
    });
  }, [background, height, lanes, padding, width]);

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

