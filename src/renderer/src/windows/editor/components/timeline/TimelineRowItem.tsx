import { Trash2 } from 'lucide-react';
import { useMemo, useState, useEffect, useRef } from 'react';

import { getStepAndIsMajorForTimelineZoom } from '../../lib/utils';

import type { Dispatch, SetStateAction } from 'react';

interface TimelineRowItemProps {
  segmentId: string;
  startTimeMs: number;
  endTimeMs: number;
  pixelsPerSecond: number;
  colorClass: string;
  minStartTimeMs: number;
  maxEndTimeMs: number;
  onUpdateSegment: (id: string, startTimeMs: number, endTimeMs: number) => void;
  onDeleteSegment: (id: string) => void;
  isSelected: boolean;
  onSelectSegment: (id: string | null) => void;
  setIsSegmentDragging: Dispatch<SetStateAction<boolean>>;
}

export default function TimelineRowItem({
  segmentId,
  startTimeMs,
  endTimeMs,
  pixelsPerSecond,
  colorClass,
  minStartTimeMs,
  maxEndTimeMs,
  onUpdateSegment,
  onDeleteSegment,
  isSelected,
  onSelectSegment,
  setIsSegmentDragging,
}: TimelineRowItemProps) {
  const [dragState, setDragState] = useState<{
    type: 'left' | 'right' | 'move';
    startX: number;
    initialStartTimeMs: number;
    initialEndTimeMs: number;
  } | null>(null);
  const [previewSegment, setPreviewSegment] = useState({
    startTimeMs,
    endTimeMs,
  });

  const draggedRef = useRef<boolean>(false);

  const startSec = previewSegment.startTimeMs / 1000;
  const endSec = previewSegment.endTimeMs / 1000;
  const left = startSec * pixelsPerSecond;
  const width = (endSec - startSec) * pixelsPerSecond;

  const lines = useMemo(() => {
    const tempLines: React.ReactNode[] = [];
    const { step } = getStepAndIsMajorForTimelineZoom(pixelsPerSecond);
    const firstLineSec = Math.ceil(startSec / step) * step;

    for (let t = firstLineSec; t <= endSec; t += step) {
      const xPos = (t - startSec) * pixelsPerSecond;
      tempLines.push(
        <div
          key={t}
          className="absolute top-0 bottom-0 w-px bg-neutral-600"
          style={{ left: `${xPos}px` }}
        />,
      );
    }
    return tempLines;
  }, [pixelsPerSecond, startSec, endSec]);

  const handleMouseDownMain = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    draggedRef.current = false;

    setDragState({
      type: 'move',
      startX: e.clientX,
      initialStartTimeMs: startTimeMs,
      initialEndTimeMs: endTimeMs,
    });
    setIsSegmentDragging(true);
  };

  const handleMouseDownLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    draggedRef.current = false;

    setDragState({
      type: 'left',
      startX: e.clientX,
      initialStartTimeMs: startTimeMs,
      initialEndTimeMs: endTimeMs,
    });
    setIsSegmentDragging(true);
  };

  const handleMouseDownRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    draggedRef.current = false;

    setDragState({
      type: 'right',
      startX: e.clientX,
      initialStartTimeMs: startTimeMs,
      initialEndTimeMs: endTimeMs,
    });
    setIsSegmentDragging(true);
  };

  useEffect(() => {
    if (!dragState) return;

    const getNewStartAndEndTimeMs = (deltaX: number) => {
      const deltaMs = (deltaX / pixelsPerSecond) * 1000;

      let newStartMs = dragState.initialStartTimeMs;
      let newEndMs = dragState.initialEndTimeMs;
      const durationMs = dragState.initialEndTimeMs - dragState.initialStartTimeMs;
      const MIN_SEGMENT_MS = 500;

      if (dragState.type === 'left') {
        newStartMs += deltaMs;
        if (newStartMs < minStartTimeMs) newStartMs = minStartTimeMs;
        if (newStartMs > newEndMs - MIN_SEGMENT_MS) {
          newStartMs = newEndMs - MIN_SEGMENT_MS;
        }
      } else if (dragState.type === 'right') {
        newEndMs += deltaMs;
        if (newEndMs > maxEndTimeMs) newEndMs = maxEndTimeMs;
        if (newEndMs < newStartMs + MIN_SEGMENT_MS) {
          newEndMs = newStartMs + MIN_SEGMENT_MS;
        }
      } else {
        newStartMs += deltaMs;
        newEndMs += deltaMs;
        if (newStartMs < minStartTimeMs) {
          newStartMs = minStartTimeMs;
          newEndMs = newStartMs + durationMs;
        }
        if (newEndMs > maxEndTimeMs) {
          newEndMs = maxEndTimeMs;
          newStartMs = newEndMs - durationMs;
        }
      }
      return { newStartMs, newEndMs };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      if (Math.abs(deltaX) > 3) {
        draggedRef.current = true;
      }
      const { newStartMs, newEndMs } = getNewStartAndEndTimeMs(deltaX);
      setPreviewSegment({ startTimeMs: newStartMs, endTimeMs: newEndMs });
    };

    const handleMouseUp = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const { newStartMs, newEndMs } = getNewStartAndEndTimeMs(deltaX);
      onUpdateSegment(segmentId, newStartMs, newEndMs);
      setDragState(null);
      setIsSegmentDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    dragState,
    pixelsPerSecond,
    minStartTimeMs,
    maxEndTimeMs,
    segmentId,
    onUpdateSegment,
    setIsSegmentDragging,
  ]);

  return (
    <div
      className={`absolute top-0 bottom-0 ${colorClass} border transition-colors duration-200 ease-in-out rounded-xl shadow-sm group cursor-grab ${dragState?.type === 'move' && 'cursor-grabbing!'} ${isSelected ? 'border-white/90 z-20 shadow-white/10 shadow-lg' : 'border-neutral-500 hover:border-white/60 z-10'}`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
      }}
      onMouseDown={handleMouseDownMain}
      onClick={() => {
        if (draggedRef.current) return;
        if (isSelected) onSelectSegment(null);
        else onSelectSegment(segmentId);
      }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">{lines}</div>
      <div
        className="absolute top-0 bottom-0 left-0 w-[10px] cursor-ew-resize z-10 flex justify-end items-center"
        onMouseDown={handleMouseDownLeft}
      >
        <div className="bg-neutral-300 w-1 h-[75%] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out" />
      </div>
      <div
        className="absolute top-0 bottom-0 right-0 w-[10px] cursor-ew-resize z-10 flex justify-start items-center"
        onMouseDown={handleMouseDownRight}
      >
        <div className="bg-neutral-300 w-1 h-[75%] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out" />
      </div>

      {isSelected && (
        <div className="absolute -top-11 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-50 pointer-events-auto">
          <button
            onClick={() => {
              onDeleteSegment(segmentId);
            }}
            className="bg-neutral-800 p-[5px] rounded-md border border-neutral-600 shadow-xl text-neutral-400 hover:text-red-500 transition-all duration-200"
          >
            <Trash2 size={18} />
          </button>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-neutral-600 drop-shadow-md" />
        </div>
      )}
    </div>
  );
}
