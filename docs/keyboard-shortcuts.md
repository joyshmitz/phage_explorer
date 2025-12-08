# Phage Explorer Keyboard Reference

Single-source key map for the TUI and the upcoming web UI. Keep these bindings stable; add new actions in higher layers and respect unlock tiers (novice → intermediate ~5 min, power ~60 min or manual promotion).

## Layer 0 — Always On (Novice)

| Keys | Action |
| --- | --- |
| `↑` / `↓` | Previous / next phage |
| `←` / `→` | Scroll sequence left / right (10 bp steps) |
| `PgUp` / `PgDn` | Scroll by page (±100 bp) |
| `Home` / `End` | Jump to start / end of genome |
| `[` / `]` | Jump to previous / next gene |
| `N` / `C` / `Space` | Toggle DNA ↔ amino acid view |
| `F` | Cycle reading frame (AA view) |
| `T` | Cycle color theme |
| `D` | Toggle diff vs reference |
| `M` | Toggle 3D model |
| `Z` | Toggle 3D fullscreen (restricted controls while active) |
| `F1` / `?` | Help overlay (tap ? inside help to toggle detail) |
| `K` | Amino-acid color legend |
| `S` / `/` | Search phages |
| `W` | Open comparison view |
| `Esc` | Close overlay / start quit confirmation |
| `Esc×2` / `Q×2` | Quit (requires double-press for safety) |

## Intermediate Layer — Unlock After ~5 Minutes

| Keys | Overlay / Menu |
| --- | --- |
| `G` | GC skew |
| `X` | Sequence complexity |
| `V` | Packaging pressure |
| `B` | Bendability |
| `P` | Promoter / RBS motifs |
| `R` | Repeats & palindromes |
| `J` | K-mer anomaly |
| `H` | HGT passport |
| `E` | Tail fiber tropism (receptor atlas) |
| `L` | Module coherence |
| `Y` | Transcription flow |
| `Shift+P` | Phase portraits (AA property PCA) |
| `A` | Analysis menu (drawer) |

## Power Layer — Unlock After ~60 Minutes

| Keys | Feature |
| --- | --- |
| `Shift+S` | Simulation hub |
| `:` or `Ctrl+P` | Command palette |
| `Ctrl+F` | Fold quickview (structure hints) |

## 3D Model Controls (Fullscreen)

| Keys | Action |
| --- | --- |
| `Z` | Exit fullscreen |
| `O` / `P` | Pause / resume rotation |
| `R` | Cycle quality (low → ultra) |
| `Q` | Quit |

## Function Keys — Quick Access (Always Available)

The F-keys provide instant access to the most visually impressive features without unlock requirements:

| Keys | Feature |
| --- | --- |
| `F1` | Help overlay |
| `F2` | Toggle 3D model |
| `F3` | Phase portraits (AA property PCA visualization) |
| `F4` | Bias decomposition (dinucleotide/codon PCA scatter) |
| `F5` | HGT passport (genomic island visualization) |
| `F6` | CRISPR pressure map |
| `F7` | Genome comparison view |
| `F8` | Simulation hub |
| `F9` | GC skew overlay |
| `F10` | Analysis menu |

Note: F11 is intentionally omitted (reserved for terminal fullscreen in Windows).

## Behavior Notes

- `Esc` closes the topmost overlay; if 3D is fullscreen, it exits fullscreen first. If nothing is open, starts quit confirmation.
- Press `Esc` or `Q` twice to quit (safety feature to prevent accidental exits).
- Overlays handle their own internal navigation (arrow keys, Enter). The tables above cover global bindings only.
- Keep key names and unlock tiers identical between TUI and web to preserve muscle memory; add web-only shortcuts in higher layers to avoid conflicts.
