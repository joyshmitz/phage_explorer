import type { GenomeComparisonResult } from '@phage-explorer/comparison';
import { compareGenomes } from '@phage-explorer/comparison';

interface ComparisonJob {
  phageA: { id: number; name: string; accession: string };
  phageB: { id: number; name: string; accession: string };
  sequenceA: string;
  sequenceB: string;
  genesA: any[];
  genesB: any[];
  codonUsageA?: any | null;
  codonUsageB?: any | null;
}

interface WorkerMessage {
  ok: boolean;
  result?: GenomeComparisonResult;
  error?: string;
}

self.onmessage = async (event: MessageEvent<ComparisonJob>) => {
  const job = event.data;
  const message: WorkerMessage = { ok: false };
  try {
    const result = await compareGenomes(
      job.phageA,
      job.phageB,
      job.sequenceA,
      job.sequenceB,
      job.genesA,
      job.genesB,
      job.codonUsageA ?? null,
      job.codonUsageB ?? null
    );
    message.ok = true;
    message.result = result;
  } catch (err) {
    message.error = err instanceof Error ? err.message : 'Comparison failed';
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (self as any).postMessage(message);
};

