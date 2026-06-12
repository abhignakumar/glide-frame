import TimelineRow from './TimelineRow';
import TimelineRowItem from './TimelineRowItem';

import type { TZoomSegment } from 'src/preload';

export default function TimelineAllRows({
  duration,
  pixelsPerSecond,
  zoomSegments,
}: {
  duration: number;
  pixelsPerSecond: number;
  zoomSegments: TZoomSegment[];
}) {
  // Only render if video metadata has loaded
  if (duration === 0) return null;

  return (
    <div className="w-full flex flex-col pt-3 pb-4 px-0 gap-y-2">
      {/* ROW 1: The Main Video Track */}
      <TimelineRow>
        <TimelineRowItem
          startTimeMs={0}
          endTimeMs={duration * 1000}
          pixelsPerSecond={pixelsPerSecond}
          colorClass="bg-yellow-600"
        />
      </TimelineRow>

      {/* ROW 2: The Zoom Segments Track */}
      <TimelineRow>
        {zoomSegments.map((segment) => (
          <TimelineRowItem
            key={segment.id}
            startTimeMs={segment.startTimeMs}
            endTimeMs={segment.endTimeMs}
            pixelsPerSecond={pixelsPerSecond}
            colorClass="bg-violet-600"
          />
        ))}
      </TimelineRow>
    </div>
  );
}
