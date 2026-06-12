import type { FinalFrameState } from './types';

export function genericBinarySearch<T>(
  sortedArray: T[],
  target: T,
  compare: (a: T, b: T) => number,
): number {
  let left = 0;
  let right = sortedArray.length - 1;

  while (left <= right) {
    const mid = Math.floor(left + (right - left) / 2);
    const comparison = compare(sortedArray[mid], target);

    if (comparison === 0) {
      return mid;
    }

    if (comparison < 0) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return left;
}

/**
 * Binary search to find the interpolated frame state exactly at a given millisecond.
 * O(log N) performance, meaning it can effortlessly handle hours of 60 FPS baked frames.
 */
export function getInterpolatedFrame(
  timestampMs: number,
  frames: FinalFrameState[],
): FinalFrameState {
  if (frames.length === 0)
    return { timestampMs, videoScale: 1, videoTranslateX: 0, videoTranslateY: 0 };
  if (timestampMs <= frames[0].timestampMs) return frames[0];
  if (timestampMs >= frames[frames.length - 1].timestampMs) return frames[frames.length - 1];

  let low = 0;
  let high = frames.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (frames[mid].timestampMs < timestampMs) low = mid + 1;
    else if (frames[mid].timestampMs > timestampMs) high = mid - 1;
    else return frames[mid];
  }

  // Linear Interpolation (LERP)
  const f1 = frames[high];
  const f2 = frames[low];
  const timeDiff = f2.timestampMs - f1.timestampMs;
  const t = timeDiff === 0 ? 0 : (timestampMs - f1.timestampMs) / timeDiff;

  return {
    timestampMs,
    videoTranslateX: f1.videoTranslateX + (f2.videoTranslateX - f1.videoTranslateX) * t,
    videoTranslateY: f1.videoTranslateY + (f2.videoTranslateY - f1.videoTranslateY) * t,
    videoScale: f1.videoScale + (f2.videoScale - f1.videoScale) * t,
  };
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  const ms = Math.floor((seconds % 1) * 1000)
    .toString()
    .padStart(3, '0');
  return `${m}:${s}:${ms}`;
}

export function formatRulerTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}
