#!/usr/bin/env bun
/**
 * Build Web Database
 *
 * Prepares the phage database for web deployment:
 * 1. Copies to web public directory
 * 2. Runs VACUUM and REINDEX for optimization
 * 3. Generates manifest.json with hash for cache invalidation
 */

import { Database } from "bun:sqlite";
import { mkdir, copyFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    source: { type: "string", default: "phage.db" },
    output: { type: "string", default: "packages/web/public" },
  },
});

const SOURCE_DB = values.source;
const OUTPUT_DIR = values.output;
const OUTPUT_DB = `${OUTPUT_DIR}/phage.db`;
const OUTPUT_MANIFEST = `${OUTPUT_DIR}/phage.db.manifest.json`;

async function main() {
  console.log("Building web database...");

  // Check source exists
  try {
    await stat(SOURCE_DB);
  } catch {
    console.error(`Source database not found: ${SOURCE_DB}`);
    process.exit(1);
  }

  // Ensure output directory exists
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Copy database to output
  console.log(`Copying ${SOURCE_DB} to ${OUTPUT_DB}...`);
  await copyFile(SOURCE_DB, OUTPUT_DB);

  // Optimize with VACUUM and REINDEX
  console.log("Optimizing database (VACUUM, REINDEX)...");
  const db = new Database(OUTPUT_DB);
  db.exec("VACUUM");
  db.exec("REINDEX");
  db.close();

  // Calculate hash for cache invalidation
  console.log("Generating manifest...");
  const fileData = await Bun.file(OUTPUT_DB).arrayBuffer();
  const hash = createHash("sha256").update(Buffer.from(fileData)).digest("hex");

  const stats = await stat(OUTPUT_DB);
  const manifest = {
    version: 1,
    hash,
    size: stats.size,
    sizeFormatted: formatBytes(stats.size),
    generatedAt: new Date().toISOString(),
  };

  await Bun.write(OUTPUT_MANIFEST, JSON.stringify(manifest, null, 2));

  console.log(`✓ Built web database:`);
  console.log(`  Database: ${OUTPUT_DB} (${manifest.sizeFormatted})`);
  console.log(`  Manifest: ${OUTPUT_MANIFEST}`);
  console.log(`  Hash: ${hash.substring(0, 16)}...`);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
