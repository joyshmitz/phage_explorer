import { __wbg_set_wasm } from "./wasm_compute_bg.js";
import * as wasmBg from "./wasm_compute_bg.js";
export * from "./wasm_compute_bg.js";

async function loadWasmBytes() {
  const url = new URL("./wasm_compute_bg.wasm", import.meta.url);

  // Node/Bun: avoid fetch(file://) portability issues.
  if (url.protocol === "file:") {
    // Bun: load directly from the filesystem without pulling in Node builtins
    // (keeps Vite builds happy in the browser).
    if (typeof Bun !== "undefined" && typeof Bun.file === "function") {
      let path = url.pathname;
      try {
        path = decodeURIComponent(path);
      } catch {
        // ignore decode issues
      }
      // Windows file URLs look like /C:/path; strip the leading slash.
      if (path.startsWith("/") && /^[A-Za-z]:\//.test(path.slice(1))) {
        path = path.slice(1);
      }

      const buf = await Bun.file(path).arrayBuffer();
      return new Uint8Array(buf);
    }

    throw new Error(
      "wasm-compute: file:// Wasm load requires Bun. " +
        "Run the build via Bun or inline the Wasm bytes (scripts/inline-wasm-compute.ts)."
    );
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch wasm_compute_bg.wasm: ${res.status} ${res.statusText}`);
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

const wasmBytes = await loadWasmBytes();
const { instance } = await WebAssembly.instantiate(wasmBytes, {
  "./wasm_compute_bg.js": wasmBg,
});

__wbg_set_wasm(instance.exports);
instance.exports.__wbindgen_start();
