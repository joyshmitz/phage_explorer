/**
 * PhageLifecycle Module
 *
 * Educational module covering phage lifecycle:
 * - Lytic cycle (attach, inject, replicate, lyse)
 * - Lysogenic cycle (integrate, dormant, trigger)
 * - Temperate vs virulent phages
 * - Lambda decision circuit
 *
 * Part of the Educational Layer epic (phage_explorer-2uo1).
 */

import React, { useState } from 'react';
import { useBeginnerMode } from '../hooks/useBeginnerMode';
import { InfectionCycleVisualizer } from '../components/InfectionCycleVisualizer';
import type { ModuleId } from '../types';

const MODULE_ID: ModuleId = 'phage-lifecycle';

type CycleStep = {
  name: string;
  description: string;
  color: string;
  duration?: string;
};

type KeyConcept = {
  term: string;
  definition: string;
  example?: string;
};

const LYTIC_STEPS: CycleStep[] = [
  {
    name: 'Attachment',
    description: 'Tail fibers recognize and bind to specific receptors on the bacterial surface.',
    color: '#3b82f6',
    duration: '< 1 min',
  },
  {
    name: 'Injection',
    description: 'The phage punctures the cell membrane and injects its genome into the host.',
    color: '#22c55e',
    duration: '~ 1 min',
  },
  {
    name: 'Takeover',
    description: 'Phage genes hijack host machinery, shutting down bacterial functions.',
    color: '#f59e0b',
    duration: '5-10 min',
  },
  {
    name: 'Replication',
    description: 'Host ribosomes and polymerases produce hundreds of phage copies.',
    color: '#8b5cf6',
    duration: '10-15 min',
  },
  {
    name: 'Assembly',
    description: 'New capsids form and package replicated genomes into complete virions.',
    color: '#ec4899',
    duration: '5-10 min',
  },
  {
    name: 'Lysis',
    description: 'Enzymes burst the host cell, releasing 100-200 new phages.',
    color: '#ef4444',
    duration: '< 1 min',
  },
];

const LYSOGENIC_STEPS: CycleStep[] = [
  {
    name: 'Attachment & Injection',
    description: 'Same initial steps as lytic cycle—genome enters the host cell.',
    color: '#3b82f6',
  },
  {
    name: 'Integration',
    description: 'Phage DNA recombines with bacterial chromosome, becoming a prophage.',
    color: '#14b8a6',
  },
  {
    name: 'Dormancy',
    description: 'Prophage replicates passively with host DNA through many generations.',
    color: '#6b7280',
  },
  {
    name: 'Induction',
    description: 'Stress triggers (UV, SOS response) activate the prophage, switching to lytic.',
    color: '#ef4444',
  },
];

const KEY_CONCEPTS: KeyConcept[] = [
  {
    term: 'Virulent Phage',
    definition: 'A phage that only follows the lytic pathway—always kills its host.',
    example: 'T4, T7 phages',
  },
  {
    term: 'Temperate Phage',
    definition: 'A phage that can choose between lytic and lysogenic pathways.',
    example: 'Lambda (λ), Mu phages',
  },
  {
    term: 'Prophage',
    definition: 'Phage DNA integrated into the host chromosome during lysogeny.',
  },
  {
    term: 'Lysogen',
    definition: 'A bacterial cell carrying a prophage—immune to infection by the same phage.',
  },
  {
    term: 'Induction',
    definition: 'The switch from lysogenic to lytic cycle, triggered by cellular stress.',
  },
  {
    term: 'Burst Size',
    definition: 'Number of new phage particles released per infected cell (typically 50-200).',
  },
];

type DecisionFactor = {
  factor: string;
  lyticBias: string;
  lysogenicBias: string;
};

const LAMBDA_DECISION_FACTORS: DecisionFactor[] = [
  {
    factor: 'MOI (Multiplicity of Infection)',
    lyticBias: 'Low MOI (few phages per cell)',
    lysogenicBias: 'High MOI (many phages competing)',
  },
  {
    factor: 'Cell Health',
    lyticBias: 'Healthy, rapidly growing cells',
    lysogenicBias: 'Starved or stressed cells',
  },
  {
    factor: 'cI vs Cro Proteins',
    lyticBias: 'Cro wins → lytic genes activate',
    lysogenicBias: 'cI wins → lysogenic genes activate',
  },
];

function CycleStepCard({ step, index }: { step: CycleStep; index: number }): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        padding: '12px',
        borderRadius: '8px',
        background: 'var(--color-surface-1, rgba(255,255,255,0.02))',
        border: `1px solid ${step.color}33`,
      }}
    >
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: step.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '14px',
          color: '#fff',
          flexShrink: 0,
        }}
      >
        {index + 1}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <strong style={{ color: step.color }}>{step.name}</strong>
          {step.duration && (
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{step.duration}</span>
          )}
        </div>
        <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '14px' }}>
          {step.description}
        </p>
      </div>
    </div>
  );
}

