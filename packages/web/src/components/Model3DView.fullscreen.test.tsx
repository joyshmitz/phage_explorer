import { afterEach, describe, expect, it } from 'bun:test';
import { usePhageStore } from '@phage-explorer/state';
import { applyThreeFullscreenClass, THREE_FULLSCREEN_CLASS } from './Model3DView';

describe('3D fullscreen regressions (o5y7)', () => {
  afterEach(() => {
    usePhageStore.getState().reset();
  });

  it('entering fullscreen unpauses and bumps quality (store invariants)', () => {
    usePhageStore.setState({
      model3DFullscreen: false,
      model3DPaused: true,
      model3DQuality: 'medium',
    });

    usePhageStore.getState().toggle3DModelFullscreen();

    const state = usePhageStore.getState();
    expect(state.model3DFullscreen).toBe(true);
    expect(state.model3DPaused).toBe(false);
    expect(state.model3DQuality).toBe('high');
  });

  it('applies the iOS fullscreen shell override class', () => {
    const applied = new Set<string>();
    const fakeRoot = {
      classList: {
        add: (name: string) => applied.add(name),
        remove: (name: string) => applied.delete(name),
      },
    };

    applyThreeFullscreenClass(fakeRoot, true);
    expect(applied.has(THREE_FULLSCREEN_CLASS)).toBe(true);

    applyThreeFullscreenClass(fakeRoot, false);
    expect(applied.has(THREE_FULLSCREEN_CLASS)).toBe(false);
  });
});
