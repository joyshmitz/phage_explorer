#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "fs";
import { join, isAbsolute } from "path";
import { parseArgs } from "util";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    "pkg-dir": { type: "string", default: "" },
  },
});

const pkgDirInput = values["pkg-dir"];
const pkgDir =
  pkgDirInput && pkgDirInput.length > 0
    ? isAbsolute(pkgDirInput)
      ? pkgDirInput
      : join(import.meta.dir, "../packages/wasm-compute", pkgDirInput)
    : join(import.meta.dir, "../packages/wasm-compute/pkg");

const jsPath = join(pkgDir, "wasm_compute.js");
const bgJsPath = join(pkgDir, "wasm_compute_bg.js");
const wasmPath = join(pkgDir, "wasm_compute_bg.wasm");
const gitignorePath = join(pkgDir, ".gitignore");

console.log(`Inlining wasm-compute Wasm into JS... (${pkgDir})`);

try {
  // wasm-pack --target bundler produces `wasm_compute_bg.js` which contains the JS glue.
  // We rely on that file for exports, so sanity-patch a few known wasm-bindgen glitches
  // where getters incorrectly call the wrong WASM export.
  try {
    const bg = readFileSync(bgJsPath, "utf8");
    const patches: Array<{ re: RegExp; from: string; to: string }> = [
      {
        // SequenceHandle.length incorrectly calls BondDetectionResult getter
        re: /export class SequenceHandle[\s\S]*?get length\(\) \{\n\s*const ret = wasm\.bonddetectionresult_bond_count\(this\.__wbg_ptr\);/,
        from: "const ret = wasm.bonddetectionresult_bond_count(this.__wbg_ptr);",
        to: "const ret = wasm.sequencehandle_length(this.__wbg_ptr);",
      },
      {
        // DenseKmerResult.k incorrectly calls CGR resolution getter
        re: /export class DenseKmerResult[\s\S]*?get k\(\) \{\n\s*const ret = wasm\.cgrcountsresult_resolution\(this\.__wbg_ptr\);/,
        from: "const ret = wasm.cgrcountsresult_resolution(this.__wbg_ptr);",
        to: "const ret = wasm.densekmerresult_k(this.__wbg_ptr);",
      },
      {
        // DotPlotBuffers.bins incorrectly calls CGR resolution getter
        re: /export class DotPlotBuffers[\s\S]*?get bins\(\) \{\n\s*const ret = wasm\.cgrcountsresult_resolution\(this\.__wbg_ptr\);/,
        from: "const ret = wasm.cgrcountsresult_resolution(this.__wbg_ptr);",
        to: "const ret = wasm.dotplotbuffers_bins(this.__wbg_ptr);",
      },
      {
        // KLScanResult.window_count incorrectly calls CGR resolution getter
        re: /export class KLScanResult[\s\S]*?get window_count\(\) \{\n\s*const ret = wasm\.cgrcountsresult_resolution\(this\.__wbg_ptr\);/,
        from: "const ret = wasm.cgrcountsresult_resolution(this.__wbg_ptr);",
        to: "const ret = wasm.klscanresult_window_count(this.__wbg_ptr);",
      },
      {
        // KLScanResult.k incorrectly calls DotPlotBuffers.window getter
        re: /export class KLScanResult[\s\S]*?get k\(\) \{\n\s*const ret = wasm\.dotplotbuffers_window\(this\.__wbg_ptr\);/,
        from: "const ret = wasm.dotplotbuffers_window(this.__wbg_ptr);",
        to: "const ret = wasm.klscanresult_k(this.__wbg_ptr);",
      },
      {
        // MinHashSignature.total_kmers incorrectly calls DenseKmerResult.total_valid getter
        re: /export class MinHashSignature[\s\S]*?get total_kmers\(\) \{\n\s*const ret = wasm\.densekmerresult_total_valid\(this\.__wbg_ptr\);/,
        from: "const ret = wasm.densekmerresult_total_valid(this.__wbg_ptr);",
        to: "const ret = wasm.minhashsignature_total_kmers(this.__wbg_ptr);",
      },
      {
        // MinHashSignature.k incorrectly calls CGR resolution getter
        re: /export class MinHashSignature[\s\S]*?get k\(\) \{\n\s*const ret = wasm\.cgrcountsresult_resolution\(this\.__wbg_ptr\);/,
        from: "const ret = wasm.cgrcountsresult_resolution(this.__wbg_ptr);",
        to: "const ret = wasm.minhashsignature_k(this.__wbg_ptr);",
      },
      {
        // PCAResult.n_features incorrectly calls DotPlotBuffers.window getter
        re: /export class PCAResult[\s\S]*?get n_features\(\) \{\n\s*const ret = wasm\.dotplotbuffers_window\(this\.__wbg_ptr\);/,
        from: "const ret = wasm.dotplotbuffers_window(this.__wbg_ptr);",
        to: "const ret = wasm.pcaresult_n_features(this.__wbg_ptr);",
      },
      {
        // PCAResult.n_components incorrectly calls CGR resolution getter
        re: /export class PCAResult[\s\S]*?get n_components\(\) \{\n\s*const ret = wasm\.cgrcountsresult_resolution\(this\.__wbg_ptr\);/,
        from: "const ret = wasm.cgrcountsresult_resolution(this.__wbg_ptr);",
        to: "const ret = wasm.pcaresult_n_components(this.__wbg_ptr);",
      },
      {
        // PCAResultF32.n_features incorrectly calls MyersDiffResult.mismatches getter
        re: /export class PCAResultF32[\s\S]*?get n_features\(\) \{\n\s*const ret = wasm\.myersdiffresult_mismatches\(this\.__wbg_ptr\);/,
        from: "const ret = wasm.myersdiffresult_mismatches(this.__wbg_ptr);",
        to: "const ret = wasm.pcaresultf32_n_features(this.__wbg_ptr);",
      },
      {
        // PCAResultF32.n_components incorrectly calls MyersDiffResult.matches getter
        re: /export class PCAResultF32[\s\S]*?get n_components\(\) \{\n\s*const ret = wasm\.myersdiffresult_matches\(this\.__wbg_ptr\);/,
        from: "const ret = wasm.myersdiffresult_matches(this.__wbg_ptr);",
        to: "const ret = wasm.pcaresultf32_n_components(this.__wbg_ptr);",
      },
    ];

    let patched = bg;
    for (const p of patches) {
      patched = patched.replace(p.re, (match) => match.replace(p.from, p.to));
    }

    if (patched !== bg) {
      writeFileSync(bgJsPath, patched);
    }
  } catch (e) {
    // Non-fatal: the build can still succeed, and the bug only impacts SequenceHandle.length.
    console.warn("Warning: failed to patch wasm_compute_bg.js:", e);
  }

  const wasmBuffer = readFileSync(wasmPath);
  const wasmBase64 = wasmBuffer.toString("base64");

  // wasm-pack output has changed over time; rather than trying to patch arbitrary templates,
  // we overwrite the entrypoint with a stable, bundler-friendly wrapper that:
  // - avoids importing `.wasm` as an ES module (Vite/Rollup do not support the proposal yet)
  // - instantiates from inlined bytes (critical for Bun --compile single-binary builds)
  // - exposes a cached async `init()` default export (worker-safe) so callers can explicitly await initialization
  //   (and so wasm-loader can safely call init when needed)
  const wrapper = `import { __wbg_set_wasm } from "./wasm_compute_bg.js";
import * as wasmBg from "./wasm_compute_bg.js";
export * from "./wasm_compute_bg.js";

// Inlined Wasm bytes (base64)
const wasmBase64 = "${wasmBase64}";

function base64ToBytes(base64) {
  // Prefer Node/Bun Buffer when available (fast + works without atob).
  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(base64, "base64"));
  }

  // Browser/worker fallback.
  const atobFn = globalThis.atob;
  if (typeof atobFn !== "function") {
    throw new Error("No base64 decoder available (expected Buffer or atob)");
  }

  const bin = atobFn(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

const wasmBytes = base64ToBytes(wasmBase64);
let initPromise = null;

async function init() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { instance } = await WebAssembly.instantiate(wasmBytes, {
      "./wasm_compute_bg.js": wasmBg,
    });

    __wbg_set_wasm(instance.exports);

    const start = instance.exports.__wbindgen_start;
    if (typeof start === "function") {
      start.call(instance.exports);
    }
  })().catch((err) => {
    // Allow retry on transient failures.
    initPromise = null;
    throw err;
  });

  return initPromise;
}

export default init;
`;

  writeFileSync(jsPath, wrapper);

  // Ensure the wasm-pack output dir is trackable in git (Vercel does not run Rust builds).
  // wasm-pack writes a blanket `*` ignore; we replace it with an allowlist so the runtime
  // files (and any wasm-bindgen `snippets/`) can be committed without `git add -f`.
  writeFileSync(
    gitignorePath,
    [
      "*",
      "!.gitignore",
      "!package.json",
      "!wasm_compute.d.ts",
      "!wasm_compute.js",
      "!wasm_compute_bg.js",
      "!wasm_compute_bg.wasm",
      "!wasm_compute_bg.wasm.d.ts",
      "!snippets/",
      "!snippets/**",
      "",
    ].join("\n")
  );
  console.log(`✓ Inlined ${wasmBuffer.length} bytes of wasm-compute.`);
} catch (e) {
  console.error("Error inlining wasm-compute:", e);
  process.exit(1);
}
