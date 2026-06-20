import { useMemo } from 'react';

import { getStepAndIsMajorForTimelineZoom } from '../../lib/utils';

interface VideoClipRowItemProps {
  startTimeMs: number;
  endTimeMs: number;
  pixelsPerSecond: number;
}

export default function VideoClipRowItem({
  startTimeMs,
  endTimeMs,
  pixelsPerSecond,
}: VideoClipRowItemProps) {
  const startSec = startTimeMs / 1000;
  const endSec = endTimeMs / 1000;
  const left = startSec * pixelsPerSecond;
  const width = (endSec - startSec) * pixelsPerSecond;

  const lines = useMemo(() => {
    const tempLines: React.ReactNode[] = [];
    const { step } = getStepAndIsMajorForTimelineZoom(pixelsPerSecond);
    const firstLineSec = Math.ceil(startSec / step) * step;

    for (let t = firstLineSec; t <= endSec; t += step) {
      const xPos = (t - startSec) * pixelsPerSecond;
      tempLines.push(
        <div
          key={t}
          className="absolute top-0 bottom-0 w-px bg-neutral-600"
          style={{ left: `${xPos}px` }}
        />,
      );
    }
    return tempLines;
  }, [pixelsPerSecond, startSec, endSec]);

  return (
    <div
      className={`absolute top-0 bottom-0 bg-yellow-600 border border-neutral-500 hover:border-white/80 transition-colors duration-250 ease-in-out rounded-xl shadow-sm group`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
      }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">{lines}</div>
    </div>
  );
}
