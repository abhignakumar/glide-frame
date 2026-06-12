import TimelineAllRows from './TimelineAllRows';
import TimelineRuler from './TimelineRuler';

import type { TZoomSegment } from 'src/preload';

export default function Timeline({
  duration,
  pixelsPerSecond,
  zoomSegments,
  scrubberRef,
  onSeek,
}: {
  duration: number;
  pixelsPerSecond: number;
  zoomSegments: TZoomSegment[];
  scrubberRef: React.RefObject<HTMLDivElement | null>;
  onSeek: (time: number) => void;
}) {
  const timelineWidth = duration * pixelsPerSecond;
  return (
    <div className="relative h-full select-none" style={{ width: `${timelineWidth}px` }}>
      <TimelineRuler width={timelineWidth} pixelsPerSecond={pixelsPerSecond} onSeek={onSeek} />
      <TimelineAllRows
        duration={duration}
        pixelsPerSecond={pixelsPerSecond}
        zoomSegments={zoomSegments}
      />

      {/* --- PLAYHEAD / SCRUBBER --- */}
      <div
        ref={scrubberRef}
        className="absolute top-0 bottom-0 z-50 w-0 pointer-events-none"
        style={{ transform: 'translateX(0px)' }} // Default, handled by renderFrame
      >
        {/* Playhead handle (Round shape) */}
        <div className="absolute top-[4px] left-0 -translate-x-1/2 w-3 h-3 bg-violet-900 rounded-full shadow-md" />
        {/* Vertical line extending to the bottom */}
        <div className="absolute top-[14px] left-0 -translate-x-1/2 w-px h-full bg-violet-900" />
      </div>
    </div>
  );
}
