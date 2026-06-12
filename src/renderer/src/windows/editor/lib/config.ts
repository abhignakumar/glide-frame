import type { TSpringConfig } from 'src/preload';

export const ZOOMED_AREA_SAFEZONE_PERCENT = 75;

export const DEFAULT_ALL_SPRING_CONFIGS: { screenMovement: TSpringConfig } = {
  screenMovement: {
    mass: 2.25,
    stiffness: 200,
    damping: 40,
  },
};

export const PREVIEW_FPS = 60;
export const FRAME_DURATION_IN_SECONDS = 1 / PREVIEW_FPS;

export const SPRING_SETTLING_TIME_TOLERANCE = 0.0001;

export const MIN_PIXELS_PER_SECOND = 60;
export const MAX_PIXELS_PER_SECOND = 600;
export const DEFAULT_PIXELS_PER_SECOND = 120;
