import type { ModuleId } from '../types';
import { WhatIsPhageModule } from './WhatIsPhage';
import { DNABasicsModule } from './DNABasics';
import { PhageLifecycleModule } from './PhageLifecycle';

export type ModuleComponent = () => JSX.Element;

export interface ModuleMeta {
  id: ModuleId;
  title: string;
  description: string;
  estimatedMinutes: number;
  component: ModuleComponent;
}

export const FOUNDATION_MODULES: ModuleMeta[] = [
  {
    id: 'intro-to-phages',
    title: 'What is a bacteriophage?',
    description: 'Structure, lifecycle overview, historical milestones, and why phages matter.',
    estimatedMinutes: 8,
    component: WhatIsPhageModule,
  },
  {
    id: 'dna-basics',
    title: 'DNA Basics for Engineers',
    description: '4-base alphabet, double helix structure, base pairing rules, 5\' to 3\' directionality.',
    estimatedMinutes: 10,
    component: DNABasicsModule,
  },
  {
    id: 'phage-lifecycle',
    title: 'Phage Lifecycle',
    description: 'Lytic and lysogenic cycles, temperate vs virulent phages, Lambda decision circuit.',
    estimatedMinutes: 12,
    component: PhageLifecycleModule,
  },
];

export { WhatIsPhageModule } from './WhatIsPhage';
export { DNABasicsModule } from './DNABasics';
export { PhageLifecycleModule } from './PhageLifecycle';
