use wasm_bindgen::prelude::*;
use std::collections::HashMap;

mod renderer;

pub use renderer::{render_ascii_model, Model3D, Vector3};

// ============================================================================
// Core Genetics Functions - HOT PATH optimizations
// ============================================================================

/// Standard DNA codon table (Translation Table 1)
/// Maps 64 codons to their amino acid single-letter codes.
fn codon_to_aa(b0: u8, b1: u8, b2: u8) -> u8 {
    // Encode codon as 6-bit index: (base0 << 4) | (base1 << 2) | base2
    // where A=0, C=1, G=2, T=3
    let encode_base = |b: u8| -> Option<u8> {
        match b {
            b'A' | b'a' => Some(0),
            b'C' | b'c' => Some(1),
            b'G' | b'g' => Some(2),
            b'T' | b't' | b'U' | b'u' => Some(3),
            _ => None, // N or other ambiguous
        }
    };

    let (e0, e1, e2) = match (encode_base(b0), encode_base(b1), encode_base(b2)) {
        (Some(a), Some(b), Some(c)) => (a, b, c),
        _ => return b'X', // Unknown codon
    };

    let idx = ((e0 as usize) << 4) | ((e1 as usize) << 2) | (e2 as usize);

    // Precomputed codon table: index = (base0*16 + base1*4 + base2)
    // Order: AAA, AAC, AAG, AAT, ACA, ACC, ACG, ACT, ...
    const TABLE: &[u8; 64] = b"KNKNTTTTRSRSIIMIQHQHPPPPRRRRLLLLEDEDAAAAGGGGVVVV*Y*YSSSS*CWCLFLF";
    TABLE[idx]
}

/// Translate DNA sequence to amino acid sequence.
///
/// # Arguments
/// * `seq` - DNA sequence string
/// * `frame` - Reading frame (0, 1, or 2)
///
/// # Returns
/// Amino acid sequence as a string. Unknown codons (containing N) become 'X'.
#[wasm_bindgen]
pub fn translate_sequence(seq: &str, frame: u8) -> String {
    let bytes = seq.as_bytes();
    let frame = (frame as usize).min(2);

    if bytes.len() < frame + 3 {
        return String::new();
    }

    let num_codons = (bytes.len() - frame) / 3;
    let mut result = Vec::with_capacity(num_codons);

    let mut i = frame;
    while i + 3 <= bytes.len() {
        let aa = codon_to_aa(bytes[i], bytes[i + 1], bytes[i + 2]);
        result.push(aa);
        i += 3;
    }

    // SAFETY: codon_to_aa only returns ASCII characters
    unsafe { String::from_utf8_unchecked(result) }
}

/// Compute reverse complement of DNA sequence.
///
/// Handles all IUPAC ambiguity codes correctly:
/// - Standard: A<->T, G<->C
/// - Ambiguity: R<->Y, K<->M, S<->S, W<->W, B<->V, D<->H, N<->N
///
/// # Arguments
/// * `seq` - DNA sequence string
///
/// # Returns
/// Reverse complement sequence (preserving case).
#[wasm_bindgen]
pub fn reverse_complement(seq: &str) -> String {
    let bytes = seq.as_bytes();
    let mut result = Vec::with_capacity(bytes.len());

    // Process in reverse
    for &b in bytes.iter().rev() {
        let comp = match b {
            // Standard bases
            b'A' => b'T', b'T' => b'A', b'G' => b'C', b'C' => b'G',
            b'a' => b't', b't' => b'a', b'g' => b'c', b'c' => b'g',
            // IUPAC ambiguity codes
            b'N' => b'N', b'n' => b'n',
            b'R' => b'Y', b'r' => b'y', // Purine (A/G) -> Pyrimidine (T/C)
            b'Y' => b'R', b'y' => b'r',
            b'S' => b'S', b's' => b's', // Strong (G/C)
            b'W' => b'W', b'w' => b'w', // Weak (A/T)
            b'K' => b'M', b'k' => b'm', // Keto (G/T) -> Amino (A/C)
            b'M' => b'K', b'm' => b'k',
            b'B' => b'V', b'b' => b'v', // Not A -> Not T
            b'V' => b'B', b'v' => b'b',
            b'D' => b'H', b'd' => b'h', // Not C -> Not G
            b'H' => b'D', b'h' => b'd',
            // U (RNA) treated as T
            b'U' => b'A', b'u' => b'a',
            // Unknown - keep as is
            other => other,
        };
        result.push(comp);
    }

    // SAFETY: We only transform ASCII characters to ASCII
    unsafe { String::from_utf8_unchecked(result) }
}

/// Calculate GC content percentage.
///
/// Only counts unambiguous A, T, G, C bases. N and other ambiguity codes
/// are excluded from both numerator and denominator.
///
/// # Arguments
/// * `seq` - DNA sequence string
///
/// # Returns
/// GC content as percentage (0-100). Returns 0 if no valid bases.
#[wasm_bindgen]
pub fn calculate_gc_content(seq: &str) -> f64 {
    let bytes = seq.as_bytes();
    let mut gc_count = 0u64;
    let mut total_count = 0u64;

    for &b in bytes {
        match b {
            b'G' | b'g' | b'C' | b'c' => {
                gc_count += 1;
                total_count += 1;
            }
            b'A' | b'a' | b'T' | b't' | b'U' | b'u' => {
                total_count += 1;
            }
            _ => {} // Skip N and other ambiguous bases
        }
    }

    if total_count == 0 {
        0.0
    } else {
        (gc_count as f64 / total_count as f64) * 100.0
    }
}

/// Result of codon usage analysis.
#[wasm_bindgen]
pub struct CodonUsageResult {
    /// JSON-encoded codon counts: { "ATG": 5, "TTT": 12, ... }
    json: String,
}

#[wasm_bindgen]
impl CodonUsageResult {
    /// Get the codon counts as a JSON string.
    #[wasm_bindgen(getter)]
    pub fn json(&self) -> String {
        self.json.clone()
    }
}

