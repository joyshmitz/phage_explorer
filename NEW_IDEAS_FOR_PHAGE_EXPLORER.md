# Big-Idea Roadmap for Phage Explorer

Ten implementation-ready, high-wattage upgrades that combine advanced math, statistics, and phage biology. Each entry lists how to build it, why it matters, novelty, teaching value, and TUI “wow”.

## 1) Pan-Phage Latent Space Atlas
- What: Learn a continuous manifold of phage genomes (sequence + gene-order graph) to expose evolutionary neighborhoods and modular swaps.
- How to build: Train a variational autoencoder with a dual encoder: (a) k‑mer CNN/Transformer over DNA; (b) gene-order graph encoded via Graph Attention Networks (PyTorch + torch-geometric). Export embeddings; optionally reimplement the forward pass in Rust and compile to WASM for on-device inference in Bun. Use UMAP for 2D projection; cache embeddings in SQLite.
- Why good/new: Moves beyond pairwise scores to global structure; reveals mosaicism and host jumps at a glance. Few phage TUIs offer latent-space navigation.
- Pedagogical value: Teaches manifold learning, modular evolution, and clustering in one picture.
- Wow/TUI: Interactive 2D scatterplot in the TUI with keyboard pan/zoom; hover to show phage card, draw trajectories when user selects multiple phages.

## 2) Recombination Hotspot Radar
- What: Detect mosaic ancestry along genomes and flag breakpoints with confidence.
- How to build: Fit a phylogenetic HMM that switches among donor clusters learned from the Atlas; emission = local Jaccard/ANI; transition priors encourage few switches. Implement core in Rust (ndarray + rayon), compile to WASM for speed; wrap in Bun. Visualize per-base posterior as a heat bar under the gene map.
- Why good/new: Brings genome painting (common in bacteria) to phages with lightweight computations.
- Pedagogical value: Demonstrates HMMs, posterior decoding, and recombination biology.
- Wow/TUI: Animated sweep that highlights segments changing color as the HMM “walks” the genome.

## 3) Structural Epitope Clash Map
- What: Predict host-receptor affinity shifts and antigenic changes on tail fibers/capsid.
- How to build: Fetch or predict structures (AlphaFold DB or ESMFold API offline cache). Run per-residue ΔΔG alanine scan (FoldX CLI or pydtmc surrogate) and APBS electrostatics. Precompute grids in a Rust worker; store residue scores. In TUI, map residues to gene coordinates; render per-residue risk ribbons; sync with ASCII 3D render (color vertices by risk).
- Why good/new: Bridges sequence to structure-function within a terminal; uncommon in phage tooling.
- Pedagogical value: Links mutational energy, surface charge, and tropism.
- Wow/TUI: Toggle “charge/affinity mode”; 3D ASCII model pulsates at high-risk residues.

## 4) Host Range Predictor via CRISPR/Spacer Matching
- What: Infer likely hosts by matching phage protospacers to CRISPR spacer catalogs and prophage hits.
- How to build: Ingest CRISPRCasdb/IMG spacers; store in a MinHash index (rust: tantivy + finch/xxhash). Fast lookup from Bun via WASM. Score hits with PAM context and seed matches; combine with prophage BLAST-lite (rust: needletail + simdutf8) against host genomes.
- Why good/new: Host prediction is high-impact; spacer/PAM-aware scoring is richer than plain ANI.
- Pedagogical value: Teaches CRISPR biology and locality-sensitive hashing.
- Wow/TUI: Ranked host list with evidence bars (spacer count, PAM quality, prophage hits); press enter to show exemplar spacers aligned to the genome slice.

## 5) Codon Economy & tRNA Adaptation Dashboard
- What: Quantify translation efficiency per gene vs host tRNA pool; surface codon-pair bias hotspots.
- How to build: Pull tRNA gene copy numbers from GtRNAdb; compute CAI, tAI, and codon-pair bias (CPB) per gene. Implement in TypeScript with numeric.js; heavy loops can be moved to Rust+WASM. Store per-gene metrics; recompute on host switch.
- Why good/new: Merges host-specific translational constraints with phage engineering hints.
- Pedagogical value: Shows how codon bias ties to host biology and expression tuning.
- Wow/TUI: Gene map heatmap (CAI/tAI colors); press `c` to see codon-pair “redlines” along the sequence grid.

## 6) Temporal Evolution Replay
- What: Animate how a phage lineage accumulated mutations across isolates/timepoints.
- How to build: If multiple isolates available, build a dated tree with BEAST-like skyline (fast approximation: LSD2 or treetime). Compute substitution rate, Ne skyline, and per-position mutation ticks. Precompute; stream frames to TUI.
- Why good/new: Time-aware visualization of evolution is rare in phage tools.
- Pedagogical value: Teaches molecular clocks and population dynamics.
- Wow/TUI: “Time scrubber” to watch mutations light up on the sequence grid and Ne curve scroll in a mini-plot.

## 7) Protein Domain Chord Plot
- What: Show how functional domains are shared and rearranged across phages.
- How to build: Run HMMER (hmmscan vs Pfam-A) on predicted proteins; cluster domains with Jaccard + MCL. Render a text-mode chord diagram: columns = phages, arcs = shared domains weighted by copy/synteny. ASCII arcs can be drawn with Braille/box drawing.
- Why good/new: Domain-level view of modularity in a TUI is novel.
- Pedagogical value: Highlights domain shuffling and convergent function.
- Wow/TUI: Interactive filter by domain family; arcs animate when selected.

## 8) Phage-Defense Arms Race Scanner
- What: Score each phage for anti-defense payloads vs host defenses.
- How to build: Curate HMM/motif sets for anti-CRISPRs, methyltransferases, RM evasion, Abi inhibitors, retron blockers. Run mmseqs2/HMMER offline; tag genes. Cross with host defense annotations (if host genome known). Compute a “offense vs defense” balance index.
- Why good/new: Gives actionable insight for therapy cocktail design; few tools summarize this in one view.
- Pedagogical value: Teaches arms-race ecology and defense landscapes.
- Wow/TUI: Two stacked bars: host defenses vs phage countermeasures; genes highlighted on the gene map by category color.

## 9) Phage Cocktail Compatibility Matrix
- What: Optimize sets of phages that do not interfere and cover hosts broadly.
- How to build: Build features per phage (receptor usage, superinfection exclusion genes, lysis timing, spacer overlap). Train a simple logistic model for interference; compute pairwise synergy scores. Solve a max-cover with incompatibility constraints via ILP (Rust + good_lp) or a greedy heuristic in TS for speed. Cache matrices.
- Why good/new: Moves from single-phage view to therapeutic design; rare in TUIs.
- Pedagogical value: Shows combinatorial optimization applied to biology.
- Wow/TUI: Heatmap matrix with tooltips; press `o` to see suggested minimal cocktail and rationale list.

## 10) RNA Structure & Packaging Signal Explorer
- What: Map RNA secondary-structure energy and packaging hairpins along genomes.
- How to build: For RNA phages or packaging motifs, run sliding RNAfold/CONTRAfold (ViennaRNA via CLI; wrap in Bun) to compute ΔG and motif class. Cache window energies; detect conserved stem-loops across phages with covariance scoring (Infernal cmsearch, prebuilt CMs). Align hits to gene map.
- Why good/new: Brings structural genomics into a fast TUI workflow.
- Pedagogical value: Connects folding thermodynamics, packaging, and regulation.
- Wow/TUI: Sparkline of ΔG under the sequence grid; highlight conserved hairpins with labels; toggle to see consensus structure in ASCII bracket notation.

## Integration Notes
- All heavy compute pieces slated for Rust+WASM where tight loops or HMMs are needed; lightweight stats stay in TypeScript/Bun.
- Precompute everything into SQLite side tables to keep the TUI snappy; lazy-load large artifacts (embeddings, structures) on demand.
- Keep visual layers optional so low-spec terminals remain responsive.

---

# Additional High-Impact Feature Proposals

The following ideas complement the existing roadmap with features not covered above, focusing on mathematical elegance, biological insight, and TUI visualization potential.

---

## 11) Cumulative GC Skew Replication Origin Detector

### Concept

Every genome leaves mathematical fingerprints of its replication process in nucleotide composition. During replication, leading and lagging strands experience different mutational pressures (C→T deamination bias), creating **strand asymmetry** that accumulates around the origin and terminus.

By computing the cumulative GC skew, we reveal:
- **Replication origin**: Global minimum of cumulative skew curve
- **Terminus**: Global maximum
- **Replication mode**: Theta (bidirectional) vs rolling circle (unidirectional)

The mathematics is elegant: a simple cumulative sum transforms noisy local composition into a beautiful sinusoidal curve where extrema correspond to biologically critical positions.

### Mathematical Foundations

**GC Skew in sliding window:**
```
skew[i] = (G_count - C_count) / (G_count + C_count)  for window at position i
```

**Cumulative skew:**
```
S[0] = 0
S[i] = S[i-1] + skew[i]

Origin = argmin(S)  // Global minimum
Terminus = argmax(S)  // Global maximum
```

**Z-curve representation (3D encoding):**
```
x_n = (A_n + G_n) - (C_n + T_n)  // Purine vs pyrimidine
y_n = (A_n + C_n) - (G_n + T_n)  // Amino vs keto
z_n = (A_n + T_n) - (G_n + C_n)  // Weak vs strong H-bonds

The cumulative Z-curve creates a 3D parametric curve encoding ALL compositional information.
```

**Optional Fourier analysis:**
```
FFT of skew signal reveals periodicity and multiple origins (unusual but possible in some phages).
```

### Implementation Approach

**Pure TypeScript** — no external dependencies:

