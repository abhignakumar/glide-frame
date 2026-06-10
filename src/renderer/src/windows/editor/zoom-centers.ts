import { ZOOMED_AREA_SAFEZONE_PERCENT } from './lib/config';
import { genericBinarySearch } from './lib/utils';

import type { ZoomCenter } from './lib/types';
import type { TMouseMove, TZoomSegment } from 'src/preload';

export function generateZoomCenters(
  zoomSegments: TZoomSegment[],
  mouseMoves: TMouseMove[],
  videoDimensions: { width: number; height: number },
  previewDimensions: { width: number; height: number },
): ZoomCenter[] {
  const zoomCenters: ZoomCenter[] = [];
  for (let i = 0; i < zoomSegments.length; i++) {
    const tempZoomCenters: ZoomCenter[] = [];
    const currentZoomSegment = zoomSegments[i];
    const currentZoomSegmentMouseMoves = getMouseMovesForCurrentZoomSegment(
      currentZoomSegment,
      mouseMoves,
    );
    const clampedXY = clampXAndYZoomCenter(
      currentZoomSegmentMouseMoves[0].x * currentZoomSegment.scale,
      currentZoomSegmentMouseMoves[0].y * currentZoomSegment.scale,
      {
        width: videoDimensions.width * currentZoomSegment.scale,
        height: videoDimensions.height * currentZoomSegment.scale,
      },
      previewDimensions,
    );
    tempZoomCenters.push({
      x: clampedXY.x,
      y: clampedXY.y,
      timestampMs: currentZoomSegment.startTimeMs,
    });
    const zoomedSafeZoneDimensions: { width: number; height: number } = {
      width: previewDimensions.width * (ZOOMED_AREA_SAFEZONE_PERCENT / 100),
      height: previewDimensions.height * (ZOOMED_AREA_SAFEZONE_PERCENT / 100),
    };
    const currentZoomedSafeZoneTopLeft: { x: number; y: number } = {
      x:
        clampedXY.x -
        previewDimensions.width / 2 +
        (previewDimensions.width * ((100 - ZOOMED_AREA_SAFEZONE_PERCENT) / 100)) / 2,
      y:
        clampedXY.y -
        previewDimensions.height / 2 +
        (previewDimensions.height * ((100 - ZOOMED_AREA_SAFEZONE_PERCENT) / 100)) / 2,
    };
    for (let j = 0; j < currentZoomSegmentMouseMoves.length - 1; j++) {
      const currentZoomSegmentMouseMove = currentZoomSegmentMouseMoves[j];
      currentZoomSegmentMouseMove.x *= currentZoomSegment.scale;
      currentZoomSegmentMouseMove.y *= currentZoomSegment.scale;
      if (
        currentZoomSegmentMouseMove.x >= currentZoomedSafeZoneTopLeft.x &&
        currentZoomSegmentMouseMove.x <=
          currentZoomedSafeZoneTopLeft.x + zoomedSafeZoneDimensions.width &&
        currentZoomSegmentMouseMove.y >= currentZoomedSafeZoneTopLeft.y &&
        currentZoomSegmentMouseMove.y <=
          currentZoomedSafeZoneTopLeft.y + zoomedSafeZoneDimensions.height
      ) {
        continue;
      }
      const tempClampedXY = clampXAndYZoomCenter(
        currentZoomSegmentMouseMove.x,
        currentZoomSegmentMouseMove.y,
        {
          width: videoDimensions.width * currentZoomSegment.scale,
          height: videoDimensions.height * currentZoomSegment.scale,
        },
        previewDimensions,
      );
      if (
        tempClampedXY.x === tempZoomCenters[tempZoomCenters.length - 1].x &&
        tempClampedXY.y === tempZoomCenters[tempZoomCenters.length - 1].y
      ) {
        continue;
      }
      tempZoomCenters.push({
        x: tempClampedXY.x,
        y: tempClampedXY.y,
        timestampMs: currentZoomSegmentMouseMove.processTimeMs,
      });
      currentZoomedSafeZoneTopLeft.x =
        tempClampedXY.x -
        previewDimensions.width / 2 +
        (previewDimensions.width * ((100 - ZOOMED_AREA_SAFEZONE_PERCENT) / 100)) / 2;
      currentZoomedSafeZoneTopLeft.y =
        tempClampedXY.y -
        previewDimensions.height / 2 +
        (previewDimensions.height * ((100 - ZOOMED_AREA_SAFEZONE_PERCENT) / 100)) / 2;
    }
    zoomCenters.push(...tempZoomCenters);
  }
  return zoomCenters;
}

function clampXAndYZoomCenter(
  scaledX: number,
  scaledY: number,
  scaledVideoDimension: { width: number; height: number },
  previewDimension: { width: number; height: number },
): { x: number; y: number } {
  const allowedXMin = previewDimension.width / 2;
  const allowedXMax = scaledVideoDimension.width - previewDimension.width / 2;
  const allowedYMin = previewDimension.height / 2;
  const allowedYMax = scaledVideoDimension.height - previewDimension.height / 2;

  return {
    x: Math.max(allowedXMin, Math.min(allowedXMax, scaledX)),
    y: Math.max(allowedYMin, Math.min(allowedYMax, scaledY)),
  };
}

function getMouseMovesForCurrentZoomSegment(
  currentZoomSegment: TZoomSegment,
  mouseMoves: TMouseMove[],
): TMouseMove[] {
  const firstIndex = genericBinarySearch<TMouseMove>(
    mouseMoves,
    {
      x: 0,
      y: 0,
      unixTimeMs: 0,
      processTimeMs: currentZoomSegment.startTimeMs,
    },
    (a: TMouseMove, b: TMouseMove) => a.processTimeMs - b.processTimeMs,
  );
  const lastIndex = genericBinarySearch<TMouseMove>(
    mouseMoves,
    {
      x: 0,
      y: 0,
      unixTimeMs: 0,
      processTimeMs: currentZoomSegment.endTimeMs,
    },
    (a: TMouseMove, b: TMouseMove) => a.processTimeMs - b.processTimeMs,
  );

  return mouseMoves.slice(
    Math.max(0, firstIndex - 1),
    lastIndex === mouseMoves.length ? lastIndex : lastIndex + 1,
  );
}
