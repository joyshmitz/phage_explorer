/**
 * Motif Search Compute Shader
 *
 * Parallel search for a pattern across a DNA sequence.
 * Supports exact matching and fuzzy matching with max mismatches.
 *
 * Base encoding: A=0, C=1, G=2, T=3, N=4
 */

// Bindings
@group(0) @binding(0) var<storage, read> sequence: array<u32>;
@group(0) @binding(1) var<storage, read> pattern: array<u32>;
@group(0) @binding(2) var<storage, read_write> matches: array<u32>;
@group(0) @binding(3) var<storage, read_write> matchCount: atomic<u32>;

struct Uniforms {
  seqLength: u32,
  patternLength: u32,
  maxMismatches: u32,
  maxPositions: u32,
}
@group(0) @binding(4) var<uniform> u: Uniforms;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let pos = global_id.x;

  // Check bounds
  if (pos + u.patternLength > u.seqLength) {
    return;
  }

  // Count mismatches
  var mismatches: u32 = 0u;

  for (var i: u32 = 0u; i < u.patternLength; i = i + 1u) {
    let seqBase = sequence[pos + i];
    let patBase = pattern[i];

    // N (4) in pattern matches anything
    // N (4) in sequence counts as mismatch
    if (patBase != 4u && seqBase != patBase) {
      mismatches = mismatches + 1u;

      // Early exit if too many mismatches
      if (mismatches > u.maxMismatches) {
        return;
      }
    }
  }

  // Found a match - record position
  if (mismatches <= u.maxMismatches) {
    let idx = atomicAdd(&matchCount, 1u);
    if (idx < u.maxPositions) {
      matches[idx] = pos;
    }
  }
}
