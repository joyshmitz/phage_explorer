/**
 * OverlayManager
 *
 * Orchestrates the rendering of available overlays.
 * Connects overlays to the application state.
 *
 * PERFORMANCE: Heavy analysis overlays are lazy-loaded to reduce initial bundle.
 * Essential overlays (search, command palette, help) remain eager for instant access.
 */

import React, { Suspense, lazy } from 'react';
import type { PhageFull } from '@phage-explorer/core';
import type { PhageRepository } from '../../db';
import { useOverlay, type OverlayId } from './OverlayProvider';
import { ActionRegistryList } from '../../keyboard/actionRegistry';
import { Overlay } from './Overlay';
import ErrorBoundary from '../layout/ErrorBoundary';
import { OverlayErrorState } from './primitives';

const OVERLAY_TITLE_BY_ID = new Map<string, string>();
for (const action of ActionRegistryList) {
  if (action.overlayId && action.overlayAction) {
    OVERLAY_TITLE_BY_ID.set(action.overlayId, action.title);
  }
}

function formatOverlayTitle(id: OverlayId): string {
  return OVERLAY_TITLE_BY_ID.get(id) ?? id;
}

// ============================================================================
// EAGER-LOADED OVERLAYS (essential for core UX, frequently accessed)
// ============================================================================
import { SearchOverlay } from './SearchOverlay';
import { AnalysisMenu } from './AnalysisMenu';
import { CommandPalette } from './CommandPalette';
import { HelpOverlay } from './HelpOverlay';
import { WelcomeModal } from './WelcomeModal';
import { SettingsOverlay } from './SettingsOverlay';
import { GotoOverlay } from './GotoOverlay';
import { AAKeyOverlay } from './AAKeyOverlay';
import { AALegend } from './AALegend';

// ============================================================================
// LAZY-LOADED OVERLAYS (heavy analysis components, loaded on-demand)
// ============================================================================

// Simulation & Comparison
const SimulationHub = lazy(() => import('./SimulationHub').then(m => ({ default: m.SimulationHub })));
const SimulationView = lazy(() => import('../SimulationView'));
const ComparisonOverlay = lazy(() => import('./ComparisonOverlay').then(m => ({ default: m.ComparisonOverlay })));
const CollaborationOverlay = lazy(() => import('./CollaborationOverlay').then(m => ({ default: m.CollaborationOverlay })));
const ResistanceEvolutionOverlay = lazy(() => import('./ResistanceEvolutionOverlay').then(m => ({ default: m.ResistanceEvolutionOverlay })));

// Sequence analysis overlays
const GCSkewOverlay = lazy(() => import('./GCSkewOverlay').then(m => ({ default: m.GCSkewOverlay })));
const ComplexityOverlay = lazy(() => import('./ComplexityOverlay').then(m => ({ default: m.ComplexityOverlay })));
const BendabilityOverlay = lazy(() => import('./BendabilityOverlay').then(m => ({ default: m.BendabilityOverlay })));
const PromoterOverlay = lazy(() => import('./PromoterOverlay').then(m => ({ default: m.PromoterOverlay })));
const RepeatsOverlay = lazy(() => import('./RepeatsOverlay').then(m => ({ default: m.RepeatsOverlay })));
const KmerAnomalyOverlay = lazy(() => import('./KmerAnomalyOverlay').then(m => ({ default: m.KmerAnomalyOverlay })));
const TranscriptionFlowOverlay = lazy(() => import('./TranscriptionFlowOverlay').then(m => ({ default: m.TranscriptionFlowOverlay })));

// Visualization overlays
const CGROverlay = lazy(() => import('./CGROverlay').then(m => ({ default: m.CGROverlay })));
const HilbertOverlay = lazy(() => import('./HilbertOverlay').then(m => ({ default: m.HilbertOverlay })));
const DotPlotOverlay = lazy(() => import('./DotPlotOverlay').then(m => ({ default: m.DotPlotOverlay })));
const SyntenyOverlay = lazy(() => import('./SyntenyOverlay').then(m => ({ default: m.SyntenyOverlay })));
const PhasePortraitOverlay = lazy(() => import('./PhasePortraitOverlay').then(m => ({ default: m.PhasePortraitOverlay })));
const GelOverlay = lazy(() => import('./GelOverlay').then(m => ({ default: m.GelOverlay })));
const LogoOverlay = lazy(() => import('./LogoOverlay').then(m => ({ default: m.LogoOverlay })));
const PeriodicityOverlay = lazy(() => import('./PeriodicityOverlay').then(m => ({ default: m.PeriodicityOverlay })));
const MosaicRadarOverlay = lazy(() => import('./MosaicRadarOverlay').then(m => ({ default: m.MosaicRadarOverlay })));
const IllustrationOverlay = lazy(() => import('./IllustrationOverlay').then(m => ({ default: m.IllustrationOverlay })));