/// Count codon usage in a DNA sequence.
///
/// # Arguments
/// * `seq` - DNA sequence string
/// * `frame` - Reading frame (0, 1, or 2)
///
/// # Returns
/// CodonUsageResult with JSON-encoded codon counts.
#[wasm_bindgen]
pub fn count_codon_usage(seq: &str, frame: u8) -> CodonUsageResult {
    let bytes = seq.as_bytes();
    let frame = (frame as usize).min(2);

    let mut counts: HashMap<String, usize> = HashMap::new();

    let mut i = frame;
    while i + 3 <= bytes.len() {
        // Extract codon and uppercase it
        let codon_bytes = &bytes[i..i + 3];
        let codon: String = codon_bytes.iter()
            .map(|&b| (b as char).to_ascii_uppercase())
            .collect();

        *counts.entry(codon).or_insert(0) += 1;
        i += 3;
    }

    // Serialize to JSON
    let json = serde_json_lite_encode(&counts);
    CodonUsageResult { json }
}

/// Simple JSON encoder for HashMap<String, usize>
/// Avoids serde_json dependency for smaller WASM size.
fn serde_json_lite_encode(map: &HashMap<String, usize>) -> String {
    let mut result = String::from("{");
    let mut first = true;

    for (key, value) in map {
        if !first {
            result.push(',');
        }
        first = false;
        result.push('"');
        result.push_str(key);
        result.push_str("\":");
        result.push_str(&value.to_string());
    }

    result.push('}');
    result
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn levenshtein_distance(s1: &str, s2: &str) -> usize {
    let v1: Vec<char> = s1.chars().collect();
    let v2: Vec<char> = s2.chars().collect();
    
    let m = v1.len();
    let n = v2.len();

    if m == 0 { return n; }
    if n == 0 { return m; }

    // Ensure v1 is the shorter string for O(min(M, N)) space
    if m > n {
        return levenshtein_impl(&v2, &v1);
    }
    levenshtein_impl(&v1, &v2)
}

fn levenshtein_impl(s1: &[char], s2: &[char]) -> usize {
    let m = s1.len();
    let mut costs: Vec<usize> = (0..=m).collect();

    for (j, &c2) in s2.iter().enumerate() {
        let mut previous_substitution_cost = costs[0];
        costs[0] = j + 1;

        for (i, &c1) in s1.iter().enumerate() {
            let insertion_cost = costs[i];
            let deletion_cost = costs[i+1];
            
            let substitution_cost = if c1 == c2 {
                previous_substitution_cost
            } else {
                previous_substitution_cost + 1
            };

            previous_substitution_cost = deletion_cost;
            
            costs[i+1] = substitution_cost.min(insertion_cost + 1).min(deletion_cost + 1);
        }
    }

    costs[m]
}

#[wasm_bindgen]
pub struct KmerAnalysisResult {
    pub k: usize,
    pub unique_kmers_a: usize,
    pub unique_kmers_b: usize,
    pub shared_kmers: usize,
    pub jaccard_index: f64,
    pub containment_a_in_b: f64,
    pub containment_b_in_a: f64,
    pub cosine_similarity: f64,
    pub bray_curtis_dissimilarity: f64,
}

fn extract_kmer_freqs(sequence: &str, k: usize) -> HashMap<String, usize> {
    let mut freqs = HashMap::new();
    // Pre-allocate assuming roughly seq_len - k unique kmers
    if sequence.len() < k {
        return freqs;
    }
    
    // Convert to bytes for faster processing. 
    // We assume input is mostly ASCII DNA. Multibyte chars are handled safely by String::from_utf8_lossy if needed,
    // but here we just process bytes and construct Strings for the map keys.
    let seq_bytes = sequence.as_bytes();
    
    // We can iterate windows on bytes.
    // Handling uppercase: we can uppercase the key when inserting.
    
    for i in 0..=(seq_bytes.len() - k) {
        let window = &seq_bytes[i..i+k];
        
        // Check for 'N' or 'n'
        // 'N' is 78, 'n' is 110.
        // Actually, let's just create the string and check.
        // Optimizing this loop is tricky without custom Hasher or encoding.
        // The safest path that is still faster than JS is reducing allocations via strict loops.
        
        // Check for N without allocation
        let has_n = window.iter().any(|&b| b == b'N' || b == b'n');
        if has_n {
            continue;
        }

        // Create String and uppercase
        // from_utf8_lossy returns Cow. 
        // We know it's valid UTF8 if input was valid str.
        let kmer_str = std::str::from_utf8(window).unwrap_or("").to_uppercase();
        
        *freqs.entry(kmer_str).or_insert(0) += 1;
    }
    freqs
}

#[wasm_bindgen]
pub fn analyze_kmers(sequence_a: &str, sequence_b: &str, k: usize) -> KmerAnalysisResult {
    let freqs_a = extract_kmer_freqs(sequence_a, k);
    let freqs_b = extract_kmer_freqs(sequence_b, k);

    let set_a_len = freqs_a.len();
    let set_b_len = freqs_b.len();

    // Iterate over the smaller map for intersection
    let (smaller, larger) = if set_a_len < set_b_len {
        (&freqs_a, &freqs_b)
    } else {
        (&freqs_b, &freqs_a)
    };

    let intersection_count = smaller.keys().filter(|kmer| larger.contains_key(*kmer)).count();
    let union_size = set_a_len + set_b_len - intersection_count;
    
    let jaccard = if union_size > 0 {
        intersection_count as f64 / union_size as f64
    } else {
        1.0
    };

    let containment_a_in_b = if set_a_len > 0 {
        intersection_count as f64 / set_a_len as f64
    } else {
        0.0
    };

    let containment_b_in_a = if set_b_len > 0 {
        intersection_count as f64 / set_b_len as f64
    } else {
        0.0
    };

    // For Cosine/Bray-Curtis, we need to iterate the union.
    // Optimization: iterate keys of A, calculate partials. Iterate keys of B, calculate partials for keys NOT in A.
    // Or just collect union keys.
    
    let mut dot_product = 0.0;
    let mut norm_a = 0.0;
    let mut norm_b = 0.0;
    let mut sum_diff = 0.0;
    let mut sum_total = 0.0;

    // Iterate all keys in A
    for (kmer, &count_a) in &freqs_a {
        let count_a = count_a as f64;
        let count_b = *freqs_b.get(kmer).unwrap_or(&0) as f64;
        
        dot_product += count_a * count_b;
        norm_a += count_a * count_a;
        // norm_b will be calculated fully later? No, we need to sum all B.
        // Let's do it simply to avoid mistakes.
        
        sum_diff += (count_a - count_b).abs();
        sum_total += count_a + count_b;
    }

    // Iterate keys in B that are NOT in A
    for (kmer, &count_b) in &freqs_b {
        if !freqs_a.contains_key(kmer) {
            let count_b = count_b as f64;
            // count_a is 0
            // dot_product += 0 * count_b -> 0
            // norm_a += 0 -> 0
            
            sum_diff += count_b; // abs(0 - count_b)
            sum_total += count_b;
        }
        // Calculate norm_b separately
        norm_b += (count_b as f64).powi(2);
    }

    let cosine_sim = if norm_a > 0.0 && norm_b > 0.0 {
        dot_product / (norm_a.sqrt() * norm_b.sqrt())
    } else {
        0.0
    };

    let bray_curtis = if sum_total > 0.0 {
        sum_diff / sum_total
    } else {
        0.0
    };

    KmerAnalysisResult {
        k,
        unique_kmers_a: set_a_len,
        unique_kmers_b: set_b_len,
        shared_kmers: intersection_count,
        jaccard_index: jaccard,
        containment_a_in_b,
        containment_b_in_a,
        cosine_similarity: cosine_sim,
        bray_curtis_dissimilarity: bray_curtis,
    }
}

#[wasm_bindgen]
pub fn min_hash_jaccard(sequence_a: &str, sequence_b: &str, k: usize, num_hashes: usize) -> f64 {
    if num_hashes == 0 {
        return 0.0;
    }

    let sig_a = get_min_hash_signature(sequence_a, k, num_hashes);
    let sig_b = get_min_hash_signature(sequence_b, k, num_hashes);

    // If either sequence had no valid k-mers, signatures will be all MAX; treat as zero similarity.
    let empty_sig_a = sig_a.iter().all(|&v| v == u32::MAX);
    let empty_sig_b = sig_b.iter().all(|&v| v == u32::MAX);
    if empty_sig_a || empty_sig_b {
        return 0.0;
    }

    let mut matches = 0;
    for i in 0..num_hashes {
        if sig_a[i] == sig_b[i] {
            matches += 1;
        }
    }

    matches as f64 / num_hashes as f64
}

fn get_min_hash_signature(seq: &str, k: usize, num_hashes: usize) -> Vec<u32> {
    let mut signature = vec![u32::MAX; num_hashes];
    let seq_bytes = seq.as_bytes(); // Optimization: use bytes

    if seq.len() < k || num_hashes == 0 {
        return signature;
    }

    for i in 0..=(seq.len() - k) {
        let window = &seq_bytes[i..i+k];

        // Check for N
        if window.iter().any(|&b| b == b'N' || b == b'n') {
            continue;
        }

        // We need a string for consistent hashing with JS implementation or just consistent logic
        // JS uses: hash(kmer, h * 0x9e3779b9)
        // Let's implement the same FNV-1a inspired hash from JS code

        // JS hash function logic:
        // h = seed;
        // for char code: h ^= code, h = imul(h, 0x01000193)
        // return h >>> 0

        // We can replicate this.
        // window is &[u8].
        // We need to handle case insensitivity (uppercase).

        for h_idx in 0..num_hashes {
            let seed = (h_idx as u32).wrapping_mul(0x9e3779b9);
            let mut h = seed;

            for &byte in window {
                // To uppercase: 'a'..='z' -> -32
                let b = if byte >= b'a' && byte <= b'z' {
                    byte - 32
                } else {
                    byte
                };

                h ^= b as u32;
                h = h.wrapping_mul(0x01000193);
            }

            if h < signature[h_idx] {
                signature[h_idx] = h;
            }
        }
    }
    signature
}

// ============================================================================
// PCA (Principal Component Analysis) via Power Iteration
// Optimized matrix operations for high-dimensional genomic data
// ============================================================================

/// Result of PCA computation
#[wasm_bindgen]
pub struct PCAResult {
    /// Flattened eigenvectors (n_components * n_features), row-major
    eigenvectors: Vec<f64>,
    /// Eigenvalues for each component
    eigenvalues: Vec<f64>,
    /// Number of components computed
    n_components: usize,
    /// Number of features (dimensions)
    n_features: usize,
}

#[wasm_bindgen]
impl PCAResult {
    /// Get eigenvectors as flat array (row-major: [pc1_feat1, pc1_feat2, ..., pc2_feat1, ...])
    #[wasm_bindgen(getter)]
    pub fn eigenvectors(&self) -> Vec<f64> {
        self.eigenvectors.clone()
    }

    /// Get eigenvalues
    #[wasm_bindgen(getter)]
    pub fn eigenvalues(&self) -> Vec<f64> {
        self.eigenvalues.clone()
    }

    /// Number of components
    #[wasm_bindgen(getter)]
    pub fn n_components(&self) -> usize {
        self.n_components
    }

    /// Number of features
    #[wasm_bindgen(getter)]
    pub fn n_features(&self) -> usize {
        self.n_features
    }
}

/// Compute PCA using power iteration method.
///
/// # Arguments
/// * `data` - Flattened row-major matrix (n_samples * n_features)
/// * `n_samples` - Number of samples (rows)
/// * `n_features` - Number of features (columns)
/// * `n_components` - Number of principal components to extract
/// * `max_iterations` - Maximum iterations for power iteration (default: 100)
/// * `tolerance` - Convergence tolerance (default: 1e-8)
///
/// # Returns
/// PCAResult containing eigenvectors and eigenvalues.
///
/// # Algorithm
/// Uses power iteration to find top eigenvectors of X^T * X without forming
/// the full covariance matrix. This is memory-efficient for high-dimensional
/// data (e.g., k-mer frequencies with 4^k features).
#[wasm_bindgen]
pub fn pca_power_iteration(
    data: &[f64],
    n_samples: usize,
    n_features: usize,
    n_components: usize,
    max_iterations: usize,
    tolerance: f64,
) -> PCAResult {
    if data.len() != n_samples * n_features || n_samples == 0 || n_features == 0 {
        return PCAResult {
            eigenvectors: Vec::new(),
            eigenvalues: Vec::new(),
            n_components: 0,
            n_features,
        };
    }

    let max_iter = if max_iterations == 0 { 100 } else { max_iterations };
    let tol = if tolerance <= 0.0 { 1e-8 } else { tolerance };
    let n_comp = n_components.min(n_samples).min(n_features);

    // Compute mean for each feature
    let mut mean = vec![0.0; n_features];
    for i in 0..n_samples {
        let row_start = i * n_features;
        for j in 0..n_features {
            mean[j] += data[row_start + j];
        }
    }
    for j in 0..n_features {
        mean[j] /= n_samples as f64;
    }

    // Center the data (create centered copy)
    let mut centered = vec![0.0; n_samples * n_features];
    for i in 0..n_samples {
        let row_start = i * n_features;
        for j in 0..n_features {
            centered[row_start + j] = data[row_start + j] - mean[j];
        }
    }

    // Find principal components
    let mut eigenvectors = Vec::with_capacity(n_comp * n_features);
    let mut eigenvalues = Vec::with_capacity(n_comp);
    let mut previous_components: Vec<Vec<f64>> = Vec::new();

    for _ in 0..n_comp {
        let (eigenvector, eigenvalue) = power_iteration_single(
            &centered,
            n_samples,
            n_features,
            &previous_components,
            max_iter,
            tol,
        );

        eigenvectors.extend(&eigenvector);
        eigenvalues.push(eigenvalue);
        previous_components.push(eigenvector);
    }

    PCAResult {
        eigenvectors,
        eigenvalues,
        n_components: n_comp,
        n_features,
    }
}

/// Single power iteration to find one eigenvector
fn power_iteration_single(
    centered: &[f64],
    n_samples: usize,
    n_features: usize,
    previous_components: &[Vec<f64>],
    max_iterations: usize,
    tolerance: f64,
) -> (Vec<f64>, f64) {
    // Initialize with pseudo-random vector (deterministic for reproducibility)
    let mut v: Vec<f64> = (0..n_features)
        .map(|i| ((i * 7919 + 104729) % 1000) as f64 / 1000.0 - 0.5)
        .collect();

    // Remove projections onto previous components
    for pc in previous_components {
        deflate_vec(&mut v, pc);
    }
    normalize_vec(&mut v);

    let mut eigenvalue = 0.0;

    for _ in 0..max_iterations {
        // Compute X^T * X * v = X^T * (X * v)
        // First: Xv = X * v (n_samples x 1)
        let xv = multiply_xv(centered, &v, n_samples, n_features);

        // Then: X^T * Xv (n_features x 1)
        let mut xtxv = multiply_xt_u(centered, &xv, n_samples, n_features);

        // Remove projections onto previous components
        for pc in previous_components {
            deflate_vec(&mut xtxv, pc);
        }

        // Compute eigenvalue (Rayleigh quotient)
        let new_eigenvalue = dot_product_vec(&v, &xtxv);

        // Normalize to get new eigenvector estimate
        normalize_vec(&mut xtxv);

        // Check convergence
        let diff: f64 = v.iter().zip(xtxv.iter()).map(|(a, b)| (a - b).abs()).sum();

        v = xtxv;
        eigenvalue = new_eigenvalue;

        if diff < tolerance {
            break;
        }
    }

    // Scale eigenvalue by (n_samples - 1) for sample covariance
    let scaled_eigenvalue = if n_samples > 1 {
        eigenvalue / (n_samples - 1) as f64
    } else {
        eigenvalue
    };

    (v, scaled_eigenvalue)
}

/// Multiply X (row-major, n x d) by vector v (d x 1), returns (n x 1)
fn multiply_xv(x: &[f64], v: &[f64], n_samples: usize, n_features: usize) -> Vec<f64> {
    let mut result = vec![0.0; n_samples];
    for i in 0..n_samples {
        let row_start = i * n_features;
        let mut sum = 0.0;
        for j in 0..n_features {
            sum += x[row_start + j] * v[j];
        }
        result[i] = sum;
    }
    result
}

/// Multiply X^T (d x n) by vector u (n x 1), returns (d x 1)
fn multiply_xt_u(x: &[f64], u: &[f64], n_samples: usize, n_features: usize) -> Vec<f64> {
    let mut result = vec![0.0; n_features];
    for i in 0..n_samples {
        let row_start = i * n_features;
        let ui = u[i];
        for j in 0..n_features {
            result[j] += x[row_start + j] * ui;
        }
    }
    result
}

/// Remove projection of v onto u: v = v - (v·u) * u
fn deflate_vec(v: &mut [f64], u: &[f64]) {
    let proj = dot_product_vec(v, u);
    for i in 0..v.len() {
        v[i] -= proj * u[i];
    }
}

/// Normalize vector in place to unit length
fn normalize_vec(v: &mut [f64]) {
    let norm: f64 = v.iter().map(|x| x * x).sum::<f64>().sqrt();
    if norm > 0.0 {
        for x in v.iter_mut() {
            *x /= norm;
        }
    }
}

/// Dot product of two vectors
fn dot_product_vec(a: &[f64], b: &[f64]) -> f64 {
    a.iter().zip(b.iter()).map(|(x, y)| x * y).sum()
}

// ============================================================================
// Hoeffding's D - Measures statistical dependence between two vectors
// Based on: https://github.com/Dicklesworthstone/fast_vector_similarity
// ============================================================================

/// Compute average ranks for a vector, handling ties correctly.
/// Returns a vector of ranks where ties receive the average of their positions.
fn average_rank(data: &[f64]) -> Vec<f64> {
    let n = data.len();
    if n == 0 {
        return Vec::new();
    }

    // Create index-value pairs and sort by value
    let mut indexed: Vec<(usize, f64)> = data.iter().cloned().enumerate().collect();
    indexed.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal));

    let mut ranks = vec![0.0; n];
    let mut i = 0;

    while i < n {
        // Find all elements with the same value (ties)
        let mut j = i;
        let mut total_rank = 0.0;

        while j < n && indexed[j].1 == indexed[i].1 {
            total_rank += (j + 1) as f64; // Ranks are 1-based
            j += 1;
        }

        // Assign average rank to all tied elements
        let avg_rank = total_rank / (j - i) as f64;
        for k in i..j {
            ranks[indexed[k].0] = avg_rank;
        }

        i = j;
    }

    ranks
}

