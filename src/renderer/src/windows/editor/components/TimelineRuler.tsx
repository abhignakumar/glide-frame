import { formatRulerTime } from '../lib/utils';

export default function TimelineRuler({
  width,
  pixelsPerSecond,
  onSeek,
}: {
  width: number;
  pixelsPerSecond: number;
  onSeek: (time: number) => void;
}) {
  // Calculate click position relative to the ruler content
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // e.clientX is view-relative. rect.left is view-relative.
    // This formula perfectly accounts for any horizontal scrolling!
    const clickX = e.clientX - rect.left;
    const clickedTime = clickX / pixelsPerSecond;
    onSeek(clickedTime);
  };

  const markers: React.ReactNode[] = [];

  let step = 1;
  let isMajor = (t: number) => t % 1 === 0;

  // Determine interval steps based on zoom level
  if (pixelsPerSecond >= 300) {
    // High Zoom (300 to 600): Steps every 0.5s, Major every 1s
    step = 0.5;
    isMajor = (t) => t % 1 === 0;
  } else if (pixelsPerSecond >= 100) {
    // Medium Zoom (100 to 299): Steps every 1s, Major every 1s
    step = 1;
    isMajor = (t) => t % 1 === 0;
  } else {
    // Low Zoom (60 to 99): Steps every 2.5s, Major every 5s
    step = 2.5;
    isMajor = (t) => t % 5 === 0;
  }

  // Calculate the maximum time we need to draw markers for.
  // We use `width / pixelsPerSecond` instead of `duration` so the markers
  // continue into the extra 100px padding we added to the timeline width.
  const maxTime = width / pixelsPerSecond;

  for (let t = step; t <= maxTime; t += step) {
    const xPosition = t * pixelsPerSecond;
    const major = isMajor(t);

    markers.push(
      <div
        key={t}
        className="absolute flex flex-col items-center justify-end pb-1 bottom-0"
        style={{
          left: `${xPosition}px`,
          transform: 'translateX(-50%)', // Centers the marker exactly on the timestamp pixel
          height: '100%',
        }}
      >
        {major ? (
          <>
            {/* Timestamp */}
            <span className="text-[12px] text-neutral-600 mb-[4px] leading-none select-none font-medium">
              {formatRulerTime(t)}
            </span>
            {/* Major Marker Dot */}
            <div className="w-[4px] h-[4px] rounded-full bg-neutral-600" />
          </>
        ) : (
          /* Minor Marker Dot */
          <div className="w-[4px] h-[4px] rounded-full bg-neutral-600 mb-px" />
        )}
      </div>,
    );
  }

  return (
    <div className="w-full h-8 relative overflow-hidden" onClick={handleRulerClick}>
      {markers}
    </div>
  );
}
