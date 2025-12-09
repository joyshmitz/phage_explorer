/**
 * OverlayManager
 *
 * Orchestrates the rendering of available overlays.
 * Connects overlays to the application state.
 */

import React from 'react';
import type { PhageFull } from '@phage-explorer/core';
import type { PhageRepository } from '../../db';
import { SearchOverlay } from './SearchOverlay';
import { SimulationHub } from './SimulationHub';
import SimulationView from '../SimulationView';
import { TropismOverlay } from './TropismOverlay';
import { AAKeyOverlay } from './AAKeyOverlay';
import { AALegend } from './AALegend';
import { ComparisonOverlay } from './ComparisonOverlay';
import { PackagingPressureOverlay } from './PackagingPressureOverlay';
import { CGROverlay } from './CGROverlay';
import { HilbertOverlay } from './HilbertOverlay';
import { VirionStabilityOverlay } from './VirionStabilityOverlay';
import { PhasePortraitOverlay } from './PhasePortraitOverlay';
import { BiasDecompositionOverlay } from './BiasDecompositionOverlay';
import { HGTOverlay } from './HGTOverlay';
import { CommandPalette } from './CommandPalette';
import { CRISPROverlay } from './CRISPROverlay';
import { AnomalyOverlay } from './AnomalyOverlay';
import { GelOverlay } from './GelOverlay';

interface OverlayManagerProps {
  repository: PhageRepository | null;
  currentPhage: PhageFull | null;
}

export function OverlayManager({ repository, currentPhage }: OverlayManagerProps): React.ReactElement | null {
  return (
    <>
      <SearchOverlay repository={repository} currentPhage={currentPhage} />
      <AAKeyOverlay />
      <AALegend />
      <TropismOverlay repository={repository} phage={currentPhage} />
      <SimulationHub />
      <SimulationView />
      <ComparisonOverlay repository={repository} />
      <PackagingPressureOverlay />
      <AnomalyOverlay repository={repository} currentPhage={currentPhage} />
      <VirionStabilityOverlay />
      <CGROverlay repository={repository} currentPhage={currentPhage} />
      <HilbertOverlay repository={repository} currentPhage={currentPhage} />
      <PhasePortraitOverlay repository={repository} currentPhage={currentPhage} />
      <BiasDecompositionOverlay repository={repository} currentPhage={currentPhage} />
      <HGTOverlay repository={repository} currentPhage={currentPhage} />
      <CRISPROverlay repository={repository} phage={currentPhage} />
      <GelOverlay repository={repository} currentPhage={currentPhage} />
      <CommandPalette />
    </>
  );
}

export default OverlayManager;
