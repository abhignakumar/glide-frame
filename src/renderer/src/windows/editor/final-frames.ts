import { DEFAULT_ALL_SPRING_CONFIGS, SPRING_SETTLING_TIME_TOLERANCE } from './lib/config';
import { genericBinarySearch } from './lib/utils';

import type { ZoomCenter, PositionVelocityState, FinalFrameState } from './lib/types';
import type { TSpringConfig, TZoomSegment } from 'src/preload';

export function computeFinalFrameStates(
  videoDurationMs: number,
  videoDimensions: { width: number; height: number },
  zoomSegments: TZoomSegment[],
  zoomCenters: ZoomCenter[],
  fps: number = 60,
): FinalFrameState[] {
  const dt = 1 / fps;
  const dtMs = dt * 1000;
  const frames: FinalFrameState[] = [];

  let videoScale: PositionVelocityState = { position: 1, velocity: 0 };
  let videoTranslateX: PositionVelocityState = { position: 0, velocity: 0 };
  let videoTranslateY: PositionVelocityState = { position: 0, velocity: 0 };

  for (let timeMs = 0; timeMs <= videoDurationMs; timeMs += dtMs) {
    const activeZoom = zoomSegments.find((z) => timeMs >= z.startTimeMs && timeMs <= z.endTimeMs);

    let targetScale = 1;
    let targetVideoX = 0;
    let targetVideoY = 0;

    if (activeZoom) {
      targetScale = activeZoom.scale;
      const zoomCenterIndex = genericBinarySearch<ZoomCenter>(
        zoomCenters,
        { x: 0, y: 0, timestampMs: timeMs },
        (a, b) => a.timestampMs - b.timestampMs,
      );
      const zoomCenter = zoomCenters[Math.max(0, zoomCenterIndex - 1)];
      targetVideoX = (videoDimensions.width * activeZoom.scale) / 2 - zoomCenter.x;
      targetVideoY = (videoDimensions.height * activeZoom.scale) / 2 - zoomCenter.y;
    }

    videoScale = stepSpringPhysicsAnimation(
      videoScale,
      targetScale,
      DEFAULT_ALL_SPRING_CONFIGS.screenMovement,
      dt,
    );
    videoTranslateX = stepSpringPhysicsAnimation(
      videoTranslateX,
      targetVideoX,
      DEFAULT_ALL_SPRING_CONFIGS.screenMovement,
      dt,
    );
    videoTranslateY = stepSpringPhysicsAnimation(
      videoTranslateY,
      targetVideoY,
      DEFAULT_ALL_SPRING_CONFIGS.screenMovement,
      dt,
    );
    frames.push({
      timestampMs: timeMs,
      videoScale: videoScale.position,
      videoTranslateX: videoTranslateX.position,
      videoTranslateY: videoTranslateY.position,
    });
  }
  return frames;
}

function stepSpringPhysicsAnimation(
  currentState: PositionVelocityState,
  targetPosition: number,
  config: TSpringConfig,
  dt: number,
): PositionVelocityState {
  if (Math.abs(currentState.position - targetPosition) <= SPRING_SETTLING_TIME_TOLERANCE) {
    return { position: targetPosition, velocity: 0 };
  }
  const force =
    -config.stiffness * (currentState.position - targetPosition) -
    config.damping * currentState.velocity;
  const acceleration = force / config.mass;
  const newVelocity = currentState.velocity + acceleration * dt;
  const newPosition = currentState.position + newVelocity * dt;
  return { position: newPosition, velocity: newVelocity };
}