/// Result of Hoeffding's D computation
#[wasm_bindgen]
pub struct HoeffdingResult {
    /// Hoeffding's D statistic. Range: approximately [-0.5, 1]
    /// Values near 0 indicate independence, larger values indicate dependence.
    /// Unlike correlation, captures non-linear relationships.
    pub d: f64,
    /// Number of observations used
    pub n: usize,
}

/// Compute Hoeffding's D statistic for measuring statistical dependence.
///
/// Hoeffding's D is a non-parametric measure of association that can detect
/// any type of dependence (linear or non-linear) between two variables.
/// Unlike Pearson correlation (linear only) or Spearman/Kendall (monotonic),
/// Hoeffding's D can detect complex non-monotonic relationships.
///
/// # Arguments
/// * `x` - First vector of observations (as a JS Float64Array)
/// * `y` - Second vector of observations (must have same length as x)
///
/// # Returns
/// HoeffdingResult containing the D statistic and sample size.
/// D ranges approximately from -0.5 to 1, where:
/// - D ≈ 0: variables are independent
/// - D > 0: variables are dependent
/// - D = 1: perfect dependence
///
/// # Performance
/// O(n²) time complexity. For very large vectors (n > 10000), consider
/// sampling or using approximate methods.
///
/// # Example Use Cases for Genome Analysis
/// - Compare k-mer frequency vectors between genomes
/// - Detect non-linear relationships in GC content distributions
/// - Measure codon usage similarity accounting for complex dependencies
#[wasm_bindgen]
pub fn hoeffdings_d(x: &[f64], y: &[f64]) -> HoeffdingResult {
    let n = x.len();

    // Handle edge cases
    if n != y.len() || n < 5 {
        return HoeffdingResult { d: 0.0, n };
    }

    let nf = n as f64;

    // Compute ranks (1-based, with ties handled via average)
    let r = average_rank(x);
    let s = average_rank(y);

    // Compute Q values for each observation
    // Q[i] = 1 + (number of points with both x and y less than point i)
    //        + 0.25 * (number of points with both x and y equal to point i, excluding i itself)
    //        + 0.5 * (number of points with x equal and y less, plus x less and y equal)
    let mut q = vec![0.0; n];

    for i in 0..n {
        let ri = r[i];
        let si = s[i];

        let mut less_than = 0.0;
        let mut equal_both = 0.0;
        let mut equal_r = 0.0;
        let mut equal_s = 0.0;

        for j in 0..n {
            if i == j {
                continue;
            }

            let rj = r[j];
            let sj = s[j];

            if rj < ri && sj < si {
                less_than += 1.0;
            } else if rj == ri && sj == si {
                equal_both += 1.0;
            } else if rj == ri && sj < si {
                equal_r += 1.0;
            } else if rj < ri && sj == si {
                equal_s += 1.0;
            }
        }

        q[i] = 1.0 + less_than + 0.25 * equal_both + 0.5 * (equal_r + equal_s);
    }

    // Compute the three D terms
    // D1 = sum of (Q[i] - 1) * (Q[i] - 3)
    // Note: This is (Q-1) * ((Q-1) - 2), matching the standard Hoeffding's D formula
    let d1: f64 = q.iter().map(|&qi| (qi - 1.0) * (qi - 3.0)).sum();

    // D2 = sum of (R[i] - 1) * (R[i] - 2) * (S[i] - 1) * (S[i] - 2)
    let d2: f64 = r.iter()
        .zip(s.iter())
        .map(|(&ri, &si)| (ri - 1.0) * (ri - 2.0) * (si - 1.0) * (si - 2.0))
        .sum();

    // D3 = sum of (R[i] - 1) * (S[i] - 1) * (Q[i] - 1)
    let d3: f64 = r.iter()
        .zip(s.iter())
        .zip(q.iter())
        .map(|((&ri, &si), &qi)| (ri - 1.0) * (si - 1.0) * (qi - 1.0))
        .sum();

    // Hoeffding's D formula
    // D = 30 * ((n-2)(n-3) * D1 + D2 - 2(n-2) * D3) / (n(n-1)(n-2)(n-3)(n-4))
    let denom = nf * (nf - 1.0) * (nf - 2.0) * (nf - 3.0) * (nf - 4.0);
    let numerator = 30.0 * ((nf - 2.0) * (nf - 3.0) * d1 + d2 - 2.0 * (nf - 2.0) * d3);

    let d = if denom.abs() > 1e-10 {
        numerator / denom
    } else {
        0.0
    };

    HoeffdingResult { d, n }
}

