import TimelineRow from './TimelineRow';
import VideoClipRowItem from './VideoClipRowItem';
import ZoomTimelineRow from './ZoomTimelineRow';

import type { TZoomSegment } from 'src/preload';

interface TimelineAllRowsProps {
  videoDurationMs: number;
  pixelsPerSecond: number;
  zoomSegments: TZoomSegment[];
  onUpdateZoomSegment: (id: string, startTimeMs: number, endTimeMs: number) => void;
  onAddZoomSegment: (startTimeMs: number, endTimeMs: number) => void;
  onDeleteZoomSegment: (id: string) => void;
}

export default function TimelineAllRows({
  videoDurationMs,
  pixelsPerSecond,
  zoomSegments,
  onUpdateZoomSegment,
  onAddZoomSegment,
  onDeleteZoomSegment,
}: TimelineAllRowsProps) {
  return (
    <div className="w-full flex flex-col py-3 gap-y-3">
      <TimelineRow>
        <VideoClipRowItem
          startTimeMs={0}
          endTimeMs={videoDurationMs}
          pixelsPerSecond={pixelsPerSecond}
        />
      </TimelineRow>
      <ZoomTimelineRow
        videoDurationMs={videoDurationMs}
        zoomSegments={zoomSegments}
        pixelsPerSecond={pixelsPerSecond}
        onAddZoomSegment={onAddZoomSegment}
        onDeleteZoomSegment={onDeleteZoomSegment}
        onUpdateZoomSegment={onUpdateZoomSegment}
      />
    </div>
  );
}
