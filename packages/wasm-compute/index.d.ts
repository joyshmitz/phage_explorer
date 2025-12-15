declare module '@phage/wasm-compute' {
  /**
   * Initialize the WASM module with the compiled binary.
   */
  export default function init(buffer?: ArrayBuffer | Uint8Array): Promise<void>;

  /**
   * Compute Levenshtein distance using the Rust/WASM implementation.
   */
  export function levenshtein_distance(a: string, b: string): number;

  // ============================================================================
  // Core Genetics Functions - HOT PATH optimizations
  // ============================================================================

  /**
   * Translate DNA sequence to amino acid sequence.
   *
   * @param seq - DNA sequence string
   * @param frame - Reading frame (0, 1, or 2)
   * @returns Amino acid sequence. Unknown codons (containing N) become 'X'.
   */
  export function translate_sequence(seq: string, frame: number): string;

  /**
   * Compute reverse complement of DNA sequence.
   *
   * Handles all IUPAC ambiguity codes correctly:
   * - Standard: A<->T, G<->C
   * - Ambiguity: R<->Y, K<->M, S<->S, W<->W, B<->V, D<->H, N<->N
   *
   * @param seq - DNA sequence string
   * @returns Reverse complement sequence (preserving case).
   */
  export function reverse_complement(seq: string): string;

  /**
   * Calculate GC content percentage.
   *
   * Only counts unambiguous A, T, G, C bases. N and other ambiguity codes
   * are excluded from both numerator and denominator.
   *
   * @param seq - DNA sequence string
   * @returns GC content as percentage (0-100). Returns 0 if no valid bases.
   */
  export function calculate_gc_content(seq: string): number;

  /**
   * Result of codon usage analysis.
   */
  export class CodonUsageResult {
    free(): void;
    /** Get the codon counts as a JSON string. */
    readonly json: string;
  }

  /**
   * Count codon usage in a DNA sequence.
   *
   * @param seq - DNA sequence string
   * @param frame - Reading frame (0, 1, or 2)
   * @returns CodonUsageResult with JSON-encoded codon counts.
   */
  export function count_codon_usage(seq: string, frame: number): CodonUsageResult;

  /**
   * Result of k-mer analysis between two sequences.
   */
  export class KmerAnalysisResult {
    free(): void;
    readonly k: number;
    readonly unique_kmers_a: number;
    readonly unique_kmers_b: number;
    readonly shared_kmers: number;
    readonly jaccard_index: number;
    readonly containment_a_in_b: number;
    readonly containment_b_in_a: number;
    readonly cosine_similarity: number;
    readonly bray_curtis_dissimilarity: number;
  }

  /**
   * Perform k-mer analysis between two sequences.
   * Returns metrics including Jaccard index, containment, cosine similarity, etc.
   */
  export function analyze_kmers(
    sequence_a: string,
    sequence_b: string,
    k: number
  ): KmerAnalysisResult;

  /**
   * Estimate Jaccard similarity using MinHash algorithm.
   * Much faster than exact computation for large sequences.
   */
  export function min_hash_jaccard(
    sequence_a: string,
    sequence_b: string,
    k: number,
    num_hashes: number
  ): number;

  /**
   * 3D Model for ASCII rendering.
   */
  export class Model3D {
    constructor(vertices: Float64Array, edges: Uint32Array);
    free(): void;
  }

  /**
   * Render a 3D model to ASCII art.
   */
  export function render_ascii_model(
    model: Model3D,
    rx: number,
    ry: number,
    rz: number,
    width: number,
    height: number,
    quality: string
  ): string;

  /**
   * Result of Hoeffding's D computation.
   */
  export class HoeffdingResult {
    free(): void;
    /** Hoeffding's D statistic. Range: approximately [-0.5, 1]. */
    readonly d: number;
    /** Number of observations used. */
    readonly n: number;
  }

  /**
   * Compute Hoeffding's D statistic for measuring statistical dependence.
   *
   * Hoeffding's D is a non-parametric measure of association that can detect
   * any type of dependence (linear or non-linear) between two variables.
   * Unlike Pearson correlation (linear only) or Spearman/Kendall (monotonic),
   * Hoeffding's D can detect complex non-monotonic relationships.
   *
   * @param x - First vector of observations (Float64Array)
   * @param y - Second vector of observations (must have same length as x)
   * @returns HoeffdingResult containing the D statistic and sample size.
   *
   * D ranges approximately from -0.5 to 1:
   * - D ≈ 0: variables are independent
   * - D > 0: variables are dependent
   * - D = 1: perfect dependence
   *
   * O(n²) time complexity. For large vectors (n > 10000), consider sampling.
   */
  export function hoeffdings_d(x: Float64Array, y: Float64Array): HoeffdingResult;

  // ============================================================================
  // PCA (Principal Component Analysis) via Power Iteration
  // ============================================================================

  /**
   * Result of PCA computation.
   */
  export class PCAResult {
    free(): void;
    /** Eigenvectors as flat array (row-major: [pc1_feat1, pc1_feat2, ..., pc2_feat1, ...]) */
    readonly eigenvectors: Float64Array;
    /** Eigenvalues for each component */
    readonly eigenvalues: Float64Array;
    /** Number of principal components */
    readonly n_components: number;
    /** Number of features (dimensions) */
    readonly n_features: number;
  }

  /**
   * Compute PCA using power iteration method.
   *
   * Uses power iteration to find top eigenvectors of X^T * X without forming
   * the full covariance matrix. Memory-efficient for high-dimensional data.
   *
   * @param data - Flattened row-major matrix (n_samples * n_features)
   * @param n_samples - Number of samples (rows)
   * @param n_features - Number of features (columns)
   * @param n_components - Number of principal components to extract
   * @param max_iterations - Maximum iterations (default: 100)
   * @param tolerance - Convergence tolerance (default: 1e-8)
   * @returns PCAResult containing eigenvectors and eigenvalues
   *
   * 10-50x faster than JS for large matrices.
   */
  export function pca_power_iteration(
    data: Float64Array,
    n_samples: number,
    n_features: number,
    n_components: number,
    max_iterations: number,
    tolerance: number
  ): PCAResult;

  /**
   * Compute Hoeffding's D between two k-mer frequency vectors derived from sequences.
   *
   * Convenience function that:
   * 1. Extracts k-mer frequencies from both sequences
   * 2. Creates aligned frequency vectors for all unique k-mers
   * 3. Computes Hoeffding's D on the frequency vectors
   *
   * @param sequence_a - First DNA sequence
   * @param sequence_b - Second DNA sequence
   * @param k - K-mer size (typically 3-7 for genome comparison)
   * @returns HoeffdingResult measuring dependence between k-mer frequency profiles.
   */
  export function kmer_hoeffdings_d(
    sequence_a: string,
    sequence_b: string,
    k: number
  ): HoeffdingResult;

  // ============================================================================
  // Entropy Functions - Information-theoretic sequence analysis
  // ============================================================================

  /**
   * Compute Shannon entropy from a probability distribution.
   * H(X) = -Σ p(x) * log2(p(x))
   *
   * @param probs - Probability distribution (must sum to ~1.0)
   * @returns Shannon entropy in bits. Returns 0 for empty or invalid input.
   */
  export function shannon_entropy(probs: Float64Array): number;

  /**
   * Compute Shannon entropy from a frequency count array.
   * Converts counts to probabilities internally.
   *
   * @param counts - Array of frequency counts
   * @returns Shannon entropy in bits.
   */
  export function shannon_entropy_from_counts(counts: Float64Array): number;

  /**
   * Compute Jensen-Shannon Divergence between two probability distributions.
   * JSD(P || Q) = 0.5 * KL(P || M) + 0.5 * KL(Q || M) where M = 0.5 * (P + Q)
   *
   * This is a symmetric and bounded (0 to 1 when using log2) divergence measure.
   *
   * @param p - First probability distribution
   * @param q - Second probability distribution (must have same length as p)
   * @returns JSD value in range [0, 1]. Returns 0 if inputs are identical.
   */
  export function jensen_shannon_divergence(p: Float64Array, q: Float64Array): number;

  /**
   * Compute JSD between two count arrays.
   * Normalizes to probabilities internally.
   */
  export function jensen_shannon_divergence_from_counts(
    counts_a: Float64Array,
    counts_b: Float64Array
  ): number;

  // ============================================================================
  // Repeat Detection - Palindromes and Tandem Repeats
  // ============================================================================

  /**
   * Result of repeat detection.
   */
  export class RepeatResult {
    free(): void;
    /** JSON-encoded array of detected repeats */
    readonly json: string;
  }

  /**
   * Detect palindromic (inverted repeat) sequences in DNA.
   *
   * A palindrome in DNA is a sequence that reads the same on the complementary
   * strand in reverse (e.g., GAATTC and its complement CTTAAG reversed).
   *
   * @param seq - DNA sequence string
   * @param min_len - Minimum palindrome arm length (typically 4-6)
   * @param max_gap - Maximum gap/spacer between palindrome arms (0 for perfect palindromes)
   * @returns RepeatResult with JSON array of {start, end, arm_length, gap, sequence}
   */
  export function detect_palindromes(
    seq: string,
    min_len: number,
    max_gap: number
  ): RepeatResult;

  /**
   * Detect tandem repeats (consecutive copies of a pattern).
   *
   * @param seq - DNA sequence string
   * @param min_unit - Minimum repeat unit length
   * @param max_unit - Maximum repeat unit length
   * @param min_copies - Minimum number of consecutive copies
   * @returns RepeatResult with JSON array of {start, end, unit, copies, sequence}
   */
  export function detect_tandem_repeats(
    seq: string,
    min_unit: number,
    max_unit: number,
    min_copies: number
  ): RepeatResult;

  // ============================================================================
  // GC Skew and Sequence Complexity
  // ============================================================================

  /**
   * Compute GC skew using a sliding window.
   * GC skew = (G - C) / (G + C)
   *
   * Used to identify the origin and terminus of replication in bacterial genomes.
   *
   * @param seq - DNA sequence string
   * @param window_size - Size of sliding window
   * @param step_size - Step between windows (1 for maximum resolution)
   * @returns Array of GC skew values for each window position.
   */
  export function compute_gc_skew(
    seq: string,
    window_size: number,
    step_size: number
  ): Float64Array;

  /**
   * Compute cumulative GC skew (useful for visualizing replication origin).
   * The cumulative skew will have a minimum at the origin of replication
   * and maximum at the terminus.
   */
  export function compute_cumulative_gc_skew(seq: string): Float64Array;

  /**
   * Compute linguistic complexity of a sequence.
   * Linguistic complexity = (number of distinct substrings) / (maximum possible substrings)
   *
   * This measures how "random" or information-rich a sequence is.
   * Low complexity indicates repetitive regions.
   *
   * @param seq - DNA sequence string
   * @param max_k - Maximum substring length to consider
   * @returns Complexity score in range [0, 1] where 1 = maximum complexity.
   */
  export function compute_linguistic_complexity(seq: string, max_k: number): number;

  /**
   * Compute local complexity in sliding windows.
   *
   * @param seq - DNA sequence string
   * @param window_size - Size of sliding window
   * @param step_size - Step between windows
   * @param k - K-mer size for complexity calculation
   * @returns Array of complexity values for each window.
   */
  export function compute_windowed_complexity(
    seq: string,
    window_size: number,
    step_size: number,
    k: number
  ): Float64Array;

  // ============================================================================
  // Grid Building - HOT PATH for viewport rendering
  // ============================================================================

  /**
   * Result of grid building for sequence viewport.
   */
  export class GridResult {
    free(): void;
    /** JSON-encoded grid data */
    readonly json: string;
  }

  /**
   * Build a grid of sequence data for viewport rendering.
   *
   * This is the HOT PATH called on every scroll. Optimized for minimal
   * allocations and fast character processing.
   *
   * @param seq - Full sequence string
   * @param start_index - Starting position in sequence (0-based)
   * @param cols - Number of columns in grid
   * @param rows - Number of rows in grid
   * @param mode - Display mode: "dna", "aa", or "dual"
   * @param frame - Reading frame for AA translation (0, 1, or 2)
   * @returns GridResult with JSON-encoded rows
   */
  export function build_grid(
    seq: string,
    start_index: number,
    cols: number,
    rows: number,
    mode: string,
    frame: number
  ): GridResult;
}
