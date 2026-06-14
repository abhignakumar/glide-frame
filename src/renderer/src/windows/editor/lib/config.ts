import type { TSpringConfig } from 'src/preload';

export const ZOOMED_AREA_SAFEZONE_PERCENT = 75;

export const DEFAULT_ALL_SPRING_CONFIGS: {
  screenMovement: TSpringConfig;
  mouseMovement: TSpringConfig;
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
};

export const PREVIEW_FPS = 60;
export const FRAME_DURATION_IN_SECONDS = 1 / PREVIEW_FPS;

export const SPRING_SETTLING_TIME_TOLERANCE = 0.0001;

export const MIN_PIXELS_PER_SECOND = 20;
export const MAX_PIXELS_PER_SECOND = 600;
export const DEFAULT_PIXELS_PER_SECOND = 60;