```typescript
interface ReplicationAnalysis {
  gcSkew: Float64Array;
  cumulativeSkew: Float64Array;
  predictedOrigin: number;      // Position of global minimum
  predictedTerminus: number;    // Position of global maximum
  confidence: number;           // Signal strength
  zCurve?: { x: Float64Array; y: Float64Array; z: Float64Array };
}

function analyzeReplicationOrigin(
  sequence: string,
  windowSize: number = 1000,
  stepSize: number = 100
): ReplicationAnalysis {
  const n = Math.floor((sequence.length - windowSize) / stepSize) + 1;
  const gcSkew = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const start = i * stepSize;
    const window = sequence.slice(start, start + windowSize);
    const G = (window.match(/G/gi) || []).length;
    const C = (window.match(/C/gi) || []).length;
    gcSkew[i] = (G + C > 0) ? (G - C) / (G + C) : 0;
  }

  // Cumulative sum with extrema tracking
  const cumulativeSkew = new Float64Array(n);
  let sum = 0, minVal = Infinity, minIdx = 0, maxVal = -Infinity, maxIdx = 0;

  for (let i = 0; i < n; i++) {
    sum += gcSkew[i];
    cumulativeSkew[i] = sum;
    if (sum < minVal) { minVal = sum; minIdx = i; }
    if (sum > maxVal) { maxVal = sum; maxIdx = i; }
  }

  return {
    gcSkew, cumulativeSkew,
    predictedOrigin: minIdx * stepSize,
    predictedTerminus: maxIdx * stepSize,
    confidence: (maxVal - minVal) / Math.abs(sum / n + 0.001)
  };
}
```

**Z-curve for 3D visualization:**
```typescript
function computeZCurve(sequence: string): ZCurve3D {
  const x = new Float64Array(sequence.length);
  const y = new Float64Array(sequence.length);
  const z = new Float64Array(sequence.length);
  let xSum = 0, ySum = 0, zSum = 0;

  for (let i = 0; i < sequence.length; i++) {
    switch (sequence[i].toUpperCase()) {
      case 'A': xSum += 1; ySum += 1; zSum += 1; break;
      case 'G': xSum += 1; ySum -= 1; zSum -= 1; break;
      case 'C': xSum -= 1; ySum += 1; zSum -= 1; break;
      case 'T': xSum -= 1; ySum -= 1; zSum += 1; break;
    }
    x[i] = xSum; y[i] = ySum; z[i] = zSum;
  }
  return { x, y, z };
}
```

**Performance:** O(n) scan, trivial for phage genomes. Pure TypeScript is sufficient.

### Why This Is a Good Idea

1. **Fundamental biology**: Replication origin is THE most important genomic position
2. **Pure signal from sequence**: No annotation needed — math reveals biology
3. **Validation opportunity**: Compare prediction to annotated dnaA/rep genes
4. **Comparative value**: Compare replication strategies across phages (theta vs rolling circle)
5. **Cloning applications**: Know where to insert genes for optimal expression

### Innovation Assessment

**Novelty: MEDIUM**

GC skew analysis is a classic technique (Lobry 1996), and tools like Ori-Finder exist. However:
- No TUI genome browser includes this
- Interactive exploration with gene overlay is novel
- Z-curve 3D visualization in ASCII is unprecedented
- Comparative view across multiple phages is powerful

### Pedagogical Value: 9/10

Teaches:
- **Replication biology**: Why origins and termini exist
- **Mutational bias**: Why strands have different compositions
- **Mathematical biology**: Elegant sequence → function relationship
- **Signal processing**: Cumulative sums reveal hidden patterns

### Cool/Wow Factor: 8/10

The cumulative GC skew curve is inherently beautiful — a smooth sinusoid rising and falling as you traverse the genome. When the minimum aligns perfectly with the annotated origin, it's deeply satisfying.

### TUI Visualization

```
Cumulative GC Skew                    Origin    Terminus
                                         ↓         ↓
    +2.0 ┤                              ╭────────╮
    +1.5 ┤                           ╭──╯        ╰──╮
    +1.0 ┤                        ╭──╯              ╰──╮
    +0.5 ┤                     ╭──╯                    ╰──╮
     0.0 ┼─────────────────────╯                          ╰─────
    -0.5 ┤  ╭──╮            ╭──╯
    -1.0 ┤──╯  ╰────────────╯
         ╰─────────────────────────────────────────────────────
         0        10k       20k       30k       40k       48k

Genes: ──[dnaA]──────[recA]─────[rep]──────[cos]──────[att]──
           ↑                      ↑
       Origin confirmed       Terminus confirmed

Comparative view:
Lambda   ▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓  (39%)
T7       ░▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  (2%)
PhiX174  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓░  (rolling)
```

---

## 12) Selection Pressure Chromosome Painter (dN/dS Landscape)

### Concept

Evolution leaves fingerprints in mutation patterns. **Synonymous mutations** (change DNA but not protein) accumulate neutrally. **Non-synonymous mutations** (change protein) are filtered by selection:

- **ω (dN/dS) < 1**: Purifying selection — protein is essential, changes deleterious
- **ω ≈ 1**: Neutral evolution — no constraint
- **ω > 1**: Positive selection — adaptive evolution, arms race with host

By computing dN/dS across genes and along sliding windows, we create a **chromosome painting** showing evolutionary pressure: blue for essential (purifying), red for arms race (positive), gray for neutral.

### Mathematical Foundations

**Nei-Gojobori method for dN/dS:**
```
For aligned codon pair (codon_A, codon_B):
  1. Count synonymous sites (S) and non-synonymous sites (N)
  2. Count synonymous differences (Sd) and non-synonymous differences (Nd)

  pS = Sd / S  (proportion synonymous differences)
  pN = Nd / N  (proportion non-synonymous differences)

  // Jukes-Cantor correction for multiple hits
  dS = -0.75 × ln(1 - 4×pS/3)
  dN = -0.75 × ln(1 - 4×pN/3)

  ω = dN / dS
```

**Statistical significance (Z-test):**
```
Z = (dN - dS) / sqrt(Var(dN) + Var(dS))
P-value from standard normal distribution
```

**Sliding window for within-gene variation:**
```
Window of 30 codons, step of 10 codons
Compute ω per window with bootstrap CI
Flag regions where ω significantly > 1 or < 1
```

### Implementation Approach

**Codon-aware alignment (critical step):**
```typescript
interface CodonAlignment {
  codonsA: string[];
  codonsB: string[];
  geneId: string;
}

function alignCodons(
  geneA: { dna: string; aa: string },
  geneB: { dna: string; aa: string }
): CodonAlignment {
  // 1. Align amino acid sequences (preserve reading frame)
  const aaAlign = needlemanWunsch(geneA.aa, geneB.aa);

  // 2. Thread DNA codons through the AA alignment
  const codonsA: string[] = [];
  const codonsB: string[] = [];
  let posA = 0, posB = 0;

  for (let i = 0; i < aaAlign.alignedA.length; i++) {
    codonsA.push(aaAlign.alignedA[i] === '-'
      ? '---'
      : geneA.dna.slice(posA++ * 3, posA * 3));
    codonsB.push(aaAlign.alignedB[i] === '-'
      ? '---'
      : geneB.dna.slice(posB++ * 3, posB * 3));
  }

  return { codonsA, codonsB, geneId: geneA.id };
}
```

**dN/dS calculation:**
```typescript
// Precompute: degeneracy of each codon position
const CODON_DEGENERACY = computeDegeneracyTable();

interface DnDsResult {
  dN: number;
  dS: number;
  omega: number;
  pValue: number;
  interpretation: 'purifying' | 'neutral' | 'positive';
}

function computeDnDs(codonPairs: [string, string][]): DnDsResult {
  let Sd = 0, Nd = 0, S = 0, N = 0;

  for (const [codonA, codonB] of codonPairs) {
    if (codonA === '---' || codonB === '---' || codonA === codonB) continue;

    // Count sites and differences
    const sites = countSites(codonA);
    S += sites.synonymous;
    N += sites.nonsynonymous;

    const diffs = countDifferences(codonA, codonB);
    Sd += diffs.synonymous;
    Nd += diffs.nonsynonymous;
  }

  // Jukes-Cantor correction
  const pS = Sd / S, pN = Nd / N;
  const dS = -0.75 * Math.log(1 - 4 * pS / 3);
  const dN = -0.75 * Math.log(1 - 4 * pN / 3);
  const omega = dS > 0 ? dN / dS : 1;

  // Z-test
  const varDn = pN * (1 - pN) / N;
  const varDs = pS * (1 - pS) / S;
  const z = (dN - dS) / Math.sqrt(varDn + varDs);
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));

  return {
    dN, dS, omega, pValue,
    interpretation: omega > 1.2 && pValue < 0.05 ? 'positive'
                  : omega < 0.8 && pValue < 0.05 ? 'purifying'
                  : 'neutral'
  };
}
```

**Performance:** O(n) per gene pair. TypeScript sufficient for phage-sized genomes.

### Why This Is a Good Idea

1. **Core evolutionary biology**: dN/dS is THE metric for detecting selection
2. **Arms race detection**: Positive selection = phage-host coevolution hotspots
3. **Essential gene identification**: Strong purifying = functional importance
4. **Therapeutic relevance**: Predict which features will evolve resistance
5. **Research value**: Immediate insight into evolutionary dynamics

### Innovation Assessment

**Novelty: MEDIUM**

dN/dS tools exist (PAML, HyPhy, MEGA), but:
- No integration with interactive genome browsers
- No sliding window visualization in TUI
- "Chromosome painting" metaphor is visually novel
- Comparative view across phages is powerful

### Pedagogical Value: 10/10

Teaches:
- **Natural selection**: The core concept made quantitative
- **Molecular evolution**: How selection acts on coding sequences
- **Arms race dynamics**: Evolution in action
- **Statistical inference**: Hypothesis testing in biology

### Cool/Wow Factor: 8/10

