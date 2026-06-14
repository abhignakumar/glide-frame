import Timeline from './Timeline';

import type { TZoomSegment } from 'src/preload';

interface TimelineContainerProps {
  videoDuration: number | null;
  pixelsPerSecond: number;
  zoomSegments: TZoomSegment[];
  scrubberRef: React.RefObject<HTMLDivElement | null>;
  seekTo: (timestampSeconds: number) => void;
}

export default function TimelineContainer({
  videoDuration,
  pixelsPerSecond,
  zoomSegments,
  scrubberRef,
  seekTo,
}: TimelineContainerProps) {
  return (
    <div className="h-full overflow-x-scroll overflow-y-hidden px-4 scrollbar-none border-t border-neutral-800">
      {videoDuration && zoomSegments.length >= 0 && (
        <Timeline
          videoDuration={videoDuration}
          pixelsPerSecond={pixelsPerSecond}
          zoomSegments={zoomSegments}
          scrubberRef={scrubberRef}
          seekTo={seekTo}
        />
      )}
    </div>
  );
}
