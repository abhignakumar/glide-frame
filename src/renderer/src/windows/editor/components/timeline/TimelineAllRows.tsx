import TimelineRow from './TimelineRow';
import TimelineRowItem from './TimelineRowItem';

import type { TZoomSegment } from 'src/preload';

interface TimelineAllRowsProps {
  videoDuration: number;
  pixelsPerSecond: number;
  zoomSegments: TZoomSegment[];
}

export default function TimelineAllRows({
  videoDuration,
  pixelsPerSecond,
  zoomSegments,
}: TimelineAllRowsProps) {
  return (
    <div className="w-full flex flex-col pt-3 pb-4 px-0 gap-y-2">
      <TimelineRow>
        <TimelineRowItem
          startTimeMs={0}
          endTimeMs={videoDuration * 1000}
          pixelsPerSecond={pixelsPerSecond}
          colorClass="bg-yellow-600"
        />
      </TimelineRow>

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
