import type {
  PhageFull,
  Simulation,
  SimulationRegistry,
  SimulationId,
  SimState,
  LysogenyCircuitState,
  RibosomeTrafficState,
  PlaqueAutomataState,
  EvolutionReplayState,
  PackagingMotorState,
} from '@phage-explorer/core';
import { getDefaultParams } from '@phage-explorer/core';

// Simple helper to clamp numbers
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function makeLysogenySimulation(): Simulation<LysogenyCircuitState> {
  return {
    id: 'lysogeny-circuit',
    name: 'Lysogeny Decision Circuit',
    description: 'Toy ODE of CI/Cro balance; UV tips decision.',
    parameters: [
      { id: 'moi', label: 'Multiplicity of infection', type: 'number', min: 0.1, max: 5, step: 0.1, defaultValue: 1 },
      { id: 'uv', label: 'UV stress', type: 'number', min: 0, max: 1, step: 0.05, defaultValue: 0 },
    ],
    controls: [],
    init: (_phage, params): LysogenyCircuitState => {
      const base = getDefaultParams([
        { id: 'moi', label: '', type: 'number', defaultValue: 1 },
        { id: 'uv', label: '', type: 'number', defaultValue: 0 },
      ]);
      const merged = { ...base, ...(params ?? {}) } as Record<string, number | boolean | string>;
      return {
        type: 'lysogeny-circuit',
        time: 0,
        running: true,
        speed: 1,
        params: merged,
        ci: 0.6,
        cro: 0.4,
        n: 0.2,
        phase: 'undecided',
        history: [] as Array<{ time: number; ci: number; cro: number }>,
      };
    },
    step: (state: LysogenyCircuitState, dt: number): LysogenyCircuitState => {
      const uv = Number(state.params.uv ?? 0);
      const moi = Number(state.params.moi ?? 1);
      const ciNext = clamp(state.ci + (0.4 * moi - 0.3 * uv - state.cro) * 0.1 * dt, 0, 1.5);
      const croNext = clamp(state.cro + (0.3 * uv + 0.2 - state.ci) * 0.1 * dt, 0, 1.5);
      const phase = ciNext - croNext > 0.1 ? 'lysogenic' : croNext - ciNext > 0.1 ? 'lytic' : 'undecided';
      const history = [...state.history, { time: state.time + dt, ci: ciNext, cro: croNext }].slice(-50);
      return {
        ...state,
        time: state.time + dt,
        ci: ciNext,
        cro: croNext,
        phase,
        history,
      };
    },
    getSummary: (state) => `t=${state.time.toFixed(0)} CI=${state.ci.toFixed(2)} Cro=${state.cro.toFixed(2)} | ${state.phase}`,
  };
}

function makeRibosomeSimulation(): Simulation<RibosomeTrafficState> {
  return {
    id: 'ribosome-traffic',
    name: 'Ribosome Traffic',
    description: 'Toy TASEP along a transcript with stalls.',
    parameters: [
      { id: 'length', label: 'mRNA length (codons)', type: 'number', min: 30, max: 300, step: 10, defaultValue: 120 },
      { id: 'stallRate', label: 'Stall rate', type: 'number', min: 0, max: 0.2, step: 0.01, defaultValue: 0.03 },
    ],
    controls: [],
    init: (_phage, params): RibosomeTrafficState => {
      const base = getDefaultParams([
        { id: 'length', label: '', type: 'number', defaultValue: 120 },
        { id: 'stallRate', label: '', type: 'number', defaultValue: 0.03 },
      ]);
      const merged = { ...base, ...(params ?? {}) } as Record<string, number | boolean | string>;
      const length = Number(merged.length ?? 120);
      return {
        type: 'ribosome-traffic',
        time: 0,
        running: true,
        speed: 1,
        params: merged,
        mRnaId: 'gene-1',
        ribosomes: [0, Math.floor(length / 3)],
        codonRates: Array.from({ length }, () => 5 + Math.random() * 5),
        proteinsProduced: 0,
        stallEvents: 0,
      };
    },
    step: (state: RibosomeTrafficState, dt: number): RibosomeTrafficState => {
      const length = Number(state.params.length ?? 120);
      const stallRate = Number(state.params.stallRate ?? 0.03);
      const ribosomes = state.ribosomes.map((pos: number) => {
        if (Math.random() < stallRate * dt) return pos;
        return Math.min(length, pos + 1 + Math.floor(state.speed));
      });
      const completed = ribosomes.filter(pos => pos >= length).length;
      const active = ribosomes.filter(pos => pos < length);
      return {
        ...state,
        time: state.time + dt,
        ribosomes: active,
        proteinsProduced: state.proteinsProduced + completed,
        stallEvents: state.stallEvents + (ribosomes.length - active.length - completed >= 0 ? 0 : 0),
      };
    },
    getSummary: (state) => `t=${state.time.toFixed(0)} ribosomes=${state.ribosomes.length} proteins=${state.proteinsProduced}`,
  };
}