/// Compute Hoeffding's D between two k-mer frequency vectors derived from sequences.
///
/// This is a convenience function that:
/// 1. Extracts k-mer frequencies from both sequences
/// 2. Creates aligned frequency vectors for all unique k-mers
/// 3. Computes Hoeffding's D on the frequency vectors
///
/// # Arguments
/// * `sequence_a` - First DNA sequence
/// * `sequence_b` - Second DNA sequence
/// * `k` - K-mer size (typically 3-7 for genome comparison)
///
/// # Returns
/// Hoeffding's D statistic measuring dependence between k-mer frequency profiles.
/// Higher values indicate more similar frequency patterns (non-linear similarity).
#[wasm_bindgen]
pub fn kmer_hoeffdings_d(sequence_a: &str, sequence_b: &str, k: usize) -> HoeffdingResult {
    if k == 0 {
        return HoeffdingResult { d: 0.0, n: 0 };
    }

    let freqs_a = extract_kmer_freqs(sequence_a, k);
    let freqs_b = extract_kmer_freqs(sequence_b, k);

    if freqs_a.is_empty() && freqs_b.is_empty() {
        return HoeffdingResult { d: 1.0, n: 0 }; // Both empty = perfect agreement
    }

    // Build aligned vectors: include all k-mers from both sequences
    let mut all_kmers: Vec<&String> = freqs_a.keys().chain(freqs_b.keys()).collect();
    all_kmers.sort();
    all_kmers.dedup();

    let n = all_kmers.len();
    if n < 5 {
        // Not enough data points for meaningful Hoeffding's D
        return HoeffdingResult { d: 0.0, n };
    }

    let x: Vec<f64> = all_kmers.iter()
        .map(|kmer| *freqs_a.get(*kmer).unwrap_or(&0) as f64)
        .collect();
    let y: Vec<f64> = all_kmers.iter()
        .map(|kmer| *freqs_b.get(*kmer).unwrap_or(&0) as f64)
        .collect();

    hoeffdings_d(&x, &y)
}

