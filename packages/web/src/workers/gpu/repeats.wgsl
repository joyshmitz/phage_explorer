/**
 * Repeat Detection Compute Shader
 *
 * Detects palindromic (inverted repeat) sequences in DNA.
 * A palindrome is a sequence that reads the same on the complementary strand.
 * E.g., GAATTC has complement CTTAAG, reversed = GAATTC
 *
 * Base encoding: A=0, C=1, G=2, T=3, N=4
 * Complement: A<->T (0<->3), C<->G (1<->2)
 */

// Bindings
@group(0) @binding(0) var<storage, read> sequence: array<u32>;
@group(0) @binding(1) var<storage, read_write> palindromes: array<u32>;  // [start, end, armLength] triplets
@group(0) @binding(2) var<storage, read_write> palindromeCount: atomic<u32>;

struct Uniforms {
  seqLength: u32,
  minArmLength: u32,
  maxGap: u32,
  maxRepeats: u32,
}
@group(0) @binding(3) var<uniform> u: Uniforms;

// Get complement of a base
fn complement(base: u32) -> u32 {
  // A(0) <-> T(3), C(1) <-> G(2)
  if (base == 0u) { return 3u; }
  if (base == 3u) { return 0u; }
  if (base == 1u) { return 2u; }
  if (base == 2u) { return 1u; }
  return 4u;  // N stays N
}

@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let centerPos = global_id.x;

  if (centerPos >= u.seqLength) {
    return;
  }

  // Try different gap sizes at this center position
  for (var gap: u32 = 0u; gap <= u.maxGap; gap = gap + 1u) {
    // Check for palindrome centered here
    // Left arm goes from centerPos backwards
    // Right arm starts at centerPos + gap + 1 and goes forward

    var armLength: u32 = 0u;
    let rightStart = centerPos + gap + 1u;

    // Don't check if right start is beyond sequence
    if (rightStart >= u.seqLength) {
      continue;
    }

    // Extend palindrome arms
    var leftPos = centerPos;
    var rightPos = rightStart;

    loop {
      // Check bounds
      if (rightPos >= u.seqLength) {
        break;
      }

      let leftBase = sequence[leftPos];
      let rightBase = sequence[rightPos];

      // Skip if either is N
      if (leftBase > 3u || rightBase > 3u) {
        break;
      }

      // Check if complement matches
      if (complement(leftBase) != rightBase) {
        break;
      }

      armLength = armLength + 1u;

      // Move pointers
      if (leftPos == 0u) {
        break;
      }
      leftPos = leftPos - 1u;
      rightPos = rightPos + 1u;
    }

    // Record if we found a palindrome meeting minimum length
    if (armLength >= u.minArmLength) {
      let idx = atomicAdd(&palindromeCount, 1u);

      if (idx < u.maxRepeats) {
        let start = centerPos - armLength + 1u;
        let end = rightStart + armLength - 1u;

        // Store triplet: [start, end, armLength]
        palindromes[idx * 3u] = start;
        palindromes[idx * 3u + 1u] = end;
        palindromes[idx * 3u + 2u] = armLength;
      }
    }
  }
}
