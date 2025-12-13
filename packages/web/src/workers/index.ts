/**
 * Workers Module Exports
 */

// Main orchestrator
export { ComputeOrchestrator, getOrchestrator } from './ComputeOrchestrator';

// Worker preloader - call preloadWorkers() on app mount for instant overlay feel
export {
  preloadWorkers,
  getSearchWorker,
  isPreloaded,
  terminateWorkers,
} from './WorkerPreloader';

// Types
export type {
  AnalysisType,
  AnalysisRequest,
  AnalysisResult,
  AnalysisOptions,
  GCSkewResult,
  ComplexityResult,
  BendabilityResult,
  PromoterResult,
  RepeatResult,
  CodonUsageResult,
  KmerSpectrumResult,
  ProgressInfo,
  SimInitParams,
  SimStepRequest,
  AnalysisWorkerAPI,
  SimulationWorkerAPI,
  SearchWorkerAPI,
  SearchMode,
  SearchRequest,
  SearchResponse,
  SearchHit,
  SearchFeature,
  SearchOptions,
  WorkerPoolConfig,
} from './types';

// Re-export simulation types from core
export type {
  SimulationId,
  SimState,
  SimParameter,
  LysogenyCircuitState,
  RibosomeTrafficState,
  PlaqueAutomataState,
  EvolutionReplayState,
  PackagingMotorState,
  InfectionKineticsState,
} from './types';
