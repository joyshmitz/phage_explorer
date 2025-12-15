/**
 * GC Skew Compute Shader
 *
 * Computes GC skew = (G - C) / (G + C) for sliding windows across a DNA sequence.
 * Also computes cumulative skew which is useful for identifying replication origins.
 *
 * Base encoding: A=0, C=1, G=2, T=3, N=4
 */

// Bindings
@group(0) @binding(0) var<storage, read> sequence: array<u32>;
@group(0) @binding(1) var<storage, read_write> skew: array<f32>;
@group(0) @binding(2) var<storage, read_write> cumulative: array<f32>;

struct Uniforms {
  seqLength: u32,
  windowSize: u32,
  stepSize: u32,
  numWindows: u32,
}
@group(0) @binding(3) var<uniform> u: Uniforms;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let windowIdx = global_id.x;

  if (windowIdx >= u.numWindows) {
    return;
  }

  let startPos = windowIdx * u.stepSize;

  // Count G and C in window
  var gCount: u32 = 0u;
  var cCount: u32 = 0u;

  for (var i: u32 = 0u; i < u.windowSize; i = i + 1u) {
    let pos = startPos + i;
    if (pos >= u.seqLength) {
      break;
    }

    let base = sequence[pos];
    if (base == 2u) {  // G
      gCount = gCount + 1u;
    } else if (base == 1u) {  // C
      cCount = cCount + 1u;
    }
  }

  // Compute GC skew
  let gcSum = gCount + cCount;
  var skewValue: f32 = 0.0;

  if (gcSum > 0u) {
    skewValue = f32(i32(gCount) - i32(cCount)) / f32(gcSum);
  }

  skew[windowIdx] = skewValue;

  // For cumulative skew, we use a simple running sum
  // Note: True cumulative requires sequential processing
  // This computes a per-window contribution that can be prefix-summed on CPU
  cumulative[windowIdx] = skewValue;
}
