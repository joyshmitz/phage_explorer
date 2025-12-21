import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { usePhageStore } from '@phage-explorer/state';
import type { PhageRepository } from '@phage-explorer/db-runtime';

interface SearchOverlayProps {
  repository: PhageRepository;
}

// Format genome size compactly
function formatSize(bp: number | null | undefined): string {
  if (!bp) return '';
  if (bp >= 100_000) return `${(bp / 1000).toFixed(0)}k`;
  if (bp >= 1_000) return `${(bp / 1000).toFixed(1)}k`;
  return `${bp}`;
}

export function SearchOverlay({ repository }: SearchOverlayProps): React.ReactElement {
  const theme = usePhageStore(s => s.currentTheme);
  const searchQuery = usePhageStore(s => s.searchQuery);
  const searchResults = usePhageStore(s => s.searchResults);
  const setSearchQuery = usePhageStore(s => s.setSearchQuery);
  const setSearchResults = usePhageStore(s => s.setSearchResults);
  const setCurrentPhageIndex = usePhageStore(s => s.setCurrentPhageIndex);
  const phages = usePhageStore(s => s.phages);
  const closeOverlay = usePhageStore(s => s.closeOverlay);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const colors = theme.colors;

  // Search when query changes
  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([]);
      return;
    }

    const doSearch = async () => {
      const results = await repository.searchPhages(searchQuery);
      setSearchResults(results);
      setSelectedIndex(0);
    };

    doSearch();
  }, [searchQuery, repository, setSearchResults]);

  const handleSelect = () => {
    if (searchResults.length > 0) {
      // Find the index of this phage in the main list
      const selected = searchResults[selectedIndex];
      const mainIndex = phages.findIndex(p => p.id === selected.id);
      if (mainIndex >= 0) {
        setCurrentPhageIndex(mainIndex);
      }
      closeOverlay();
    }
  };

  // Handle keyboard navigation
  useInput((input, key) => {
    if (key.downArrow) {
      setSelectedIndex(i => Math.min(i + 1, searchResults.length - 1));
    } else if (key.upArrow) {
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (key.escape) {
      closeOverlay();
    }
    // Return key handled by TextInput onSubmit
  });

  const maxResults = 8;
  // Calculate scroll offset to keep selected item in view
  const scrollOffset = Math.max(0, Math.min(selectedIndex - maxResults + 1, searchResults.length - maxResults));
  // Clamp negative offset if few results
  const effectiveOffset = Math.max(0, scrollOffset);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.borderFocus}
      paddingX={2}
      paddingY={1}
      width={65}
    >
      {/* Header */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Box gap={1}>
          <Text color={colors.primary} bold>◉ SEARCH PHAGES</Text>
          <Text color={colors.accent}>[S]</Text>
        </Box>
        <Text color={colors.textMuted}>ESC to close</Text>
      </Box>

      {/* Separator */}
      <Box marginBottom={1}>
        <Text color={colors.borderLight}>{'─'.repeat(59)}</Text>
      </Box>

      {/* Search input */}
      <Box marginBottom={1} gap={1}>
        <Text color={colors.info}>◎</Text>
        <Text color={colors.textDim}>Query:</Text>
        <Box borderStyle="single" borderColor={colors.border} paddingX={1}>
          <TextInput
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={handleSelect}
            placeholder="name, host, family, or accession..."
          />
        </Box>
      </Box>

      {/* Results count */}
      {searchQuery.length > 0 && (
        <Box marginBottom={1}>
          <Text color={colors.textMuted}>
            {searchResults.length === 0
              ? 'No matches'
              : `${searchResults.length} match${searchResults.length === 1 ? '' : 'es'}`}
          </Text>
        </Box>
      )}

      {/* Results list */}
      <Box flexDirection="column" height={maxResults + 1}>
        {searchResults.length === 0 && searchQuery.length === 0 ? (
          <Box flexDirection="column">
            <Text color={colors.textDim}>Start typing to search...</Text>
            <Text color={colors.textMuted}>
              Examples: "lambda", "E. coli", "T7", "NC_"
            </Text>
          </Box>
        ) : searchResults.length === 0 ? (
          <Box gap={1}>
            <Text color={colors.warning}>⚠</Text>
            <Text color={colors.textDim}>No phages match "{searchQuery}"</Text>
          </Box>
        ) : (
          searchResults.slice(effectiveOffset, effectiveOffset + maxResults).map((phage, i) => {
            const realIndex = effectiveOffset + i;
            const isSelected = realIndex === selectedIndex;
            const hostAbbr = phage.host ? phage.host.split(/[\s,]+/)[0] : '';

            return (
              <Box key={phage.id} justifyContent="space-between">
                <Box gap={0}>
                  <Text
                    color={isSelected ? colors.accent : colors.textMuted}
                    bold={isSelected}
                  >
                    {isSelected ? '▶ ' : '  '}
                  </Text>
                  <Text
                    color={isSelected ? colors.text : colors.textDim}
                    bold={isSelected}
                    backgroundColor={isSelected ? colors.backgroundAlt : undefined}
                  >
                    {phage.name}
                  </Text>
                </Box>
                <Box gap={2}>
                  {hostAbbr && (
                    <Text color={colors.textMuted}>{hostAbbr}</Text>
                  )}
                  <Text color={isSelected ? colors.info : colors.textMuted}>
                    {formatSize(phage.genomeLength)} bp
                  </Text>
                </Box>
              </Box>
            );
          })
        )}

        {/* Show "more results" indicator */}
        {searchResults.length > maxResults && (
          <Text color={colors.textMuted}>
            {effectiveOffset > 0 ? '↑ ' : ''}
            ... {searchResults.length - effectiveOffset - maxResults > 0 ? `and ${searchResults.length - effectiveOffset - maxResults} more` : ''}
          </Text>
        )}
      </Box>

      {/* Separator */}
      <Box marginTop={1}>
        <Text color={colors.borderLight}>{'─'.repeat(59)}</Text>
      </Box>

      {/* Instructions */}
      <Box justifyContent="center" marginTop={1} gap={2}>
        <Text color={colors.info}>[↑↓]</Text>
        <Text color={colors.textDim}>navigate</Text>
        <Text color={colors.success}>[Enter]</Text>
        <Text color={colors.textDim}>select</Text>
        <Text color={colors.warning}>[Esc]</Text>
        <Text color={colors.textDim}>cancel</Text>
      </Box>
    </Box>
  );
}
