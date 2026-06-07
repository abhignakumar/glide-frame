import { defaultSpringAnimationConfig } from './config';
import { calculateSpringSettlingDurationMs } from './utils';

export const CLOSE_CURRENT_WINDOW = 'close-current-window';
export const LIST_DISPLAY_SOURCES = 'list-display-sources';

export const STOP_RECORDING = 'stop-recording';

export const ZOOM_TRANSITION_TIME_MS = calculateSpringSettlingDurationMs(
  defaultSpringAnimationConfig.screenMovement,
);
export const GROUP_CLICKS_WITHIN_TIME_MS = 3000;

export const SPRING_SETTLING_TIME_TOLERANCE = 0.0001;
