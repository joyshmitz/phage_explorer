import type { VirtualScrollResult, VirtualScrollerOptions } from './types';

export class VirtualScroller {
  private rowHeight: number;
  private overscan: number;

  constructor(options: VirtualScrollerOptions) {
    this.rowHeight = options.rowHeight;
    this.overscan = options.overscan;
  }

  compute(scrollTop: number, viewportHeight: number, totalRows: number): VirtualScrollResult {
    const startRow = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.overscan);
    const visibleRows = Math.ceil(viewportHeight / this.rowHeight) + this.overscan * 2;
    const endRow = Math.min(totalRows, startRow + visibleRows);
    const offsetY = startRow * this.rowHeight;
    return { startRow, endRow, offsetY };
  }
}

