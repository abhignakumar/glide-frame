import {
  CLICK_TARGET_SCALE,
  CLICK_VISUAL_HOLD_MS,
  DEFAULT_ALL_SPRING_CONFIGS,
  MAX_ROTATION_DEG,
  MOUSE_LOOKAHEAD_MS,
  SPRING_SETTLING_TIME_TOLERANCE,
  VELOCITY_TO_DEG_MULTIPLIER,
} from './lib/config';
import { genericBinarySearch } from './lib/utils';

import type { ZoomCenter, PositionVelocityState, FinalFrameState } from './lib/types';
import type { TMouseClick, TMouseMove, TSpringConfig, TZoomSegment } from 'src/preload';

export function computeFinalFrameStates(
  videoDurationMs: number,
  videoDimensions: { width: number; height: number },
  zoomSegments: TZoomSegment[],
  zoomCenters: ZoomCenter[],
  mouseMoves: TMouseMove[],
  mouseClicks: TMouseClick[],
  fps: number = 60,
): FinalFrameState[] {
  const dt = 1 / fps;
  const dtMs = dt * 1000;
  const frames: FinalFrameState[] = [];

  let videoScale: PositionVelocityState = { position: 1, velocity: 0 };
  let videoTranslateX: PositionVelocityState = { position: 0, velocity: 0 };
  let videoTranslateY: PositionVelocityState = { position: 0, velocity: 0 };
  let mouseX: PositionVelocityState = { position: mouseMoves[0].x, velocity: 0 };
  let mouseY: PositionVelocityState = { position: mouseMoves[0].y, velocity: 0 };
  let mouseScale: PositionVelocityState = { position: 1, velocity: 0 };
  let mouseRotation: PositionVelocityState = { position: 0, velocity: 0 };

  const mouseClickEvents = mouseClicks.filter((click) => click.type === 'mouseDown');

  for (let timeMs = 0; timeMs <= videoDurationMs; timeMs += dtMs) {
    const activeZoom = zoomSegments.find((z) => timeMs >= z.startTimeMs && timeMs <= z.endTimeMs);

    let targetScale = 1;
    let targetVideoX = 0;
    let targetVideoY = 0;
    let targetMouseScale = 1;

    const currentMouseMoveIndex = genericBinarySearch<TMouseMove>(
      mouseMoves,
      { x: 0, y: 0, unixTimeMs: 0, processTimeMs: timeMs + MOUSE_LOOKAHEAD_MS },
      (a, b) => a.processTimeMs - b.processTimeMs,
    );
    const currentMouseMove = mouseMoves[Math.max(0, currentMouseMoveIndex - 1)];
    const targetMouseX = currentMouseMove.x;
    const targetMouseY = currentMouseMove.y;

    const recentClickIndex = genericBinarySearch<TMouseClick>(
      mouseClickEvents,
      { x: 0, y: 0, type: 'mouseDown', button: 'left', unixTimeMs: 0, processTimeMs: timeMs },
      (a, b) => a.processTimeMs - b.processTimeMs,
    );

    if (recentClickIndex > 0) {
      const recentClick = mouseClickEvents[recentClickIndex - 1];
      const timeSinceClick = timeMs - recentClick.processTimeMs;
      if (timeSinceClick >= 0 && timeSinceClick <= CLICK_VISUAL_HOLD_MS) {
        targetMouseScale = CLICK_TARGET_SCALE;
      }
    }

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
    mouseX = stepSpringPhysicsAnimation(
      mouseX,
      targetMouseX,
      DEFAULT_ALL_SPRING_CONFIGS.mouseMovement,
      dt,
    );
    mouseY = stepSpringPhysicsAnimation(
      mouseY,
      targetMouseY,
      DEFAULT_ALL_SPRING_CONFIGS.mouseMovement,
      dt,
    );
    mouseScale = stepSpringPhysicsAnimation(
      mouseScale,
      targetMouseScale,
      DEFAULT_ALL_SPRING_CONFIGS.mouseClick,
      dt,
    );

    let rawTargetRotation = mouseX.velocity * VELOCITY_TO_DEG_MULTIPLIER.x;
    rawTargetRotation += mouseY.velocity * VELOCITY_TO_DEG_MULTIPLIER.y;

    const targetRotation = Math.max(
      MAX_ROTATION_DEG.counterClockwise,
      Math.min(MAX_ROTATION_DEG.clockwise, rawTargetRotation),
    );

    mouseRotation = stepSpringPhysicsAnimation(
      mouseRotation,
      targetRotation,
      DEFAULT_ALL_SPRING_CONFIGS.mouseMovement,
      dt,
    );

    frames.push({
      timestampMs: timeMs,
      videoScale: videoScale.position,
      videoTranslateX: videoTranslateX.position,
      videoTranslateY: videoTranslateY.position,
      mouseX: mouseX.position,
      mouseY: mouseY.position,
      mouseScale: mouseScale.position,
      mouseRotation: mouseRotation.position,
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
