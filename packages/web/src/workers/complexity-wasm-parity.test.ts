import { describe, expect, it } from 'bun:test';

const wasm = await import('@phage/wasm-compute');
if (typeof (wasm as unknown as { default?: () => Promise<void> }).default === 'function') {
  await (wasm as unknown as { default: () => Promise<void> }).default();
}

function windowedEntropyJs(sequence: string, windowSize: number, stepSize: number): number[] {
  const seq = sequence.toUpperCase();
  const out: number[] = [];

  for (let i = 0; i < seq.length - windowSize; i += stepSize) {
    const window = seq.slice(i, i + windowSize);
    const counts = { A: 0, C: 0, G: 0, T: 0 } as const;
    const mutable: Record<keyof typeof counts, number> = { ...counts };

    for (let j = 0; j < window.length; j++) {
      const ch = window[j];
      if (ch === 'A') mutable.A++;
      else if (ch === 'C') mutable.C++;
      else if (ch === 'G') mutable.G++;
      else if (ch === 'T' || ch === 'U') mutable.T++;
    }

    const total = mutable.A + mutable.C + mutable.G + mutable.T;
    if (total === 0) {
      out.push(0);
      continue;
    }

    let ent = 0;
    for (const c of Object.values(mutable)) {
      if (c === 0) continue;
      const p = c / total;
      ent -= p * Math.log2(p);
    }
    out.push(ent / 2);
  }

  return out;
}

function expectFloat64ArrayClose(actual: Float64Array, expected: number[], tol = 1e-12): void {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < expected.length; i++) {
    const diff = Math.abs((actual[i] ?? 0) - (expected[i] ?? 0));
    if (diff > tol) {
      throw new Error(`Mismatch at ${i}: got ${actual[i]}, expected ${expected[i]} (|diff|=${diff})`);
    }
  }
}

describe('compute_windowed_entropy_acgt (WASM) parity', () => {
  it('matches JS reference (ACGTACGT, window=4)', () => {
    const seq = 'ACGTACGT';
    const windowSize = 4;
    const stepSize = Math.max(1, Math.floor(windowSize / 2));

    const expected = windowedEntropyJs(seq, windowSize, stepSize);
    const actual = wasm.compute_windowed_entropy_acgt(seq, windowSize, stepSize);
    expectFloat64ArrayClose(actual, expected);
  });

  it('matches JS reference for low entropy windows (AAAAAA, window=4)', () => {
    const seq = 'AAAAAA';
    const windowSize = 4;
    const stepSize = Math.max(1, Math.floor(windowSize / 2));

    const expected = windowedEntropyJs(seq, windowSize, stepSize);
    const actual = wasm.compute_windowed_entropy_acgt(seq, windowSize, stepSize);
    expectFloat64ArrayClose(actual, expected);
  });

  it('returns empty for n <= window_size (ANNT, window=4)', () => {
    const seq = 'ANNT';
    const windowSize = 4;
    const stepSize = Math.max(1, Math.floor(windowSize / 2));

    const actual = wasm.compute_windowed_entropy_acgt(seq, windowSize, stepSize);
    expect(actual.length).toBe(0);
  });
});
