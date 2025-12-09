import React, { useEffect, useMemo, useRef } from 'react';
import type { PackagingMotorState } from '../../workers/types';
import { useTheme } from '../../hooks/useTheme';

interface PackagingMotorVisualizerProps {
  state: PackagingMotorState;
  width?: number;
  height?: number;
}

const COLORS = {
  pressure: '#f97316',
  force: '#22c55e',
  fill: '#a855f7',
};

export function PackagingMotorVisualizer({
  state,
  width = 540,
  height = 260,
}: PackagingMotorVisualizerProps): React.ReactElement {
  const { theme } = useTheme();
  const colors = theme.colors;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const history = useMemo(() => {
    const hist = (state as any).history as Array<{ time: number; fill: number; pressure: number; force: number }> | undefined;
    const points = hist && hist.length > 0
      ? hist
      : [{ time: state.time, fill: state.fillFraction, pressure: state.pressure, force: state.force }];
    return [...points].sort((a, b) => a.time - b.time);
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    // Gauges column
    const gaugeWidth = width - 160;
    const gaugeHeight = 18;
    const gaugeX = 70;
    const topY = 28;

    const drawGauge = (label: string, value: number, max: number, y: number, color: string) => {
      const pct = Math.max(0, Math.min(1, value / max));
      ctx.strokeStyle = colors.borderLight;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(gaugeX, y, gaugeWidth, gaugeHeight);
      ctx.fillStyle = colors.backgroundAlt;
      ctx.fillRect(gaugeX, y, gaugeWidth, gaugeHeight);
      ctx.fillStyle = color;
      ctx.fillRect(gaugeX, y, gaugeWidth * pct, gaugeHeight);
      ctx.fillStyle = colors.text;
      ctx.font = '12px monospace';
      ctx.fillText(`${label}: ${value.toFixed(1)} / ${max}`, gaugeX, y - 4);
    };

    const fill = Math.max(0, Math.min(1, state.fillFraction ?? 0));
    drawGauge('DNA packaged (%)', fill * 100, 100, topY, COLORS.fill);
    drawGauge('Pressure (atm)', state.pressure ?? 0, 80, topY + 36, COLORS.pressure);
    drawGauge('Force (pN)', state.force ?? 0, 200, topY + 72, COLORS.force);

    const stall = Math.max(0, Math.min(1, state.stallProbability ?? 0));
    ctx.fillStyle = colors.textDim;
    ctx.font = '12px monospace';
    ctx.fillText('Stall probability', gaugeX, topY + 112);
    ctx.fillStyle = stall > 0.7 ? colors.error : stall > 0.3 ? colors.warning : colors.success;
    ctx.beginPath();
    ctx.arc(gaugeX + 130, topY + 108, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.background;
    ctx.font = '10px monospace';
    ctx.fillText((stall * 100).toFixed(0) + '%', gaugeX + 124, topY + 112);

    // History plots
    const pad = { left: 70, right: 20, top: topY + 140, bottom: 28 };
    const w = width - pad.left - pad.right;
    const h = height - pad.top - pad.bottom;
    const maxTime = Math.max(1, ...history.map(hp => hp.time));
    const maxPressure = Math.max(1, ...history.map(hp => hp.pressure));
    const maxForce = Math.max(1, ...history.map(hp => hp.force));
    const xScale = (t: number) => pad.left + (t / maxTime) * w;
    const yScale = (v: number, maxVal: number) => pad.top + h - (v / maxVal) * h;

    ctx.strokeStyle = colors.borderLight;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + h);
    ctx.lineTo(pad.left + w, pad.top + h);
    ctx.stroke();

    const drawLine = (key: 'pressure' | 'force' | 'fill', color: string, maxVal: number) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = key === 'fill' ? 1.2 : 1.8;
      history.forEach((p, i) => {
        const x = xScale(p.time);
        const y = yScale(key === 'fill' ? p.fill * 100 : (p as any)[key], maxVal);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    drawLine('pressure', COLORS.pressure, maxPressure);
    drawLine('force', COLORS.force, maxForce);
    drawLine('fill', COLORS.fill, 100);

    ctx.fillStyle = colors.textDim;
    ctx.font = '11px monospace';
    ctx.fillText('History: pressure / force / fill', pad.left, pad.top - 6);
    ctx.textAlign = 'center';
    ctx.fillText('Time', pad.left + w / 2, height - 6);
  }, [history, state.fillFraction, state.force, state.pressure, state.stallProbability, width, height, colors]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px`, display: 'block' }}
    />
  );
}

export default PackagingMotorVisualizer;
