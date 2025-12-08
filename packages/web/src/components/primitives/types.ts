export type ColorScale = (value: number) => string;

export interface HeatmapMatrix {
  rows: number;
  cols: number;
  values: Float32Array | number[];
  min?: number;
  max?: number;
}

export interface HeatmapHover {
  row: number;
  col: number;
  value: number;
}

export interface ScatterPoint {
  x: number;
  y: number;
  value?: number;
  color?: string;
  size?: number;
  id?: string | number;
}

export interface ArcNode {
  id: string;
  label?: string;
  position?: number; // 0..1 along baseline; if omitted, spaced evenly
}

export interface ArcLink {
  source: string;
  target: string;
  weight?: number;
  color?: string;
}

export interface GenomeTrackDatum {
  start: number;
  end: number;
  value?: number;
  label?: string;
  color?: string;
  type?: 'bar' | 'region' | 'line';
}

export interface GenomeTrack {
  id: string;
  label?: string;
  data: GenomeTrackDatum[];
  color?: string;
}

export interface GelBand {
  position: number; // e.g., bp or kDa
  intensity: number; // 0..1
  label?: string;
}

export interface GelLane {
  id: string;
  label?: string;
  bands: GelBand[];
}

