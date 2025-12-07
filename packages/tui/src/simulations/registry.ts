import type {
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
import { getDefaultParams, STANDARD_CONTROLS } from '@phage-explorer/core';

// Simple helper to clamp numbers
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const randomNeighbor = (index: number, size: number): number | null => {
  const x = index % size;
  const y = Math.floor(index / size);
  const dirs = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
  ];
  const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
  const nx = x + dx;
  const ny = y + dy;
  if (nx < 0 || ny < 0 || nx >= size || ny >= size) return null;
  return ny * size + nx;
};

function makeLysogenySimulation(): Simulation<LysogenyCircuitState> {
  return {
    id: 'lysogeny-circuit',
    name: 'Lysogeny Decision Circuit',
    description: 'Bistable CI/Cro toggle; MOI and UV tip the switch.',
    controls: STANDARD_CONTROLS,
    parameters: [
      { id: 'moi', label: 'Multiplicity of infection', type: 'number', min: 0.1, max: 5, step: 0.1, defaultValue: 1 },
      { id: 'uv', label: 'UV / damage', type: 'number', min: 0, max: 1, step: 0.05, defaultValue: 0 },
      { id: 'ciProd', label: 'CI synthesis', type: 'number', min: 0.1, max: 2, step: 0.05, defaultValue: 0.8 },
      { id: 'croProd', label: 'Cro synthesis', type: 'number', min: 0.1, max: 2, step: 0.05, defaultValue: 0.6 },
      { id: 'decay', label: 'Protein decay', type: 'number', min: 0.01, max: 0.3, step: 0.01, defaultValue: 0.05 },
      { id: 'hill', label: 'Hill cooperativity', type: 'number', min: 1, max: 4, step: 0.2, defaultValue: 2 },
    ],
    init: (_phage, params): LysogenyCircuitState => {
      const base = getDefaultParams([
        { id: 'moi', label: '', type: 'number', defaultValue: 1 },
        { id: 'uv', label: '', type: 'number', defaultValue: 0 },
        { id: 'ciProd', label: '', type: 'number', defaultValue: 0.8 },
        { id: 'croProd', label: '', type: 'number', defaultValue: 0.6 },
        { id: 'decay', label: '', type: 'number', defaultValue: 0.05 },
        { id: 'hill', label: '', type: 'number', defaultValue: 2 },
      ]);
      const merged = { ...base, ...(params ?? {}) } as Record<string, number | boolean | string>;
      return {
        type: 'lysogeny-circuit',
        time: 0,
        running: true,
        speed: 1,
        params: merged,
        ci: 0.4,
        cro: 0.3,
        n: 0.05,
        phase: 'undecided',
        history: [] as Array<{ time: number; ci: number; cro: number; phase: string }>,
      };
    },
    step: (state: LysogenyCircuitState, dt: number): LysogenyCircuitState => {
      const uv = Number(state.params.uv ?? 0);
      const moi = Number(state.params.moi ?? 1);
      const ciProd = Number(state.params.ciProd ?? 0.8);
      const croProd = Number(state.params.croProd ?? 0.6);
      const decay = Number(state.params.decay ?? 0.05);
      const hill = Number(state.params.hill ?? 2);

      // Hill repression: Cro represses CI, CI represses Cro
      const ciRepr = 1 / (1 + Math.pow(state.cro / 0.5, hill));
      const croRepr = 1 / (1 + Math.pow(state.ci / 0.5, hill));

      const ciSynth = ciProd * moi * ciRepr;
      const croSynth = croProd * croRepr + 0.12 * uv; // UV biases Cro

      const ciNext = clamp(state.ci + (ciSynth - decay * state.ci - 0.2 * uv) * dt, 0, 3);
      const croNext = clamp(state.cro + (croSynth - decay * state.cro + 0.05) * dt, 0, 3);

      const phase = ciNext - croNext > 0.2 ? 'lysogenic' : croNext - ciNext > 0.2 ? 'lytic' : 'undecided';
      const history = [...state.history, { time: state.time + dt, ci: ciNext, cro: croNext, phase }].slice(-120);
      return {
        ...state,
        time: state.time + dt,
        ci: ciNext,
        cro: croNext,
        phase,
        history,
      };
    },
    getSummary: (state) => `t=${state.time.toFixed(0)} CI=${state.ci.toFixed(2)} Cro=${state.cro.toFixed(2)} · ${state.phase}`,
  };
}

