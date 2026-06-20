import Scrubber from './Scrubber';
import TimelineAllRows from './TimelineAllRows';
import TimelineRuler from './TimelineRuler';

import type { TZoomSegment } from 'src/preload';

interface TimelineProps {
  videoDurationMs: number;
  pixelsPerSecond: number;
  zoomSegments: TZoomSegment[];
  scrubberRef: React.RefObject<HTMLDivElement | null>;
  seekTo: (timestampSeconds: number) => void;
  onUpdateZoomSegment: (id: string, startTimeMs: number, endTimeMs: number) => void;
  onAddZoomSegment: (startTimeMs: number, endTimeMs: number) => void;
  onDeleteZoomSegment: (id: string) => void;
}

export default function Timeline({
  videoDurationMs,
  pixelsPerSecond,
  zoomSegments,
  scrubberRef,
  seekTo,
  onUpdateZoomSegment,
  onAddZoomSegment,
  onDeleteZoomSegment,
}: TimelineProps) {
  const timelineWidth = (videoDurationMs / 1000) * pixelsPerSecond;
  return (
    <div className="relative h-full select-none" style={{ width: `${timelineWidth}px` }}>
      <TimelineRuler
        timelineWidth={timelineWidth}
        pixelsPerSecond={pixelsPerSecond}
        seekTo={seekTo}
      />
      <TimelineAllRows
        videoDurationMs={videoDurationMs}
        pixelsPerSecond={pixelsPerSecond}
        zoomSegments={zoomSegments}
        onUpdateZoomSegment={onUpdateZoomSegment}
        onAddZoomSegment={onAddZoomSegment}
        onDeleteZoomSegment={onDeleteZoomSegment}
      />

      <Scrubber scrubberRef={scrubberRef} />
    </div>
  );
}
