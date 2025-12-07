import type { GeneInfo } from './types';

export type ModuleId =
  | 'replication'
  | 'packaging'
  | 'capsid'
  | 'tail'
  | 'lysis'
  | 'regulation';

export interface ModuleExpectation {
  id: ModuleId;
  label: string;
  keywords: string[];
  min: number;
  max?: number;
}

export interface ModuleStatus {
  id: ModuleId;
  label: string;
  count: number;
  min: number;
  max?: number;
  score: number; // 0..1
  issues: string[];
  matchedGenes: GeneInfo[];
}

export interface ModuleReport {
  statuses: ModuleStatus[];
  overall: number; // 0..1
}

const EXPECTATIONS: ModuleExpectation[] = [
  {
    id: 'replication',
    label: 'Replication',
    keywords: ['polymerase', 'primase', 'helicase', 'ligase', 'exonuclease', 'dna-binding protein'],
    min: 1,
  },
  {
    id: 'packaging',
    label: 'Packaging',
    keywords: ['terminase', 'portal', 'head morphogenesis', 'head completion', 'prohead', 'head scaffolding'],
    min: 2,
  },
  {
    id: 'capsid',
    label: 'Capsid',
    keywords: ['capsid', 'coat', 'head', 'major capsid', 'scaffolding'],
    min: 1,
  },
  {
    id: 'tail',
    label: 'Tail',
    keywords: ['tail', 'baseplate', 'sheath', 'tube', 'tail fiber', 'tailspike', 'adapter', 'tail assembly'],
    min: 2,
  },
  {
    id: 'lysis',
    label: 'Lysis',
    keywords: ['holin', 'endolysin', 'lysin', 'spanin', 'lysozyme'],
    min: 1,
    max: 3,
  },
  {
    id: 'regulation',
    label: 'Regulation',
    keywords: ['repressor', 'integrase', 'excisionase', 'cro', 'transcriptional regulator'],
    min: 1,
  },
];

function normalize(text: string | null | undefined): string {
  return (text ?? '').toLowerCase();
}

function geneMatches(expectation: ModuleExpectation, gene: GeneInfo): boolean {
  const fields = [gene.name, gene.product, gene.locusTag].map(normalize);
  return expectation.keywords.some(kw => fields.some(f => f.includes(kw)));
}

export function computeModuleCoherence(genes: GeneInfo[]): ModuleReport {
  const statuses: ModuleStatus[] = [];

  for (const exp of EXPECTATIONS) {
    const matchedGenes = genes.filter(g => geneMatches(exp, g));
    const count = matchedGenes.length;

    let score = 1;
    const issues: string[] = [];

    if (count < exp.min) {
      score = count === 0 ? 0 : 0.5;
      issues.push(`Missing ${exp.min - count} required gene(s)`);
    }

    if (exp.max !== undefined && count > exp.max) {
      score = Math.min(score, 0.6);
      issues.push(`Possible excess (${count}/${exp.max})`);
    }

    statuses.push({
      id: exp.id,
      label: exp.label,
      count,
      min: exp.min,
      max: exp.max,
      score,
      issues,
      matchedGenes,
    });
  }

  const overall = statuses.reduce((sum, s) => sum + s.score, 0) / statuses.length;

  return { statuses, overall };
}