Seeing the tail fiber gene light up red (arms race!) while DNA polymerase is deep blue (essential!) makes evolution tangible.

### TUI Visualization

```
Selection Pressure: Lambda vs P22

Gene:     ──[CI]────[N]────[cro]────[O]────[P]────[gpJ tail fiber]──
dN/dS:    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
          └─ purifying (ω=0.1-0.3) ────────────────┘ └── positive! ──┘
                                                       (ω=2.8)

Legend: ░ Purifying (ω<0.5)  ▒ Neutral (0.5<ω<1.5)  ▓ Positive (ω>1.5)

Sliding window within gpJ:
   3.0 ┤                        ╭───╮  ← RBD hypervariable
   2.0 ┤                       ╭╯   ╰╮
   1.0 ┼─────────────────────────────────── ω = 1 (neutral)
   0.5 ┤ ╭───╮
   0.0 ┤─╯   ╰───────────────╯
       └─────────────────────────────────
         Anchor      Shaft        RBD
```

---

## 13) Lysogeny Decision Circuit Simulator

### Concept

The lambda phage **lysis-lysogeny decision** is biology's most famous genetic switch — a bistable circuit choosing between:
- **Lysogeny**: Integrate, repress lytic genes, wait for better times
- **Lysis**: Replicate, lyse cell, spread to new hosts

The decision is controlled by **CI** and **Cro** repressors in mutual competition. By modeling this with **ordinary differential equations** and visualizing the **phase portrait**, users can:
- Watch the decision unfold in real-time
- Understand how parameters (MOI, UV damage) affect outcomes
- See bistability and hysteresis in action
- Predict effects of mutations

### Mathematical Foundations

**ODE model:**
```
dCI/dt = α₁ · f(CI, Cro) - δ₁ · CI
dCro/dt = α₂ · g(CI, Cro) - δ₂ · Cro

Where:
f(CI, Cro) = (CI²/(K₁² + CI²)) × (K₂ⁿ/(K₂ⁿ + Croⁿ))
  // CI activates itself (positive feedback)
  // Cro represses CI

g(CI, Cro) = K₃ᵐ/(K₃ᵐ + CIᵐ)
  // CI represses Cro

Parameters: α (production), δ (degradation), K (thresholds), n,m (cooperativity)
```

**Phase portrait analysis:**
```
Fixed points where dCI/dt = 0 AND dCro/dt = 0:
  - Lysogenic state: High CI, low Cro (stable)
  - Lytic state: Low CI, high Cro (stable)
  - Saddle point: Medium CI, medium Cro (unstable)

Separatrix: Boundary between basins of attraction
  - Initial conditions on one side → lysogeny
  - Other side → lysis
```

**Bifurcation analysis:**
```
As δ₁ increases (UV damage degrades CI):
  - Lysogenic fixed point disappears
  - System forced into lysis (prophage induction)
```

### Implementation Approach

**Runge-Kutta 4th order integrator:**
```typescript
function rk4(
  deriv: (t: number, y: number[]) => number[],
  y0: number[],
  t0: number,
  tf: number,
  dt: number
): { t: number[]; y: number[][] } {
  const trajectory: number[][] = [y0];
  const times: number[] = [t0];
  let y = [...y0], t = t0;

  while (t < tf) {
    const k1 = deriv(t, y);
    const k2 = deriv(t + dt/2, y.map((yi, i) => yi + dt/2 * k1[i]));
    const k3 = deriv(t + dt/2, y.map((yi, i) => yi + dt/2 * k2[i]));
    const k4 = deriv(t + dt, y.map((yi, i) => yi + dt * k3[i]));
    y = y.map((yi, i) => yi + dt/6 * (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]));
    t += dt;
    trajectory.push([...y]);
    times.push(t);
  }
  return { t: times, y: trajectory };
}
```

**Circuit model:**
```typescript
interface LysogenyParams {
  alpha1: number; alpha2: number;  // Production rates
  delta1: number; delta2: number;  // Degradation rates
  K1: number; K2: number; K3: number;  // Thresholds
  n: number; m: number;  // Hill coefficients
}

function lysogenyODE(params: LysogenyParams) {
  return (t: number, y: number[]): number[] => {
    const [CI, Cro] = y;

    const ciActivation = CI**2 / (params.K1**2 + CI**2);
    const croRepression = params.K2**params.n / (params.K2**params.n + Cro**params.n);
    const ciRepression = params.K3**params.m / (params.K3**params.m + CI**params.m);

    return [
      params.alpha1 * ciActivation * croRepression - params.delta1 * CI,
      params.alpha2 * ciRepression - params.delta2 * Cro
    ];
  };
}
```

**Phase portrait generation:**
```typescript
function computePhasePortrait(params: LysogenyParams, resolution = 20) {
  const ode = lysogenyODE(params);
  const vectorField = [];

  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const ci = i / resolution * 2;
      const cro = j / resolution * 1;
      const [dci, dcro] = ode(0, [ci, cro]);
      vectorField.push({ x: ci, y: cro, dx: dci, dy: dcro });
    }
  }

  return { vectorField, fixedPoints: findFixedPoints(ode) };
}
```

### Why This Is a Good Idea

1. **Iconic biology**: Lambda switch is in every molecular biology textbook
2. **Systems biology gateway**: Perfect introduction to mathematical modeling
3. **Interactive learning**: Adjust parameters, observe consequences
4. **Beautiful mathematics**: Bistability, bifurcations, phase portraits
5. **Research relevance**: Understand prophage induction, synthetic biology

### Innovation Assessment

**Novelty: HIGH**

Mathematical models of lambda exist, but:
- No interactive TUI exploration
- No real-time parameter adjustment
- No connection to actual gene sequence/annotation
- No ASCII phase portrait visualization

### Pedagogical Value: 10/10

Teaches:
- **Systems biology**: Genes as circuits, not just sequences
- **Differential equations**: Biology as dynamical systems
- **Bistability**: How cells make binary decisions
- **Cooperativity**: Why Hill coefficients matter
- **Noise**: Stochastic effects in gene expression

### Cool/Wow Factor: 10/10

Watching trajectories spiral toward fixed points — seeing the "decision" unfold — is mesmerizing. Parameter sliders make it feel like a simulation game.

### TUI Visualization

```
Lysogeny Decision Phase Portrait

Cro ↑  · · · → → → → ╲ ╲ ╲ ↓ ↓ ↓ ↓ ↓ ·
    │  · · · → → → ╲ ╲ ╲ ↓ ↓ ↓ ↓ ↓ ↓ ·
    │  · · → → → ╲ ╲ ╲ ╲ ↓ ↓ ↓ ↓ ↓ · ·
    │  · → → → ╲ ╲ ╲ ╲ ↓ ↓ ↓ ↓ ↓ · · ·
    │  · → → → ╲ ╲ ╲ [●LYSIS] ↓ · · · ·    ● = stable
    │  · → → → ╲ ╲ ╲ ╲ ↓ ↓ ↓ · · · · ·
    │  · · → → → ╲ ╲ ╲ ╲ ↓ ↓ · · · · ·
    │  · · · → → → ╲ ╲ ╳ · · · · · · ·    ╳ = saddle
    │  · · · · → → → · ⊙ · · · · · · ·    ⊙ = current
    │  · · · · · · [●LYSOGENY] · · · ·
    ╰────────────────────────────────→ CI

Current: ⊙ (CI=1.2, Cro=0.3) → Lysogeny trajectory

Parameters:
  MOI: [████░░░░░░] 2.0    UV damage: [██░░░░░░░░] low
  [▶ Simulate] [↻ Reset] [⚙ Advanced]
```

---

## 14) Information-Theoretic Sequence Anomaly Scanner

### Concept

Every genome has a statistical "signature" — characteristic k-mer frequencies, compositional biases, and complexity patterns. **Anomalies** in this signature reveal:
- **Recent horizontal transfer**: Different composition from foreign source
- **Regulatory elements**: Low complexity but high information content
- **Repetitive regions**: High compression potential
- **Novel features**: Deviations that don't fit any model

Using **algorithmic information theory** (Kolmogorov complexity via compression, Shannon entropy, KL divergence), we find regions that "don't belong" — the surprises in the genome.

### Mathematical Foundations

**Kolmogorov complexity approximation:**
```
K(x) ≈ length(gzip(x))  // Compressed size approximates algorithmic complexity

Normalized: NC(x) = K̂(x) / length(x)
  Low NC = repetitive/simple
  High NC = complex/random
```

**Shannon entropy:**
```
H(X) = -Σ p(x) × log₂(p(x))

For DNA: max H = 2 bits/base (if A=C=G=T=0.25)
Typical genome: H ≈ 1.8-1.95 bits/base
```

**KL divergence for anomaly detection:**
```
D_KL(P || Q) = Σ P(x) × log(P(x) / Q(x))

Compare local k-mer distribution (P) to genome-wide (Q):
  High D_KL = local region differs from genome background
  = potential HGT, regulatory element, or novel feature
```

### Implementation Approach

**Compression-based complexity:**
```typescript
import pako from 'pako';

function compressionComplexity(sequence: string): number {
  const input = new TextEncoder().encode(sequence);
  const compressed = pako.deflate(input, { level: 9 });
  return compressed.length / input.length;
}

function slidingComplexity(
  sequence: string,
  windowSize = 1000,
  stepSize = 100
): { position: number; complexity: number }[] {
  const results = [];
  for (let i = 0; i <= sequence.length - windowSize; i += stepSize) {
    results.push({
      position: i,
      complexity: compressionComplexity(sequence.slice(i, i + windowSize))
    });
  }
  return results;
}
```

