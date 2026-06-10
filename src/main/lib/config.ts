import type { SpringConfig } from './types/types';

export const DEFAULT_PROJECTS_ROOT_DIR = '~/Open Studio Projects';

export const DEFAULT_ALL_SPRING_CONFIGS: { screenMovement: SpringConfig } = {
  screenMovement: {
    mass: 2.25,
    stiffness: 200,
    damping: 40,
  },
};
