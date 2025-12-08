import './styles.css';

// Minimal static landing content (no React hooks) to avoid client/runtime crashes.
export default function App(): JSX.Element {
  return (
    <div className="app-shell">
      <header className="hero">
        <h1>Phage Explorer</h1>
        <p className="text-dim">
          Terminal-inspired genome explorer. Build locally with Bun or run the TUI binary.
        </p>
        <div className="actions">
          <a className="btn" href="https://github.com/Dicklesworthstone/phage_explorer" target="_blank" rel="noreferrer">
            View on GitHub
          </a>
          <a className="btn" href="https://raw.githubusercontent.com/Dicklesworthstone/phage_explorer/main/install.sh" target="_blank" rel="noreferrer">
            Install Script
          </a>
        </div>
      </header>

      <main className="cards-grid">
        <section className="card">
          <h2>Keyboard-First</h2>
          <p>Navigate genomes, overlays, and analyses entirely from the keyboard.</p>
        </section>
        <section className="card">
          <h2>Analysis Overlays</h2>
          <p>GC skew, complexity, repeats, HGT, dot plots, Hilbert maps, and more.</p>
        </section>
        <section className="card">
          <h2>Local &amp; Private</h2>
          <p>No cloud dependency. Works offline with the bundled SQLite phage database.</p>
        </section>
        <section className="card">
          <h2>Build Instructions</h2>
          <p>
            <code>bun install</code> · <code>bun run build:db</code> · <code>bun run dev</code>
          </p>
        </section>
      </main>
    </div>
  );
}