**KL divergence anomaly detection:**
```typescript
function computeKmerDistribution(seq: string, k: number): Map<string, number> {
  const counts = new Map<string, number>();
  for (let i = 0; i <= seq.length - k; i++) {
    const kmer = seq.slice(i, i + k);
    counts.set(kmer, (counts.get(kmer) || 0) + 1);
  }
  // Normalize to probabilities
  const total = seq.length - k + 1;
  const dist = new Map<string, number>();
  for (const [kmer, count] of counts) {
    dist.set(kmer, count / total);
  }
  return dist;
}

function klDivergence(local: Map<string, number>, global: Map<string, number>): number {
  let kl = 0;
  for (const [kmer, p] of local) {
    const q = global.get(kmer) || 1e-10;  // Smoothing
    kl += p * Math.log(p / q);
  }
  return kl;
}

interface Anomaly {
  start: number;
  end: number;
  klDivergence: number;
  type: 'potential_HGT' | 'repetitive' | 'regulatory' | 'unknown';
}

function detectAnomalies(sequence: string, windowSize = 2000): Anomaly[] {
  const globalDist = computeKmerDistribution(sequence, 4);
  const anomalies: Anomaly[] = [];

  for (let i = 0; i < sequence.length - windowSize; i += windowSize / 2) {
    const window = sequence.slice(i, i + windowSize);
    const localDist = computeKmerDistribution(window, 4);
    const kl = klDivergence(localDist, globalDist);

    if (kl > 0.5) {  // Threshold
      const complexity = compressionComplexity(window);
      anomalies.push({
        start: i,
        end: i + windowSize,
        klDivergence: kl,
        type: complexity < 0.3 ? 'repetitive' : 'potential_HGT'
      });
    }
  }

  return mergeOverlapping(anomalies);
}
```

### Why This Is a Good Idea

1. **Discovery-oriented**: Finds what you weren't looking for
2. **Annotation-independent**: Pure signal from sequence statistics
3. **HGT detection**: Critical for understanding phage evolution
4. **Regulatory element identification**: Promoters/terminators often anomalous
5. **Elegant mathematics**: Information theory in biology

### Innovation Assessment

**Novelty: HIGH**

Compression-based analysis exists in research, but:
- No integration with genome browsers
- No "anomaly scanner" visualization
- No classification of anomaly types
- Interactive exploration is novel

### Pedagogical Value: 8/10

Teaches:
- **Information theory**: Entropy, complexity, compression
- **Algorithmic information**: Kolmogorov complexity concepts
- **Compositional analysis**: Statistical signatures of sequences
- **HGT detection**: How foreign DNA is identified

### Cool/Wow Factor: 8/10

The idea of "finding surprises" using pure mathematics is intellectually exciting. An anomaly lighting up with "this looks foreign" is compelling.

### TUI Visualization

```
Information-Theoretic Profile: Lambda phage

Kolmogorov complexity (compression ratio):
  1.0 ┤──────────────────────────────────────────────────────
  0.8 ┤  ╭────────────╮      ╭───────────────╮    ╭─────────╮
  0.6 ┤──╯            ╰──────╯               ╰────╯         ╰
  0.4 ┤
  0.2 ┤                                            ╭───╮
  0.0 ┤────────────────────────────────────────────╯   ╰────
                    att site    normal region      repeat

KL divergence (compositional anomaly):
  2.0 ┤                    ╭─╮              ╭───╮
  1.5 ┤                   ╭╯ ╰╮            ╭╯   ╰╮
  1.0 ┤──────────────────╯    ╰────────────╯     ╰──────────
  0.5 ┤
      └───────────────────────────────────────────────────────
               ↑ HGT?           ↑ Regulatory island?

Detected anomalies:
  [12,450 - 14,200] KL=1.8 Type: potential_HGT    ⚠
  [38,100 - 38,800] KL=0.9 Type: repetitive       ○
```

---

## 15) Auxiliary Metabolic Gene (AMG) Hijacking Mapper

### Concept

Phages aren't just parasites — they're **metabolic engineers**. Many carry **Auxiliary Metabolic Genes (AMGs)** that reprogram host metabolism:
- **Photosynthesis** (psbA, psbD): Boost photosynthesis in cyanophages
- **Nucleotide synthesis**: Increase dNTP pools for viral replication
- **Carbon metabolism**: Redirect resources to phage production
- **Stress response**: Protect host long enough to complete infection

By mapping AMGs onto metabolic pathways, we visualize how phages **hijack** their hosts.

### Mathematical Foundations

**HMM profile matching (KOfam):**
```
KEGG Orthology provides HMM profiles for metabolic genes.
For each phage protein:
  Score against KOfam profiles
  Assign KO if E-value < threshold
```

**Pathway enrichment (hypergeometric test):**
```
For AMGs with KO assignments:
  For each KEGG pathway P:
    k = number of AMGs in P
    K = total AMGs
    M = genes in pathway P (background)
    N = total genes

    P-value = Σ C(M,x) × C(N-M, K-x) / C(N, K)  for x ≥ k

Enriched if P < 0.05 (Bonferroni corrected)
```

### Implementation Approach

**Simplified KO assignment without HMMER:**
```typescript
// Pre-computed k-mer signatures for metabolic gene families
const KO_SIGNATURES: Map<string, { kmers: Set<string>; pathway: string }> =
  loadKOSignatures();

interface AMGAnnotation {
  geneId: string;
  KO: string;
  pathway: string;
  confidence: number;
}

function assignKO(protein: string): AMGAnnotation | null {
  const proteinKmers = new Set<string>();
  for (let i = 0; i <= protein.length - 5; i++) {
    proteinKmers.add(protein.slice(i, i + 5));
  }

  let bestKO: string | null = null;
  let bestScore = 0;

  for (const [ko, { kmers, pathway }] of KO_SIGNATURES) {
    let intersection = 0;
    for (const kmer of proteinKmers) {
      if (kmers.has(kmer)) intersection++;
    }
    const score = intersection / Math.min(proteinKmers.size, kmers.size);

    if (score > bestScore && score > 0.2) {
      bestScore = score;
      bestKO = ko;
    }
  }

  return bestKO ? { geneId: '', KO: bestKO, pathway: '', confidence: bestScore } : null;
}
```

**Pathway overlay:**
```typescript
interface PathwayNode {
  id: string;
  name: string;
  x: number;
  y: number;
  isAMG: boolean;
  phageGene?: string;
}

// Pre-defined pathway layouts for key pathways
const PATHWAY_LAYOUTS = new Map<string, PathwayNode[]>();

function overlayAMGs(pathwayId: string, amgs: AMGAnnotation[]): PathwayNode[] {
  const layout = structuredClone(PATHWAY_LAYOUTS.get(pathwayId)!);

  for (const node of layout) {
    const amg = amgs.find(a => a.KO === node.id);
    if (amg) {
      node.isAMG = true;
      node.phageGene = amg.geneId;
    }
  }

  return layout;
}
```

### Why This Is a Good Idea

1. **Cutting-edge science**: AMGs are hot research topic (discovered 2003)
2. **Ecosystem impact**: Phage AMGs affect global biogeochemical cycles
3. **Evolutionary insight**: Why carry metabolic genes at all?
4. **Therapeutic relevance**: AMGs might have unexpected effects
5. **Visualization gap**: No tool shows AMGs on pathway maps in TUI

### Innovation Assessment

**Novelty: MEDIUM-HIGH**

Tools like VIBRANT and DRAM detect AMGs, but:
- No interactive pathway visualization
- No integration with genome browser
- TUI pathway overlay is unique

### Pedagogical Value: 9/10

Teaches:
- **Viral manipulation**: Phages as metabolic engineers
- **Metabolic pathways**: KEGG and cellular metabolism
- **Ecology**: Viruses affect biogeochemical cycles
- **Systems biology**: Pathway-level thinking

### Cool/Wow Factor: 8/10

Seeing a metabolic pathway with phage enzymes highlighted — realizing the virus is rewiring the host — is profound.

### TUI Visualization

```
Carbon Metabolism with Cyanophage S-PM2 AMGs
═══════════════════════════════════════════════════════════════

       CO₂
        │
        ▼
   ┌─────────┐
   │RuBisCO  │  ← Host enzyme
   └────┬────┘
        │
        ▼
   ┌─────────┐     ╔═════════╗     ┌─────────┐
   │3-PGA    │────▶║  psbA   ║────▶│  NADPH  │
   └─────────┘     ╚════╤════╝     └─────────┘
                        │
                   PHAGE AMG!      → Enhanced photosynthesis
                   (PS II D1)        during infection
                        │
                        ▼
                   Pentose-P ──▶ dNTPs ──▶ Phage DNA

Legend: ─ Host enzyme  ║ Phage AMG  ▶ Metabolic flow

AMG inventory:
┌──────────┬───────────────────┬───────────────────┬───────┐
│ Gene     │ Function          │ Pathway           │ Conf  │
├──────────┼───────────────────┼───────────────────┼───────┤
│ psbA     │ PS II D1 protein  │ Photosynthesis    │ █████ │
│ psbD     │ PS II D2 protein  │ Photosynthesis    │ █████ │
│ talC     │ Transaldolase     │ Pentose-P         │ ████░ │
│ mazG     │ dNTP hydrolase    │ Nucleotide metab. │ ████░ │
└──────────┴───────────────────┴───────────────────┴───────┘

Pathway enrichment: Photosynthesis (p = 3.2e-8) ⚡
```

---

## 16) Promoter/RBS Strength Predictor

### Concept

Gene expression is controlled by **promoter** strength (transcription initiation) and **RBS** strength (translation initiation). Predicting these from sequence enables:
- Understanding phage gene expression timing
- Designing synthetic constructs
- Identifying highly expressed proteins (targets for therapy)

### Implementation

