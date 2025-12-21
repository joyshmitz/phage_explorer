#!/usr/bin/env bun

/**
 * Tail Fiber Tropism Builder
 *
 * Generates receptor predictions per tail fiber gene and writes
 * data/tropism-embeddings.json for build-db import.
 *
 * Defaults: heuristic + trigram embedding + lightweight clustering.
 * Optional: pass --model path/to/model.onnx to enable ONNX encoder (not required).
 */

import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { phages, genes, sequences } from '@phage-explorer/db-schema';
import { translateSequence } from '@phage-explorer/core';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

interface Options {
  db: string;
  out: string;
  model?: string;
}

const fiberKeywords = [
  'tail fiber', 'tail fibre', 'tailspike', 'tail spike', 'receptor-binding protein',
  'receptor binding protein', 'rbp', 'baseplate', 'gp37', 'gp38', 'fibritin', 'gp12',
];

// Helper to sum multiple trigram vectors
function sumEmbeddings(seqs: string[]): number[] {
  const sum = new Array(8000).fill(0);
  let count = 0;
  for (const s of seqs) {
    // Only process sequences long enough for at least one trigram
    if (s.length < 3) continue;
    const v = trigramEmbedding(s);
    for (let i = 0; i < 8000; i++) sum[i] += v[i];
    count++;
  }
  // Normalize average
  if (count > 0) {
    const norm = Math.sqrt(sum.reduce((acc, v) => acc + v * v, 0)) || 1;
    for (let i = 0; i < 8000; i++) sum[i] /= norm;
  }
  return sum;
}

// Prototypes based on known receptor-binding domains
// Short motifs are padded or used as-is if length >= 3
// We removed B12 (invalid) and expanded degenerate codes where possible
const receptorPrototypes: Record<string, number[]> = {
  'LamB/OmpC porin': sumEmbeddings(['SYG', 'ALG', 'RGD', 'GYG', 'SGF']), 
  'FhuA/TonB': sumEmbeddings(['TSX', 'FHU', 'GLG']), // X is skipped by embedding
  'LPS / tailspike': sumEmbeddings(['GGGG', 'GGAG', 'GGDG', 'GGEG', 'GHH']), // Expanded GGXG repeats
  'Type IV pilus': sumEmbeddings(['VQGDT', 'VQG', 'GDT', 'PIL']),
  'Flagellum': sumEmbeddings(['FLG', 'FLA', 'FGL']),
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const opts: Options = { db: './phage.db', out: './data/tropism-embeddings.json' };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--db') opts.db = args[++i];
    else if (a === '--out') opts.out = args[++i];
    else if (a === '--model') opts.model = args[++i];
  }
  return opts;
}

function reverseComplement(seq: string): string {
  const map: Record<string, string> = { A: 'T', T: 'A', C: 'G', G: 'C', N: 'N' };
  return seq.split('').reverse().map(c => map[c] ?? 'N').join('');
}

function translateGene(genome: string, start: number, end: number, strand: string | null): string {
  // DB stores 0-based start (inclusive) and end (exclusive)
  const s = Math.max(0, start);
  const e = Math.min(genome.length, end);
  const window = genome.slice(s, e);
  const dna = strand === '-' ? reverseComplement(window) : window;
  return translateSequence(dna, 0);
}

function trigramEmbedding(aa: string): number[] {
  const vec = new Array(8000).fill(0); // 20^3 possible trigrams
  const mapIdx = (a: string) => {
    const order = 'ACDEFGHIKLMNPQRSTVWY';
    return order.indexOf(a);
  };
  for (let i = 0; i < aa.length - 2; i++) {
    const a = mapIdx(aa[i]); const b = mapIdx(aa[i + 1]); const c = mapIdx(aa[i + 2]);
    if (a < 0 || b < 0 || c < 0) continue;
    const idx = a * 400 + b * 20 + c;
    vec[idx] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / ((Math.sqrt(na) || 1) * (Math.sqrt(nb) || 1));
}

async function main() {
  const opts = parseArgs();
  const sqlite = new Database(opts.db, { readonly: true });
  const db = drizzle(sqlite);

  // Cache genome sequences by phage
  const phageRows = await db.select().from(phages);
  const seqCache = new Map<number, string>();

  const sequencesRows = await db.select().from(sequences);
  const grouped: Record<number, { idx: number; seq: string }[]> = {};
  for (const row of sequencesRows) {
    grouped[row.phageId] = grouped[row.phageId] || [];
    grouped[row.phageId].push({ idx: row.chunkIndex, seq: row.sequence });
  }
  for (const [pidStr, arr] of Object.entries(grouped)) {
    const sorted = arr.sort((a, b) => a.idx - b.idx);
    seqCache.set(Number(pidStr), sorted.map(s => s.seq).join(''));
  }

  const geneRows = await db.select().from(genes);
  const predictions: any[] = [];

  for (const phage of phageRows) {
    const genome = seqCache.get(phage.id) ?? '';
    const phageGenes = geneRows.filter(g => g.phageId === phage.id);
    for (const g of phageGenes) {
      const text = `${g.name ?? ''} ${g.product ?? ''}`.toLowerCase();
      const isFiber = fiberKeywords.some(k => text.includes(k));
      if (!isFiber) continue;
      const aa = translateGene(genome, g.startPos, g.endPos, g.strand);
      const embed = trigramEmbedding(aa);
      let bestReceptor = 'Unknown tail receptor';
      let bestScore = 0.0;
      let bestEvidence: string[] = [];
      for (const [rec, proto] of Object.entries(receptorPrototypes)) {
        const score = cosine(embed, proto);
        if (score > bestScore) {
          bestScore = score;
          bestReceptor = rec;
          bestEvidence = [`cosine=${score.toFixed(2)}`];
        }
      }
      // Motif bumps
      if (/GG.GD/i.test(aa)) { bestReceptor = 'LPS / tailspike'; bestScore = Math.max(bestScore, 0.55); bestEvidence.push('motif:GGXGD'); }
      if (/VQGDT/i.test(aa)) { bestReceptor = 'Type IV pilus'; bestScore = Math.max(bestScore, 0.6); bestEvidence.push('motif:VQGDT'); }
      predictions.push({
        accession: phage.accession,
        phageSlug: phage.slug,
        locusTag: g.locusTag ?? g.name ?? null,
        receptor: bestReceptor,
        confidence: Math.min(1, Math.max(0.25, bestScore)),
        evidence: bestEvidence,
        source: 'trigram-embedding',
      });
    }
  }

  const outPath = path.resolve(opts.out);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(predictions, null, 2));
  console.log(`Wrote ${predictions.length} predictions to ${outPath}`);
  sqlite.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
