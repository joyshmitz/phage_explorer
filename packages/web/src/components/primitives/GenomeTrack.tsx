import React, { useEffect, useMemo, useRef } from 'react';
import type { GenomeTrack as Track, GenomeTrackDatum } from './types';

export interface GenomeTrackProps {
  width: number;
  height: number;
  genomeLength: number;
  tracks: Track[];
  padding?: number;
  ariaLabel?: string;
}

function drawDatum(
  ctx: CanvasRenderingContext2D,
  datum: GenomeTrackDatum,
  y: number,
  height: number,
  scale: (pos: number) => number,
  color: string
) {
  const x1 = scale(datum.start);
  const x2 = scale(datum.end);
  const w = Math.max(1, x2 - x1);
  const h = Math.max(1, Math.min(height, 10));
  const yTop = y - h / 2;
  ctx.fillStyle = datum.color ?? color;
  switch (datum.type) {
    case 'line':
      ctx.strokeStyle = datum.color ?? color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
      break;
    case 'region':
    case 'bar':
    default:
      ctx.fillRect(x1, yTop, w, h);
  }
}

export function GenomeTrack({
  width,
  height,
  genomeLength,
  tracks,
  padding = 16,
  ariaLabel = 'genome track',
}: GenomeTrackProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const scale = useMemo(() => {
    const innerW = width - padding * 2;
    const denom = genomeLength || 1;
    return (pos: number) => padding + (pos / denom) * innerW;
  }, [genomeLength, padding, width]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    const laneHeight = Math.max(12, (height - padding * 2) / Math.max(1, tracks.length));

    tracks.forEach((track, idx) => {
      const y = padding + laneHeight * idx + laneHeight / 2;
      ctx.fillStyle = '#334155';
      ctx.fillRect(padding, y, width - padding * 2, 1);
      const color = track.color ?? '#22c55e';
      for (const datum of track.data) {
        drawDatum(ctx, datum, y, laneHeight, scale, color);
      }
      if (track.label) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(track.label, padding, y - laneHeight / 2 + 10);
      }
    });
  }, [height, padding, scale, tracks, width]);

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

export default GenomeTrack;

