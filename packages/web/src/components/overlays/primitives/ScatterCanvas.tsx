import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../../hooks/useTheme';
import type { ColorScale, ScatterInteraction, ScatterPoint, ScatterScale } from './types';

interface ScatterCanvasProps {
  points: ScatterPoint[];
  scale?: ScatterScale;
  colorScale?: ColorScale;
  width?: number;
  height?: number;
  radius?: number;
  onHover?: (info: ScatterInteraction | null) => void;
  onClick?: (info: ScatterInteraction) => void;
  className?: string;
  ariaLabel?: string;
}

function computeScale(points: ScatterPoint[], padding = 0.05): ScatterScale {
  let xMin = Number.POSITIVE_INFINITY;
  let xMax = Number.NEGATIVE_INFINITY;
  let yMin = Number.POSITIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;

  for (const p of points) {
    xMin = Math.min(xMin, p.x);
    xMax = Math.max(xMax, p.x);
    yMin = Math.min(yMin, p.y);
    yMax = Math.max(yMax, p.y);
  }

  if (!Number.isFinite(xMin) || !Number.isFinite(xMax)) {
    xMin = 0;
    xMax = 1;
  }
  if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) {
    yMin = 0;
    yMax = 1;
  }

  const xPad = (xMax - xMin || 1) * padding;
  const yPad = (yMax - yMin || 1) * padding;

  return {
    xMin: xMin - xPad,
    xMax: xMax + xPad,
    yMin: yMin - yPad,
    yMax: yMax + yPad,
  };
}

function parseColor(hex: string): [number, number, number] {
  const trimmed = hex.replace('#', '');
  const full = trimmed.length === 3 ? trimmed.split('').map(c => c + c).join('') : trimmed;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function colorFromScale(value: number, scale: ColorScale): string {
  const { stops } = scale;
  if (stops.length === 0) return '#ffffff';
  if (value <= stops[0].value) return stops[0].color;
  if (value >= stops[stops.length - 1].value) return stops[stops.length - 1].color;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (value >= a.value && value <= b.value) {
      const t = (value - a.value) / (b.value - a.value || 1);
      const [r1, g1, b1] = parseColor(a.color);
      const [r2, g2, b2] = parseColor(b.color);
      const r = Math.round(lerp(r1, r2, t));
      const g = Math.round(lerp(g1, g2, t));
      const bch = Math.round(lerp(b1, b2, t));
      return `rgb(${r}, ${g}, ${bch})`;
    }
  }
  return stops[stops.length - 1].color;
}

export const ScatterCanvas: React.FC<ScatterCanvasProps> = ({
  points,
  scale,
  colorScale,
  width = 400,
  height = 300,
  radius = 3,
  onHover,
  onClick,
  className = '',
  ariaLabel = 'Scatter plot',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const [hover, setHover] = useState<ScatterInteraction | null>(null);

  const resolvedScale = useMemo(() => scale ?? computeScale(points), [points, scale]);

  const project = useMemo(() => {
    const { xMin, xMax, yMin, yMax } = resolvedScale;
    const dx = xMax - xMin || 1;
    const dy = yMax - yMin || 1;
    return (p: ScatterPoint) => {
      const px = ((p.x - xMin) / dx) * (width - 20) + 10;
      const py = height - (((p.y - yMin) / dy) * (height - 20) + 10);
      return { px, py };
    };
  }, [height, resolvedScale, width]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = theme.colors.background;
    ctx.fillRect(0, 0, width, height);

    // Axes box
    ctx.strokeStyle = theme.colors.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const { px, py } = project(p);
      const r = p.radius ?? radius;
      let color = p.color ?? theme.colors.accent;
      if (colorScale && typeof p.value === 'number') {
        color = colorFromScale(p.value, colorScale);
      }
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }, [colorScale, height, points, project, radius, theme.colors.accent, theme.colors.background, theme.colors.border, width]);

  // Hover / click
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let closest: ScatterInteraction | null = null;
      let minDist = Infinity;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const { px, py } = project(p);
        const r = p.radius ?? radius;
        const dx = mx - px;
        const dy = my - py;
        const dist2 = dx * dx + dy * dy;
        if (dist2 <= (r + 4) * (r + 4) && dist2 < minDist) {
          minDist = dist2;
          closest = { point: p, index: i, clientX: e.clientX, clientY: e.clientY };
        }
      }
      setHover(closest);
      onHover?.(closest);
    };
    const handleLeave = () => {
      setHover(null);
      onHover?.(null);
    };
    const handleClick = () => {
      if (hover) onClick?.(hover);
    };
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseleave', handleLeave);
    canvas.addEventListener('click', handleClick);
    return () => {
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseleave', handleLeave);
      canvas.removeEventListener('click', handleClick);
    };
  }, [hover, onClick, onHover, points, project, radius]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width,
        height,
        background: theme.colors.background,
        border: `1px solid ${theme.colors.border}`,
      }}
      aria-label={ariaLabel}
      role="img"
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};

export default ScatterCanvas;

