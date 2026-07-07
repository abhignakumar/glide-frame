import { MAX_PIXELS_PER_SECOND, MIN_PIXELS_PER_SECOND } from '../../lib/config';

interface TimelineZoomControlProps {
  pixelsPerSecond: number;
  handleSetPixelsPerSecond: (newPixelsPerSecond: number) => void;
}

export default function TimelineZoomControl({
  pixelsPerSecond,
  handleSetPixelsPerSecond,
}: TimelineZoomControlProps) {
  return (
    <div className="flex items-center gap-x-3">
      <span className="text-xs text-neutral-400 font-medium">Timeline Zoom</span>
      <input
        type="range"
        min={MIN_PIXELS_PER_SECOND}
        max={MAX_PIXELS_PER_SECOND}
        value={pixelsPerSecond}
        onFocus={(e) => e.currentTarget.blur()}
        onChange={(e) => handleSetPixelsPerSecond(Number(e.target.value))}
        className="w-32 accent-white"
      />
    </div>
  );
}
