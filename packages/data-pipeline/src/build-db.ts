#!/usr/bin/env bun

// Build script to create and populate the phage database

import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import {
  phages,
  sequences,
  genes,
  codonUsage,
  preferences,
  tropismPredictions,
} from '@phage-explorer/db-schema';
import { countCodonUsage, countAminoAcidUsage, translateSequence } from '@phage-explorer/core';
import { PHAGE_CATALOG } from './phage-catalog';
import { fetchPhageSequence, type NCBISequenceResult } from './ncbi-fetcher';
import { readFileSync, existsSync } from 'fs';

const DB_PATH = './phage.db';
const CHUNK_SIZE = 10000; // 10kb chunks
const TROPISM_PATH = './data/tropism-embeddings.json';

async function main() {
  console.log('Building phage database...\n');

  // Create/overwrite database
  const sqlite = new Database(DB_PATH);
  const db = drizzle(sqlite);

  // Create tables using raw SQL (Drizzle's createTable isn't available in all versions)
  console.log('Creating tables...');

  sqlite.exec(`
    DROP TABLE IF EXISTS preferences;
    DROP TABLE IF EXISTS tropism_predictions;
    DROP TABLE IF EXISTS models;
    DROP TABLE IF EXISTS codon_usage;
    DROP TABLE IF EXISTS genes;
    DROP TABLE IF EXISTS sequences;
    DROP TABLE IF EXISTS phages;
    DROP TABLE IF EXISTS tropism_predictions;

    CREATE TABLE phages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE,
      name TEXT NOT NULL,
      accession TEXT UNIQUE NOT NULL,
      family TEXT,
      genus TEXT,
      host TEXT,
      morphology TEXT,
      lifecycle TEXT,
      genome_length INTEGER,
      genome_type TEXT,
      gc_content REAL,
      baltimore_group TEXT,
      description TEXT,
      pdb_ids TEXT,
      tags TEXT,
      last_updated INTEGER
    );

    CREATE TABLE sequences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phage_id INTEGER NOT NULL REFERENCES phages(id),
      chunk_index INTEGER NOT NULL,
      sequence TEXT NOT NULL,
      UNIQUE(phage_id, chunk_index)
    );
    CREATE INDEX idx_sequences_phage ON sequences(phage_id);

    CREATE TABLE genes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phage_id INTEGER NOT NULL REFERENCES phages(id),
      name TEXT,
      locus_tag TEXT,
      start_pos INTEGER NOT NULL,
      end_pos INTEGER NOT NULL,
      strand TEXT,
      product TEXT,
      type TEXT,
      qualifiers TEXT
    );
    CREATE INDEX idx_genes_phage ON genes(phage_id);
    CREATE INDEX idx_genes_position ON genes(phage_id, start_pos, end_pos);

    CREATE TABLE codon_usage (
      phage_id INTEGER PRIMARY KEY REFERENCES phages(id),
      aa_counts TEXT NOT NULL,
      codon_counts TEXT NOT NULL
    );

    CREATE TABLE models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phage_id INTEGER NOT NULL REFERENCES phages(id),
      role TEXT NOT NULL,
      pdb_id TEXT,
      source TEXT NOT NULL,
      obj_data BLOB,
      ascii_frames TEXT,
      meta TEXT
    );
    CREATE INDEX idx_models_phage ON models(phage_id);

    CREATE TABLE preferences (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE tropism_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phage_id INTEGER NOT NULL REFERENCES phages(id),
      gene_id INTEGER REFERENCES genes(id),
      locus_tag TEXT,
      receptor TEXT NOT NULL,
      confidence REAL NOT NULL,
      evidence TEXT,
      source TEXT NOT NULL
    );
    CREATE INDEX idx_tropism_phage ON tropism_predictions(phage_id);
    CREATE INDEX idx_tropism_gene ON tropism_predictions(gene_id);
  `);

  console.log('Tables created.\n');

  // Process each phage in the catalog
  for (const entry of PHAGE_CATALOG) {
    console.log(`\nProcessing ${entry.name} (${entry.accession})...`);

    let sequenceData: NCBISequenceResult;

    try {
      // Fetch sequence from NCBI
      sequenceData = await fetchPhageSequence(entry.accession);
      console.log(`  Fetched: ${sequenceData.length} bp, ${sequenceData.features.length} features`);
    } catch (error) {
      console.error(`  ERROR fetching ${entry.accession}:`, error);
      continue;
    }

    // Insert phage record
    const [phageRecord] = await db
      .insert(phages)
      .values({
        slug: entry.slug,
        name: entry.name,
        accession: entry.accession,
        family: entry.family,
        genus: entry.genus,
        host: entry.host,
        morphology: entry.morphology,
        lifecycle: entry.lifecycle,
        genomeLength: sequenceData.length,
        genomeType: entry.genomeType,
        gcContent: sequenceData.gcContent,
        baltimoreGroup: entry.baltimoreGroup,
        description: entry.description,
        pdbIds: entry.pdbIds ? JSON.stringify(entry.pdbIds) : null,
        lastUpdated: Date.now(),
      })
      .returning({ id: phages.id });

    const phageId = phageRecord.id;
    console.log(`  Inserted phage record (id: ${phageId})`);

    // Insert sequence chunks
    const seq = sequenceData.sequence;
    const numChunks = Math.ceil(seq.length / CHUNK_SIZE);

    for (let i = 0; i < numChunks; i++) {
      const chunk = seq.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await db.insert(sequences).values({
        phageId,
        chunkIndex: i,
        sequence: chunk,
      });
    }
    console.log(`  Inserted ${numChunks} sequence chunks`);

    // Insert gene annotations
    for (const feature of sequenceData.features) {
      await db.insert(genes).values({
        phageId,
        name: feature.gene || null,
        locusTag: feature.locusTag || null,
        startPos: feature.start,
        endPos: feature.end,
        strand: feature.strand,
        product: feature.product || null,
        type: feature.type,
        qualifiers: JSON.stringify(feature.qualifiers),
      });
    }
    console.log(`  Inserted ${sequenceData.features.length} gene annotations`);

    // Calculate and insert codon usage
    const codonCounts = countCodonUsage(seq, 0);
    const aaSeq = translateSequence(seq, 0);
    const aaCounts = countAminoAcidUsage(aaSeq);

    await db.insert(codonUsage).values({
      phageId,
      aaCounts: JSON.stringify(aaCounts),
      codonCounts: JSON.stringify(codonCounts),
    });
    console.log(`  Calculated codon usage`);

    // Small delay between fetches to be nice to NCBI
    await new Promise(r => setTimeout(r, 500));
  }

  // Insert default preferences
  await db.insert(preferences).values({ key: 'theme', value: 'classic' });
  await db.insert(preferences).values({ key: 'show3DModel', value: 'true' });

  // Optional: load precomputed tropism predictions (embedding-based) if available
  if (existsSync(TROPISM_PATH)) {
    console.log('\nLoading tropism predictions from', TROPISM_PATH);
    try {
      const raw = readFileSync(TROPISM_PATH, 'utf8');
      const data = JSON.parse(raw) as Array<{
        phageSlug?: string;
        accession?: string;
        locusTag?: string;
        receptor: string;
        confidence: number;
        evidence?: string[];
        source?: string;
      }>;

      // Build lookup for phage slug/accession -> id
      const phageRows = await db.select({ id: phages.id, slug: phages.slug, accession: phages.accession }).from(phages);
      const bySlug = new Map<string, number>();
      const byAcc = new Map<string, number>();
      phageRows.forEach(p => {
        if (p.slug) bySlug.set(p.slug.toLowerCase(), p.id);
        byAcc.set(p.accession.toLowerCase(), p.id);
      });

      // Build lookup for genes per phage
      const geneRows = await db.select({ id: genes.id, phageId: genes.phageId, locusTag: genes.locusTag }).from(genes);
      const geneMap = new Map<number, Map<string, number>>();
      geneRows.forEach(g => {
        if (!g.locusTag) return;
        const key = g.phageId;
        if (!geneMap.has(key)) geneMap.set(key, new Map());
        geneMap.get(key)!.set(g.locusTag.toLowerCase(), g.id);
      });

      let inserted = 0;
      for (const row of data) {
        const phageId =
          (row.phageSlug && bySlug.get(row.phageSlug.toLowerCase())) ||
          (row.accession && byAcc.get(row.accession.toLowerCase()));
        if (!phageId) continue;
        const geneId = row.locusTag
          ? geneMap.get(phageId)?.get(row.locusTag.toLowerCase()) ?? null
          : null;
        await db.insert(tropismPredictions).values({
          phageId,
          geneId,
          locusTag: row.locusTag ?? null,
          receptor: row.receptor,
          confidence: row.confidence,
          evidence: row.evidence ? JSON.stringify(row.evidence) : null,
          source: row.source ?? 'embedding',
        });
        inserted++;
      }
      console.log(`Inserted ${inserted} tropism predictions`);
    } catch (err) {
      console.error('Failed to load tropism predictions:', err);
    }
  } else {
    console.log('\nNo tropism embedding file found; skipping tropism_predictions import.');
  }

  sqlite.close();

  console.log('\n========================================');
  console.log(`Database created: ${DB_PATH}`);
  console.log(`Total phages: ${PHAGE_CATALOG.length}`);
  console.log('========================================\n');
}

main().catch(console.error);