// Genomic analysis overlays
const HGTOverlay = lazy(() => import('./HGTOverlay').then(m => ({ default: m.HGTOverlay })));
const CRISPROverlay = lazy(() => import('./CRISPROverlay').then(m => ({ default: m.CRISPROverlay })));
const NonBDNAOverlay = lazy(() => import('./NonBDNAOverlay').then(m => ({ default: m.NonBDNAOverlay })));
const AnomalyOverlay = lazy(() => import('./AnomalyOverlay').then(m => ({ default: m.AnomalyOverlay })));
const GenomicSignaturePCAOverlay = lazy(() => import('./GenomicSignaturePCAOverlay').then(m => ({ default: m.GenomicSignaturePCAOverlay })));
const ProphageExcisionOverlay = lazy(() => import('./ProphageExcisionOverlay').then(m => ({ default: m.ProphageExcisionOverlay })));

// Codon & protein analysis overlays
const CodonBiasOverlay = lazy(() => import('./CodonBiasOverlay').then(m => ({ default: m.CodonBiasOverlay })));
const CodonAdaptationOverlay = lazy(() => import('./CodonAdaptationOverlay').then(m => ({ default: m.CodonAdaptationOverlay })));
const SelectionPressureOverlay = lazy(() => import('./SelectionPressureOverlay').then(m => ({ default: m.SelectionPressureOverlay })));
const BiasDecompositionOverlay = lazy(() => import('./BiasDecompositionOverlay').then(m => ({ default: m.BiasDecompositionOverlay })));
const ProteinDomainOverlay = lazy(() => import('./ProteinDomainOverlay').then(m => ({ default: m.ProteinDomainOverlay })));
const FoldQuickviewOverlay = lazy(() => import('./FoldQuickviewOverlay').then(m => ({ default: m.FoldQuickviewOverlay })));
const RNAStructureOverlay = lazy(() => import('./RNAStructureOverlay').then(m => ({ default: m.RNAStructureOverlay })));

// Host & phage interaction overlays
const TropismOverlay = lazy(() => import('./TropismOverlay').then(m => ({ default: m.TropismOverlay })));
const DefenseArmsRaceOverlay = lazy(() => import('./DefenseArmsRaceOverlay').then(m => ({ default: m.DefenseArmsRaceOverlay })));
const AMGPathwayOverlay = lazy(() => import('./AMGPathwayOverlay').then(m => ({ default: m.AMGPathwayOverlay })));
const CocktailCompatibilityOverlay = lazy(() => import('./CocktailCompatibilityOverlay').then(m => ({ default: m.CocktailCompatibilityOverlay })));

// Structure & stability overlays
const StructureConstraintOverlay = lazy(() => import('./StructureConstraintOverlay').then(m => ({ default: m.StructureConstraintOverlay })));
const VirionStabilityOverlay = lazy(() => import('./VirionStabilityOverlay').then(m => ({ default: m.VirionStabilityOverlay })));
const PackagingPressureOverlay = lazy(() => import('./PackagingPressureOverlay').then(m => ({ default: m.PackagingPressureOverlay })));

// Module analysis overlays
const ModuleOverlay = lazy(() => import('./ModuleOverlay').then(m => ({ default: m.ModuleOverlay })));

// Epistasis & fitness landscape
const EpistasisOverlay = lazy(() => import('./EpistasisOverlay').then(m => ({ default: m.EpistasisOverlay })));

// Benchmark & diagnostic
const GpuWasmBenchmarkOverlay = lazy(() => import('./GpuWasmBenchmarkOverlay').then(m => ({ default: m.GpuWasmBenchmarkOverlay })));

// Metagenomic niche analysis
const NicheNetworkOverlay = lazy(() => import('./NicheNetworkOverlay').then(m => ({ default: m.NicheNetworkOverlay })));

