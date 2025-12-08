import React, { useRef, useEffect } from 'react';
import { usePhageStore } from '@phage-explorer/state';
import { GeneMapRenderer } from '../rendering/GeneMapRenderer';

interface GeneMapCanvasProps {
  width?: string | number;
  height?: number;
  className?: string;
}

export const GeneMapCanvas: React.FC<GeneMapCanvasProps> = ({
  width = '100%',
  height = 60,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GeneMapRenderer | null>(null);

  // State from store
  const currentPhage = usePhageStore((s) => s.currentPhage);
  const scrollPosition = usePhageStore((s) => s.scrollPosition);
  const theme = usePhageStore((s) => s.currentTheme);

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
  }, []);

  // Update theme
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setTheme(theme);
    }
  }, [theme]);

  // Update data
  useEffect(() => {
    if (!rendererRef.current || !currentPhage) return;

    // Calculate viewport size (approximate based on terminal cols if we were in TUI, 
    // but for web we might want to use actual visible bases if available in store)
    // For now, let's assume a fixed viewport size or derive it.
    // In TUI, viewport is gridWidth * gridHeight.
    // Let's use a default or estimate.
    const viewportSize = 1000; // Placeholder

    rendererRef.current.setState({
      genomeLength: currentPhage.genomeLength || 0,
      genes: currentPhage.genes || [],
      viewportStart: scrollPosition,
      viewportEnd: scrollPosition + viewportSize,
    });
  }, [currentPhage, scrollPosition]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      rendererRef.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width, height, display: 'block' }}
    />
  );
};
