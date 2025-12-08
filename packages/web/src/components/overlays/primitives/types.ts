/**
 * Shared visualization primitive types
 */

export interface ColorStop {
  value: number;
  color: string;
}

export interface ColorScale {
  stops: ColorStop[];
}

export interface MatrixData {
  /** Number of rows */
  rows: number;
  /** Number of columns */
  cols: number;
  /** Flattened values length = rows * cols */
  values: Float32Array | number[];
}

export interface HeatmapInteraction {
  row: number;
  col: number;
  value: number | null;
  clientX: number;
  clientY: number;
}

export interface ScatterPoint {
  x: number;
  y: number;
  value?: number;
  color?: string;
  radius?: number;
  meta?: Record<string, unknown>;
}

export interface ScatterScale {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface ScatterInteraction {
  point: ScatterPoint;
  index: number;
  clientX: number;
  clientY: number;
}