function LambdaDecisionDiagram(): React.ReactElement {
  return (
    <div
      aria-label="Lambda phage decision circuit diagram"
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(59, 130, 246, 0.12))',
        borderRadius: '16px',
        padding: '20px',
        minHeight: '200px',
      }}
    >
      <svg viewBox="0 0 300 160" role="img" aria-hidden="true" style={{ width: '100%', height: '100%' }}>
        {/* Infection point */}
        <circle cx="150" cy="20" r="15" fill="#3b82f6" opacity="0.9" />
        <text x="150" y="24" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600">
          DNA
        </text>

        {/* Decision point */}
        <polygon points="150,55 180,85 150,115 120,85" fill="#f59e0b" opacity="0.9" />
        <text x="150" y="90" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600">
          Decision
        </text>

        {/* Arrows from injection */}
        <line x1="150" y1="35" x2="150" y2="55" stroke="#6b7280" strokeWidth="2" markerEnd="url(#arrow)" />

        {/* Lytic path */}
        <line x1="180" y1="85" x2="240" y2="85" stroke="#ef4444" strokeWidth="2" />
        <rect x="240" y="70" width="50" height="30" rx="6" fill="#ef4444" opacity="0.9" />
        <text x="265" y="90" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600">
          LYTIC
        </text>
        <text x="265" y="120" textAnchor="middle" fill="#ef4444" fontSize="9">
          Cro wins
        </text>

        {/* Lysogenic path */}
        <line x1="120" y1="85" x2="60" y2="85" stroke="#22c55e" strokeWidth="2" />
        <rect x="10" y="70" width="50" height="30" rx="6" fill="#22c55e" opacity="0.9" />
        <text x="35" y="90" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600">
          LYSOG
        </text>
        <text x="35" y="120" textAnchor="middle" fill="#22c55e" fontSize="9">
          cI wins
        </text>

        {/* Integration arrow from lysogenic */}
        <line x1="35" y1="100" x2="35" y2="140" stroke="#14b8a6" strokeWidth="2" strokeDasharray="4" />
        <text x="35" y="155" textAnchor="middle" fill="#14b8a6" fontSize="8">
          Integrate
        </text>

        {/* Induction arrow */}
        <path d="M 60 140 Q 150 160 240 140" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3" />
        <text x="150" y="155" textAnchor="middle" fill="#f59e0b" fontSize="8">
          Induction (stress)
        </text>

        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="#6b7280" />
          </marker>
        </defs>
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
        Lambda (λ) Decision Switch
      </div>
    </div>
  );
}

