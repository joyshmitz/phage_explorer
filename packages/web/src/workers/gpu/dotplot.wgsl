/**
 * Dot Plot (Self-Similarity Matrix) Compute Shader
 *
 * Computes a self-similarity dot plot for sequence analysis.
 * Each thread checks if k-mers at positions (i, j) match.
 *
 * Output is a sparse representation: only matching positions are recorded.
 *
 * Base encoding: A=0, C=1, G=2, T=3, N=4
 */

// Bindings
@group(0) @binding(0) var<storage, read> sequence: array<u32>;
@group(0) @binding(1) var<storage, read_write> matches: array<u32>;  // Packed positions [i << 16 | j]
@group(0) @binding(2) var<storage, read_write> matchCount: atomic<u32>;

struct Uniforms {
  seqLength: u32,
  kmerSize: u32,
  maxMatches: u32,
  startRow: u32,   // For tiled processing of large sequences
}
@group(0) @binding(3) var<uniform> u: Uniforms;

// Compare two k-mers at positions i and j
fn kmersMatch(posI: u32, posJ: u32, k: u32, seqLen: u32) -> bool {
  if (posI + k > seqLen || posJ + k > seqLen) {
    return false;
  }

  for (var offset: u32 = 0u; offset < k; offset = offset + 1u) {
    let baseI = sequence[posI + offset];
    let baseJ = sequence[posJ + offset];

    // Skip if either contains N
    if (baseI > 3u || baseJ > 3u) {
      return false;
    }

    if (baseI != baseJ) {
      return false;
    }
  }

  return true;
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let i = u.startRow + global_id.x;
  let j = global_id.y;

  let numKmers = u.seqLength - u.kmerSize + 1u;

  // Bounds check
  if (i >= numKmers || j >= numKmers) {
    return;
  }

  // Only check upper triangle + diagonal to avoid duplicate matches
  if (j < i) {
    return;
  }

  // Check if k-mers match
  if (kmersMatch(i, j, u.kmerSize, u.seqLength)) {
    let idx = atomicAdd(&matchCount, 1u);

    if (idx < u.maxMatches) {
      // Pack i and j into single u32 (16 bits each, supports sequences up to 65536)
      matches[idx] = (i << 16u) | j;
    }
  }
}
