import type { SpringConfig } from './types/types';

export const DEFAULT_PROJECTS_ROOT_DIR = '~/Glide Frame Projects';

export const DEFAULT_ALL_SPRING_CONFIGS: {
  screenMovement: SpringConfig;
  mouseMovement: SpringConfig;
  mouseClick: SpringConfig;
} = {
  screenMovement: {
    mass: 2.25,
    stiffness: 200,
    damping: 40,
  },
  mouseMovement: {
    mass: 3,
    stiffness: 470,
    damping: 70,
  },
  mouseClick: {
    stiffness: 500,
    damping: 50,
    mass: 1,
  },
};
