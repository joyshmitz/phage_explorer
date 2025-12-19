/**
 * GpuWasmBenchmarkOverlay (dev-only)
 *
 * Small in-browser benchmark harness to compare WebGPU compute vs WASM compute
 * on real genome windows.
 *
 * This is intentionally hidden from production builds by only being surfaced in
 * dev UI entry points (hotkey + AnalysisMenu dev section).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { PhageFull } from '@phage-explorer/core';
import type { PhageRepository } from '../../db';
import { useTheme } from '../../hooks/useTheme';
import { useHotkey } from '../../hooks/useHotkey';
import { detectWebGPU } from '../../utils';
import { gpuCompute } from '../../workers/gpu/GPUCompute';
import { Overlay } from './Overlay';
import { useOverlay } from './OverlayProvider';
import type * as WasmComputeTypes from '@phage/wasm-compute';

type BenchBackend = 'gpu' | 'wasm';
type BenchOp = 'kmer' | 'gc-skew';
type WasmComputeModule = typeof WasmComputeTypes;

interface BenchRow {
  backend: BenchBackend;
  op: BenchOp;
  supported: boolean;
  warmupMs?: number;
  medianMs?: number;
  runs?: number;
  notes?: string;
  error?: string;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function formatMs(value: number | undefined): string {
  if (value === undefined) return '—';
  return `${Math.round(value * 100) / 100} ms`;
}

async function yieldToUi(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

async function benchAsync(args: {
  warmup: () => Promise<void>;
  run: () => Promise<void>;
  runs: number;
}): Promise<{ warmupMs: number; medianMs: number; samples: number[] }> {
  const { warmup, run, runs } = args;
  const samples: number[] = [];

  const t0 = performance.now();
  await warmup();
  const warmupMs = performance.now() - t0;

  for (let i = 0; i < runs; i++) {
    await yieldToUi();
    const start = performance.now();
    await run();
    samples.push(performance.now() - start);
  }

  return { warmupMs, medianMs: median(samples), samples };
}

interface GpuWasmBenchmarkOverlayProps {
  repository: PhageRepository | null;
  currentPhage: PhageFull | null;
}

export function GpuWasmBenchmarkOverlay({
  repository,
  currentPhage,
}: GpuWasmBenchmarkOverlayProps): React.ReactElement | null {
  if (!import.meta.env.DEV) return null;

  const { theme } = useTheme();
  const colors = theme.colors;
  const { isOpen, toggle, isMobile } = useOverlay();

  const [sampleBp, setSampleBp] = useState(100_000);
  const [k, setK] = useState(6);
  const [gcWindow, setGcWindow] = useState(1000);
  const [gcStep, setGcStep] = useState(250);
  const [runs, setRuns] = useState(7);

  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<BenchRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    phageName: string;
    genomeBp: number;
    sampleBp: number;
    webgpu: Awaited<ReturnType<typeof detectWebGPU>> | null;
  } | null>(null);

  const runIdRef = useRef(0);

  // Hotkey: Alt+Shift+B
  useHotkey(
    { key: 'b', modifiers: { alt: true, shift: true } },
    'GPU vs WASM Benchmark',
    () => toggle('gpuWasmBenchmark'),
    { modes: ['NORMAL'], category: 'Dev', minLevel: 'power' }
  );

  // Reset state when closing
  useEffect(() => {
    if (isOpen('gpuWasmBenchmark')) return;
    setRunning(false);
    setRows([]);
    setError(null);
    setMeta(null);
  }, [isOpen]);

  const canRun = useMemo(() => {
    return Boolean(repository && currentPhage && !running);
  }, [repository, currentPhage, running]);

  async function runBenchmark(): Promise<void> {
    if (!repository || !currentPhage) {
      setError('Select a phage first.');
      return;
    }

    const runId = ++runIdRef.current;
    setRunning(true);
    setError(null);
    setRows([]);
    setMeta(null);

    try {
      const tryLoadWasm = async (): Promise<{
        ok: boolean;
        module?: WasmComputeModule;
        error?: string;
      }> => {
        try {
          const wasm = await import('@phage/wasm-compute');
          // Some builds auto-init; calling init() again should be a no-op, but keep it best-effort.
          try {
            await wasm.default?.();
          } catch {
            // Ignore init errors; the functions may still be usable depending on bundler output.
          }
          return { ok: true, module: wasm };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : String(err) };
        }
      };

      const [webgpuInfo, wasm] = await Promise.all([detectWebGPU(), tryLoadWasm()]);
      if (runIdRef.current !== runId) return;

      const genomeBp = await repository.getFullGenomeLength(currentPhage.id);
      const usedSampleBp = Math.max(1, Math.min(genomeBp, sampleBp));
      const sequence = await repository.getSequenceWindow(currentPhage.id, 0, usedSampleBp);
      const seq = sequence.toUpperCase();

      setMeta({
        phageName: currentPhage.name,
        genomeBp,
        sampleBp: usedSampleBp,
        webgpu: webgpuInfo,
      });

      const nextRows: BenchRow[] = [];

      // ---------------------------------------------------------------------
      // GPU benchmarks
      // ---------------------------------------------------------------------
      const gpuSupported = webgpuInfo.supported && (await gpuCompute.ready());

      if (!gpuSupported) {
        nextRows.push({
          backend: 'gpu',
          op: 'kmer',
          supported: false,
          notes: webgpuInfo.supported ? 'GPU init failed' : webgpuInfo.reason,
        });
        nextRows.push({
          backend: 'gpu',
          op: 'gc-skew',
          supported: false,
          notes: webgpuInfo.supported ? 'GPU init failed' : webgpuInfo.reason,
        });
      } else {
        // k-mer (GPU)
        try {
          const measured = await benchAsync({
            warmup: async () => {
              const result = await gpuCompute.countKmers(seq, k);
              if (!result) throw new Error('GPU k-mer returned null');
            },
            run: async () => {
              const result = await gpuCompute.countKmers(seq, k);
              if (!result) throw new Error('GPU k-mer returned null');
            },
            runs,
          });
          nextRows.push({
            backend: 'gpu',
            op: 'kmer',
            supported: true,
            warmupMs: measured.warmupMs,
            medianMs: measured.medianMs,
            runs,
            notes: `k=${k}`,
          });
        } catch (err) {
          nextRows.push({
            backend: 'gpu',
            op: 'kmer',
            supported: false,
            error: err instanceof Error ? err.message : String(err),
            notes: `k=${k}`,
          });
        }

        // GC skew (GPU)
        try {
          const measured = await benchAsync({
            warmup: async () => {
              const result = await gpuCompute.computeGCSkew(seq, gcWindow, gcStep);
              if (!result) throw new Error('GPU GC skew returned null');
            },
            run: async () => {
              const result = await gpuCompute.computeGCSkew(seq, gcWindow, gcStep);
              if (!result) throw new Error('GPU GC skew returned null');
            },
            runs,
          });
          nextRows.push({
            backend: 'gpu',
            op: 'gc-skew',
            supported: true,
            warmupMs: measured.warmupMs,
            medianMs: measured.medianMs,
            runs,
            notes: `window=${gcWindow}, step=${gcStep}`,
          });
        } catch (err) {
          nextRows.push({
            backend: 'gpu',
            op: 'gc-skew',
            supported: false,
            error: err instanceof Error ? err.message : String(err),
            notes: `window=${gcWindow}, step=${gcStep}`,
          });
        }
      }

      // ---------------------------------------------------------------------
      // WASM benchmarks
      // ---------------------------------------------------------------------
      if (!wasm.ok || !wasm.module) {
        nextRows.push({
          backend: 'wasm',
          op: 'kmer',
          supported: false,
          notes: wasm.error ?? 'WASM module failed to load',
        });
        nextRows.push({
          backend: 'wasm',
          op: 'gc-skew',
          supported: false,
          notes: wasm.error ?? 'WASM module failed to load',
        });
      } else {
        // k-mer (WASM) - use analyze_kmers(seq, seq) as a k-mer-heavy proxy.
        try {
          const measured = await benchAsync({
            warmup: async () => {
              const r = wasm.module!.analyze_kmers(seq, seq, k);
              r.free();
            },
            run: async () => {
              const r = wasm.module!.analyze_kmers(seq, seq, k);
              r.free();
            },
            runs,
          });
          nextRows.push({
            backend: 'wasm',
            op: 'kmer',
            supported: true,
            warmupMs: measured.warmupMs,
            medianMs: measured.medianMs,
            runs,
            notes: `analyze_kmers(seq, seq), k=${k}`,
          });
        } catch (err) {
          nextRows.push({
            backend: 'wasm',
            op: 'kmer',
            supported: false,
            error: err instanceof Error ? err.message : String(err),
            notes: `k=${k}`,
          });
        }

        // GC skew (WASM)
        try {
          const measured = await benchAsync({
            warmup: async () => {
              void wasm.module!.compute_gc_skew(seq, gcWindow, gcStep);
            },
            run: async () => {
              void wasm.module!.compute_gc_skew(seq, gcWindow, gcStep);
            },
            runs,
          });
          nextRows.push({
            backend: 'wasm',
            op: 'gc-skew',
            supported: true,
            warmupMs: measured.warmupMs,
            medianMs: measured.medianMs,
            runs,
            notes: `compute_gc_skew(window=${gcWindow}, step=${gcStep})`,
          });
        } catch (err) {
          nextRows.push({
            backend: 'wasm',
            op: 'gc-skew',
            supported: false,
            error: err instanceof Error ? err.message : String(err),
            notes: `window=${gcWindow}, step=${gcStep}`,
          });
        }
      }

      if (runIdRef.current !== runId) return;
      setRows(nextRows);
    } catch (err) {
      if (runIdRef.current !== runId) return;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (runIdRef.current === runId) {
        setRunning(false);
      }
    }
  }

  if (!isOpen('gpuWasmBenchmark')) return null;

  const rowBg = colors.backgroundAlt;
  const tableBorder = colors.borderLight;

  return (
    <Overlay id="gpuWasmBenchmark" title="GPU vs WASM BENCHMARK (Dev)" hotkey="Alt+Shift+B" size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ color: colors.textMuted, fontFamily: 'monospace', fontSize: '0.85rem' }}>
          Runs on the current phage’s first window and reports median timings. Numbers vary by browser/GPU/thermal state.
        </div>

        {error && (
          <div style={{ color: colors.error, fontFamily: 'monospace' }}>
            {error}
          </div>
        )}

        {/* Controls */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))',
            gap: '0.75rem',
            padding: '0.75rem',
            border: `1px solid ${tableBorder}`,
            borderRadius: '6px',
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ color: colors.textMuted, fontSize: '0.8rem' }}>Sample bp</span>
            <input
              type="number"
              value={sampleBp}
              min={1000}
              step={1000}
              onChange={(e) => setSampleBp(Math.max(1000, Number(e.target.value) || 1000))}
              style={{ padding: '0.35rem', borderRadius: '4px', border: `1px solid ${tableBorder}` }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ color: colors.textMuted, fontSize: '0.8rem' }}>k (k-mer)</span>
            <input
              type="number"
              value={k}
              min={2}
              max={12}
              step={1}
              onChange={(e) => setK(Math.max(2, Math.min(12, Number(e.target.value) || 6)))}
              style={{ padding: '0.35rem', borderRadius: '4px', border: `1px solid ${tableBorder}` }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ color: colors.textMuted, fontSize: '0.8rem' }}>Runs</span>
            <input
              type="number"
              value={runs}
              min={3}
              max={15}
              step={1}
              onChange={(e) => setRuns(Math.max(3, Math.min(15, Number(e.target.value) || 7)))}
              style={{ padding: '0.35rem', borderRadius: '4px', border: `1px solid ${tableBorder}` }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ color: colors.textMuted, fontSize: '0.8rem' }}>GC window</span>
            <input
              type="number"
              value={gcWindow}
              min={100}
              step={50}
              onChange={(e) => setGcWindow(Math.max(100, Number(e.target.value) || 1000))}
              style={{ padding: '0.35rem', borderRadius: '4px', border: `1px solid ${tableBorder}` }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ color: colors.textMuted, fontSize: '0.8rem' }}>GC step</span>
            <input
              type="number"
              value={gcStep}
              min={1}
              step={1}
              onChange={(e) => setGcStep(Math.max(1, Number(e.target.value) || 250))}
              style={{ padding: '0.35rem', borderRadius: '4px', border: `1px solid ${tableBorder}` }}
            />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => void runBenchmark()}
              disabled={!canRun}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: `1px solid ${tableBorder}`,
                backgroundColor: canRun ? colors.accent : colors.backgroundAlt,
                color: canRun ? colors.background : colors.textMuted,
                cursor: canRun ? 'pointer' : 'not-allowed',
                fontWeight: 600,
              }}
            >
              {running ? 'Running…' : 'Run benchmark'}
            </button>
          </div>
        </div>

        {/* Meta */}
        {meta && (
          <div style={{ color: colors.textMuted, fontFamily: 'monospace', fontSize: '0.85rem' }}>
            Phage: {meta.phageName} · Genome: {meta.genomeBp.toLocaleString()} bp · Sample: {meta.sampleBp.toLocaleString()} bp
            {meta.webgpu && meta.webgpu.supported && meta.webgpu.adapterInfo?.name
              ? ` · WebGPU: ${meta.webgpu.adapterInfo.name}`
              : meta.webgpu && !meta.webgpu.supported
                ? ` · WebGPU: ${meta.webgpu.reason}`
                : ''}
          </div>
        )}

        {/* Results */}
        <div style={{ border: `1px solid ${tableBorder}`, borderRadius: '6px', overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '110px 90px 110px 110px 1fr',
              gap: '0',
              backgroundColor: rowBg,
              borderBottom: `1px solid ${tableBorder}`,
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              padding: '0.5rem 0.75rem',
            }}
          >
            <div style={{ color: colors.textMuted }}>Backend</div>
            <div style={{ color: colors.textMuted }}>Op</div>
            <div style={{ color: colors.textMuted }}>Warmup</div>
            <div style={{ color: colors.textMuted }}>Median</div>
            <div style={{ color: colors.textMuted }}>Notes</div>
          </div>

          {(rows.length === 0 ? [null] : rows).map((row, idx) => {
            if (!row) {
              return (
                <div key="empty" style={{ padding: '0.75rem', color: colors.textMuted, fontFamily: 'monospace' }}>
                  {repository && currentPhage ? 'Run the benchmark to see results.' : 'Select a phage to enable benchmarking.'}
                </div>
              );
            }

            const supportedColor = row.supported ? colors.success : colors.textMuted;
            const backendLabel = row.backend === 'gpu' ? 'WebGPU' : 'WASM';
            const opLabel = row.op === 'kmer' ? 'k-mer' : 'GC skew';
            const note = row.error ? `${row.notes ?? ''} ${row.error}`.trim() : row.notes ?? '';

            return (
              <div
                key={`${row.backend}-${row.op}-${idx}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '110px 90px 110px 110px 1fr',
                  padding: '0.5rem 0.75rem',
                  borderBottom: idx === rows.length - 1 ? 'none' : `1px solid ${tableBorder}`,
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ color: supportedColor }}>{backendLabel}</div>
                <div style={{ color: colors.textDim }}>{opLabel}</div>
                <div style={{ color: colors.text }}>{formatMs(row.warmupMs)}</div>
                <div style={{ color: colors.text }}>{formatMs(row.medianMs)}</div>
                <div style={{ color: row.error ? colors.error : colors.textMuted }}>{note || '—'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Overlay>
  );
}

export default GpuWasmBenchmarkOverlay;
