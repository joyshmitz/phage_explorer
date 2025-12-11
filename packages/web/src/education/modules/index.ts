import type { ModuleId } from '../types';
import { WhatIsPhageModule } from './WhatIsPhage';

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
];

export { WhatIsPhageModule } from './WhatIsPhage';
