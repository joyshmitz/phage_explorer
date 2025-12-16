/**
 * DNABasics Module
 *
 * Educational module: DNA basics for engineers.
 * Covers 4-base alphabet, double helix structure, base pairing rules,
 * directionality (5' to 3'), complementary strands.
 *
 * Part of the Educational Layer epic (phage_explorer-2uo1).
 */

import React, { useState, useMemo } from 'react';
import { useBeginnerMode } from '../hooks/useBeginnerMode';
import { DNAHelixVisualizer } from '../components/DNAHelixVisualizer';
import type { ModuleId } from '../types';

const MODULE_ID: ModuleId = 'dna-basics';

type BaseInfo = {
  letter: string;
  name: string;
  type: 'purine' | 'pyrimidine';
  pairsWithLetter: string;
  pairsWithName: string;
  bonds: number;
  color: string;
  description: string;
};

const BASES: BaseInfo[] = [
  {
    letter: 'A',
    name: 'Adenine',
    type: 'purine',
    pairsWithLetter: 'T',
    pairsWithName: 'Thymine',
    bonds: 2,
    color: '#22c55e',
    description: 'A purine with two ring structures. Always pairs with Thymine via 2 hydrogen bonds.',
  },
  {
    letter: 'T',
    name: 'Thymine',
    type: 'pyrimidine',
    pairsWithLetter: 'A',
    pairsWithName: 'Adenine',
    bonds: 2,
    color: '#ef4444',
    description: 'A pyrimidine with one ring. Always pairs with Adenine. (In RNA, Uracil replaces T.)',
  },
  {
    letter: 'G',
    name: 'Guanine',
    type: 'purine',
    pairsWithLetter: 'C',
    pairsWithName: 'Cytosine',
    bonds: 3,
    color: '#3b82f6',
    description: 'A purine with two ring structures. Always pairs with Cytosine via 3 hydrogen bonds.',
  },
  {
    letter: 'C',
    name: 'Cytosine',
    type: 'pyrimidine',
    pairsWithLetter: 'G',
    pairsWithName: 'Guanine',
    bonds: 3,
    color: '#f59e0b',
    description: 'A pyrimidine with one ring. Always pairs with Guanine. (Found in both DNA and RNA.)',
  },
];

type AnalogyConcept = {
  dna: string;
  computing: string;
  detail: string;
};

const ANALOGIES: AnalogyConcept[] = [
  {
    dna: '4 bases (A, T, G, C)',
    computing: 'Base-4 encoding',
    detail: 'Like hexadecimal uses 0-9 + A-F, DNA uses 4 symbols. Each base is ~2 bits of information.',
  },
  {
    dna: 'Double strand',
    computing: 'RAID mirroring',
    detail: 'Complementary strands = redundancy. If one strand is damaged, the other provides the template.',
  },
  {
    dna: '5\' → 3\' direction',
    computing: 'Big-endian / Little-endian',
    detail: 'Enzymes always read DNA in one direction, like processors read memory addresses.',
  },
  {
    dna: 'Genome length',
    computing: 'File size',
    detail: 'Human genome ≈ 3 billion bp ≈ 750 MB when compressed. E. coli ≈ 4.6 Mbp ≈ 1.15 MB.',
  },
];

type KeyRule = {
  rule: string;
  explanation: string;
  color?: string;
};

const KEY_RULES: KeyRule[] = [
  {
    rule: 'A pairs with T (2 H-bonds)',
    explanation: 'Adenine and Thymine are held together by 2 hydrogen bonds.',
    color: '#22c55e',
  },
  {
    rule: 'G pairs with C (3 H-bonds)',
    explanation: 'Guanine and Cytosine are held together by 3 hydrogen bonds—stronger binding.',
    color: '#3b82f6',
  },
  {
    rule: 'Strands are anti-parallel',
    explanation: 'One strand runs 5\'→3\', the other runs 3\'→5\'. They\'re oriented in opposite directions.',
    color: '#8b5cf6',
  },
  {
    rule: 'GC content affects stability',
    explanation: 'More G-C pairs = higher melting temperature. Extremophiles often have high GC genomes.',
    color: '#f59e0b',
  },
];