// Phylodynamic trajectory analysis
const PhylodynamicsOverlay = lazy(() => import('./PhylodynamicsOverlay').then(m => ({ default: m.PhylodynamicsOverlay })));

// Environmental provenance analysis
const EnvironmentalProvenanceOverlay = lazy(() => import('./EnvironmentalProvenanceOverlay').then(m => ({ default: m.EnvironmentalProvenanceOverlay })));

interface OverlayManagerProps {
  repository: PhageRepository | null;
  currentPhage: PhageFull | null;
}

/**
 * Suspense fallback - show an instant shell so opening an overlay always feels responsive
 */
function OverlayFallback({ id }: { id: OverlayId }): React.ReactElement {
  const { isMobile } = useOverlay();
  // On mobile, prefer a half-height sheet during the load to avoid covering the entire UI.
  const size = isMobile ? 'sm' : 'lg';
  return (
    <Overlay id={id} title={formatOverlayTitle(id)} size={size}>
      <div aria-busy="true" aria-label="Loading overlay" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="skeleton skeleton-text skeleton--pulse" style={{ width: '44%' }} />
        <div className="skeleton skeleton-text skeleton--pulse" style={{ width: '76%' }} />
        <div className="skeleton skeleton-card skeleton--pulse" />
      </div>
    </Overlay>
  );
}

export function OverlayManager({ repository, currentPhage }: OverlayManagerProps): React.ReactElement | null {
  const { stack, isMobile } = useOverlay();
  const size = isMobile ? 'sm' : 'lg';

  const lazyOverlays = stack
    .map((item) => item.id)
    .map((id) => {
      return {
        id,
        element: renderLazyOverlay(id, repository, currentPhage),
      };
    })
    .filter((entry): entry is { id: OverlayId; element: React.ReactElement } => Boolean(entry.element));

  return (
    <>
      {/* EAGER: Essential overlays that must be instantly available */}
      <WelcomeModal />
      <HelpOverlay />
      <AnalysisMenu />
      <SearchOverlay repository={repository} currentPhage={currentPhage} />
      <GotoOverlay />
      <AAKeyOverlay />
      <AALegend />
      <SettingsOverlay />
      <CommandPalette />

      {/* LAZY: Analysis overlays loaded only when open */}
      {lazyOverlays.map(({ id, element }) => (
        <ErrorBoundary
          key={id}
          fallback={({ error, errorInfo, reset }) => (
            <Overlay id={id} title={formatOverlayTitle(id)} size={size}>
              <OverlayErrorState
                message="This overlay hit an unexpected error."
                details={import.meta.env.DEV ? formatOverlayErrorDetails(error, errorInfo) : undefined}
                onRetry={reset}
              />
            </Overlay>
          )}
        >
          <Suspense fallback={<OverlayFallback id={id} />}>{element}</Suspense>
        </ErrorBoundary>
      ))}
    </>
  );
}

export default OverlayManager;