**Promoter strength features:**
```typescript
interface PromoterPrediction {
  position: number;
  minus35: string;
  minus10: string;
  spacerLength: number;
  predictedStrength: number;  // 0-1 scale
  confidence: number;
}

function predictPromoterStrength(upstream: string): PromoterPrediction {
  // Consensus: TTGACA (-35) and TATAAT (-10), spacer 17±1bp
  const MINUS35_CONSENSUS = 'TTGACA';
  const MINUS10_CONSENSUS = 'TATAAT';

  let bestScore = 0;
  let bestPos = -1;

  for (let m35 = 0; m35 <= upstream.length - 35; m35++) {
    const minus35 = upstream.slice(m35, m35 + 6);
    const m35Score = sequenceSimilarity(minus35, MINUS35_CONSENSUS);

    for (let spacer = 15; spacer <= 19; spacer++) {
      const m10Pos = m35 + 6 + spacer;
      if (m10Pos + 6 > upstream.length) continue;

      const minus10 = upstream.slice(m10Pos, m10Pos + 6);
      const m10Score = sequenceSimilarity(minus10, MINUS10_CONSENSUS);

      const spacerPenalty = Math.abs(spacer - 17) * 0.1;
      const totalScore = (m35Score + m10Score) / 2 - spacerPenalty;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestPos = m35;
      }
    }
  }

  return {
    position: bestPos,
    minus35: upstream.slice(bestPos, bestPos + 6),
    minus10: upstream.slice(bestPos + 6 + 17, bestPos + 6 + 17 + 6),
    spacerLength: 17,
    predictedStrength: bestScore,
    confidence: bestScore > 0.7 ? 0.9 : 0.5
  };
}
```

**RBS strength (Shine-Dalgarno):**
```typescript
function predictRBSStrength(upstream: string): number {
  const SD_CONSENSUS = 'AGGAGG';
  let bestScore = 0;

  // Search 5-15 bp upstream of start codon
  for (let i = upstream.length - 15; i <= upstream.length - 5; i++) {
    for (let len = 4; len <= 6; len++) {
      const sd = upstream.slice(i, i + len);
      const score = sequenceSimilarity(sd, SD_CONSENSUS.slice(0, len));
      bestScore = Math.max(bestScore, score);
    }
  }

  return bestScore;
}
```

### TUI Visualization

```
Gene expression predictions:
Gene: ──[P:████░]──[RBS:███░░]──[cI repressor]────────────────
          strong      medium

       ──[P:██░░░]──[RBS:█████]──[cro]────────────────────────
          weak        strong      (early lytic gene)
```

---

## 17) Structural Variation Detector

### Concept

Find large-scale rearrangements between related phages:
- **Deletions**: Genes present in one, absent in another
- **Inversions**: Same genes, flipped orientation
- **Duplications**: Gene copy number changes
- **Translocations**: Same genes, different positions

### Implementation

```typescript
interface StructuralVariant {
  type: 'deletion' | 'inversion' | 'duplication' | 'translocation';
  positionA: { start: number; end: number };
  positionB?: { start: number; end: number };
  size: number;
  genes: string[];
}

function detectStructuralVariants(
  alignmentBlocks: AlignmentBlock[]
): StructuralVariant[] {
  const variants: StructuralVariant[] = [];

  // Sort blocks by position in genome A
  const sorted = [...alignmentBlocks].sort((a, b) => a.startA - b.startA);

  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];

    // Gap in A but not B = deletion in A
    const gapA = next.startA - curr.endA;
    const gapB = next.startB - curr.endB;

    if (gapA > 500 && gapB < 100) {
      variants.push({
        type: 'deletion',
        positionA: { start: curr.endA, end: next.startA },
        size: gapA,
        genes: findGenesInRegion(curr.endA, next.startA)
      });
    }

    // Orientation flip = inversion
    if (curr.strand !== next.strand) {
      variants.push({
        type: 'inversion',
        positionA: { start: curr.endA, end: next.startA },
        positionB: { start: curr.endB, end: next.startB },
        size: next.startA - curr.endA,
        genes: findGenesInRegion(curr.endA, next.startA)
      });
    }
  }

  return variants;
}
```

### TUI Visualization

```
Structural variants: Lambda vs P22

Lambda: ═══════════╗          ╔════════════════════════════════╗
                   ║  ──────  ║                                ║
P22:    ═══════════╩══════════╩════════════════════════════════╝
                   │          │
                   12kb       24kb
                   inversion  (integrase region)

Legend: ═ Syntenic blocks  ║ Inversion breakpoint  ── Deleted
```

---

## 18) Prophage Excision Precision Mapper

### Concept

For temperate phages, predict the exact **attL** and **attR** sites that flank the integrated prophage, and model the excision product.

### Implementation

```typescript
interface AttSites {
  attL: { sequence: string; position: number };
  attR: { sequence: string; position: number };
  attB: string;  // Reconstituted bacterial site
  attP: string;  // Reconstituted phage site
  integrase: Gene;
}

function findAttSites(
  prophageRegion: string,
  genes: Gene[]
): AttSites | null {
  // Find integrase gene
  const integrase = genes.find(g =>
    g.product?.toLowerCase().includes('integrase') ||
    g.product?.toLowerCase().includes('recombinase')
  );

  if (!integrase) return null;

  // Search for imperfect direct repeats at prophage boundaries
  const leftFlank = prophageRegion.slice(0, 500);
  const rightFlank = prophageRegion.slice(-500);

  const repeats = findImperfectRepeats(leftFlank, rightFlank, {
    minLength: 15,
    maxMismatches: 3
  });

  if (repeats.length === 0) return null;

  const best = repeats[0];

  return {
    attL: { sequence: best.left, position: best.leftPos },
    attR: { sequence: best.right, position: best.rightPos },
    attB: reconstructAttB(best.left, best.right),
    attP: reconstructAttP(best.left, best.right),
    integrase
  };
}
```

### TUI Visualization

```
Prophage excision prediction: Lambda

Integrated state:
────[gal]───[attL]════[λ prophage]════[attR]───[bio]────
              │                          │
              GCTTTTTTATACTAA             GCTTTTTTATACTAA
              (core sequence)

              ↓ Int-mediated excision

Excised products:
Chromosome: ────[gal]───[attB]───[bio]────  (restored)
                         │
                    GCTTTTTTATACTAA

Lambda circle:     ╭──[attP]──╮
                   │          │
                   ╰──────────╯
```

---

## 19) Virion Stability Predictor

### Concept

Predict phage particle stability (temperature, pH, ionic strength) from capsid protein properties — critical for therapy formulation.

### Implementation

```typescript
interface StabilityProfile {
  temperatureRange: { min: number; max: number; optimal: number };
  pHRange: { min: number; max: number; optimal: number };
  ionicSensitivity: 'low' | 'medium' | 'high';
  shelfLife: string;
  concerns: string[];
}

function predictStability(capsidProteins: Protein[]): StabilityProfile {
  // Aggregate properties across structural proteins
  let totalCharge = 0;
  let hydrophobicFraction = 0;
  let cysteineCount = 0;
  let totalLength = 0;

  for (const protein of capsidProteins) {
    const props = computeProteinProperties(protein.sequence);
    totalCharge += props.netCharge;
    hydrophobicFraction += props.hydrophobicFraction * protein.sequence.length;
    cysteineCount += (protein.sequence.match(/C/g) || []).length;
    totalLength += protein.sequence.length;
  }

  hydrophobicFraction /= totalLength;
  const chargePerResidue = totalCharge / totalLength;

  // Empirical rules from literature
  const tempMax = 55 + cysteineCount * 2;  // Disulfides stabilize
  const pHMin = chargePerResidue > 0.1 ? 5 : 4;
  const pHMax = chargePerResidue < -0.1 ? 9 : 10;

  return {
    temperatureRange: { min: 4, max: tempMax, optimal: 20 },
    pHRange: { min: pHMin, max: pHMax, optimal: 7 },
    ionicSensitivity: hydrophobicFraction > 0.4 ? 'high' : 'medium',
    shelfLife: tempMax > 60 ? '12+ months' : '6-12 months',
    concerns: []
  };
}
```

### TUI Visualization

```
Virion Stability: T4 phage

Temperature:  ████████████░░░░░░░░  (stable to 55°C)
pH tolerance: ░░░████████████████░  (pH 5-9)
Ionic sens.:  ████░░░░░░░░░░░░░░░░  (low sensitivity)

Recommendation: Store at 4°C in SM buffer (pH 7.5)
Shelf life: ~12 months with <1 log loss

⚠ Concerns: None identified
```

---

## 20) Comparative Synteny Browser

### Concept

Visualize gene order conservation across multiple phages with rearrangement highlighting.

### Implementation

```typescript
interface SyntenyBlock {
  phages: string[];
  genes: Map<string, Gene[]>;  // phageId -> genes in block
  conserved: boolean;
  rearrangement?: 'inversion' | 'translocation';
}

function computeSynteny(phages: PhageFull[]): SyntenyBlock[] {
  // Build ortholog clusters
  const orthologs = clusterOrthologs(phages.flatMap(p => p.genes));

  // Find conserved blocks (same order across phages)
  const blocks: SyntenyBlock[] = [];

  // Walk through first phage, extend blocks while order conserved
  const reference = phages[0];
  let currentBlock: Gene[] = [];

  for (const gene of reference.genes) {
    const cluster = orthologs.get(gene.id);
    if (!cluster) continue;

    // Check if order conserved in all phages
    const conservedInAll = phages.every(p =>
      isOrderConserved(cluster, p.genes, currentBlock)
    );

    if (conservedInAll) {
      currentBlock.push(gene);
    } else {
      if (currentBlock.length > 0) {
        blocks.push(createBlock(currentBlock, phages));
      }
      currentBlock = [gene];
    }
  }

  return blocks;
}
```

### TUI Visualization

