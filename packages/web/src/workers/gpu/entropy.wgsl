/**
 * Entropy Compute Shader
 *
 * Computes Shannon entropy and linguistic complexity in sliding windows.
 * Uses k-mer frequency distribution within each window.
 *
 * Base encoding: A=0, C=1, G=2, T=3, N=4
 */

// Bindings
@group(0) @binding(0) var<storage, read> sequence: array<u32>;
@group(0) @binding(1) var<storage, read_write> entropy: array<f32>;
@group(0) @binding(2) var<storage, read_write> complexity: array<f32>;

struct Uniforms {
  seqLength: u32,
  windowSize: u32,
  kmerSize: u32,
  numWindows: u32,
}
@group(0) @binding(3) var<uniform> u: Uniforms;

// Workgroup shared memory for k-mer counts (k=4 -> 256 counts)
var<workgroup> kmerCounts: array<u32, 256>;

// log2 approximation for entropy calculation
fn log2_approx(x: f32) -> f32 {
  if (x <= 0.0) {
    return 0.0;
  }
  // Use natural log and convert: log2(x) = ln(x) / ln(2)
  return log(x) / 0.693147180559945;
}

@compute @workgroup_size(64)
fn main(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>
) {
  let windowIdx = global_id.x;

  if (windowIdx >= u.numWindows) {
    return;
  }

  let startPos = windowIdx;
  let k = min(u.kmerSize, 4u);  // Cap at 4 for shared memory limits
  let numPossibleKmers = 1u << (k * 2u);  // 4^k

  // Initialize counts (only first threads do this)
  if (local_id.x == 0u) {
    for (var i: u32 = 0u; i < numPossibleKmers; i = i + 1u) {
      kmerCounts[i] = 0u;
    }
  }
  workgroupBarrier();

  // Count k-mers in window (single thread per window for simplicity)
  var uniqueKmers: u32 = 0u;
  var totalKmers: u32 = 0u;

  // Local k-mer count array since we can't easily share
  // Note: This simplified version counts for the specific window
  let windowEnd = min(startPos + u.windowSize, u.seqLength);
  let numKmersInWindow = windowEnd - startPos - k + 1u;

  if (numKmersInWindow == 0u || windowEnd <= startPos + k) {
    entropy[windowIdx] = 0.0;
    complexity[windowIdx] = 0.0;
    return;
  }

  // Build local counts
  var localCounts: array<u32, 256>;
  for (var i: u32 = 0u; i < numPossibleKmers; i = i + 1u) {
    localCounts[i] = 0u;
  }

  for (var i: u32 = 0u; i < numKmersInWindow; i = i + 1u) {
    let pos = startPos + i;
    var kmerIdx: u32 = 0u;
    var valid: bool = true;

    for (var j: u32 = 0u; j < k; j = j + 1u) {
      let base = sequence[pos + j];
      if (base > 3u) {  // N or invalid
        valid = false;
        break;
      }
      kmerIdx = (kmerIdx << 2u) | base;
    }

    if (valid) {
      if (localCounts[kmerIdx] == 0u) {
        uniqueKmers = uniqueKmers + 1u;
      }
      localCounts[kmerIdx] = localCounts[kmerIdx] + 1u;
      totalKmers = totalKmers + 1u;
    }
  }

  // Compute Shannon entropy: -sum(p * log2(p))
  var entropyVal: f32 = 0.0;

  if (totalKmers > 0u) {
    let totalF = f32(totalKmers);

    for (var i: u32 = 0u; i < numPossibleKmers; i = i + 1u) {
      if (localCounts[i] > 0u) {
        let p = f32(localCounts[i]) / totalF;
        entropyVal = entropyVal - p * log2_approx(p);
      }
    }
  }

  // Compute linguistic complexity: unique_kmers / max_possible_kmers
  let maxPossibleInWindow = min(numKmersInWindow, numPossibleKmers);
  var complexityVal: f32 = 0.0;
  if (maxPossibleInWindow > 0u) {
    complexityVal = f32(uniqueKmers) / f32(maxPossibleInWindow);
  }

  entropy[windowIdx] = entropyVal;
  complexity[windowIdx] = complexityVal;
}
