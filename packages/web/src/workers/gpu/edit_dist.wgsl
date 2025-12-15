/**
 * Edit Distance (Levenshtein) Compute Shader
 *
 * Computes edit distance between two sequences using wavefront parallelization.
 * The anti-diagonal wavefront approach allows parallel computation of DP cells.
 *
 * This shader computes one anti-diagonal at a time, called repeatedly from JS.
 * Each cell on an anti-diagonal can be computed independently.
 *
 * Requires THREE buffers:
 * - dpPrev2: diagonal d-2 (for substitution: cell i-1, j-1)
 * - dpPrev1: diagonal d-1 (for deletion: cell i-1, j and insertion: cell i, j-1)
 * - dpCurr:  diagonal d (current, being written)
 *
 * Base encoding: A=0, C=1, G=2, T=3, N=4
 */

// Bindings
@group(0) @binding(0) var<storage, read> seqA: array<u32>;
@group(0) @binding(1) var<storage, read> seqB: array<u32>;
@group(0) @binding(2) var<storage, read> dpPrev2: array<u32>;  // Diagonal d-2 (for substitution)
@group(0) @binding(3) var<storage, read> dpPrev1: array<u32>;  // Diagonal d-1 (for del/ins)
@group(0) @binding(4) var<storage, read_write> dpCurr: array<u32>;  // Current diagonal d

struct Uniforms {
  lenA: u32,
  lenB: u32,
  diagonal: u32,      // Which anti-diagonal we're computing (0 to lenA+lenB)
  offset: u32,        // Starting i index for this diagonal
  offsetPrev1: u32,   // Starting i index for diagonal d-1
  offsetPrev2: u32,   // Starting i index for diagonal d-2
}
@group(0) @binding(5) var<uniform> u: Uniforms;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let idx = global_id.x;

  // Compute i,j from diagonal and local index
  let i = u.offset + idx;
  let j = u.diagonal - i;

  // Bounds check
  if (i > u.lenA || j > u.lenB) {
    return;
  }

  // Handle boundary conditions (first row and column)
  if (i == 0u) {
    dpCurr[idx] = j;  // Insert j characters
    return;
  }
  if (j == 0u) {
    dpCurr[idx] = i;  // Delete i characters
    return;
  }

  // Compute match/mismatch cost
  let matchCost = select(1u, 0u, seqA[i - 1u] == seqB[j - 1u]);

  // Indexing for wavefront:
  // Cell (i,j) is at position (i - offset) on diagonal d
  // Cell (i-1,j-1) is at position (i-1 - offsetPrev2) on diagonal d-2
  // Cell (i-1,j) is at position (i-1 - offsetPrev1) on diagonal d-1
  // Cell (i,j-1) is at position (i - offsetPrev1) on diagonal d-1

  // Substitution: (i-1, j-1) from diagonal d-2
  let subIdx = i - 1u - u.offsetPrev2;
  let sub = dpPrev2[subIdx] + matchCost;

  // Deletion: (i-1, j) from diagonal d-1
  // Position of (i-1, j) on d-1: (i-1) - offsetPrev1
  let delIdx = i - 1u - u.offsetPrev1;
  let del = dpPrev1[delIdx] + 1u;

  // Insertion: (i, j-1) from diagonal d-1
  // Position of (i, j-1) on d-1: i - offsetPrev1
  let insIdx = i - u.offsetPrev1;
  let ins = dpPrev1[insIdx] + 1u;

  dpCurr[idx] = min(min(sub, del), ins);
}
