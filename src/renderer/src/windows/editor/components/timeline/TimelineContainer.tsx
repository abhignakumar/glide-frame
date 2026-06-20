import Timeline from './Timeline';

import type { TZoomSegment } from 'src/preload';

interface TimelineContainerProps {
  videoDurationMs: number | null;
  pixelsPerSecond: number;
  zoomSegments: TZoomSegment[];
  scrubberRef: React.RefObject<HTMLDivElement | null>;
  seekTo: (timestampSeconds: number) => void;
  onUpdateZoomSegment: (id: string, startTimeMs: number, endTimeMs: number) => void;
  onAddZoomSegment: (startTimeMs: number, endTimeMs: number) => void;
  onDeleteZoomSegment: (id: string) => void;
  timelineContainerRef: React.RefObject<HTMLDivElement | null>;
}

export default function TimelineContainer({
  videoDurationMs,
  pixelsPerSecond,
  zoomSegments,
  scrubberRef,
  seekTo,
  onUpdateZoomSegment,
  onAddZoomSegment,
  onDeleteZoomSegment,
  timelineContainerRef,
}: TimelineContainerProps) {
  return (
    <div
      className="h-full overflow-x-scroll overflow-y-hidden px-4 scrollbar-none border-t border-neutral-800"
      ref={timelineContainerRef}
    >
      {videoDurationMs !== null && zoomSegments.length >= 0 && (
        <Timeline
          videoDurationMs={videoDurationMs}
          pixelsPerSecond={pixelsPerSecond}
          zoomSegments={zoomSegments}
          scrubberRef={scrubberRef}
          seekTo={seekTo}
          onUpdateZoomSegment={onUpdateZoomSegment}
          onAddZoomSegment={onAddZoomSegment}
          onDeleteZoomSegment={onDeleteZoomSegment}
        />
      )}
    </div>
  );
}
