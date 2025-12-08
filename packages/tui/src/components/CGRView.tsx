/**
 * CGRView - Chaos Game Representation Visualization
 *
 * Renders the CGR fractal fingerprint using Braille characters for high resolution.
 * Supports zooming, panning, and k-mer inspection.
 */

import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { usePhageStore } from '@phage-explorer/state';
import { computeCGR } from '@phage-explorer/core';

// Braille patterns (0x2800 base)
// Map 2x4 pixel block to Braille char
// Dots:
// 1 4
// 2 5
// 3 6
// 7 8
const BRAILLE_MAP = [
  [0x1, 0x8],
  [0x2, 0x10],
  [0x4, 0x20],
  [0x40, 0x80]
];

function floatToBraille(grid: Float32Array, w: number, h: number, threshold: number): string[][] {
  // Output size is w/2 x h/4 characters
  const outW = Math.floor(w / 2);
  const outH = Math.floor(h / 4);
  const output: string[][] = Array(outH).fill(null).map(() => Array(outW).fill(' '));

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      let mask = 0;
      
      // Check 2x4 sub-grid
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const px = x * 2 + dx;
          const py = y * 4 + dy;
          
          if (px < w && py < h) {
            const val = grid[py * w + px];
            if (val > threshold) {
              mask |= BRAILLE_MAP[dy][dx];
            }
          }
        }
      }
      
      output[y][x] = String.fromCharCode(0x2800 + mask);
    }
  }
  
  return output;
}

interface CGRViewProps {
  sequence?: string;
  k?: number;
}

export function CGRView({ sequence, k = 6 }: CGRViewProps): React.ReactElement {
  const theme = usePhageStore(s => s.currentTheme);
  const colors = theme.colors;
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [threshold, setThreshold] = useState(0); // 0 = show all hits

  const cgr = useMemo(() => {
    if (!sequence) return null;
    return computeCGR(sequence, k);
  }, [sequence, k]);

  useInput((input, key) => {
    if (input === '+' || input === '=') setZoom(z => Math.min(z * 2, 16));
    if (input === '-') setZoom(z => Math.max(z / 2, 1));
    
    const panStep = 0.1 / zoom;
    if (key.leftArrow) setPanX(x => Math.max(0, x - panStep));
    if (key.rightArrow) setPanX(x => Math.min(1 - 1/zoom, x + panStep));
    if (key.upArrow) setPanY(y => Math.max(0, y - panStep));
    if (key.downArrow) setPanY(y => Math.min(1 - 1/zoom, y + panStep));
    
    if (input === ']') setThreshold(t => t + 1);
    if (input === '[') setThreshold(t => Math.max(0, t - 1));
  });

  if (!cgr) return <Text>No sequence data.</Text>;

  // Extract visible subgrid
  const res = cgr.resolution;
  const viewW = 64; // Target output width chars -> 128 pixels
  const viewH = 32; // Target output height chars -> 128 pixels
  
  // We need to resample the grid to match view resolution
  // For simplicity, let's assume k=7 (128x128) matches view perfectly without zoom
  // If zoom > 1, we crop.
  
  const subGridW = Math.floor(res / zoom);
  const subGridH = Math.floor(res / zoom);
  const startX = Math.floor(panX * res);
  const startY = Math.floor(panY * res);
  
  // Resample to viewW * 2 x viewH * 4
  const renderW = viewW * 2;
  const renderH = viewH * 4;
  const renderGrid = new Float32Array(renderW * renderH);
  
  for (let y = 0; y < renderH; y++) {
    for (let x = 0; x < renderW; x++) {
      // Map render coord to source coord
      const srcX = startX + Math.floor((x / renderW) * subGridW);
      const srcY = startY + Math.floor((y / renderH) * subGridH);
      
      if (srcX < res && srcY < res) {
        renderGrid[y * renderW + x] = cgr.grid[srcY * res + srcX];
      }
    }
  }

  const braille = floatToBraille(renderGrid, renderW, renderH, threshold);

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={colors.border} paddingX={1}>
      <Box justifyContent="space-between">
        <Text color={colors.accent} bold>CGR Fractal (k={k})</Text>
        <Text color={colors.textDim}>Zoom: {zoom}x | Thr: {threshold}</Text>
      </Box>
      
      <Box flexDirection="column" marginY={1}>
        {braille.map((row, i) => (
          <Text key={i} color={colors.primary}>{row.join('')}</Text>
        ))}
      </Box>
      
      <Box justifyContent="space-between">
        <Text color={colors.textMuted}>A (top-left)  T (top-right)</Text>
        <Text color={colors.textMuted}>C (bot-left)  G (bot-right)</Text>
      </Box>
      
      <Text color={colors.textDim} dimColor>
        [+/-] Zoom  [Arrows] Pan  [[/]] Threshold
      </Text>
    </Box>
  );
}