```
Synteny: Lambda vs P22 vs HK97

Lambda: ═[cI]═[N]═[cro]═══════════[head]════════[tail]═══════[lysis]═
             │   │                  │             │            │
P22:    ═════╪═══╪══════════════════╪═════════════╪════════════╪═════
             │   │                  │             │            │
HK97:   ═════╪═══╪══════════════════╪════[portal]═╪════════════╪═════
             │   │                  │      ↑      │            │
             └───┴──────────────────┴──────┼──────┴────────────┘
                  conserved regulatory      gene insertion
                  module across all 3

Legend: ═ Conserved synteny  ╪ Block boundary  ↑ Insertion/rearrangement
```

---

## 21) Sequence Logo Generator

### Concept

Create information-theoretic **sequence logos** from multiple sequence alignments — the standard for visualizing conserved motifs.

### Implementation

```typescript
interface LogoColumn {
  position: number;
  totalBits: number;  // Information content (max 2 for DNA, 4.3 for protein)
  letters: { char: string; height: number }[];  // Sorted by height
}

function generateLogo(alignment: string[], type: 'dna' | 'protein'): LogoColumn[] {
  const maxBits = type === 'dna' ? 2 : Math.log2(20);
  const length = alignment[0].length;
  const columns: LogoColumn[] = [];

  for (let pos = 0; pos < length; pos++) {
    const counts = new Map<string, number>();
    let total = 0;

    for (const seq of alignment) {
      const char = seq[pos];
      if (char !== '-') {
        counts.set(char, (counts.get(char) || 0) + 1);
        total++;
      }
    }

    // Shannon entropy
    let entropy = 0;
    for (const count of counts.values()) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }

    const information = maxBits - entropy;

    // Letter heights proportional to frequency × information
    const letters = Array.from(counts.entries())
      .map(([char, count]) => ({
        char,
        height: (count / total) * information
      }))
      .sort((a, b) => a.height - b.height);  // Stack smallest at bottom

    columns.push({ position: pos, totalBits: information, letters });
  }

  return columns;
}
```

### TUI Visualization

```
Promoter -10 box consensus logo:

Bits
 2.0 ┤     T
     │     T A A A
 1.5 ┤     T A A A T
     │   T T A A A T
 1.0 ┤   T T A A A T
     │   T T A A A T
 0.5 ┤ T T T A A A T A
     │ T T T A A A T A T
 0.0 └─┴─┴─┴─┴─┴─┴─┴─┴─┴─
       1 2 3 4 5 6 7 8 9

Consensus: TATAAT (Pribnow box)
Information content: 8.2 bits (highly conserved)
```

---

## 22) Chaos Game Representation (CGR) Fractal Fingerprints

### Concept
Turn a 1D sequence into a 2D fractal image. The algorithm is simple: start at the center of a square. For each nucleotide, move halfway toward its designated corner (A=top-left, T=top-right, G=bottom-right, C=bottom-left).

This generates a unique "fingerprint" where patterns (like CpG islands or repetitive kmers) emerge as distinct visual attractors or voids.

### Implementation
**Canvas-less TUI Rendering:**
Use Braille characters (`⣿`, `⣤`) to create a 4x resolution grid per character cell.

```typescript
function computeCGR(sequence: string, resolution: number): number[][] {
  const grid = Array(resolution).fill(0).map(() => Array(resolution).fill(0));
  let x = resolution / 2;
  let y = resolution / 2;

  for (const char of sequence) {
    if (char === 'A') { x /= 2; y /= 2; }
    else if (char === 'T') { x = (x + resolution) / 2; y /= 2; }
    else if (char === 'G') { x = (x + resolution) / 2; y = (y + resolution) / 2; }
    else if (char === 'C') { x /= 2; y = (y + resolution) / 2; }
    grid[Math.floor(y)][Math.floor(x)]++;
  }
  return grid;
}
```

### Why Good?
Instant visual classification. You can *see* if a phage is AT-rich or has specific forbidden k-mers (empty zones in the fractal).

### Novelty
High. CGR is a niche bioinformatics tool, almost never seen in CLI tools.

### Pedagogical Value
Teaches **Chaos Theory**, **Fractals**, and **k-mer frequency visualization**.

### Cool/Wow Factor
It creates a beautiful, complex image from "random" looking text.

---

## 23) Hilbert Curve Genome Atlas

### Concept
Map the entire linear genome onto a 2D square using a **Hilbert space-filling curve**. This preserves locality: points close in 1D are close in 2D.

Color pixels by:
- GC Content
- Hydrophobicity
- Gene Density

### Implementation
**Hilbert Mapping:**
Standard recursive algorithm to map 1D index `i` to `(x, y)`.

```typescript
function d2xy(n: number, d: number): [number, number] {
  let rx, ry, s, t = d;
  let x = 0, y = 0;
  for (s = 1; s < n; s *= 2) {
    rx = 1 & (t / 2);
    ry = 1 & (t ^ rx);
    // Rotate/flip
    if (ry === 0) {
      if (rx === 1) { x = s - 1 - x; y = s - 1 - y; }
      [x, y] = [y, x];
    }
    x += s * rx;
    y += s * ry;
    t /= 4;
  }
  return [x, y];
}
```

### Why Good?
Allows viewing **entire genomes** (even giant ones like T4) on a single screen without scrolling. Global structural organization becomes visible.

### Novelty
Very high for a TUI.

### Pedagogical Value
Teaches **Space-filling curves** and **Genomic Architecture**.

### TUI Visualization
A dense colored square. Different "lobes" of the phage (Early, Middle, Late genes) appear as distinct blocks.

---

## 24) Ribosome Traffic Jam Simulator

### Concept
A dynamic **particle simulation** of translation. Ribosomes (particles) move along the mRNA (track). Their speed depends on the **tRNA availability** (codon adaptation) of the current codon.

If a ribosome hits a "slow" codon (rare tRNA), it pauses. Behind it, other ribosomes pile up, creating a "traffic jam."

### Implementation
**Discrete Event Simulation:**
- `Ribosome` object with `position`, `state`.
- `CodonWaitTimes` lookup table (inverse of CAI).
- Tick loop: Move ribosomes. If `dist(r1, r2) < footprint`, block r2.

### Why Good?
Visualizes **Translation Kinetics**. Shows why "codon optimization" matters dynamically, not just statistically.

### Novelty
Extremely high. Most tools show static plots. This is a *movie*.

### Pedagogical Value
Teaches **Kinetic theory**, **Translation elongation**, and **Bottlenecks**.

### TUI Visualization
```
mRNA: ──[AUG]──[UUU]──[CGA]──[GGG]──
Ribosomes:  ⬤ ➔    ⬤ ➔   ⬤ (stuck!)
Traffic:    ░░      ░░    ████
```

---

## 25) Intrinsic DNA Curvature & Stiffness Map

### Concept
DNA is not a straight rod. Specific sequences (like A-tracts) cause the helix to bend. This **intrinsic curvature** is critical for:
- DNA packaging into the capsid (needs to bend tight!).
- Promoter recognition (wrapping around RNA pol).
- Nucleosome positioning (in temperate phages).

### Implementation
**Structural parameters:**
Use dinucleotide "wedge angles" (Roll, Tilt, Twist) from Trifonov or Bolshoy models. Calculate the vector trajectory of the helix axis.

```typescript
// Predicted curvature (degrees per helical turn)
function calculateCurvature(sequence: string): number[] {
  // Sum wedge angles over sliding window
  // Vector addition of roll/tilt vectors
}
```

### Why Good?
Reveals the **physical reality** of the molecule. Explains *why* packaging signals work.

### Novelty
High. Structural genomics is rarely part of general browsers.

### Pedagogical Value
Teaches **DNA biophysics** and **Structural biology**.

### TUI Visualization
A "Bendability" graph. High peaks = "kinks" in the DNA.
`Bend: ▂▃▅▇█▇▅▃ (Packaging Signal?)`

---

## 26) Virtual Agarose Gel Electrophoresis

### Concept
Simulate a lab experiment. Select a restriction enzyme (e.g., *EcoRI*, *HindIII*), "digest" the genome, and display the resulting bands on a virtual gel.

### Implementation
**In-silico Digestion:**
- Search for cut sites (e.g. `GAATTC`).
- Calculate fragment lengths.
- Map length to log-scale migration distance.

### Why Good?
Essential for experimental planning ("Will I see distinct bands?").

### Novelty
Classic concept, but great TUI utility.

### Pedagogical Value
Teaches **Restriction mapping** and **Log-linear migration**.

### TUI Visualization
```
  [ Ladder ]  [ Lambda ]  [ T4 ]
  - 10kb      ---------
  - 5kb       ---         ---------
  - 2kb                   ---
              ---------   ---
```

---

## 27) Self-Homology Dot Plot (Matrix)

### Concept
Compare the genome against *itself* to find repeats.
X-axis = Genome, Y-axis = Genome. Place a dot at `(x,y)` if `seq[x] == seq[y]`.

### Implementation
**Canvas-less Dot Matrix:**
Sliding window match (e.g., window 10, match > 9).
Render with Braille dots.

### Why Good?
The gold standard for finding **Inverted Repeats** (stem loops), **Direct Repeats** (duplications), and **Palindromes**.

### Novelty
Standard tool, but crucial gap filler.

### Pedagogical Value
Teaches **Sequence alignment fundamentals**.

### TUI Visualization
- Diagonal line = Identity.
- Parallel lines = Direct repeats.
- Perpendicular lines = Inverted repeats (hairpins).

---

## 28) Non-B DNA Structure Map (G4, Z-DNA)

### Concept
DNA isn't always a B-form double helix. It forms:
- **G-Quadruplexes (G4):** 4-stranded knots in G-rich regions (regulates promoters).
- **Z-DNA:** Left-handed helix in GC-alternating regions (immune response trigger).

### Implementation
**Regex/Pattern Matching:**
- G4: `G{3,}N{1,7}G{3,}N{1,7}G{3,}N{1,7}G{3,}`
- Z-DNA: `(GC){6,}`

