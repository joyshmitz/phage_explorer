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
  const launchSimulation = usePhageStore(s => s.launchSimulation);

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
        const initial = sim.init(currentPhage, undefined);
        launchSimulation(sim.id, initial);
      }
      onClose();
    }
  });

  const selectedMeta: SimulationMeta | undefined = simulations[selected];

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
        <Text color="#9ca3af">ESC to close · Enter to start</Text>
      </Box>

      <Box>
        <Box flexDirection="column" width={30}>
          {simulations.map((sim, idx) => (
            <Text key={sim.id} color={idx === selected ? '#22c55e' : '#e5e7eb'} bold={idx === selected}>
              {idx === selected ? '▶ ' : '  '}
              {sim.icon} {sim.name}
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
            </>
          ) : (
            <Text color="#9ca3af">Select a simulation</Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}