function makeRibosomeSimulation(): Simulation<RibosomeTrafficState> {
  return {
    id: 'ribosome-traffic',
    name: 'Ribosome Traffic',
    description: 'TASEP-like translation with footprint, stalls, and initiation.',
    controls: STANDARD_CONTROLS,
    parameters: [
      { id: 'length', label: 'mRNA length (codons)', type: 'number', min: 30, max: 300, step: 10, defaultValue: 120 },
      { id: 'stallRate', label: 'Stall site fraction', type: 'number', min: 0, max: 0.3, step: 0.01, defaultValue: 0.08 },
      { id: 'initRate', label: 'Initiation rate', type: 'number', min: 0, max: 2, step: 0.05, defaultValue: 0.6 },
      { id: 'footprint', label: 'Ribosome footprint (codons)', type: 'number', min: 6, max: 12, step: 1, defaultValue: 9 },
    ],
    init: (_phage, params): RibosomeTrafficState => {
      const base = getDefaultParams([
        { id: 'length', label: '', type: 'number', defaultValue: 120 },
        { id: 'stallRate', label: '', type: 'number', defaultValue: 0.08 },
        { id: 'initRate', label: '', type: 'number', defaultValue: 0.6 },
        { id: 'footprint', label: '', type: 'number', defaultValue: 9 },
      ]);
      const merged = { ...base, ...(params ?? {}) } as Record<string, number | boolean | string>;
      const length = Number(merged.length ?? 120);
      const stallRate = Number(merged.stallRate ?? 0.08);
      const slowCount = Math.max(1, Math.floor(length * stallRate));
      const codonRates = Array.from({ length }, () => 6 + Math.random() * 4); // 6-10 fast-ish
      // Seed slow codons
      for (let i = 0; i < slowCount; i++) {
        const idx = Math.floor(Math.random() * length);
        codonRates[idx] = 1 + Math.random() * 2; // very slow site
      }
      return {
        type: 'ribosome-traffic',
        time: 0,
        running: true,
        speed: 1,
        params: merged,
        mRnaId: 'gene-1',
        ribosomes: [],
        codonRates,
        proteinsProduced: 0,
        stallEvents: 0,
        densityHistory: [],
        productionHistory: [],
      };
    },
    step: (state: RibosomeTrafficState, dt: number): RibosomeTrafficState => {
      const length = Number(state.params.length ?? 120);
      const initRate = Number(state.params.initRate ?? 0.6);
      const footprint = Number(state.params.footprint ?? 9);

      const ribosomes = [...state.ribosomes];
      let stallEvents = state.stallEvents;

      // Attempt initiation
      const canInitiate = ribosomes.every(pos => pos > footprint);
      if (canInitiate && Math.random() < initRate * dt) {
        ribosomes.unshift(0);
      }

      // Advance ribosomes from front to back to respect exclusion
      for (let i = 0; i < ribosomes.length; i++) {
        const pos = ribosomes[i];
        if (pos >= length) continue;

        const rate = state.codonRates[Math.min(pos, state.codonRates.length - 1)] ?? 5;
        const stepSize = Math.max(1, Math.floor(rate * dt));
        const target = Math.min(length, pos + stepSize);

        const ahead = ribosomes.slice(0, i).find(p => p >= pos && p < pos + footprint);
        const blocked = ahead !== undefined && ahead - pos < footprint;
        if (blocked) {
          stallEvents += 1;
          continue;
        }
        ribosomes[i] = target;
      }

      const completed = ribosomes.filter(pos => pos >= length).length;
      const active = ribosomes.filter(pos => pos < length);

      const densityHistory = [...state.densityHistory, active.length].slice(-200);
      const productionHistory = [...state.productionHistory, state.proteinsProduced + completed].slice(-200);

      return {
        ...state,
        time: state.time + dt,
        ribosomes: active,
        proteinsProduced: state.proteinsProduced + completed,
        stallEvents,
        densityHistory,
        productionHistory,
      };
    },
    getSummary: (state) => `t=${state.time.toFixed(0)} ribosomes=${state.ribosomes.length} proteins=${state.proteinsProduced}`,
  };
}

