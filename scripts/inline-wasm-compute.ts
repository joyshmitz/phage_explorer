#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const pkgDir = join(import.meta.dir, "../packages/wasm-compute/pkg");
const jsPath = join(pkgDir, "wasm_compute.js");
const wasmPath = join(pkgDir, "wasm_compute_bg.wasm");

console.log("Inlining wasm-compute Wasm into JS...");

try {
  const wasmBuffer = readFileSync(wasmPath);
  const wasmBase64 = wasmBuffer.toString("base64");

  // wasm-pack output has changed over time; rather than trying to patch arbitrary templates,
  // we overwrite the entrypoint with a stable, bundler-friendly wrapper that:
  // - avoids importing `.wasm` as an ES module (Vite/Rollup do not support the proposal yet)
  // - instantiates from inlined bytes (critical for Bun --compile single-binary builds)
  // - preserves the `import('@phage/wasm-compute')` "module is ready" semantics via top-level await
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
const { instance } = await WebAssembly.instantiate(wasmBytes, {
  "./wasm_compute_bg.js": wasmBg,
});

__wbg_set_wasm(instance.exports);
instance.exports.__wbindgen_start();
`;

  writeFileSync(jsPath, wrapper);
  console.log(`✓ Inlined ${wasmBuffer.length} bytes of wasm-compute.`);
} catch (e) {
  console.error("Error inlining wasm-compute:", e);
  process.exit(1);
}