// ============================================================================
// Entropy Functions - Information-theoretic sequence analysis
// ============================================================================

/// Compute Shannon entropy from a probability distribution.
///
/// H(X) = -Σ p(x) * log2(p(x))
///
/// # Arguments
/// * `probs` - Probability distribution (must sum to ~1.0)
///
/// # Returns
/// Shannon entropy in bits. Returns 0 for empty or invalid input.
#[wasm_bindgen]
pub fn shannon_entropy(probs: &[f64]) -> f64 {
    if probs.is_empty() {
        return 0.0;
    }

    let mut entropy = 0.0;
    for &p in probs {
        if p > 0.0 && p <= 1.0 {
            entropy -= p * p.log2();
        }
    }

    // Clamp to non-negative (numerical precision issues can make it slightly negative)
    entropy.max(0.0)
}

/// Compute Shannon entropy from a frequency count array.
/// Converts counts to probabilities internally.
///
/// # Arguments
/// * `counts` - Array of frequency counts
///
/// # Returns
/// Shannon entropy in bits.
#[wasm_bindgen]
pub fn shannon_entropy_from_counts(counts: &[f64]) -> f64 {
    let total: f64 = counts.iter().sum();
    if total <= 0.0 {
        return 0.0;
    }

    let mut entropy = 0.0;
    for &count in counts {
        if count > 0.0 {
            let p = count / total;
            entropy -= p * p.log2();
        }
    }

    entropy.max(0.0)
}