function makePlaqueSimulation(): Simulation<PlaqueAutomataState> {
  return {
    id: 'plaque-automata',
    name: 'Plaque Automata',
    description: 'Reaction-diffusion CA: infection, lysis, diffusion, lysogeny.',
    controls: STANDARD_CONTROLS,
    parameters: [
      { id: 'grid', label: 'Grid size', type: 'number', min: 10, max: 50, step: 5, defaultValue: 30 },
      { id: 'burst', label: 'Burst size', type: 'number', min: 5, max: 300, step: 5, defaultValue: 80 },
      { id: 'latent', label: 'Latent period (ticks)', type: 'number', min: 2, max: 40, step: 1, defaultValue: 12 },
      { id: 'diffusion', label: 'Diffusion prob', type: 'number', min: 0.0, max: 0.6, step: 0.05, defaultValue: 0.25 },
      { id: 'adsorption', label: 'Adsorption prob', type: 'number', min: 0.0, max: 0.6, step: 0.05, defaultValue: 0.2 },
      { id: 'lysogeny', label: 'Lysogeny prob', type: 'number', min: 0.0, max: 1.0, step: 0.05, defaultValue: 0.0 },
    ],
    init: (_phage, params): PlaqueAutomataState => {
      const base = getDefaultParams([
        { id: 'grid', label: '', type: 'number', defaultValue: 30 },
        { id: 'burst', label: '', type: 'number', defaultValue: 80 },
        { id: 'latent', label: '', type: 'number', defaultValue: 12 },
        { id: 'diffusion', label: '', type: 'number', defaultValue: 0.25 },
        { id: 'adsorption', label: '', type: 'number', defaultValue: 0.2 },
        { id: 'lysogeny', label: '', type: 'number', defaultValue: 0.0 },
      ]);
      const merged = { ...base, ...(params ?? {}) } as Record<string, number | boolean | string>;
      const size = Number(merged.grid ?? 30);
      const cells = new Uint8Array(size * size);
      const ages = new Float32Array(size * size);
      cells[Math.floor(size * size / 2)] = 4; // seed phage at center
      return {
        type: 'plaque-automata',
        time: 0,
        running: true,
        speed: 1,
        params: merged,
        gridSize: size,
        grid: cells,
        infectionTimes: ages,
        phageCount: 1,
        bacteriaCount: size * size - 1,
        infectionCount: 0,
      };
    },
    step: (state: PlaqueAutomataState, dt: number): PlaqueAutomataState => {
      // Double buffering to prevent sequential update artifacts
      const currentGrid = state.grid;
      const nextGrid = new Uint8Array(currentGrid); // Start with copy
      const nextAges = new Float32Array(state.infectionTimes); // Copy ages

      let phage = 0;
      let bacteria = 0;
      let infected = 0;

      const size = state.gridSize;
      const burst = Number(state.params.burst ?? 80);
      const latent = Number(state.params.latent ?? 12);
      const diffusion = Number(state.params.diffusion ?? 0.25);
      const adsorption = Number(state.params.adsorption ?? 0.2);
      const lysogeny = Number(state.params.lysogeny ?? 0.0);

      // We iterate over the CURRENT grid to determine actions
      for (let i = 0; i < currentGrid.length; i++) {
        const stateVal = currentGrid[i];

        if (stateVal === 4) { // Free phage
          // Diffuse randomly
          if (Math.random() < diffusion * dt) {
            const neighbor = randomNeighbor(i, size);
            // Check if neighbor is valid and what resides there in CURRENT state
            if (neighbor !== null) {
              const targetState = currentGrid[neighbor];
              
              if (targetState === 1 && Math.random() < adsorption) {
                // Infect bacteria
                // Check if already infected in NEXT grid by another phage this tick
                if (nextGrid[neighbor] !== 2 && nextGrid[neighbor] !== 5) {
                   nextGrid[neighbor] = 2;
                   nextAges[neighbor] = 0;
                   // Remove self from old spot (unless replaced by something else in nextGrid? assume 0)
                   // But what if another phage moved into 'i'?
                   // If we write 0, we might kill a phage that just arrived.
                   // Priority: Arrival > Departure? 
                   // Simplification: We enforce empty.
                   if (nextGrid[i] === 4) nextGrid[i] = 0; 
                }
              } else if (targetState === 0) {
                // Move to empty space
                // Only move if target spot in NEXT grid is not occupied by higher priority (Infection/Bacteria)
                // We allow stacking (overwriting 4 with 4)
                if (nextGrid[neighbor] === 0 || nextGrid[neighbor] === 4) {
                   nextGrid[neighbor] = 4;
                   if (nextGrid[i] === 4) nextGrid[i] = 0;
                }
              }
            }
          }
        } else if (stateVal === 2) { // Infected
          // Age the infection
          nextAges[i] += dt;
          if (nextAges[i] >= latent) {
            // Decision: Lysis vs Lysogeny
            if (Math.random() < lysogeny) {
               nextGrid[i] = 5; // Lysogen
            } else {
               nextGrid[i] = 3; // Lysed
               // Burst: scatter phages
               const burstCount = Math.max(1, Math.floor(burst));
               for (let b = 0; b < burstCount; b++) {
                 const nb = randomNeighbor(i, size);
                 // Can only place phage in empty or on top of other phages
                 if (nb !== null && (nextGrid[nb] === 0 || nextGrid[nb] === 4)) {
                   nextGrid[nb] = 4;
                 }
               }
            }
          }
        } else if (stateVal === 0) { // Empty
          // Regrowth
          if (Math.random() < 0.01 * dt) {
            // Only grow if not already claimed by a phage in this tick
            if (nextGrid[i] === 0) {
              nextGrid[i] = 1;
            }
          }
        }
      }

      // Count stats for next frame
      for (let i = 0; i < nextGrid.length; i++) {
        const val = nextGrid[i];
        if (val === 1 || val === 5) bacteria++; // Lysogens count as bacteria
        if (val === 2) infected++;
        if (val === 4) phage++;
        // Normalize lysogens to bacteria for display if desired, 
        // but keeping 5 allows distinctive behavior later.
        if (val === 5) nextGrid[i] = 1; // Visual simplification
      }

      return {
        ...state,
        time: state.time + dt,
        grid: nextGrid,
        infectionTimes: nextAges,
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
    description: 'Molecular clock-ish replay: mutations, fitness, Ne drift.',
    controls: STANDARD_CONTROLS,
    parameters: [
      { id: 'mutRate', label: 'Mutation rate', type: 'number', min: 0, max: 0.2, step: 0.01, defaultValue: 0.05 },
      { id: 'popSize', label: 'Effective population (Ne)', type: 'number', min: 1e3, max: 1e7, step: 1e3, defaultValue: 1e5 },
      { id: 'selMean', label: 'Selection mean s', type: 'number', min: -0.1, max: 0.1, step: 0.01, defaultValue: 0.0 },
      { id: 'selSd', label: 'Selection sd', type: 'number', min: 0, max: 0.1, step: 0.01, defaultValue: 0.02 },
    ],
    init: (_phage, params): EvolutionReplayState => {
      const base = getDefaultParams([
        { id: 'mutRate', label: '', type: 'number', defaultValue: 0.05 },
        { id: 'popSize', label: '', type: 'number', defaultValue: 1e5 },
        { id: 'selMean', label: '', type: 'number', defaultValue: 0.0 },
        { id: 'selSd', label: '', type: 'number', defaultValue: 0.02 },
      ]);
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
        neHistory: [Number(merged.popSize ?? 1e5)],
      };
    },
    step: (state: EvolutionReplayState, dt: number): EvolutionReplayState => {
      const mutRate = Number(state.params.mutRate ?? 0.05);
      const popSize = Number(state.params.popSize ?? 1e5);
      const selMean = Number(state.params.selMean ?? 0.0);
      const selSd = Number(state.params.selSd ?? 0.02);

      const newMutations = [...state.mutations];
      const mutsThisGen = Math.max(0, Math.round(mutRate * 3 * dt)); // approximate
      for (let i = 0; i < mutsThisGen; i++) {
        const s = selMean + selSd * (Math.random() * 2 - 1);
        newMutations.push({
          position: Math.floor(Math.random() * 50000),
          from: 'A',
          to: 'G',
          generation: state.generation + 1,
          s,
        } as any);
      }

      const lastFitness = state.fitnessHistory[state.fitnessHistory.length - 1] ?? 1;
      const meanS = newMutations.slice(-10).reduce((a, m: any) => a + (m.s ?? 0), 0) / Math.max(1, Math.min(10, newMutations.length));
      const drift = (Math.random() - 0.5) * 0.01;
      const nextFitness = clamp(lastFitness * (1 + meanS + drift), 0.6, 1.5);
      const nextHistory = [...state.fitnessHistory, nextFitness].slice(-200);

      // Ne drift with weak noise
      const lastNe = state.neHistory.at(-1) ?? popSize;
      const neDrift = lastNe * (1 + (Math.random() - 0.5) * 0.05);
      const nextNe = clamp(neDrift, popSize * 0.1, popSize * 10);
      const neHistory = [...state.neHistory, nextNe].slice(-200);

      return {
        ...state,
        time: state.time + dt,
        generation: state.generation + 1,
        mutations: newMutations,
        fitnessHistory: nextHistory,
        neHistory,
      };
    },
    getSummary: (state) => `gen=${state.generation} fitness=${state.fitnessHistory.at(-1)?.toFixed(2) ?? '1.00'} muts=${state.mutations.length}`,
  };
}

function makePackagingSimulation(): Simulation<PackagingMotorState> {
  return {
    id: 'packaging-motor',
    name: 'Packaging Motor',
    description: 'DNA fill → pressure/force with salt and capsid geometry.',
    controls: STANDARD_CONTROLS,
    parameters: [
      { id: 'genomeKb', label: 'Genome length (kb)', type: 'number', min: 3, max: 200, step: 1, defaultValue: 50 },
      { id: 'capsidRadius', label: 'Capsid radius (nm)', type: 'number', min: 20, max: 60, step: 1, defaultValue: 30 },
      { id: 'ionic', label: 'Ionic strength (mM)', type: 'number', min: 1, max: 200, step: 5, defaultValue: 50 },
      { id: 'mode', label: 'Packaging mode', type: 'select', options: [
        { value: 'headful', label: 'Headful' },
        { value: 'cos', label: 'Cos' },
        { value: 'phi29', label: 'Phi29 motor' },
      ], defaultValue: 'cos' },
    ],
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
        stallProbability: 0,
      };
    },
    step: (state: PackagingMotorState, dt: number): PackagingMotorState => {
      const genomeKb = Number(state.params.genomeKb ?? 50);
      const capsidRadius = Number(state.params.capsidRadius ?? 30); // nm
      const ionic = Number(state.params.ionic ?? 50); // mM
      const mode = String(state.params.mode ?? 'cos');

      // Progress fill; faster when under-stuffed, slower near full
      const fillDelta = 0.015 * state.speed * (1 - state.fillFraction) * dt;
      const fill = clamp(state.fillFraction + fillDelta, 0, 1);

      // Very lightweight physics-inspired approximations
      const persistenceLen = 50; // nm
      const contourNm = genomeKb * 0.34 * 1000; // nm
      const packedDensity = (contourNm * fill) / ((4 / 3) * Math.PI * Math.pow(capsidRadius, 3));

      // Bending energy ~ (L / R^2)
      const bendingEnergy = (contourNm * fill) / Math.max(1, capsidRadius * capsidRadius * persistenceLen);

      // Electrostatics damped by ionic strength (Debye ~ 0.304/sqrt(I) nm)
      const debye = 0.304 / Math.sqrt(Math.max(1, ionic)); // nm
      const electrostatic = packedDensity * 0.5 * (1 / Math.max(debye, 0.05));

      // Mode-specific pressure scaling
      const modeFactor = mode === 'headful' ? 1.0 : mode === 'phi29' ? 1.2 : 0.9;

      const pressure = clamp(5 + 30 * fill + 200 * bendingEnergy * 1e-6 + 80 * electrostatic * 1e-3, 0, 80) * modeFactor;
      const force = clamp(10 + 150 * fill + pressure * 0.8, 0, 200);

      return {
        ...state,
        time: state.time + dt,
        fillFraction: fill,
        pressure,
        force,
        stallProbability: 0,
      };
    },
    getSummary: (state) => `t=${state.time.toFixed(0)} fill ${(state.fillFraction * 100).toFixed(1)}% · P=${state.pressure.toFixed(1)} atm · F=${state.force.toFixed(1)} pN`,
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
  sims.forEach(sim => reg.set(sim.id as SimulationId, sim));
  registryCache = reg;
  return reg;
}

