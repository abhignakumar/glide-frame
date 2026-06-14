import Scrubber from './Scrubber';
import TimelineAllRows from './TimelineAllRows';
import TimelineRuler from './TimelineRuler';

import type { TZoomSegment } from 'src/preload';

interface TimelineProps {
  videoDuration: number;
  pixelsPerSecond: number;
  zoomSegments: TZoomSegment[];
  scrubberRef: React.RefObject<HTMLDivElement | null>;
  seekTo: (timestampSeconds: number) => void;
}

export default function Timeline({
  videoDuration,
  pixelsPerSecond,
  zoomSegments,
  scrubberRef,
  seekTo,
}: TimelineProps) {
  const timelineWidth = videoDuration * pixelsPerSecond;
  return (
    <div className="relative h-full select-none" style={{ width: `${timelineWidth}px` }}>
      <TimelineRuler
        timelineWidth={timelineWidth}
        pixelsPerSecond={pixelsPerSecond}
        seekTo={seekTo}
      />
      <TimelineAllRows
        videoDuration={videoDuration}
        pixelsPerSecond={pixelsPerSecond}
        zoomSegments={zoomSegments}
      />

      <Scrubber scrubberRef={scrubberRef} />
    </div>
  );
}
