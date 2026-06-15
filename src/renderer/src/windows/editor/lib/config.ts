import type { TSpringConfig } from 'src/preload';

export const ZOOMED_AREA_SAFEZONE_PERCENT = 75;

export const DEFAULT_ALL_SPRING_CONFIGS: {
  screenMovement: TSpringConfig;
  mouseMovement: TSpringConfig;
  mouseClick: TSpringConfig;
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

export const PREVIEW_FPS = 60;
export const FRAME_DURATION_IN_SECONDS = 1 / PREVIEW_FPS;

export const SPRING_SETTLING_TIME_TOLERANCE = 0.0001;

export const MIN_PIXELS_PER_SECOND = 20;
export const MAX_PIXELS_PER_SECOND = 600;
export const DEFAULT_PIXELS_PER_SECOND = 60;

export const MOUSE_ARROW_DATA = {
  standardSize: {
    width: 28,
    height: 40,
  },
  hotspot: { x: 5, y: 5 },
};

export const MOUSE_SIZE_TIMES = 4;

export const CLICK_VISUAL_HOLD_MS = 150;
export const CLICK_TARGET_SCALE = 0.8;

export const VELOCITY_TO_DEG_MULTIPLIER = {
  x: 0.01,
  y: 0.005,
};

export const MAX_ROTATION_DEG = {
  clockwise: 5,
  counterClockwise: -15,
};

export const MOUSE_LOOKAHEAD_MS = 150;