/// Compute Jensen-Shannon Divergence between two probability distributions.
///
/// JSD(P || Q) = 0.5 * KL(P || M) + 0.5 * KL(Q || M)
/// where M = 0.5 * (P + Q)
///
/// This is a symmetric and bounded (0 to 1 when using log2) divergence measure.
///
/// # Arguments
/// * `p` - First probability distribution
/// * `q` - Second probability distribution (must have same length as p)
///
/// # Returns
/// JSD value in range [0, 1]. Returns 0 if inputs are identical, 1 if completely different.
#[wasm_bindgen]
pub fn jensen_shannon_divergence(p: &[f64], q: &[f64]) -> f64 {
    if p.len() != q.len() || p.is_empty() {
        return 0.0;
    }

    let n = p.len();
    let mut jsd = 0.0;

    for i in 0..n {
        let pi = p[i].max(0.0);
        let qi = q[i].max(0.0);
        let mi = 0.5 * (pi + qi);

        if mi > 0.0 {
            if pi > 0.0 {
                jsd += 0.5 * pi * (pi / mi).log2();
            }
            if qi > 0.0 {
                jsd += 0.5 * qi * (qi / mi).log2();
            }
        }
    }

    // Clamp to valid range [0, 1]
    jsd.max(0.0).min(1.0)
}

/// Compute JSD between two count arrays.
/// Normalizes to probabilities internally.
#[wasm_bindgen]
pub fn jensen_shannon_divergence_from_counts(counts_a: &[f64], counts_b: &[f64]) -> f64 {
    if counts_a.len() != counts_b.len() || counts_a.is_empty() {
        return 0.0;
    }

    let total_a: f64 = counts_a.iter().sum();
    let total_b: f64 = counts_b.iter().sum();

    if total_a <= 0.0 || total_b <= 0.0 {
        return if total_a <= 0.0 && total_b <= 0.0 { 0.0 } else { 1.0 };
    }

    let p: Vec<f64> = counts_a.iter().map(|&c| c / total_a).collect();
    let q: Vec<f64> = counts_b.iter().map(|&c| c / total_b).collect();

    jensen_shannon_divergence(&p, &q)
}

// ============================================================================
// Repeat Detection - Palindromes and Tandem Repeats
// ============================================================================

/// Result of repeat detection
#[wasm_bindgen]
pub struct RepeatResult {
    /// JSON-encoded array of detected repeats
    json: String,
}

#[wasm_bindgen]
impl RepeatResult {
    #[wasm_bindgen(getter)]
    pub fn json(&self) -> String {
        self.json.clone()
    }
}

/// Detect palindromic (inverted repeat) sequences in DNA.
///
/// A palindrome in DNA is a sequence that reads the same on the complementary
/// strand in reverse (e.g., GAATTC and its complement CTTAAG reversed).
///
/// # Arguments
/// * `seq` - DNA sequence string
/// * `min_len` - Minimum palindrome arm length (typically 4-6)
/// * `max_gap` - Maximum gap/spacer between palindrome arms (0 for perfect palindromes)
///
/// # Returns
/// RepeatResult with JSON array of {start, end, arm_length, gap, sequence}
#[wasm_bindgen]
pub fn detect_palindromes(seq: &str, min_len: usize, max_gap: usize) -> RepeatResult {
    let bytes = seq.as_bytes();
    let n = bytes.len();
    let mut results: Vec<String> = Vec::new();

    if n < min_len * 2 {
        return RepeatResult { json: "[]".to_string() };
    }

    // Check every potential center position
    for center in min_len..(n - min_len + 1) {
        for gap in 0..=max_gap {
            if center < min_len + gap / 2 || center + gap / 2 + min_len > n {
                continue;
            }

            let half_gap = gap / 2;
            let mut arm_len = 0;

            // Expand outward checking for complementary bases
            for offset in 0..min_len.max((n - center - half_gap).min(center - half_gap)) {
                let left_idx = center - half_gap - offset - 1;
                let right_idx = center + half_gap + offset;

                if right_idx >= n {
                    break;
                }

                let left_base = bytes[left_idx];
                let right_base = bytes[right_idx];

                if is_complement(left_base, right_base) {
                    arm_len = offset + 1;
                } else {
                    break;
                }
            }

            if arm_len >= min_len {
                let start = center - half_gap - arm_len;
                let end = center + half_gap + arm_len;
                let subseq = std::str::from_utf8(&bytes[start..end]).unwrap_or("");

                results.push(format!(
                    "{{\"start\":{},\"end\":{},\"arm_length\":{},\"gap\":{},\"sequence\":\"{}\"}}",
                    start, end, arm_len, gap, subseq
                ));
            }
        }
    }

    RepeatResult {
        json: format!("[{}]", results.join(",")),
    }
}

