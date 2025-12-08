import App from './App';
import './styles.css';

const container = document.getElementById('root');

if (container) {
  container.innerHTML = '';
  // Render without React runtime to avoid hook/version clashes in the static landing.
  // App returns plain JSX which gets compiled to static HTML.
  container.appendChild((() => {
    const wrapper = document.createElement('div');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore JSX compiled to h() calls; we simply use template here.
    wrapper.innerHTML = `
      <div class="app-shell">
        <header class="hero">
          <h1>Phage Explorer</h1>
          <p class="text-dim">Terminal-inspired genome explorer. Build locally with Bun or run the TUI binary.</p>
          <div class="actions">
            <a class="btn" href="https://github.com/Dicklesworthstone/phage_explorer" target="_blank" rel="noreferrer">View on GitHub</a>
            <a class="btn" href="https://raw.githubusercontent.com/Dicklesworthstone/phage_explorer/main/install.sh" target="_blank" rel="noreferrer">Install Script</a>
          </div>
        </header>
        <main class="cards-grid">
          <section class="card">
            <h2>Keyboard-First</h2>
            <p>Navigate genomes, overlays, and analyses entirely from the keyboard.</p>
          </section>
          <section class="card">
            <h2>Analysis Overlays</h2>
            <p>GC skew, complexity, repeats, HGT, dot plots, Hilbert maps, and more.</p>
          </section>
          <section class="card">
            <h2>Local &amp; Private</h2>
            <p>No cloud dependency. Works offline with the bundled SQLite phage database.</p>
          </section>
          <section class="card">
            <h2>Build Instructions</h2>
            <p><code>bun install</code> · <code>bun run build:db</code> · <code>bun run dev</code></p>
          </section>
        </main>
      </div>`;
    return wrapper.firstElementChild as HTMLElement;
  })());
}
