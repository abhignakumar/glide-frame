import { useMemo } from 'react';

import { formatRulerTime, getStepAndIsMajorForTimelineZoom } from '../../lib/utils';

interface TimelineRulerProps {
  timelineWidth: number;
  pixelsPerSecond: number;
  seekTo: (timestampSeconds: number) => void;
}

export default function TimelineRuler({
  timelineWidth,
  pixelsPerSecond,
  seekTo,
}: TimelineRulerProps) {
  const markers = useMemo(() => {
    const tempMarkers: React.ReactNode[] = [];

    const { step, isMajor } = getStepAndIsMajorForTimelineZoom(pixelsPerSecond);

    const maxTime = timelineWidth / pixelsPerSecond;

    for (let t = step; t <= maxTime; t += step) {
      const xPosition = t * pixelsPerSecond;
      const major = isMajor(t);

      tempMarkers.push(
        <div
          key={t}
          className="absolute flex flex-col items-center justify-end pb-1 bottom-0"
          style={{
            left: `${xPosition}px`,
            transform: 'translateX(-50%)',
            height: '100%',
          }}
        >
          {major && (
            <span className="text-[12px] text-neutral-600 mb-[4px] leading-none select-none font-medium">
              {formatRulerTime(t)}
            </span>
          )}
          <div className="w-[4px] h-[4px] rounded-full bg-neutral-600" />
        </div>,
      );
    }
    return tempMarkers;
  }, [timelineWidth, pixelsPerSecond]);

  function handleRulerClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedTime = clickX / pixelsPerSecond;
    seekTo(clickedTime);
  }

  return (
    <div className="w-full h-8 relative overflow-hidden" onClick={handleRulerClick}>
      {markers}
    </div>
  );
}