function BaseCard({
  base,
  isSelected,
  onClick,
}: {
  base: BaseInfo;
  isSelected: boolean;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '16px',
        borderRadius: '12px',
        border: isSelected ? `2px solid ${base.color}` : '1px solid var(--color-border-subtle)',
        background: isSelected
          ? `linear-gradient(135deg, ${base.color}22, ${base.color}11)`
          : 'var(--color-surface-1, rgba(255,255,255,0.02))',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: base.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 700,
            color: '#fff',
          }}
        >
          {base.letter}
        </span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '16px' }}>{base.name}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', textTransform: 'capitalize' }}>
            {base.type}
          </div>
        </div>
      </div>
      <div style={{ fontSize: '13px', color: 'var(--color-text-dim)' }}>
        Pairs with <strong style={{ color: BASES.find((b) => b.letter === base.pairsWithLetter)?.color }}>
          {base.pairsWithName}
        </strong>{' '}
        ({base.bonds} H-bonds)
      </div>
    </button>
  );
}

function DirectionalityDiagram(): React.ReactElement {
  return (
    <div
      aria-label="DNA strand directionality diagram"
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
        borderRadius: '16px',
        padding: '20px',
        minHeight: '160px',
      }}
    >
      <svg viewBox="0 0 300 120" role="img" aria-hidden="true" style={{ width: '100%', height: '100%' }}>
        {/* 5' to 3' strand */}
        <rect x="30" y="20" width="240" height="24" rx="4" fill="#3b82f6" opacity="0.9" />
        <text x="20" y="36" fill="#3b82f6" fontSize="12" fontWeight="700">
          5'
        </text>
        <text x="278" y="36" fill="#3b82f6" fontSize="12" fontWeight="700">
          3'
        </text>
        <text x="150" y="36" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">
          5' → 3' (Top strand)
        </text>
        <path d="M 250 32 L 268 32 M 260 27 L 268 32 L 260 37" stroke="#fff" strokeWidth="2" fill="none" />

        {/* Hydrogen bonds */}
        <g stroke="#6b7280" strokeWidth="1" strokeDasharray="3">
          <line x1="60" y1="44" x2="60" y2="76" />
          <line x1="100" y1="44" x2="100" y2="76" />
          <line x1="140" y1="44" x2="140" y2="76" />
          <line x1="180" y1="44" x2="180" y2="76" />
          <line x1="220" y1="44" x2="220" y2="76" />
        </g>

        {/* 3' to 5' strand */}
        <rect x="30" y="76" width="240" height="24" rx="4" fill="#22c55e" opacity="0.9" />
        <text x="20" y="92" fill="#22c55e" fontSize="12" fontWeight="700">
          3'
        </text>
        <text x="278" y="92" fill="#22c55e" fontSize="12" fontWeight="700">
          5'
        </text>
        <text x="150" y="92" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">
          3' ← 5' (Bottom strand)
        </text>
        <path d="M 50 88 L 32 88 M 40 83 L 32 88 L 40 93" stroke="#fff" strokeWidth="2" fill="none" />
      </svg>
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          background: 'rgba(0,0,0,0.35)',
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '12px',
          color: 'var(--color-text-strong, #fff)',
          backdropFilter: 'blur(4px)',
        }}
      >
        Anti-parallel strands
      </div>
    </div>
  );
}

