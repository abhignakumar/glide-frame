import { useMemo } from 'react';

import { getStepAndIsMajorForTimelineZoom } from '../../lib/utils';

interface TimelineRowItemProps {
  startTimeMs: number;
  endTimeMs: number;
  pixelsPerSecond: number;
  colorClass: string;
}

export default function TimelineRowItem({
  startTimeMs,
  endTimeMs,
  pixelsPerSecond,
  colorClass,
}: TimelineRowItemProps) {
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
      className={`absolute top-0 bottom-0 ${colorClass} border border-neutral-500 hover:border-white/80 transition-all duration-250 ease-in-out rounded-xl overflow-hidden shadow-sm`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
      }}
    >
      {lines}
    </div>
  );
}
