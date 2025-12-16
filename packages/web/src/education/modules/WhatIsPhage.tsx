import React, { useMemo } from 'react';
import { useBeginnerMode } from '../hooks/useBeginnerMode';
import type { ModuleId } from '../types';

type Fact = {
  label: string;
  value: string;
  detail?: string;
};

type StructurePart = {
  name: string;
  description: string;
  color: string;
};

type TimelineEntry = {
  year: string;
  title: string;
  summary: string;
};

const MODULE_ID: ModuleId = 'intro-to-phages';

const FAST_FACTS: Fact[] = [
  { label: 'What it is', value: 'Virus that infects bacteria', detail: 'A capsid + tail nanomachine' },
  { label: 'Genome', value: 'DNA or RNA', detail: 'dsDNA is most common; sizes span ~3–200 kb' },
  { label: 'Abundance', value: '~10³¹ on Earth', detail: 'More phages than every other organism combined' },
  { label: 'Role', value: 'Rewrite bacterial code', detail: 'Drive evolution, ecology, and the carbon cycle' },
];

const STRUCTURE: StructurePart[] = [
  { name: 'Capsid (Head)', description: 'Protein shell that packages the genome and protects it outside the host.', color: '#8b5cf6' },
  { name: 'Tail', description: 'Contractile or flexible tube that delivers the genome into the host cell.', color: '#22c55e' },
  { name: 'Tail Fibers', description: 'Sensor/keys that recognize bacterial surface receptors and anchor the phage.', color: '#f97316' },
  { name: 'Baseplate', description: 'Mechanical latch that triggers DNA injection once the phage is locked on.', color: '#0ea5e9' },
];

const TIMELINE: TimelineEntry[] = [
  {
    year: '1952',
    title: 'Hershey–Chase Blender Experiment',
    summary: 'Showed that DNA (not protein) is the hereditary material using phage T2.',
  },
  {
    year: '1961',
    title: 'Frameshift Experiments',
    summary: 'Crick & Brenner used phage T4 to prove the genetic code is read in triplets.',
  },
  {
    year: 'Today',
    title: 'Therapy & Tooling',
    summary: 'Phage cocktails target antibiotic-resistant infections; enzymes like T7 RNA polymerase power biotech.',
  },
];

function FigureLegend({ label }: { label: string }): React.ReactElement {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        right: 12,
        background: 'rgba(0,0,0,0.35)',
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        color: 'var(--color-text-strong, #fff)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {label}
    </div>
  );
}

function StructureDiagram(): React.ReactElement {
  return (
    <div
      aria-label="Stylized phage structure diagram"
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.12), rgba(59, 130, 246, 0.12))',
        borderRadius: 16,
        padding: '18px 18px 26px',
        minHeight: 220,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg viewBox="0 0 240 200" role="img" aria-hidden="true" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="capsidFill" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#a855f7" offset="0%" />
            <stop stopColor="#7c3aed" offset="100%" />
          </linearGradient>
          <linearGradient id="tailFill" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#22c55e" offset="0%" />
            <stop stopColor="#16a34a" offset="100%" />
          </linearGradient>
        </defs>
        <polygon
          points="120,20 160,70 140,130 100,130 80,70"
          fill="url(#capsidFill)"
          stroke="#d8b4fe"
          strokeWidth={2}
          opacity={0.95}
        />
        <rect x="112" y="130" width="16" height="48" rx="6" fill="url(#tailFill)" opacity={0.9} />
        <line x1="120" y1="178" x2="120" y2="195" stroke="#0ea5e9" strokeWidth={6} strokeLinecap="round" />
        <g stroke="#f97316" strokeWidth={3} strokeLinecap="round">
          <line x1="120" y1="184" x2="150" y2="198" />
          <line x1="120" y1="184" x2="90" y2="198" />
        </g>
      </svg>
      <FigureLegend label="Capsid + Tail nanomachine" />
    </div>
  );
}