function ComparisonTable(): React.ReactElement {
  return (
    <div
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
        }}
      >
        <thead>
          <tr style={{ background: 'var(--color-surface-1, rgba(255,255,255,0.03))' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--color-border-subtle)' }}>
              Feature
            </th>
            <th
              style={{
                padding: '12px',
                textAlign: 'left',
                borderBottom: '1px solid var(--color-border-subtle)',
                color: '#ef4444',
              }}
            >
              Lytic Cycle
            </th>
            <th
              style={{
                padding: '12px',
                textAlign: 'left',
                borderBottom: '1px solid var(--color-border-subtle)',
                color: '#22c55e',
              }}
            >
              Lysogenic Cycle
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-subtle)' }}>Host cell fate</td>
            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-subtle)', color: '#ef4444' }}>
              Destroyed (lysis)
            </td>
            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-subtle)', color: '#22c55e' }}>
              Survives (lysogen)
            </td>
          </tr>
          <tr style={{ background: 'var(--color-surface-1, rgba(255,255,255,0.01))' }}>
            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-subtle)' }}>Phage DNA</td>
            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-subtle)', color: '#ef4444' }}>
              Circular, replicating
            </td>
            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-subtle)', color: '#22c55e' }}>
              Integrated (prophage)
            </td>
          </tr>
          <tr>
            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-subtle)' }}>Timeline</td>
            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-subtle)', color: '#ef4444' }}>
              30-60 min total
            </td>
            <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border-subtle)', color: '#22c55e' }}>
              Generations to years
            </td>
          </tr>
          <tr style={{ background: 'var(--color-surface-1, rgba(255,255,255,0.01))' }}>
            <td style={{ padding: '10px 12px' }}>Offspring</td>
            <td style={{ padding: '10px 12px', color: '#ef4444' }}>50-200 new phages</td>
            <td style={{ padding: '10px 12px', color: '#22c55e' }}>Inherited by daughter cells</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function PhageLifecycleModule(): React.ReactElement {
  const { completeModule, hasCompletedModule } = useBeginnerMode();
  const done = hasCompletedModule(MODULE_ID);
  const [activeTab, setActiveTab] = useState<'lytic' | 'lysogenic' | 'comparison'>('lytic');

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
            Foundations - Module 5
          </p>
          <h2 style={{ margin: 0 }}>Phage Lifecycle</h2>
          <p style={{ margin: '6px 0 0', color: 'var(--color-text-muted)' }}>
            How phages infect bacteria: lytic destruction vs lysogenic dormancy.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="badge">{done ? 'Completed' : '10-12 min'}</span>
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

      {/* Interactive Visualizer */}
      <section className="panel panel-compact">
        <div style={{ marginBottom: '12px' }}>
          <p className="text-dim" style={{ letterSpacing: '0.3px' }}>
            Interactive Animation
          </p>
          <h3 style={{ margin: 0 }}>Infection Cycle Visualizer</h3>
        </div>
        <InfectionCycleVisualizer
          initialPathway="lytic"
          speedMs={2000}
          autoPlay={false}
          title="Explore the phage infection cycle"
        />
      </section>

      {/* Cycle Details Tabs */}
      <section className="panel panel-compact">
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
            borderBottom: '1px solid var(--color-border-subtle)',
            paddingBottom: '12px',
          }}
        >
          <button
            type="button"
            className={`btn ${activeTab === 'lytic' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('lytic')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: activeTab === 'lytic' ? '#ef4444' : 'transparent',
              color: activeTab === 'lytic' ? '#fff' : 'var(--color-text)',
              border: activeTab === 'lytic' ? 'none' : '1px solid var(--color-border-subtle)',
            }}
          >
            Lytic Cycle
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'lysogenic' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('lysogenic')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: activeTab === 'lysogenic' ? '#22c55e' : 'transparent',
              color: activeTab === 'lysogenic' ? '#fff' : 'var(--color-text)',
              border: activeTab === 'lysogenic' ? 'none' : '1px solid var(--color-border-subtle)',
            }}
          >
            Lysogenic Cycle
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'comparison' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('comparison')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: activeTab === 'comparison' ? '#8b5cf6' : 'transparent',
              color: activeTab === 'comparison' ? '#fff' : 'var(--color-text)',
              border: activeTab === 'comparison' ? 'none' : '1px solid var(--color-border-subtle)',
            }}
          >
            Compare
          </button>
        </div>

        {activeTab === 'lytic' && (
          <div>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              The <strong style={{ color: '#ef4444' }}>lytic cycle</strong> is a fast, destructive infection
              that kills the host cell within 30-60 minutes, releasing hundreds of new phage particles.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {LYTIC_STEPS.map((step, i) => (
                <CycleStepCard key={step.name} step={step} index={i} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'lysogenic' && (
          <div>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              The <strong style={{ color: '#22c55e' }}>lysogenic cycle</strong> allows the phage to integrate
              into the host chromosome and replicate passively for generations—until stress triggers activation.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {LYSOGENIC_STEPS.map((step, i) => (
                <CycleStepCard key={step.name} step={step} index={i} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Compare the two infection strategies side by side.
            </p>
            <ComparisonTable />
          </div>
        )}
      </section>

      {/* Lambda Decision */}
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
              Molecular Switch
            </p>
            <h3 style={{ margin: 0 }}>Lambda Decision Circuit</h3>
          </div>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
            Phage Lambda (λ) is the most studied temperate phage. It uses a bistable genetic switch
            to "decide" between lytic and lysogenic fates.
          </p>
          <div style={{ display: 'grid', gap: '8px' }}>
            {LAMBDA_DECISION_FACTORS.map((factor) => (
              <div
                key={factor.factor}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'var(--color-surface-1, rgba(255,255,255,0.02))',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '6px' }}>{factor.factor}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                  <div style={{ color: '#ef4444' }}>
                    <span style={{ opacity: 0.7 }}>Lytic:</span> {factor.lyticBias}
                  </div>
                  <div style={{ color: '#22c55e' }}>
                    <span style={{ opacity: 0.7 }}>Lysogenic:</span> {factor.lysogenicBias}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <LambdaDecisionDiagram />
      </section>

      {/* Key Concepts */}
      <section className="panel panel-compact">
        <div style={{ marginBottom: '12px' }}>
          <p className="text-dim" style={{ letterSpacing: '0.3px' }}>
            Vocabulary
          </p>
          <h3 style={{ margin: 0 }}>Key Concepts</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
          {KEY_CONCEPTS.map((concept) => (
            <div
              key={concept.term}
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'var(--color-surface-1, rgba(255,255,255,0.02))',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>{concept.term}</div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{concept.definition}</div>
              {concept.example && (
                <div style={{ marginTop: '6px', fontSize: '13px', color: 'var(--color-text-dim)' }}>
                  <em>Example: {concept.example}</em>
                </div>
              )}
            </div>
          ))}
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
            <strong>Lytic cycle</strong> = rapid, destructive infection ending in cell lysis and phage release.
          </li>
          <li>
            <strong>Lysogenic cycle</strong> = stealth mode where phage DNA integrates and replicates with the host.
          </li>
          <li>
            <strong>Temperate phages</strong> can switch between both strategies; virulent phages are lytic-only.
          </li>
          <li>
            Lambda's <strong>cI vs Cro</strong> circuit is a classic example of a bistable molecular switch.
          </li>
          <li>
            <strong>Prophage induction</strong> occurs under stress (UV, antibiotics), triggering the lytic pathway.
          </li>
        </ul>
      </section>
    </div>
  );
}

export default PhageLifecycleModule;
