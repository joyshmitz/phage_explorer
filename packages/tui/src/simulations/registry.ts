import { getAllSimulations, type SimulationRegistry, type SimulationId } from '@phage-explorer/core';

let registryCache: SimulationRegistry | null = null;

export function getSimulationRegistry(): SimulationRegistry {
  if (registryCache) return registryCache;
  const reg: SimulationRegistry = new Map();
  const sims = getAllSimulations();
  sims.forEach(sim => reg.set(sim.id as SimulationId, sim));
  registryCache = reg;
  return reg;
}

