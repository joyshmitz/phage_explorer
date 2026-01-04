import type { PhageRepository } from '../db';
import type { SequenceSource, SequenceWindow } from './types';

/**
 * Repository-backed sequence source for the web renderer.
 * Wraps PhageRepository to serve sequence windows to the canvas grid.
 */
export class RepositorySequenceSource implements SequenceSource {
  constructor(
    private repo: PhageRepository,
    private phageId: number,
    private rowWidth = 200
  ) {}

  setPhage(phageId: number): void {
    this.phageId = phageId;
  }

  setRowWidth(width: number): void {
    this.rowWidth = Math.max(1, width);
  }

  async getWindow(request: { start: number; end: number }): Promise<SequenceWindow> {
    const start = Math.max(0, request.start);
    const end = Math.max(start, request.end);
    const seq = await this.repo.getSequenceWindow(this.phageId, start, end);
    const rows: string[] = [];
    for (let i = 0; i < seq.length; i += this.rowWidth) {
      rows.push(seq.slice(i, i + this.rowWidth));
    }
    return { start, end, rows };
  }

  async totalLength(): Promise<number> {
    return this.repo.getFullGenomeLength(this.phageId);
  }
}
