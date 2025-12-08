import React, { useEffect, useMemo, useRef } from 'react';
import type { ArcLink, ArcNode } from './types';

export interface ArcDiagramProps {
  width: number;
  height: number;
  nodes: ArcNode[];
  links: ArcLink[];
  padding?: number;
  stroke?: string;
  ariaLabel?: string;
}

export function ArcDiagram({
  width,
  height,
  nodes,
  links,
  padding = 24,
  stroke = '#94a3b8',
  ariaLabel = 'arc diagram',
}: ArcDiagramProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const positioned = useMemo(() => {
    const n = nodes.length || 1;
    return nodes.map((node, idx) => {
      const pos = node.position ?? idx / Math.max(1, n - 1);
      return { ...node, position: Math.min(1, Math.max(0, pos)) };
    });
  }, [nodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const baselineY = height - padding;
    const availableW = width - padding * 2;

    // Draw baseline
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, baselineY);
    ctx.lineTo(width - padding, baselineY);
    ctx.stroke();

    // Draw links
    for (const link of links) {
      const source = positioned.find(n => n.id === link.source);
      const target = positioned.find(n => n.id === link.target);
      if (!source || !target) continue;
      const x1 = padding + source.position * availableW;
      const x2 = padding + target.position * availableW;
      const mid = (x1 + x2) / 2;
      const arcHeight = Math.max(12, Math.abs(x2 - x1) / 3);

      ctx.strokeStyle = link.color ?? stroke;
      ctx.lineWidth = Math.max(1, (link.weight ?? 1) * 0.5);
      ctx.beginPath();
      ctx.moveTo(x1, baselineY);
      ctx.quadraticCurveTo(mid, baselineY - arcHeight, x2, baselineY);
      ctx.stroke();
    }

    // Draw nodes
    for (const node of positioned) {
      const x = padding + node.position * availableW;
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.arc(x, baselineY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [height, links, padding, positioned, stroke, width]);

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

export default ArcDiagram;