function BinaryComparisonWidget(): React.ReactElement {
  const [inputSeq, setInputSeq] = useState('ATGC');
  const cleanSeq = inputSeq.toUpperCase().replace(/[^ATGC]/g, '').slice(0, 20);

  const binaryRep = useMemo(() => {
    const map: Record<string, string> = { A: '00', T: '01', G: '10', C: '11' };
    return cleanSeq.split('').map((b) => map[b] || '??').join(' ');
  }, [cleanSeq]);

  const byteCount = useMemo(() => {
    return Math.ceil((cleanSeq.length * 2) / 8);
  }, [cleanSeq]);

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '12px',
        background: 'var(--color-surface-1, rgba(255,255,255,0.02))',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="dna-input" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
          Try it: Enter a DNA sequence
        </label>
        <input
          id="dna-input"
          type="text"
          value={inputSeq}
          onChange={(e) => setInputSeq(e.target.value)}
          placeholder="ATGC..."
          maxLength={20}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid var(--color-border-subtle)',
            background: 'var(--color-background)',
            color: 'var(--color-text)',
            fontFamily: 'monospace',
            fontSize: '16px',
            letterSpacing: '0.5px',
          }}
        />
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
            DNA (base-4)
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '18px',
              fontWeight: 600,
              letterSpacing: '4px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
            }}
          >
            {cleanSeq.split('').map((base, i) => (
              <span key={i} style={{ color: BASES.find((b) => b.letter === base)?.color ?? 'var(--color-text)' }}>
                {base}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
            Binary equivalent (A=00, T=01, G=10, C=11)
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '14px',
              color: 'var(--color-text-dim)',
              wordBreak: 'break-all',
            }}
          >
            {binaryRep || '—'}
          </div>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {cleanSeq.length} bases = {cleanSeq.length * 2} bits ≈ {byteCount} byte{byteCount !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

export function DNABasicsModule(): React.ReactElement {
  const { completeModule, hasCompletedModule } = useBeginnerMode();
  const done = hasCompletedModule(MODULE_ID);
  const [selectedBase, setSelectedBase] = useState<string | null>(null);
  const selectedBaseInfo = selectedBase ? BASES.find((b) => b.letter === selectedBase) : null;

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <p className="text-dim" style={{ letterSpacing: '0.4px' }}>
            Foundations - Module 2
          </p>
          <h2 style={{ margin: 0 }}>DNA Basics for Engineers</h2>
          <p style={{ margin: '6px 0 0', color: 'var(--color-text-muted)' }}>
            DNA as a 4-symbol information storage system—think of it like a quaternary (base-4) encoding.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="badge">{done ? 'Completed' : '8-10 min'}</span>
          <button
            type="button"
            className="btn"
            onClick={() => completeModule(MODULE_ID)}
            disabled={done}
            aria-pressed={done}
          >
            {done ? 'Marked Complete' : 'Mark Complete'}
          </button>
        </div>
      </header>

      {/* Interactive 3D Helix */}
      <section className="panel panel-compact">
        <div style={{ marginBottom: '12px' }}>
          <p className="text-dim" style={{ letterSpacing: '0.3px' }}>
            3D Visualization
          </p>
          <h3 style={{ margin: 0 }}>DNA Double Helix</h3>
        </div>
        <DNAHelixVisualizer
          sequence="ATGCGATCGAATCG"
          speedMs={100}
          autoRotate={true}
          title="Interactive DNA Structure"
          showReplication={true}
        />
      </section>

      {/* The 4-Base Alphabet */}
      <section className="panel panel-compact">
        <div style={{ marginBottom: '12px' }}>
          <p className="text-dim" style={{ letterSpacing: '0.3px' }}>
            The Alphabet
          </p>
          <h3 style={{ margin: 0 }}>Four Bases: A, T, G, C</h3>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '6px' }}>
            Unlike binary (0,1), DNA uses four symbols. Click a base to learn more.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {BASES.map((base) => (
            <BaseCard
              key={base.letter}
              base={base}
              isSelected={selectedBase === base.letter}
              onClick={() => setSelectedBase(selectedBase === base.letter ? null : base.letter)}
            />
          ))}
        </div>

        {selectedBaseInfo && (
          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${selectedBaseInfo.color}15, ${selectedBaseInfo.color}08)`,
              borderLeft: `4px solid ${selectedBaseInfo.color}`,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '6px' }}>
              {selectedBaseInfo.name} ({selectedBaseInfo.letter})
            </div>
            <div style={{ color: 'var(--color-text-muted)' }}>{selectedBaseInfo.description}</div>
          </div>
        )}
      </section>

      {/* Directionality */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1fr) minmax(280px, 1fr)',
          gap: '16px',
          alignItems: 'stretch',
        }}
      >
        <div className="panel panel-compact">
          <div style={{ marginBottom: '12px' }}>
            <p className="text-dim" style={{ letterSpacing: '0.3px' }}>
              Reading Direction
            </p>
            <h3 style={{ margin: 0 }}>5' to 3' Directionality</h3>
          </div>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
            DNA strands have directionality. Enzymes like DNA polymerase <strong>always</strong> synthesize
            in the 5' → 3' direction. The two strands run in opposite directions (anti-parallel).
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            <li>
              <strong>5' end:</strong> Has a free phosphate group
            </li>
            <li>
              <strong>3' end:</strong> Has a free hydroxyl (OH) group
            </li>
            <li>
              <strong>Naming:</strong> Refers to carbon positions on the sugar ring
            </li>
          </ul>
        </div>

        <DirectionalityDiagram />
      </section>

      {/* Base Pairing Rules */}
      <section className="panel panel-compact">
        <div style={{ marginBottom: '12px' }}>
          <p className="text-dim" style={{ letterSpacing: '0.3px' }}>
            Chargaff's Rules
          </p>
          <h3 style={{ margin: 0 }}>Base Pairing Rules</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
          {KEY_RULES.map((rule) => (
            <div
              key={rule.rule}
              style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'var(--color-surface-1, rgba(255,255,255,0.02))',
                borderLeft: `4px solid ${rule.color ?? 'var(--color-accent)'}`,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{rule.rule}</div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{rule.explanation}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Binary Comparison */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1fr) minmax(280px, 1fr)',
          gap: '16px',
          alignItems: 'stretch',
        }}
      >
        <div className="panel panel-compact">
          <div style={{ marginBottom: '12px' }}>
            <p className="text-dim" style={{ letterSpacing: '0.3px' }}>
              Engineer's Perspective
            </p>
            <h3 style={{ margin: 0 }}>DNA vs Computing</h3>
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {ANALOGIES.map((analogy) => (
              <div
                key={analogy.dna}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--color-surface-1, rgba(255,255,255,0.02))',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '6px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>DNA</span>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{analogy.dna}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>Computing</span>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{analogy.computing}</div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{analogy.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel panel-compact">
          <div style={{ marginBottom: '12px' }}>
            <p className="text-dim" style={{ letterSpacing: '0.3px' }}>
              Interactive Demo
            </p>
            <h3 style={{ margin: 0 }}>DNA to Binary</h3>
          </div>
          <BinaryComparisonWidget />
        </div>
      </section>

      {/* Summary */}
      <section
        className="panel panel-compact"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.08))',
          border: '1px solid var(--color-accent)',
        }}
      >
        <h3 style={{ margin: '0 0 12px' }}>Key Takeaways</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
          <li>
            <strong>DNA uses 4 bases:</strong> Adenine, Thymine, Guanine, Cytosine — like a base-4 encoding system.
          </li>
          <li>
            <strong>Base pairing:</strong> A pairs with T (2 bonds), G pairs with C (3 bonds) — always.
          </li>
          <li>
            <strong>Double helix:</strong> Two complementary strands wound together, providing redundancy.
          </li>
          <li>
            <strong>Directionality:</strong> Strands run 5'→3' in opposite directions (anti-parallel).
          </li>
          <li>
            <strong>Information density:</strong> Each base = 2 bits. Human genome ≈ 750 MB compressed.
          </li>
        </ul>
      </section>
    </div>
  );
}

export default DNABasicsModule;
