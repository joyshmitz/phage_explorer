import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { usePhageStore } from '@phage-explorer/state';
import { SIMULATION_METADATA, type SimulationMeta } from '@phage-explorer/core';
import { getSimulationRegistry } from '../simulations/registry';

interface SimulationHubOverlayProps {
  onClose: () => void;
}

export function SimulationHubOverlay({ onClose }: SimulationHubOverlayProps): React.ReactElement {
  const currentPhage = usePhageStore(s => s.currentPhage);
  const activeSim = usePhageStore(s => s.activeSimulationId);
  const launchSimulation = usePhageStore(s => s.launchSimulation);
  const closeSimulation = usePhageStore(s => s.closeSimulation);

  const [selected, setSelected] = useState(0);

  const simulations = useMemo(
    () => [...SIMULATION_METADATA].sort((a, b) => a.priority - b.priority),
    []
  );

  const registry = getSimulationRegistry();

  useInput((input, key) => {
    if (key.escape) {
      onClose();
      return;
    }
    if (key.upArrow) {
      setSelected(i => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow) {
      setSelected(i => Math.min(simulations.length - 1, i + 1));
      return;
    }
    if (key.return) {
      const meta = simulations[selected];
      const sim = registry.get(meta.id);
      if (sim) {
        if (meta.requiresPhage && !currentPhage) {
          return;
        }
        // Stop an existing simulation before launching a new one
        if (activeSim) {
          closeSimulation();
        }
        const initial = sim.init(currentPhage, undefined);
        launchSimulation(sim.id, initial);
      }
      onClose();
    }
  });

  const selectedMeta: SimulationMeta | undefined = simulations[selected];
  const phageName = currentPhage?.name ?? 'None';

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="#22c55e"
      width={80}
      height={24}
      paddingX={1}
      paddingY={1}
    >
      <Box justifyContent="space-between" marginBottom={1}>
        <Text color="#22c55e" bold>SIMULATION HUB</Text>
        <Text color="#9ca3af">ESC to close · Enter to start · Current phage: {phageName}</Text>
      </Box>

      <Box>
        <Box flexDirection="column" width={30}>
          {simulations.map((sim, idx) => (
            <Text
              key={sim.id}
              color={sim.requiresPhage && !currentPhage ? '#4b5563' : idx === selected ? '#22c55e' : '#e5e7eb'}
              bold={idx === selected}
            >
              {idx === selected ? '▶ ' : '  '}
              {sim.icon} {sim.name}
              {activeSim === sim.id ? ' (running)' : ''}
              {sim.requiresPhage && !currentPhage ? ' [needs phage]' : ''}
            </Text>
          ))}
        </Box>

        <Box flexDirection="column" paddingLeft={2} width={46}>
          {selectedMeta ? (
            <>
              <Text color="#e5e7eb" bold>{selectedMeta.name}</Text>
              <Text color="#9ca3af">{selectedMeta.description}</Text>
              <Text color="#9ca3af" dimColor>
                Requires phage: {selectedMeta.requiresPhage ? 'Yes' : 'No'}
              </Text>
              <Text color="#9ca3af" dimColor>
                Keywords: {selectedMeta.keywords.join(', ')}
              </Text>
              {selectedMeta.requiresPhage && !currentPhage && (
                <Text color="#f87171">Load a phage to start this simulation.</Text>
              )}
            </>
          ) : (
            <Text color="#9ca3af">Select a simulation</Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}

