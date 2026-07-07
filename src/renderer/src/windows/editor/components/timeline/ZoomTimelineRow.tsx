import { Plus } from 'lucide-react';
import { useRef, useState } from 'react';

import TimelineRow from './TimelineRow';
import TimelineRowItem from './TimelineRowItem';

import type { TZoomSegment } from 'src/preload';

interface ZoomTimelineRowProps {
  videoDurationMs: number;
  zoomSegments: TZoomSegment[];
  pixelsPerSecond: number;
  onAddZoomSegment: (startTimeMs: number, endTimeMs: number) => void;
  onDeleteZoomSegment: (id: string) => void;
  onUpdateZoomSegment: (id: string, startTimeMs: number, endTimeMs: number) => void;
}

export default function ZoomTimelineRow({
  videoDurationMs,
  zoomSegments,
  pixelsPerSecond,
  onAddZoomSegment,
  onDeleteZoomSegment,
  onUpdateZoomSegment,
}: ZoomTimelineRowProps) {
  const zoomRowRef = useRef<HTMLDivElement | null>(null);

  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [isSegmentDragging, setIsSegmentDragging] = useState<boolean>(false);
  const [hoverSegment, setHoverSegment] = useState<{
    startTimeMs: number;
    endTimeMs: number;
  } | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!zoomRowRef.current) {
      setHoverSegment(null);
      return;
    }

    const rect = zoomRowRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const timeMs = (x / pixelsPerSecond) * 1000;

    const insideSegment = zoomSegments.find(
      (s) => timeMs >= s.startTimeMs && timeMs <= s.endTimeMs,
    );
    if (insideSegment) {
      setHoverSegment(null);
      return;
    }

    let minStartTimeMs = 0;
    let maxEndTimeMs = videoDurationMs;
    for (const s of zoomSegments) {
      if (s.endTimeMs <= timeMs) minStartTimeMs = s.endTimeMs;
      if (s.startTimeMs >= timeMs && s.startTimeMs < maxEndTimeMs) maxEndTimeMs = s.startTimeMs;
    }
    let startTimeMs = timeMs - 500;
    let endTimeMs = timeMs + 500;

    if (startTimeMs < minStartTimeMs) {
      startTimeMs = minStartTimeMs;
      endTimeMs = Math.min(maxEndTimeMs, startTimeMs + 1000);
    } else if (endTimeMs > maxEndTimeMs) {
      endTimeMs = maxEndTimeMs;
      startTimeMs = Math.max(minStartTimeMs, endTimeMs - 1000);
    }

    if (endTimeMs - startTimeMs < 100) {
      setHoverSegment(null);
      return;
    }

    setHoverSegment({ startTimeMs, endTimeMs });
  };

  return (
    <TimelineRow>
      <div
        ref={zoomRowRef}
        className="absolute inset-0 z-0"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverSegment(null)}
        onClick={() => {
          setSelectedSegmentId(null);
          if (hoverSegment) {
            setHoverSegment(null);
            onAddZoomSegment(hoverSegment.startTimeMs, hoverSegment.endTimeMs);
          }
        }}
      >
        {hoverSegment && !isSegmentDragging && (
          <div
            className="absolute top-0 bottom-0 bg-white/10 border border-dashed border-white/50 rounded-xl flex items-center justify-center pointer-events-none"
            style={{
              left: `${(hoverSegment.startTimeMs / 1000) * pixelsPerSecond}px`,
              width: `${((hoverSegment.endTimeMs - hoverSegment.startTimeMs) / 1000) * pixelsPerSecond}px`,
            }}
          >
            <Plus className="text-white/60 drop-shadow-md" size={18} strokeWidth={3} />
          </div>
        )}
      </div>

      {zoomSegments.map((segment, index) => {
        const prevSegment = index > 0 ? zoomSegments[index - 1] : undefined;
        const nextSegment = index < zoomSegments.length - 1 ? zoomSegments[index + 1] : undefined;
        const minStartTimeMs = prevSegment ? prevSegment.endTimeMs : 0;
        const maxEndTimeMs = nextSegment ? nextSegment.startTimeMs : videoDurationMs;

        return (
          <TimelineRowItem
            key={segment.id}
            segmentId={segment.id}
            startTimeMs={segment.startTimeMs}
            endTimeMs={segment.endTimeMs}
            pixelsPerSecond={pixelsPerSecond}
            colorClass="bg-violet-600"
            isSelected={selectedSegmentId === segment.id}
            minStartTimeMs={minStartTimeMs}
            maxEndTimeMs={maxEndTimeMs}
            onSelectSegment={setSelectedSegmentId}
            onDeleteSegment={onDeleteZoomSegment}
            onUpdateSegment={onUpdateZoomSegment}
            setIsSegmentDragging={setIsSegmentDragging}
          />
        );
      })}
    </TimelineRow>
  );
}
