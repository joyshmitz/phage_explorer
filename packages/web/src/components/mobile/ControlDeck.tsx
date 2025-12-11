import React, { useState } from 'react';
import { usePhageStore } from '@phage-explorer/state';
import { useOverlay } from '../overlays/OverlayProvider';

export function ControlDeck(): JSX.Element {
  const [activeTab, setActiveTab] = useState<'view' | 'nav' | 'tools'>('view');
  
  // Store Actions
  const toggleViewMode = usePhageStore(s => s.toggleViewMode);
  const readingFrame = usePhageStore(s => s.readingFrame);
  const setReadingFrame = usePhageStore(s => s.setReadingFrame);
  const diffEnabled = usePhageStore(s => s.diffEnabled);
  const toggleDiff = usePhageStore(s => s.toggleDiff);
  const show3DModel = usePhageStore(s => s.show3DModel);
  const toggle3DModel = usePhageStore(s => s.toggle3DModel);
  const { open } = useOverlay();

  const setScrollPosition = usePhageStore(s => s.setScrollPosition);
  const currentPhage = usePhageStore(s => s.currentPhage);
  const scrollPosition = usePhageStore(s => s.scrollPosition);

  // Gene Navigation Logic
  const handleGeneNav = (direction: 'prev' | 'next') => {
    if (!currentPhage?.genes?.length) return;
    
    // Simple logic: find gene with startPos closest to current scroll
    // Better logic: find gene immediately before/after current scroll
    const sortedGenes = [...currentPhage.genes].sort((a, b) => a.startPos - b.startPos);
    
    if (direction === 'next') {
      const nextGene = sortedGenes.find(g => g.startPos > scrollPosition + 50); // Buffer to avoid getting stuck
      if (nextGene) setScrollPosition(nextGene.startPos);
    } else {
      // Find first gene that starts before current position
      // Reverse iterate
      for (let i = sortedGenes.length - 1; i >= 0; i--) {
        if (sortedGenes[i].startPos < scrollPosition - 50) {
          setScrollPosition(sortedGenes[i].startPos);
          return;
        }
      }
      // If none found (at start), go to first gene if we are past it, else 0
      if (scrollPosition > 0) setScrollPosition(0);
    }
  };

  // Cycle Frame
  const cycleFrame = () => {
    const frames = [0, 1, 2, -1, -2, -3];
    const idx = frames.indexOf(readingFrame as number);
    setReadingFrame(frames[(idx + 1) % frames.length]);
  };

  return (
    <div className="control-deck">
      {/* Tab Content Area */}
      <div className="deck-content">
        {activeTab === 'view' && (
          <div className="deck-row">
            <button className="deck-btn" onClick={toggleViewMode}>
              <span className="icon">Aa</span>
              <span className="label">Mode</span>
            </button>
            <button className="deck-btn" onClick={cycleFrame}>
              <span className="icon">F{readingFrame}</span>
              <span className="label">Frame</span>
            </button>
            <button className={`deck-btn ${diffEnabled ? 'active' : ''}`} onClick={toggleDiff}>
              <span className="icon">±</span>
              <span className="label">Diff</span>
            </button>
            <button className={`deck-btn ${show3DModel ? 'active' : ''}`} onClick={toggle3DModel}>
              <span className="icon">🧊</span>
              <span className="label">3D</span>
            </button>
          </div>
        )}

        {activeTab === 'nav' && (
          <div className="deck-row">
             <button className="deck-btn" onClick={() => open('search')}>
              <span className="icon">🔍</span>
              <span className="label">Search</span>
            </button>
            <button className="deck-btn" onClick={() => open('goto')}>
              <span className="icon">Go</span>
              <span className="label">Goto</span>
            </button>
             {/* Gene Navigation */}
             <button className="deck-btn" onClick={() => handleGeneNav('prev')}>
              <span className="icon">←</span>
              <span className="label">Prev Gene</span>
            </button>
            <button className="deck-btn" onClick={() => handleGeneNav('next')}>
              <span className="icon">→</span>
              <span className="label">Next Gene</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Tabs */}
      <div className="deck-tabs">
        <button 
          className={`tab-btn ${activeTab === 'view' ? 'active' : ''}`} 
          onClick={() => setActiveTab('view')}
        >
          View
        </button>
        <button 
          className={`tab-btn ${activeTab === 'nav' ? 'active' : ''}`} 
          onClick={() => setActiveTab('nav')}
        >
          Navigate
        </button>
        <button 
          className="tab-btn"
          onClick={() => open('commandPalette')}
        >
          Tools
        </button>
      </div>
    </div>
  );
}