function makePlaqueSimulation(): Simulation<PlaqueAutomataState> {
  return {
    id: 'plaque-automata',
    name: 'Plaque Automata',
    description: 'Cellular automaton of plaque spread.',
    parameters: [
      { id: 'grid', label: 'Grid size', type: 'number', min: 10, max: 50, step: 5, defaultValue: 30 },
    ],
    controls: [],
    init: (_phage, params): PlaqueAutomataState => {
      const base = getDefaultParams([{ id: 'grid', label: '', type: 'number', defaultValue: 30 }]);
      const merged = { ...base, ...(params ?? {}) } as Record<string, number | boolean | string>;
      const size = Number(merged.grid ?? 30);
      const cells = new Uint8Array(size * size);
      cells[Math.floor(size * size / 2)] = 4; // seed phage
      return {
        type: 'plaque-automata',
        time: 0,
        running: true,
        speed: 1,
        params: merged,
        gridSize: size,
        grid: cells,
        phageCount: 1,
        bacteriaCount: size * size - 1,
        infectionCount: 0,
      };
    },
    step: (state: PlaqueAutomataState, dt: number): PlaqueAutomataState => {
      const grid = state.grid.slice();
      let phage = state.phageCount;
      let bacteria = state.bacteriaCount;
      let infected = state.infectionCount;
      const size = state.gridSize;
      for (let i = 0; i < grid.length; i++) {
        if (grid[i] === 4 && Math.random() < 0.1 * dt) {
          grid[i] = 2; // infect
          phage = Math.max(0, phage - 1);
          infected += 1;
        } else if (grid[i] === 2 && Math.random() < 0.05 * dt) {
          grid[i] = 3; // lyse
          phage += 5;
          infected = Math.max(0, infected - 1);
        } else if (grid[i] === 0 && Math.random() < 0.02 * dt) {
          grid[i] = 1; // bacteria grow back
          bacteria += 1;
        }
      }
      return {
        ...state,
        time: state.time + dt,
        grid,
        phageCount: phage,
        bacteriaCount: bacteria,
        infectionCount: infected,
      };
    },
    getSummary: (state) => `t=${state.time.toFixed(0)} phage=${state.phageCount} infected=${state.infectionCount}`,
  };
}

function makeEvolutionSimulation(): Simulation<EvolutionReplayState> {
  return {
    id: 'evolution-replay',
    name: 'Evolution Replay',
    description: 'Accumulate random mutations and fitness.',
    parameters: [
      { id: 'mutRate', label: 'Mutation rate', type: 'number', min: 0, max: 0.2, step: 0.01, defaultValue: 0.05 },
    ],
    controls: [],
    init: (_phage, params): EvolutionReplayState => {
      const base = getDefaultParams([{ id: 'mutRate', label: '', type: 'number', defaultValue: 0.05 }]);
      const merged = { ...base, ...(params ?? {}) } as Record<string, number | boolean | string>;
      return {
        type: 'evolution-replay',
        time: 0,
        running: true,
        speed: 1,
        params: merged,
        generation: 0,
        mutations: [],
        fitnessHistory: [1],
      };
    },
    step: (state: EvolutionReplayState, dt: number): EvolutionReplayState => {
      const mutRate = Number(state.params.mutRate ?? 0.05);
      const newMutations = [...state.mutations];
      if (Math.random() < mutRate * dt) {
        newMutations.push({
          position: Math.floor(Math.random() * 50000),
          from: 'A',
          to: 'G',
          generation: state.generation + 1,
        });
      }
      const nextFitness = clamp(state.fitnessHistory[state.fitnessHistory.length - 1] + (Math.random() - 0.4) * 0.05, 0.7, 1.3);
      const nextHistory = [...state.fitnessHistory, nextFitness].slice(-100);
      return {
        ...state,
        time: state.time + dt,
        generation: state.generation + 1,
        mutations: newMutations,
        fitnessHistory: nextHistory,
      };
    },
    getSummary: (state) => `gen=${state.generation} fitness=${state.fitnessHistory.at(-1)?.toFixed(2) ?? '1.00'} muts=${state.mutations.length}`,
  };
}

function makePackagingSimulation(): Simulation<PackagingMotorState> {
  return {
    id: 'packaging-motor',
    name: 'Packaging Motor',
    description: 'Fill fraction → pressure model.',
    parameters: [
      { id: 'stall', label: 'Stall prob', type: 'number', min: 0, max: 0.2, step: 0.01, defaultValue: 0.02 },
    ],
    controls: [],
    init: (_phage, params): PackagingMotorState => {
      const base = getDefaultParams([{ id: 'stall', label: '', type: 'number', defaultValue: 0.02 }]);
      const merged = { ...base, ...(params ?? {}) } as Record<string, number | boolean | string>;
      return {
        type: 'packaging-motor',
        time: 0,
        running: true,
        speed: 1,
        params: merged,
        fillFraction: 0.1,
        pressure: 5,
        force: 20,
        stallProbability: Number(merged.stall ?? 0.02),
      };
    },
    step: (state: PackagingMotorState, dt: number): PackagingMotorState => {
      const stall = Number(state.params.stall ?? 0.02);
      const stalled = Math.random() < stall * dt;
      const fill = clamp(state.fillFraction + (stalled ? 0 : 0.01 * dt * state.speed), 0, 1);
      const pressure = 5 + fill * 55;
      const force = 20 + fill * 80;
      return {
        ...state,
        time: state.time + dt,
        fillFraction: fill,
        pressure,
        force,
        stallProbability: stall,
      };
    },
    getSummary: (state) => `t=${state.time.toFixed(0)} fill ${(state.fillFraction * 100).toFixed(1)}% pressure=${state.pressure.toFixed(1)} atm`,
  };
}

let registryCache: SimulationRegistry | null = null;

export function getSimulationRegistry(): SimulationRegistry {
  if (registryCache) return registryCache;
  const reg: SimulationRegistry = new Map();
  const sims: Array<Simulation<SimState>> = [
    makeLysogenySimulation(),
    makeRibosomeSimulation(),
    makePlaqueSimulation(),
    makeEvolutionSimulation(),
    makePackagingSimulation(),
  ].map(sim => sim as unknown as Simulation<SimState>);
  sims.forEach(sim => reg.set(sim.id as SimulationId, sim as Simulation));
  registryCache = reg;
  return reg;
}

