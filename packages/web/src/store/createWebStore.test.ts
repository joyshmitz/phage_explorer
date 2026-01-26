import { describe, expect, test } from 'bun:test';
import {
  get3DViewerDisabledDescriptionForPolicy,
  getShow3DModelDefaultPolicy,
  inferDefaultShow3DModel,
} from './createWebStore';

function assert3DPolicyAlignment(coarsePointer: boolean): void {
  const policy = getShow3DModelDefaultPolicy({ coarsePointer });
  const expected = inferDefaultShow3DModel({ coarsePointer });

  try {
    expect(policy.defaultEnabled).toBe(expected);
    expect(policy.reason).toBe(coarsePointer ? 'coarse-pointer' : 'fine-pointer');

    const description = get3DViewerDisabledDescriptionForPolicy(policy);
    const mentionsDisabledByDefault = description.toLowerCase().includes('disabled by default');
    expect(mentionsDisabledByDefault).toBe(!expected);
  } catch (error) {
    // Structured log for debugging regressions (only on failure to keep test output clean).
    console.error('[3d-default-policy]', { coarsePointer, policy, expected });
    throw error;
  }
}

describe('createWebStore: 3D default policy + copy alignment', () => {
  test('inferDefaultShow3DModel: fine pointer defaults on, coarse pointer defaults off', () => {
    expect(inferDefaultShow3DModel({ coarsePointer: false })).toBe(true);
    expect(inferDefaultShow3DModel({ coarsePointer: true })).toBe(false);
  });

  test('copy helper never contradicts the decided default policy', () => {
    for (const coarsePointer of [false, true]) {
      assert3DPolicyAlignment(coarsePointer);
    }
  });
});
