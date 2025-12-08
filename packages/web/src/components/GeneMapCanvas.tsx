import React, { useRef, useEffect, useCallback, useState } from 'react';
import { usePhageStore } from '@phage-explorer/state';
import type { GeneInfo } from '@phage-explorer/core';
import { useTheme } from '../hooks/useTheme';
import { GeneMapRenderer } from '../rendering/GeneMapRenderer';

interface GeneMapCanvasProps {
  /** Width of the canvas (CSS value) */
  width?: string | number;
  /** Height of the canvas in pixels */
  height?: number;
  /** Custom class name */
  className?: string;
  /** Viewport size in base pairs */
  viewportSize?: number;
  /** Callback when position is clicked */
  onPositionClick?: (position: number) => void;
  /** Callback when a gene is clicked */
  onGeneClick?: (gene: GeneInfo) => void;
}

export const GeneMapCanvas: React.FC<GeneMapCanvasProps> = ({
  width = '100%',
  height = 60,
  className = '',
  viewportSize = 1000,
  onPositionClick,
  onGeneClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GeneMapRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredGene, setHoveredGene] = useState<GeneInfo | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const { theme } = useTheme();
  const colors = theme.colors;

  // State from store
  const currentPhage = usePhageStore((s) => s.currentPhage);
  const scrollPosition = usePhageStore((s) => s.scrollPosition);
  const setScrollPosition = usePhageStore((s) => s.setScrollPosition);

  // Get genome length
  const genomeLength = currentPhage?.genomeLength ?? 0;
  const genes = currentPhage?.genes ?? [];

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    rendererRef.current = new GeneMapRenderer({
      canvas: canvasRef.current,
      theme,
      height,
      showDensity: true,
      showLabels: true,
    });

    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, [height, theme]);

  // Update theme
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setTheme(theme);
    }
  }, [theme]);

  // Update data
  useEffect(() => {
    if (!rendererRef.current || !currentPhage) return;

    rendererRef.current.setState({
      genomeLength: genomeLength,
      genes: genes,
      viewportStart: scrollPosition,
      viewportEnd: scrollPosition + viewportSize,
    });
  }, [currentPhage, scrollPosition, viewportSize, genomeLength, genes]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      rendererRef.current?.resize();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    return () => resizeObserver.disconnect();
  }, []);

  // Convert canvas X position to genome position
  const xToPosition = useCallback(
    (x: number): number => {
      const canvas = canvasRef.current;
      if (!canvas || genomeLength === 0) return 0;
      const rect = canvas.getBoundingClientRect();
      const relX = x - rect.left;
      const pos = Math.floor((relX / rect.width) * genomeLength);
      return Math.max(0, Math.min(genomeLength - 1, pos));
    },
    [genomeLength]
  );

  // Find gene at position
  const findGeneAtPosition = useCallback(
    (position: number): GeneInfo | null => {
      for (const gene of genes) {
        if (position >= gene.startPos && position <= gene.endPos) {
          return gene;
        }
      }
      return null;
    },
    [genes]
  );

  // Handle click to navigate
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const position = xToPosition(e.clientX);
      const gene = findGeneAtPosition(position);

      if (gene && onGeneClick) {
        onGeneClick(gene);
      } else if (onPositionClick) {
        onPositionClick(position);
      }

      // Navigate to clicked position (center it)
      const newPosition = Math.max(0, position - Math.floor(viewportSize / 2));
      setScrollPosition(newPosition);
    },
    [xToPosition, findGeneAtPosition, onGeneClick, onPositionClick, viewportSize, setScrollPosition]
  );

  // Handle mouse move for tooltip
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const position = xToPosition(e.clientX);
      const gene = findGeneAtPosition(position);

      if (gene) {
        setHoveredGene(gene);
        setTooltipPos({ x: e.clientX, y: e.clientY });
      } else {
        setHoveredGene(null);
        setTooltipPos(null);
      }
    },
    [xToPosition, findGeneAtPosition]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredGene(null);
    setTooltipPos(null);
  }, []);

  // Format position for display
  const formatPosition = (pos: number): string => {
    if (pos >= 1_000_000) return `${(pos / 1_000_000).toFixed(2)}M`;
    if (pos >= 1_000) return `${(pos / 1_000).toFixed(1)}k`;
    return pos.toString();
  };

  return (
    <div
      ref={containerRef}
      className={`gene-map-container ${className}`}
      style={{
        position: 'relative',
        width,
        border: `1px solid ${colors.border}`,
        borderRadius: '4px',
        backgroundColor: colors.background,
        overflow: 'hidden',
      }}
    >
      {/* Scale bar header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0.2rem 0.5rem',
          fontSize: '0.7rem',
          color: colors.textMuted,
          borderBottom: `1px solid ${colors.borderLight}`,
        }}
      >
        <span>0</span>
        <span style={{ color: colors.primary, fontWeight: 'bold' }}>Gene Map</span>
        <span>{formatPosition(genomeLength)}</span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          width: '100%',
          height,
          display: 'block',
          cursor: 'crosshair',
        }}
        title="Click to navigate"
      />

      {/* Viewport indicator */}
      {genomeLength > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: `${(scrollPosition / genomeLength) * 100}%`,
            width: `${Math.min(100, (viewportSize / genomeLength) * 100)}%`,
            height: '3px',
            backgroundColor: colors.accent,
            opacity: 0.7,
            transition: 'left 0.1s ease',
          }}
          aria-label="Current viewport"
        />
      )}

      {/* Gene tooltip */}
      {hoveredGene && tooltipPos && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPos.x + 10,
            top: tooltipPos.y - 60,
            backgroundColor: colors.backgroundAlt,
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            padding: '0.5rem',
            fontSize: '0.8rem',
            zIndex: 1000,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ fontWeight: 'bold', color: colors.accent }}>{hoveredGene.name || 'Unknown'}</div>
          <div style={{ color: colors.textDim }}>
            {formatPosition(hoveredGene.startPos)} - {formatPosition(hoveredGene.endPos)}
          </div>
          <div style={{ color: colors.textMuted }}>
            {hoveredGene.strand === '+' || hoveredGene.strand === '1' ? '+ strand' : '- strand'}
          </div>
          {hoveredGene.product && (
            <div style={{ color: colors.text, marginTop: '0.25rem', maxWidth: '200px' }}>
              {hoveredGene.product}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GeneMapCanvas;