/// Check if two bases are complements
fn is_complement(a: u8, b: u8) -> bool {
    matches!(
        (a.to_ascii_uppercase(), b.to_ascii_uppercase()),
        (b'A', b'T') | (b'T', b'A') | (b'G', b'C') | (b'C', b'G') |
        (b'A', b'U') | (b'U', b'A')
    )
}

/// Detect tandem repeats (consecutive copies of a pattern).
///
/// # Arguments
/// * `seq` - DNA sequence string
/// * `min_unit` - Minimum repeat unit length
/// * `max_unit` - Maximum repeat unit length
/// * `min_copies` - Minimum number of consecutive copies
///
/// # Returns
/// RepeatResult with JSON array of {start, end, unit, copies, sequence}
#[wasm_bindgen]
pub fn detect_tandem_repeats(
    seq: &str,
    min_unit: usize,
    max_unit: usize,
    min_copies: usize,
) -> RepeatResult {
    let bytes = seq.as_bytes();
    let n = bytes.len();
    let mut results: Vec<String> = Vec::new();

    if n < min_unit * min_copies {
        return RepeatResult { json: "[]".to_string() };
    }

    // For each starting position
    for start in 0..n {
        // For each unit length
        for unit_len in min_unit..=max_unit.min(n - start) {
            let unit = &bytes[start..start + unit_len];

            // Count consecutive copies
            let mut copies = 1;
            let mut pos = start + unit_len;

            while pos + unit_len <= n {
                let candidate = &bytes[pos..pos + unit_len];
                if candidate.eq_ignore_ascii_case(unit) {
                    copies += 1;
                    pos += unit_len;
                } else {
                    break;
                }
            }

            if copies >= min_copies {
                let end = start + copies * unit_len;
                let unit_str = std::str::from_utf8(unit).unwrap_or("").to_uppercase();
                let subseq = std::str::from_utf8(&bytes[start..end]).unwrap_or("");

                results.push(format!(
                    "{{\"start\":{},\"end\":{},\"unit\":\"{}\",\"copies\":{},\"sequence\":\"{}\"}}",
                    start, end, unit_str, copies, subseq
                ));
            }
        }
    }

    RepeatResult {
        json: format!("[{}]", results.join(",")),
    }
}

// ============================================================================
// GC Skew and Sequence Complexity
// ============================================================================

/// Compute GC skew using a sliding window.
///
/// GC skew = (G - C) / (G + C)
///
/// GC skew is used to identify the origin and terminus of replication in
/// bacterial genomes. Positive skew indicates leading strand, negative
/// indicates lagging strand.
///
/// # Arguments
/// * `seq` - DNA sequence string
/// * `window_size` - Size of sliding window
/// * `step_size` - Step between windows (1 for maximum resolution)
///
/// # Returns
/// Array of GC skew values for each window position.
#[wasm_bindgen]
pub fn compute_gc_skew(seq: &str, window_size: usize, step_size: usize) -> Vec<f64> {
    let bytes = seq.as_bytes();
    let n = bytes.len();

    if window_size == 0 || step_size == 0 || n < window_size {
        return Vec::new();
    }

    let num_windows = (n - window_size) / step_size + 1;
    let mut results = Vec::with_capacity(num_windows);

    for i in 0..num_windows {
        let start = i * step_size;
        let window = &bytes[start..start + window_size];

        let mut g_count = 0u32;
        let mut c_count = 0u32;

        for &base in window {
            match base {
                b'G' | b'g' => g_count += 1,
                b'C' | b'c' => c_count += 1,
                _ => {}
            }
        }

        let total = g_count + c_count;
        let skew = if total > 0 {
            (g_count as f64 - c_count as f64) / total as f64
        } else {
            0.0
        };

        results.push(skew);
    }

    results
}

/// Compute cumulative GC skew (useful for visualizing replication origin).
///
/// The cumulative skew will have a minimum at the origin of replication
/// and maximum at the terminus.
#[wasm_bindgen]
pub fn compute_cumulative_gc_skew(seq: &str) -> Vec<f64> {
    let bytes = seq.as_bytes();
    let mut cumulative = Vec::with_capacity(bytes.len());
    let mut sum = 0.0;

    for &base in bytes {
        match base {
            b'G' | b'g' => sum += 1.0,
            b'C' | b'c' => sum -= 1.0,
            _ => {}
        }
        cumulative.push(sum);
    }

    cumulative
}

/// Compute linguistic complexity of a sequence.
///
/// Linguistic complexity = (number of distinct substrings) / (maximum possible substrings)
///
/// This measures how "random" or information-rich a sequence is.
/// Low complexity indicates repetitive regions.
///
/// # Arguments
/// * `seq` - DNA sequence string
/// * `max_k` - Maximum substring length to consider
///
/// # Returns
/// Complexity score in range [0, 1] where 1 = maximum complexity.
#[wasm_bindgen]
pub fn compute_linguistic_complexity(seq: &str, max_k: usize) -> f64 {
    let bytes = seq.as_bytes();
    let n = bytes.len();

    if n == 0 || max_k == 0 {
        return 0.0;
    }

    let max_k = max_k.min(n);
    let mut total_distinct = 0u64;
    let mut total_possible = 0u64;

    for k in 1..=max_k {
        let mut seen: std::collections::HashSet<&[u8]> = std::collections::HashSet::new();

        for i in 0..=n.saturating_sub(k) {
            seen.insert(&bytes[i..i + k]);
        }

        total_distinct += seen.len() as u64;

        // Maximum possible distinct k-mers is min(4^k, n-k+1) for DNA
        let max_possible = (4u64.pow(k as u32)).min((n - k + 1) as u64);
        total_possible += max_possible;
    }

    if total_possible == 0 {
        0.0
    } else {
        total_distinct as f64 / total_possible as f64
    }
}