### Why Good?
These structures are **regulatory switches** often missed by standard analysis.

### Novelty
Medium-High. G4 finding is trendy in viral research.

### Pedagogical Value
Teaches **Alternative DNA conformations**.

### TUI Visualization
"Danger flags" on the genome track.
`[====]--!G4!--[====]`

---

## 29) Genomic Signature PCA (Tetranucleotide Frequency)

### Concept
Every organism has a unique ratio of 4-mers (AAAA, AAAC, ...). This is a "genomic signature."
We can project all phages in the database into a PCA plot based on these 256 dimensions.

### Implementation
**Dimensionality Reduction:**
- Calculate 4-mer freq vector (size 256) for all phages.
- Run PCA (Singular Value Decomposition) in TS/Wasm.
- Plot PC1 vs PC2.

### Why Good?
**Alignment-free phylogeny.** Groups phages by family/host without needing gene homology.

### Novelty
High.

### Pedagogical Value
Teaches **Multivariate statistics** and **Alignment-free methods**.

### TUI Visualization
A scatter plot. "Your phage is here (X). It clusters with T7-like phages."

---

## 30) Plaque Morphology Cellular Automata

### Concept
Simulate the growth of a phage plaque on a bacterial lawn.
Parameters: **Diffusivity** (phage size), **Latent Period** (time to lyse), **Burst Size** (virions produced).

### Implementation
**2D Grid Simulation:**
- Cells: `Bacteria`, `Infected`, `Lysed`.
- Phages diffuse to neighbors.
- Outcome: A "virtual plaque" size and turbidity (clear vs turbid).

### Why Good?
Connects **Genotype** (Burst size, Lysis time) to **Phenotype** (Plaque size).

### Novelty
Very High. A "sim-game" inside the tool.

### Pedagogical Value
Teaches **Reaction-diffusion systems** and **Phage ecology**.

### TUI Visualization
An expanding circle of "dead" cells (` `) surrounded by growing bacteria (`#`).
"Predicted Plaque Size: Large/Clear (Lytic)" vs "Small/Turbid (Temperate)".

---

## 31) Packaging Motor Physics (Terminase Energy)

### Concept
Phage DNA is packed to extreme density (60 atm pressure!). The **Terminase** motor burns ATP to shove DNA in.
Visualize the **Force vs Filling** curve.

### Implementation
**Biophysical Model:**
Force increases exponentially as capsid fills due to DNA-DNA repulsion and bending energy.
`F = F_0 + F_bending + F_electrostatic`

### Why Good?
Highlights the **incredible mechanics** of viruses.

### Novelty
High. Physics in a genomics tool.

### Pedagogical Value
Teaches **Polymer physics** and **Molecular machines**.

### TUI Visualization
A gauge/meter showing internal pressure rising as you scroll from start to end of the genome.
`[||||||||||||||  ] 40 atm (WARNING: High Pressure)`

---

# Implementation Priority Matrix (Updated Phase 2)

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| 11. GC Skew | High | Low | **P0** |
| 13. Lysogeny Sim | Very High | Med | **P0** |
| 22. CGR Fractals | High | Low | **P1** |
| 24. Ribosome Traffic | Very High | High | **P1** |
| 25. Intrinsic Curvature | Med | Med | **P2** |
| 26. Virtual Gel | Med | Low | **P2** |
| 30. Plaque Sim | High | High | **P3** |

---

# UI Architecture Recommendations: Integrating 31 Features Without Overwhelming Users

*Analysis and recommendations by Claude — December 2024*

## The Core Challenge

We have 31 sophisticated features spanning:
- Statistical overlays (GC skew, complexity, curvature)
- Full-screen visualizations (CGR fractals, Hilbert curves, dot plots, PCA)
- Interactive simulations (lysogeny circuit, ribosome traffic, plaque growth)
- Comparative analyses (dN/dS, synteny, structural variants)
- Predictions and annotations (host range, AMGs, promoters)
- Utilities (virtual gel, sequence logos)

If we expose all 31 features as top-level keybindings, we get:
- **Cognitive overload**: Users can't remember 31 keys
- **Intimidation**: New users see complexity and leave
- **Accidental triggers**: Typos activate unfamiliar features
- **UI clutter**: Help overlay becomes a wall of text

The existing interface is already excellent — clean, focused, discoverable. We must preserve that while adding depth.

---

## Proposed Architecture: The "Depth Layers" Model

### Layer 0: The Sacred Surface (Keep Untouched)

The current interface represents our **core loop**:
```
↑/↓     Navigate phages       ←/→     Scroll sequence
N/C     DNA/Amino acid view   F       Reading frame
T       Theme cycle           D       Diff mode
M       3D model              K       Amino acid key
S       Search                ?       Help
```

**These 12 controls must never change.** They represent the "5-minute experience" — what users learn in their first session. This is our brand.

### Layer 1: Quick Overlays (Single-Keypress Toggles)

For features that augment the existing view without disrupting it, we add **overlay toggles**. These show additional data tracks beneath/above the sequence grid.

**Proposed quick-toggle keys** (unused in Layer 0):
```
G       GC Skew curve + origin/terminus markers
X       Complexity (Kolmogorov) sparkline
B       Bendability/curvature track
P       Promoter/RBS strength annotations
R       Repeat/palindrome markers
```

**Design principles:**
- Each overlay is **independent** — toggle any combination
- Overlays use **consistent visual language** (sparklines, annotation bars)
- Pressing the key again **hides** the overlay
- Status bar shows active overlays: `[G][X][P]`

**Why this works:**
- Single keypress = zero friction for power users
- Discoverable via `?` help (a separate "Overlays" section)
- Non-destructive — main view unchanged when all off

### Layer 2: The Analysis Menu (Press 'A')

For features requiring configuration, multiple inputs, or dedicated screen real estate, we introduce a **modal menu**.

```
╭─────────────────────────────────────────────────────────────╮
│  ANALYSIS MENU                                    [ESC] Close │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SEQUENCE ANALYSIS                                           │
│    [1] GC Skew Origin Detector         (overlays origin)     │
│    [2] Information Anomaly Scanner     (find HGT regions)    │
│    [3] Non-B DNA Structures            (G4, Z-DNA)           │
│    [4] Sequence Logo Generator         (from alignment)      │
│                                                              │
│  COMPARATIVE                                                 │
│    [5] Selection Pressure (dN/dS)      (vs another phage)    │
│    [6] Structural Variants             (vs another phage)    │
│    [7] Synteny Browser                 (multi-phage)         │
│    [8] Genome Comparison Dashboard     (already built!)      │
│                                                              │
│  PREDICTIONS                                                 │
│    [9] Host Range (CRISPR spacers)     (requires DB)         │
│    [0] AMG Pathway Mapper              (metabolic hijacking) │
│    [a] Promoter/RBS Strength           (expression levels)   │
│    [b] Prophage Excision Sites         (att site prediction) │
│    [c] Virion Stability                (therapy formulation) │
│                                                              │
│  WHOLE-GENOME VIEWS                                          │
│    [d] CGR Fractal Fingerprint         (full-screen)         │
│    [e] Hilbert Curve Atlas             (full-screen)         │
│    [f] Self-Homology Dot Plot          (full-screen)         │
│    [g] Tetranucleotide PCA             (full-screen)         │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│  [/] Search features...                                      │
╰─────────────────────────────────────────────────────────────╯
```

**Design principles:**
- **Categorized** — users find features by purpose, not alphabetically
- **Numbered shortcuts** — power users learn favorites (A + 5 = dN/dS)
- **Brief descriptions** — explain what each does in ≤4 words
- **Fuzzy search** — press `/` to filter by keyword
- **ESC always exits** — no trapped states

### Layer 3: The Simulation Hub (Press Shift+S)

Interactive simulations need their own space. They're time-evolving, may need parameter sliders, and fundamentally change the interaction model.

```
╭─────────────────────────────────────────────────────────────╮
│  SIMULATION HUB                                   [ESC] Exit │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  DYNAMIC SIMULATIONS                                         │
│                                                              │
│    [1] Lysogeny Decision Circuit                             │
│        Watch CI/Cro battle unfold — adjust MOI, UV damage    │
│        ════════════════════════════════════════════════════  │
│                                                              │
│    [2] Ribosome Traffic Simulator                            │
│        See translation bottlenecks form in real-time         │
│        ════════════════════════════════════════════════════  │
│                                                              │
│    [3] Plaque Growth Automata                                │
│        Cellular automaton of phage spreading on lawn         │
│        ════════════════════════════════════════════════════  │
│                                                              │
│    [4] Evolution Replay                                      │
│        Watch mutations accumulate across isolates            │
│        ════════════════════════════════════════════════════  │
│                                                              │
│    [5] Packaging Motor Pressure                              │
│        Feel the 60 atmospheres building in the capsid        │
│                                                              │
╰─────────────────────────────────────────────────────────────╯
```

**Design principles:**
- Dedicated space respects simulation complexity
- Each simulation has its own **full-screen mode** with custom controls
- Common controls: `Space` = pause/resume, `R` = reset, `←/→` = speed
- Status bar shows simulation time/state
- ESC returns to main view

### Layer 4: Command Palette (Press ':' or Ctrl+P)

For power users who know what they want, a **fuzzy-search command palette**:

```
╭─────────────────────────────────────────────────────────────╮
│  : gc skew█                                                  │
├─────────────────────────────────────────────────────────────┤
│  → GC Skew Origin Detector       Toggle overlay              │
│    Cumulative GC Skew Analysis   Full analysis view          │
│    GC Content in Comparison      Compare GC %                │
│                                                              │
│  [↑/↓] Navigate   [Enter] Select   [ESC] Cancel              │
╰─────────────────────────────────────────────────────────────╯
```

