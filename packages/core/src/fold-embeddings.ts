import type { GeneInfo } from './types';

export interface FoldEmbedding {
  geneId: number;
  vector: number[]; // normalized embedding
  length: number;
  name: string | null;
  product: string | null;
}

export interface Neighbor {
  geneId: number;
  distance: number; // lower = closer
  name: string | null;
  product: string | null;
}

export interface QuickviewResult {
  novelty: number; // 0..1, higher = more novel
  neighbors: Neighbor[];
  note?: string;
}

// Lightweight cosine distance for small vectors
function cosineDistance(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i++) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb) || 1;
  return 1 - dot / denom;
}

export function nearestNeighbors(
  target: FoldEmbedding,
  corpus: FoldEmbedding[],
  k = 5
): Neighbor[] {
  const scored = corpus
    .filter(e => e.geneId !== target.geneId && e.vector.length && target.vector.length)
    .map(e => ({
      geneId: e.geneId,
      distance: cosineDistance(target.vector, e.vector),
      name: e.name,
      product: e.product,
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, k);

  return scored;
}

export function computeNovelty(
  target: FoldEmbedding,
  corpus: FoldEmbedding[],
  k = 10
): QuickviewResult {
  const neighbors = nearestNeighbors(target, corpus, k);
  if (neighbors.length === 0) {
    return { novelty: 1, neighbors, note: 'No neighbors found' };
  }

  // Novelty heuristic: mean distance of top-k neighbors
  const meanDist = neighbors.reduce((s, n) => s + n.distance, 0) / neighbors.length;
  const novelty = Math.min(1, Math.max(0, meanDist)); // cosine distance in [0,2]; clamp to 0..1

  return { novelty, neighbors };
}

// Map genes to embeddings by geneId
export function buildEmbeddingMap(embeddings: FoldEmbedding[]): Map<number, FoldEmbedding> {
  const map = new Map<number, FoldEmbedding>();
  for (const e of embeddings) {
    map.set(e.geneId, e);
  }
  return map;
}

export function attachEmbeddingInfo(
  genes: GeneInfo[],
  embeddings: Map<number, FoldEmbedding>
): Array<GeneInfo & { embedding?: FoldEmbedding }> {
  return genes.map(g => ({
    ...g,
    embedding: embeddings.get(g.id),
  }));
}