/// Compute local complexity in sliding windows.
///
/// # Arguments
/// * `seq` - DNA sequence string
/// * `window_size` - Size of sliding window
/// * `step_size` - Step between windows
/// * `k` - K-mer size for complexity calculation
///
/// # Returns
/// Array of complexity values for each window.
#[wasm_bindgen]
pub fn compute_windowed_complexity(
    seq: &str,
    window_size: usize,
    step_size: usize,
    k: usize,
) -> Vec<f64> {
    let bytes = seq.as_bytes();
    let n = bytes.len();

    if window_size == 0 || step_size == 0 || k == 0 || n < window_size || k > window_size {
        return Vec::new();
    }

    let num_windows = (n - window_size) / step_size + 1;
    let mut results = Vec::with_capacity(num_windows);

    for i in 0..num_windows {
        let start = i * step_size;
        let window = &bytes[start..start + window_size];

        // Count distinct k-mers in this window
        let mut seen: std::collections::HashSet<&[u8]> = std::collections::HashSet::new();
        for j in 0..=window.len().saturating_sub(k) {
            seen.insert(&window[j..j + k]);
        }

        let distinct = seen.len() as f64;
        let max_possible = (4u64.pow(k as u32) as f64).min((window.len() - k + 1) as f64);

        let complexity = if max_possible > 0.0 {
            distinct / max_possible
        } else {
            0.0
        };

        results.push(complexity);
    }

    results
}

// ============================================================================
// Grid Building - HOT PATH for viewport rendering
// ============================================================================

/// Result of grid building for sequence viewport
#[wasm_bindgen]
pub struct GridResult {
    /// JSON-encoded grid data
    json: String,
}

#[wasm_bindgen]
impl GridResult {
    #[wasm_bindgen(getter)]
    pub fn json(&self) -> String {
        self.json.clone()
    }
}

/// Build a grid of sequence data for viewport rendering.
///
/// This is the HOT PATH called on every scroll. Optimized for minimal
/// allocations and fast character processing.
///
/// # Arguments
/// * `seq` - Full sequence string
/// * `start_index` - Starting position in sequence (0-based)
/// * `cols` - Number of columns in grid
/// * `rows` - Number of rows in grid
/// * `mode` - Display mode: "dna", "aa", or "dual"
/// * `frame` - Reading frame for AA translation (0, 1, or 2)
///
/// # Returns
/// GridResult with JSON-encoded rows, each containing:
/// - cells: array of {char, phase, is_stop, is_start} for DNA mode
/// - cells: array of {char, codon, is_stop, is_start} for AA mode
#[wasm_bindgen]
pub fn build_grid(
    seq: &str,
    start_index: usize,
    cols: usize,
    rows: usize,
    mode: &str,
    frame: i8,
) -> GridResult {
    let bytes = seq.as_bytes();
    let n = bytes.len();

    if cols == 0 || rows == 0 || start_index >= n {
        return GridResult { json: "[]".to_string() };
    }

    let frame = frame.rem_euclid(3) as usize;
    let mode_is_aa = mode == "aa";
    let _mode_is_dual = mode == "dual"; // Reserved for future dual-view support

    let mut result_rows: Vec<String> = Vec::with_capacity(rows);

    for row in 0..rows {
        let row_start = start_index + row * cols;
        if row_start >= n {
            break;
        }

        let row_end = (row_start + cols).min(n);
        let mut cells: Vec<String> = Vec::with_capacity(cols);

        if mode_is_aa {
            // Amino acid mode: translate codons
            let mut i = row_start;
            // Adjust to codon boundary
            let offset = (i as i64 - frame as i64).rem_euclid(3) as usize;
            if offset != 0 {
                i += 3 - offset;
            }

            while i + 3 <= row_end && i + 3 <= n {
                let aa = codon_to_aa(bytes[i], bytes[i + 1], bytes[i + 2]);
                let codon: String = bytes[i..i + 3]
                    .iter()
                    .map(|&b| (b as char).to_ascii_uppercase())
                    .collect();

                let is_stop = aa == b'*';
                let is_start = aa == b'M';

                cells.push(format!(
                    "{{\"char\":\"{}\",\"codon\":\"{}\",\"pos\":{},\"is_stop\":{},\"is_start\":{}}}",
                    aa as char, codon, i, is_stop, is_start
                ));

                i += 3;
            }
        } else {
            // DNA mode (or dual)
            for i in row_start..row_end {
                let base = bytes[i];
                let char_upper = (base as char).to_ascii_uppercase();

                // Calculate codon phase (position within codon)
                let phase = ((i as i64 - frame as i64).rem_euclid(3)) as u8;

                // Check if this position starts a stop or start codon
                let (is_stop, is_start) = if phase == 0 && i + 3 <= n {
                    let aa = codon_to_aa(bytes[i], bytes[i + 1], bytes[i + 2]);
                    (aa == b'*', aa == b'M')
                } else {
                    (false, false)
                };

                cells.push(format!(
                    "{{\"char\":\"{}\",\"pos\":{},\"phase\":{},\"is_stop\":{},\"is_start\":{}}}",
                    char_upper, i, phase, is_stop, is_start
                ));
            }
        }

        let row_json = format!(
            "{{\"row\":{},\"start\":{},\"end\":{},\"cells\":[{}]}}",
            row,
            row_start,
            row_end,
            cells.join(",")
        );
        result_rows.push(row_json);
    }

    GridResult {
        json: format!("[{}]", result_rows.join(",")),
    }
}