**Why command palette matters:**
- **Instant access** to any feature with 3-4 keystrokes
- **Discoverable** — users find features by typing concepts
- **Extensible** — future features automatically searchable
- Familiar to developers (VSCode, Sublime, Raycast)

---

## Feature Classification Table

| Feature | Layer | Access | Screen Impact |
|---------|-------|--------|---------------|
| GC Skew curve | L1 | `G` | Overlay |
| Complexity sparkline | L1 | `X` | Overlay |
| Bendability track | L1 | `B` | Overlay |
| Promoter annotations | L1 | `P` | Overlay |
| Repeat markers | L1 | `R` | Overlay |
| dN/dS painter | L2 | `A` → 5 | Overlay + panel |
| Structural variants | L2 | `A` → 6 | Overlay + panel |
| Synteny browser | L2 | `A` → 7 | Full-screen |
| Host range predictor | L2 | `A` → 9 | Panel |
| AMG mapper | L2 | `A` → 0 | Full-screen |
| CGR fractal | L2 | `A` → d | Full-screen |
| Hilbert curve | L2 | `A` → e | Full-screen |
| Dot plot | L2 | `A` → f | Full-screen |
| PCA plot | L2 | `A` → g | Full-screen |
| Lysogeny sim | L3 | `Shift+S` → 1 | Full-screen |
| Ribosome traffic | L3 | `Shift+S` → 2 | Full-screen |
| Plaque automata | L3 | `Shift+S` → 3 | Full-screen |
| Evolution replay | L3 | `Shift+S` → 4 | Full-screen |
| Packaging motor | L3 | `Shift+S` → 5 | Overlay + gauge |
| Virtual gel | L2 | `A` → ... | Panel |
| Sequence logo | L2 | `A` → 4 | Panel |
| (All features) | L4 | `:` | Search |

---

## Implementation Recommendations

### Phase 1: Foundation (Do First)

1. **Overlay System Architecture**
   - Create `OverlayManager` in state store
   - Define `Overlay` interface: `{ id, render, height, position }`
   - Implement overlay stacking logic (max 3 simultaneous?)
   - Add overlay status indicator to status bar

2. **Menu Infrastructure**
   - Create reusable `ModalMenu` component (Ink)
   - Define `MenuItem` interface with icons, shortcuts, actions
   - Implement keyboard navigation (↑/↓, numbers, letters)
   - Add fuzzy search capability

3. **Command Palette**
   - Create `CommandRegistry` singleton
   - All features register with name, keywords, action
   - Implement fuzzy matching (Fuse.js or simple scoring)
   - Hotkey: `:` or `Ctrl+P`

### Phase 2: Quick Overlays (High Impact, Low Effort)

These features benefit most from Layer 1 quick toggles:

| Overlay | Key | Data Source | Complexity |
|---------|-----|-------------|------------|
| GC Skew | `G` | Pure sequence | Low |
| Complexity | `X` | Compression | Low |
| Bendability | `B` | Dinucleotide tables | Medium |
| Promoter/RBS | `P` | Pattern match | Medium |

**Implementation pattern:**
```typescript
// In store
toggleOverlay: (id: OverlayId) => void;
activeOverlays: Set<OverlayId>;

// In component
const gcSkewData = useGCSkew(sequence); // Memoized
if (activeOverlays.has('gc-skew')) {
  return <OverlaySparkline data={gcSkewData} />;
}
```

### Phase 3: Analysis Menu

Create dedicated components for each analysis:

```
packages/tui/src/components/
  AnalysisMenu/
    index.tsx          # Menu modal
    categories.ts      # Category definitions
    items.ts           # MenuItem list
  Analysis/
    DNDSPainter.tsx
    StructuralVariants.tsx
    SyntenyBrowser.tsx
    CGRFractal.tsx
    HilbertAtlas.tsx
    DotPlot.tsx
    ...
```

### Phase 4: Simulation Hub

Simulations need special infrastructure:

```typescript
interface Simulation {
  id: string;
  name: string;
  description: string;

  // Lifecycle
  init: (params: SimParams) => SimState;
  step: (state: SimState, dt: number) => SimState;
  render: (state: SimState) => React.ReactNode;

  // Controls
  parameters: SimParameter[];
  controls: SimControl[];
}
```

Each simulation runs in a dedicated full-screen mode with:
- Parameter sliders (if applicable)
- Play/pause/speed controls
- Reset button
- Current state visualization
- ESC to exit

---

## Progressive Disclosure Strategy

**New User Journey:**

1. **First 5 minutes**: Navigate phages, scroll sequences, toggle DNA/AA view
   - Only Layer 0 needed
   - Help overlay shows only essential controls

2. **First hour**: Discover overlays via help, try diff mode, explore 3D model
   - Layer 0 + some Layer 1
   - Help now shows "Advanced: press A for more..."

3. **Power user**: Uses command palette, runs simulations, does comparative analysis
   - Full Layer 0-4 access
   - Discovers features through exploration

**Key insight**: Every feature should be **reachable in ≤3 keypresses** but **invisible until needed**.

---

## Help System Redesign

Current help is a single overlay. Proposed: **contextual, layered help**.

```
╭─────────────────────────────────────────────────────────────╮
│  HELP                                               [ESC]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  NAVIGATION           │  VIEW CONTROLS                       │
│  ↑/↓  Select phage    │  N/C  DNA / Amino acid               │
│  ←/→  Scroll sequence │  F    Reading frame (1-3)            │
│  PgUp/PgDn  Page      │  T    Theme cycle                    │
│  Home/End   Jump      │  D    Diff mode                      │
│  [/]  Prev/next gene  │  M    3D model                       │
│                       │  K    Amino acid key                 │
│                       │                                      │
│  OVERLAYS (toggle)    │  SEARCH                              │
│  G  GC Skew           │  S or /  Search phages               │
│  X  Complexity        │                                      │
│  B  Bendability       │  ADVANCED                            │
│  P  Promoters         │  A       Analysis Menu               │
│  R  Repeats           │  Shift+S Simulation Hub              │
│                       │  :       Command Palette             │
│                       │                                      │
│  [?] Detailed docs    │  [Q] Quit                            │
╰─────────────────────────────────────────────────────────────╯
```

**Future enhancement**: Press `?` twice for detailed docs, including:
- Each overlay explained
- Each analysis tool described
- Keyboard shortcut cheatsheet

---

## Visual Language Guidelines

To maintain coherence across 31 features:

### Color Semantics
```
Green  (#22c55e)  = Good, conserved, stable, similar
Yellow (#eab308)  = Caution, moderate, neutral
Red    (#ef4444)  = Warning, divergent, unstable, different
Blue   (#3b82f6)  = Informational, cool metrics
Purple (#a855f7)  = Special, unique, notable
Gray   (#6b7280)  = Inactive, background, reference
```

### Graph/Sparkline Standards
```
Height: 3-5 character rows for overlays
Width:  Full terminal width
Scale:  Auto-normalize, show min/max in labels
Style:  Braille dots (⣿⣤⣀) for high resolution
```

### Panel/Modal Standards
```
Border: Single line box drawing (╭╮╰╯─│)
Header: Bold, centered, with close hint
Padding: 1 character on all sides
Max width: 80 characters (or terminal width - 4)
```

---

## State Management Considerations

```typescript
interface AdvancedUIState {
  // Overlay system
  activeOverlays: Set<OverlayId>;
  overlayConfigs: Map<OverlayId, OverlayConfig>;

  // Modal system
  activeModal: ModalId | null;
  modalHistory: ModalId[];  // For back navigation

  // Simulation state
  activeSimulation: SimulationId | null;
  simulationState: SimState | null;
  simulationSpeed: number;
  simulationPaused: boolean;

  // Command palette
  commandPaletteOpen: boolean;
  commandSearch: string;
  commandResults: CommandMatch[];
  selectedCommandIndex: number;

  // Computed data cache
  analysisCache: Map<string, AnalysisResult>;
}
```

Key principle: **Precompute on phage selection, not on feature activation.**

When user selects a phage, we should background-compute:
- GC skew curve
- Complexity profile
- Bendability track
- Promoter predictions

This makes overlays feel **instant** when toggled.

---

## Risk Mitigation

### Risk: Feature bloat slows down main loop
**Mitigation**:
- Lazy-load analysis components (`React.lazy`)
- Precompute in Web Worker / background
- Cache aggressively in SQLite

### Risk: Users get lost in menus
**Mitigation**:
- ESC always returns to main view
- Breadcrumb trail in status bar
- "Back" action in every modal

### Risk: Mobile/small terminal breaks
**Mitigation**:
- Detect terminal size, hide overlays if too small
- Stack overlays vertically if narrow
- Minimum viable mode: Layer 0 only

### Risk: Too many keybindings conflict
**Mitigation**:
- Layer 0 = unmodified lowercase letters
- Layer 1 = specific lowercase letters (G, X, B, P, R)
- Layer 2/3 = Shift+letter or menu selection
- Layer 4 = `:` prefix (command mode)

---

## Summary

The **Depth Layers** model preserves what makes Phage Explorer excellent while enabling 31 advanced features:

| Layer | Access | Audience | Features |
|-------|--------|----------|----------|
| L0 | Direct keys | Everyone | 12 core controls |
| L1 | Single keys | Intermediate | 5 quick overlays |
| L2 | `A` menu | Researchers | ~15 analyses |
| L3 | `Shift+S` menu | Explorers | 5 simulations |
| L4 | `:` palette | Power users | Everything |

**Total keystrokes to any feature**: 1-3
**Visible complexity for new users**: 12 controls
**Available power for experts**: 31+ features

The architecture is **extensible** — future features (32, 33, ...) simply register in the command palette and appear in the appropriate menu category.

---

*End of UI Architecture Recommendations*