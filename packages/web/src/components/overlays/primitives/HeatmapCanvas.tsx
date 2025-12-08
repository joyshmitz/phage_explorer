import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../../hooks/useTheme';
import type { ColorScale, HeatmapInteraction, MatrixData } from './types';

interface HeatmapCanvasProps {
  data: MatrixData;
  colorScale: ColorScale;
  width?: number;
  height?: number;
  triangular?: 'upper' | 'lower' | null;
  onHover?: (info: HeatmapInteraction | null) => void;
  onClick?: (info: HeatmapInteraction) => void;
  className?: string;
  ariaLabel?: string;
}

function parseColor(hex: string): [number, number, number] {
  const trimmed = hex.replace('#', '');
  const bigint = parseInt(trimmed.length === 3 ? trimmed.split('').map(c => c + c).join('') : trimmed, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getColorAt(value: number, scale: ColorScale): [number, number, number] {
  const { stops } = scale;
  if (stops.length === 0) return [0, 0, 0];
  if (value <= stops[0].value) return parseColor(stops[0].color);
  if (value >= stops[stops.length - 1].value) return parseColor(stops[stops.length - 1].color);

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (value >= a.value && value <= b.value) {
      const t = (value - a.value) / (b.value - a.value || 1);
      const [r1, g1, b1] = parseColor(a.color);
      const [r2, g2, b2] = parseColor(b.color);
      return [lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t)];
    }
  }
  return parseColor(stops[stops.length - 1].color);
}

export const HeatmapCanvas: React.FC<HeatmapCanvasProps> = ({
  data,
  colorScale,
  width = 320,
  height = 240,
  triangular = null,
  onHover,
  onClick,
  className = '',
  ariaLabel = 'Heatmap visualization',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const [hoverInfo, setHoverInfo] = useState<HeatmapInteraction | null>(null);

  const cellSize = useMemo(() => {
    return {
      w: Math.max(1, Math.floor(width / data.cols)),
      h: Math.max(1, Math.floor(height / data.rows)),
    };
  }, [data.cols, data.rows, height, width]);

  // Render heatmap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.createImageData(width, height);
    const { rows, cols, values } = data;

    const getValue = (r: number, c: number): number | null => {
      if (r < 0 || c < 0 || r >= rows || c >= cols) return null;
      if (triangular === 'upper' && r > c) return null;
      if (triangular === 'lower' && r < c) return null;
      const idx = r * cols + c;
      return values[idx] as number;
    };

    for (let y = 0; y < height; y++) {
      const row = Math.floor(y / cellSize.h);
      for (let x = 0; x < width; x++) {
        const col = Math.floor(x / cellSize.w);
        const v = getValue(row, col);
        const base = (y * width + x) * 4;
        if (v === null || Number.isNaN(v)) {
          // background
          imageData.data[base] = 0;
          imageData.data[base + 1] = 0;
          imageData.data[base + 2] = 0;
          imageData.data[base + 3] = 0;
        } else {
          const [r, g, b] = getColorAt(v, colorScale);
          imageData.data[base] = r;
          imageData.data[base + 1] = g;
          imageData.data[base + 2] = b;
          imageData.data[base + 3] = 255;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    ctx.strokeStyle = theme.colors.border;
    ctx.strokeRect(0, 0, width, height);
  }, [colorScale, data, cellSize.h, cellSize.w, height, theme.colors.border, triangular, width]);

  // Hover handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { rows, cols, values } = data;
    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) {
        setHoverInfo(null);
        onHover?.(null);
        return;
      }
      const col = Math.min(cols - 1, Math.floor((x / rect.width) * cols));
      const row = Math.min(rows - 1, Math.floor((y / rect.height) * rows));
      if (triangular === 'upper' && row > col) {
        setHoverInfo(null);
        onHover?.(null);
        return;
      }
      if (triangular === 'lower' && row < col) {
        setHoverInfo(null);
        onHover?.(null);
        return;
      }
      const idx = row * cols + col;
      const value = values[idx] ?? null;
      const info: HeatmapInteraction = { row, col, value, clientX: e.clientX, clientY: e.clientY };
      setHoverInfo(info);
      onHover?.(info);
    };
    const handleLeave = () => {
      setHoverInfo(null);
      onHover?.(null);
    };
    const handleClick = () => {
      if (hoverInfo) {
        onClick?.(hoverInfo);
      }
    };
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseleave', handleLeave);
    canvas.addEventListener('click', handleClick);
    return () => {
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseleave', handleLeave);
      canvas.removeEventListener('click', handleClick);
    };
  }, [data, hoverInfo, onClick, onHover, triangular]);

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

export default HeatmapCanvas;