function SizeScale(): React.ReactElement {
  const items = [
    { label: 'Phage', value: '≈ 50–200 nm', color: '#22c55e' },
    { label: 'Bacterium', value: '≈ 1–5 µm', color: '#3b82f6' },
    { label: 'Human cell', value: '≈ 10–100 µm', color: '#f97316' },
  ];
  return (
    <div
      aria-label="Relative size scale"
      style={{
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 14,
        padding: '12px 14px',
        display: 'grid',
        gap: 8,
        background: 'var(--color-surface-1, rgba(255,255,255,0.02))',
      }}
    >
      {items.map((item) => (
        <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: item.color,
                boxShadow: `0 0 0 4px ${item.color}22`,
              }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>{item.label}</div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{item.value}</div>
            </div>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: `${item.color}22`,
              position: 'relative',
              overflow: 'hidden',
              minWidth: 120,
            }}
            aria-hidden="true"
          >
            <div style={{ width: `${items.indexOf(item) === 0 ? 12 : items.indexOf(item) === 1 ? 55 : 100}%`, background: item.color, height: '100%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmGallery(): React.ReactElement {
  const cards = useMemo(
    () => [
      { title: 'T4 head + tail fibers', accent: '#8b5cf6' },
      { title: 'Filamentous M13', accent: '#22c55e' },
      { title: 'Icosahedral MS2', accent: '#f97316' },
    ],
    []
  );

  return (
    <div
      aria-label="Electron microscopy gallery placeholders"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 10,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.title}
          style={{
            position: 'relative',
            borderRadius: 14,
            overflow: 'hidden',
            border: '1px solid var(--color-border-subtle)',
            background: `linear-gradient(145deg, ${card.accent}22, rgba(255,255,255,0.03))`,
            minHeight: 120,
            display: 'flex',
            alignItems: 'flex-end',
            padding: '10px 12px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 100,
              height: 100,
              background: `${card.accent}33`,
              borderRadius: '50%',
              filter: 'blur(12px)',
            }}
            aria-hidden="true"
          />
          <div style={{ position: 'relative' }}>
            <p style={{ fontWeight: 600 }}>{card.title}</p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>High-contrast EM silhouette</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function WhatIsPhageModule(): React.ReactElement {
  const { completeModule, hasCompletedModule } = useBeginnerMode();
  const done = hasCompletedModule(MODULE_ID);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p className="text-dim" style={{ letterSpacing: 0.4 }}>Foundations · Module 1</p>
          <h2 style={{ margin: 0 }}>What is a bacteriophage?</h2>
          <p style={{ margin: '6px 0 0', color: 'var(--color-text-muted)' }}>
            Self-assembling nanosyringes that land on bacteria, inject genetic code, and rewrite the host.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge">{done ? 'Completed' : '6–8 min'}</span>
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

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {FAST_FACTS.map((fact) => (
          <div
            key={fact.label}
            className="panel panel-compact"
            style={{ borderColor: 'var(--color-border-subtle)', boxShadow: 'var(--shadow-sm, 0 8px 20px rgba(0,0,0,0.25))' }}
          >
            <p className="text-dim" style={{ marginBottom: 4 }}>{fact.label}</p>
            <p style={{ fontSize: 18, fontWeight: 700 }}>{fact.value}</p>
            {fact.detail && <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>{fact.detail}</p>}
          </div>
        ))}
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 1.1fr) minmax(240px, 0.9fr)',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        <div className="panel panel-compact">
          <div style={{ marginBottom: 8 }}>
            <p className="text-dim" style={{ letterSpacing: 0.3 }}>Structure</p>
            <h3 style={{ margin: 0 }}>Capsid, Tail, Fibers</h3>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {STRUCTURE.map((part) => (
              <div key={part.name} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 10, alignItems: 'center' }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 4,
                    background: part.color,
                    boxShadow: `0 0 0 6px ${part.color}22`,
                  }}
                />
                <div>
                  <p style={{ margin: 0, fontWeight: 700 }}>{part.name}</p>
                  <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{part.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <StructureDiagram />
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 1fr) minmax(260px, 1fr)',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <div className="panel panel-compact">
          <p className="text-dim" style={{ letterSpacing: 0.3 }}>Scale</p>
          <h3 style={{ marginTop: 0 }}>Size context</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Phages are nanoscale—hundreds of times smaller than the bacteria they infect. The tail fibers act like
            precise docking keys to find the right host.
          </p>
          <SizeScale />
        </div>

        <div className="panel panel-compact">
          <p className="text-dim" style={{ letterSpacing: 0.3 }}>History</p>
          <h3 style={{ marginTop: 0 }}>Milestones</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {TIMELINE.map((entry) => (
              <div
                key={entry.year}
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid var(--color-border-subtle)',
                  background: 'var(--color-surface-1, rgba(255,255,255,0.02))',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                  <span className="badge badge-ghost">{entry.year}</span>
                  <strong>{entry.title}</strong>
                </div>
                <p style={{ margin: '6px 0 0', color: 'var(--color-text-muted)' }}>{entry.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel panel-compact">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <p className="text-dim" style={{ letterSpacing: 0.3, marginBottom: 2 }}>Visuals</p>
            <h3 style={{ margin: 0 }}>Electron microscopy gallery</h3>
          </div>
          <span className="badge badge-ghost">Reference</span>
        </div>
        <EmGallery />
      </section>
    </div>
  );
}

export default WhatIsPhageModule;
