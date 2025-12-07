import React, { useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { usePhageStore } from '@phage-explorer/state';

type HelpRow = { key: string; desc: string; note?: string };

function Section({ title, rows }: { title: string; rows: HelpRow[] }): React.ReactElement {
  const colors = usePhageStore.getState().currentTheme.colors;
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color={colors.primary} bold underline>
        {title}
      </Text>
      {rows.map(({ key, desc, note }) => (
        <Box key={key} gap={2}>
          <Text color={colors.accent}>{key.padEnd(12)}</Text>
          <Text color={colors.text}>{desc}</Text>
          {note ? (
            <Text color={colors.textDim}> · {note}</Text>
          ) : null}
        </Box>
      ))}
    </Box>
  );
}

export function HelpOverlay(): React.ReactElement {
  const theme = usePhageStore(s => s.currentTheme);
  const viewMode = usePhageStore(s => s.viewMode);
  const readingFrame = usePhageStore(s => s.readingFrame);
  const diffEnabled = usePhageStore(s => s.diffEnabled);
  const model3DFullscreen = usePhageStore(s => s.model3DFullscreen);
  const helpDetail = usePhageStore(s => s.helpDetail);
  const overlays = usePhageStore(s => s.overlays);
  const setHelpDetail = usePhageStore(s => s.setHelpDetail);
  const closeOverlay = usePhageStore(s => s.closeOverlay);
  const experienceLevel = usePhageStore(s => s.experienceLevel);
  const colors = theme.colors;

  useInput((input, key) => {
    if (key.escape) {
      closeOverlay('help');
      return;
    }
    if (input === '?' || input === 'h' || input === 'H') {
      setHelpDetail(helpDetail === 'essential' ? 'detailed' : 'essential');
    }
  });

  const overlayRowsAll: HelpRow[] = [
    { key: 'X', desc: 'Sequence complexity (entropy)', note: 'HGT / repeats' },
    { key: 'G', desc: 'GC skew overlay', note: 'origin / terminus' },
    { key: 'B', desc: 'DNA bendability (AT proxy)' },
    { key: 'P', desc: 'Promoter / RBS motifs' },
    { key: 'R', desc: 'Repeats / palindromes' },
    { key: 'K', desc: 'AA legend (AA view)', note: 'AA only' },
    { key: 'W', desc: 'Comparison overlay', note: 'pairwise' },
    { key: ': / Ctrl+P', desc: 'Command palette', note: 'Fuzzy commands' },
  ];

  const overlayRows = useMemo(() => {
    if (experienceLevel === 'power') return overlayRowsAll;
    if (experienceLevel === 'intermediate') {
      return overlayRowsAll.filter(row => row.key !== ': / Ctrl+P');
    }
    // novice: only core overlays
    return overlayRowsAll.filter(row =>
      ['X', 'G', 'W', 'K'].includes(row.key)
    );
  }, [experienceLevel]);

  const essential = useMemo(() => {
    return {
      left: [
        {
          title: 'Navigate',
          rows: [
            { key: '↑ / ↓', desc: 'Previous / next phage' },
            { key: '← / →', desc: 'Scroll sequence left / right' },
            { key: 'PgUp / PgDn', desc: 'Scroll by page' },
            { key: 'Home / End', desc: 'Jump to start / end' },
          ],
        },
        {
          title: 'View & diff',
          rows: [
            { key: 'N / C / Space', desc: 'Toggle DNA / AA view' },
            { key: 'F', desc: `Reading frame (now ${readingFrame + 1})`, note: 'AA view only' },
            { key: 'T', desc: 'Cycle theme' },
            { key: 'D', desc: `Diff mode (${diffEnabled ? 'on' : 'off'})` },
            { key: 'M', desc: 'Toggle 3D model' },
          ],
        },
      ],
      right: [
        {
          title: 'Quick overlays',
          rows: [
            { key: 'X', desc: 'Complexity (HGT / repeats)' },
            { key: 'G', desc: 'GC skew (origin/terminus)' },
            { key: 'B', desc: 'Bendability (AT proxy)' },
            { key: 'P', desc: 'Promoter / RBS motifs' },
            { key: 'R', desc: 'Repeats / palindromes' },
            { key: 'W', desc: 'Comparison overlay' },
            { key: 'K', desc: 'AA legend (AA view)' },
            { key: ': / Ctrl+P', desc: 'Command palette (fuzzy commands)' },
          ],
        },
        {
          title: 'Find & exit',
          rows: [
            { key: 'S / /', desc: 'Search phages' },
            { key: '?', desc: 'More help detail' },
            { key: 'Esc', desc: 'Close top overlay' },
            { key: 'Q', desc: 'Quit' },
          ],
        },
      ],
    };
  }, [readingFrame, diffEnabled]);

  const detailed = useMemo(() => {
    const left: { title: string; rows: HelpRow[] }[] = [
      ...essential.left,
      {
        title: 'Context',
        rows: [
          { key: 'Mode', desc: viewMode === 'aa' ? 'Amino acids (translated)' : 'DNA (nucleotides)' },
          { key: 'Diff', desc: diffEnabled ? 'Comparing vs reference' : 'Single genome view' },
          { key: '3D', desc: model3DFullscreen ? 'Fullscreen: Z exit, O/P pause, R quality' : 'M toggles, O pause, Z fullscreen' },
          { key: 'Overlays', desc: overlays.join(', ') || 'None' },
          { key: 'Experience', desc: experienceLevel },
        ],
      },
    ];

    const right: { title: string; rows: HelpRow[] }[] = [
      ...essential.right,
      {
        title: 'Analysis & menus',
        rows: [
          { key: 'A', desc: 'Analysis menu' },
          { key: 'Shift+S', desc: 'Simulation hub' },
          { key: 'W', desc: 'Genome comparison overlay' },
          { key: 'K', desc: 'Amino acid key' },
          { key: ': / Ctrl+P', desc: 'Command palette (future)' },
        ],
      },
      {
        title: '3D & model controls',
        rows: [
          { key: 'M', desc: 'Toggle 3D model' },
          { key: 'P', desc: 'Pause/resume model' },
          { key: 'Z', desc: 'Fullscreen model' },
          { key: 'R', desc: 'Cycle model quality' },
        ],
      },
      {
        title: 'Quick overlays (full list)',
        rows: overlayRows,
      },
    ];

    return { left, right };
  }, [essential, viewMode, diffEnabled, model3DFullscreen, overlays, overlayRows]);

  const layout = helpDetail === 'essential' ? essential : detailed;

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={colors.accent}
      paddingX={2}
      paddingY={1}
    >
      <Box justifyContent="space-between" marginBottom={1}>
        <Text color={colors.accent} bold>
          HELP {helpDetail === 'essential' ? '(essentials)' : '(detailed)'}
        </Text>
        <Text color={colors.textDim}>
          {`Tier: ${experienceLevel}`} · ?: expand/close · Esc: close
        </Text>
      </Box>

      <Box gap={4}>
        <Box flexDirection="column" width={40}>
          {layout.left.map(section => (
            <Section key={section.title} title={section.title} rows={section.rows} />
          ))}
        </Box>
        <Box flexDirection="column" width={40}>
          {layout.right.map(section => (
            <Section key={section.title} title={section.title} rows={section.rows} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
