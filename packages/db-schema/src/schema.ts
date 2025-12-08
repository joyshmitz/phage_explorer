import { sqliteTable, text, integer, real, blob, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Main phages catalog table
export const phages = sqliteTable('phages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').unique(),
  name: text('name').notNull(),
  accession: text('accession').unique().notNull(),
  family: text('family'),
  genus: text('genus'),
  host: text('host'),
  morphology: text('morphology'), // siphovirus, myovirus, podovirus, filamentous, etc.
  lifecycle: text('lifecycle'), // lytic, lysogenic, chronic
  genomeLength: integer('genome_length'),
  genomeType: text('genome_type'), // dsDNA, ssDNA, dsRNA, ssRNA
  gcContent: real('gc_content'),
  baltimoreGroup: text('baltimore_group'),
  description: text('description'),
  pdbIds: text('pdb_ids'), // JSON array of PDB IDs
  tags: text('tags'), // JSON for quick flags
  lastUpdated: integer('last_updated'), // unix timestamp
});

// Chunked sequences table - stores genome in 10kb chunks
export const sequences = sqliteTable('sequences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  phageId: integer('phage_id').notNull().references(() => phages.id),
  chunkIndex: integer('chunk_index').notNull(),
  sequence: text('sequence').notNull(),
}, (table) => [
  uniqueIndex('idx_sequences_phage_chunk').on(table.phageId, table.chunkIndex),
  index('idx_sequences_phage').on(table.phageId),
]);

// Gene annotations table
export const genes = sqliteTable('genes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  phageId: integer('phage_id').notNull().references(() => phages.id),
  name: text('name'),
  locusTag: text('locus_tag'),
  startPos: integer('start_pos').notNull(),
  endPos: integer('end_pos').notNull(),
  strand: text('strand'), // '+' or '-'
  product: text('product'),
  type: text('type'), // CDS, gene, promoter, terminator, etc.
  qualifiers: text('qualifiers'), // JSON bag
}, (table) => [
  index('idx_genes_phage').on(table.phageId),
  index('idx_genes_position').on(table.phageId, table.startPos, table.endPos),
]);

// Codon usage statistics
export const codonUsage = sqliteTable('codon_usage', {
  phageId: integer('phage_id').primaryKey().references(() => phages.id),
  aaCounts: text('aa_counts').notNull(), // JSON: { "A": 1234, "R": 567, ... }
  codonCounts: text('codon_counts').notNull(), // JSON: { "ATG": 10, "TTT": 23, ... }
});

// 3D models table with optional pre-rendered ASCII frames
export const models = sqliteTable('models', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  phageId: integer('phage_id').notNull().references(() => phages.id),
  role: text('role').notNull(), // capsid, tail, full_virion
  pdbId: text('pdb_id'),
  source: text('source').notNull(), // pdb, sketchfab, custom
  objData: blob('obj_data'), // simplified OBJ/STL data
  asciiFrames: text('ascii_frames'), // JSON array of pre-rendered frames
  meta: text('meta'), // JSON metadata, citations, resolution
}, (table) => [
  index('idx_models_phage').on(table.phageId),
]);

// Tail fiber tropism predictions (precomputed via embeddings/ONNX)
export const tropismPredictions = sqliteTable('tropism_predictions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  phageId: integer('phage_id').notNull().references(() => phages.id),
  geneId: integer('gene_id').references(() => genes.id),
  locusTag: text('locus_tag'),
  receptor: text('receptor').notNull(),
  confidence: real('confidence').notNull(), // 0-1
  evidence: text('evidence'), // JSON array of strings
  source: text('source').notNull(), // e.g., esm2-hdbscan, heuristic
}, (table) => [
  index('idx_tropism_phage').on(table.phageId),
  index('idx_tropism_gene').on(table.geneId),
]);

// User preferences
export const preferences = sqliteTable('preferences', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// Type exports for use in other packages
export type Phage = typeof phages.$inferSelect;
export type NewPhage = typeof phages.$inferInsert;

export type Sequence = typeof sequences.$inferSelect;
export type NewSequence = typeof sequences.$inferInsert;

export type Gene = typeof genes.$inferSelect;
export type NewGene = typeof genes.$inferInsert;

export type CodonUsage = typeof codonUsage.$inferSelect;
export type NewCodonUsage = typeof codonUsage.$inferInsert;

export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;

export type Preference = typeof preferences.$inferSelect;
export type NewPreference = typeof preferences.$inferInsert;

export type TropismPrediction = typeof tropismPredictions.$inferSelect;
export type NewTropismPrediction = typeof tropismPredictions.$inferInsert;