function renderLazyOverlay(
  id: OverlayId,
  repository: PhageRepository | null,
  currentPhage: PhageFull | null
): React.ReactElement | null {
  switch (id) {
    // Simulation & comparison
    case 'simulationHub':
      return <SimulationHub />;
    case 'simulationView':
      return <SimulationView />;
    case 'comparison':
      return <ComparisonOverlay repository={repository} />;
    case 'collaboration':
      return <CollaborationOverlay />;
    case 'resistanceEvolution':
      return <ResistanceEvolutionOverlay />;

    // Sequence analysis
    case 'gcSkew':
      return <GCSkewOverlay repository={repository} currentPhage={currentPhage} />;
    case 'complexity':
      return <ComplexityOverlay repository={repository} currentPhage={currentPhage} />;
    case 'bendability':
      return <BendabilityOverlay repository={repository} currentPhage={currentPhage} />;
    case 'promoter':
      return <PromoterOverlay repository={repository} currentPhage={currentPhage} />;
    case 'repeats':
      return <RepeatsOverlay repository={repository} currentPhage={currentPhage} />;
    case 'kmerAnomaly':
      return <KmerAnomalyOverlay repository={repository} currentPhage={currentPhage} />;
    case 'transcriptionFlow':
      return <TranscriptionFlowOverlay repository={repository} currentPhage={currentPhage} />;

    // Visualizations
    case 'cgr':
      return <CGROverlay repository={repository} currentPhage={currentPhage} />;
    case 'hilbert':
      return <HilbertOverlay repository={repository} currentPhage={currentPhage} />;
    case 'dotPlot':
      return <DotPlotOverlay repository={repository} currentPhage={currentPhage} />;
    case 'synteny':
      return <SyntenyOverlay repository={repository} currentPhage={currentPhage} />;
    case 'phasePortrait':
      return <PhasePortraitOverlay repository={repository} currentPhage={currentPhage} />;
    case 'gel':
      return <GelOverlay repository={repository} currentPhage={currentPhage} />;
    case 'logo':
      return <LogoOverlay repository={repository} currentPhage={currentPhage} />;
    case 'periodicity':
      return <PeriodicityOverlay repository={repository} currentPhage={currentPhage} />;
    case 'mosaicRadar':
      return <MosaicRadarOverlay repository={repository} currentPhage={currentPhage} />;
    case 'illustration':
      return <IllustrationOverlay />;

    // Genomic analysis
    case 'hgt':
      return <HGTOverlay repository={repository} currentPhage={currentPhage} />;
    case 'crispr':
      return <CRISPROverlay repository={repository} phage={currentPhage} />;
    case 'nonBDNA':
      return <NonBDNAOverlay repository={repository} currentPhage={currentPhage} />;
    case 'anomaly':
      return <AnomalyOverlay repository={repository} currentPhage={currentPhage} />;
    case 'genomicSignaturePCA':
      return <GenomicSignaturePCAOverlay repository={repository} currentPhage={currentPhage} />;
    case 'prophageExcision':
      return <ProphageExcisionOverlay repository={repository} currentPhage={currentPhage} />;

    // Codon & protein
    case 'codonBias':
      return <CodonBiasOverlay repository={repository} currentPhage={currentPhage} />;
    case 'codonAdaptation':
      return <CodonAdaptationOverlay repository={repository} currentPhage={currentPhage} />;
    case 'selectionPressure':
      return <SelectionPressureOverlay repository={repository} currentPhage={currentPhage} />;
    case 'biasDecomposition':
      return <BiasDecompositionOverlay repository={repository} currentPhage={currentPhage} />;
    case 'proteinDomains':
      return <ProteinDomainOverlay repository={repository} currentPhage={currentPhage} />;
    case 'foldQuickview':
      return <FoldQuickviewOverlay repository={repository} currentPhage={currentPhage} />;
    case 'rnaStructure':
      return <RNAStructureOverlay repository={repository} currentPhage={currentPhage} />;

    // Host interactions
    case 'tropism':
      return <TropismOverlay repository={repository} phage={currentPhage} />;
    case 'defenseArmsRace':
      return <DefenseArmsRaceOverlay repository={repository} currentPhage={currentPhage} />;
    case 'amgPathway':
      return <AMGPathwayOverlay repository={repository} currentPhage={currentPhage} />;
    case 'cocktailCompatibility':
      return <CocktailCompatibilityOverlay repository={repository} currentPhage={currentPhage} />;

    // Structure & stability
    case 'structureConstraint':
      return <StructureConstraintOverlay repository={repository} currentPhage={currentPhage} />;
    case 'stability':
      return <VirionStabilityOverlay />;
    case 'pressure':
      return <PackagingPressureOverlay />;

    // Module analysis
    case 'modules':
      return <ModuleOverlay repository={repository} currentPhage={currentPhage} />;

    // Epistasis & fitness landscape
    case 'epistasis':
      return <EpistasisOverlay repository={repository} currentPhage={currentPhage} />;

    // Benchmark & diagnostic
    case 'gpuWasmBenchmark':
      return <GpuWasmBenchmarkOverlay repository={repository} currentPhage={currentPhage} />;

    // Metagenomic niche analysis
    case 'nicheNetwork':
      return <NicheNetworkOverlay />;

    // Phylodynamic trajectory analysis
    case 'phylodynamics':
      return <PhylodynamicsOverlay repository={repository} currentPhage={currentPhage} />;

    // Environmental provenance analysis
    case 'environmentalProvenance':
      return <EnvironmentalProvenanceOverlay repository={repository} currentPhage={currentPhage} />;

    default:
      return null;
  }
}

function formatOverlayErrorDetails(error: Error | null, errorInfo: React.ErrorInfo | null): string {
  const message = error ? error.toString() : 'Unknown error';
  const stack = errorInfo?.componentStack?.trim();
  if (!stack) return message;
  return `${message}\n${stack}`;
}
