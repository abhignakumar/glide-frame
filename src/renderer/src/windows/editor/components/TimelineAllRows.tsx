import TimelineRow from './TimelineRow';

export default function TimelineAllRows({
  duration,
  pixelsPerSecond,
}: {
  duration: number;
  pixelsPerSecond: number;
}) {
  // Only render if video metadata has loaded
  if (duration === 0) return null;

  return (
    <div className="w-full flex flex-col pt-3 pb-4 px-0 gap-y-2">
      <TimelineRow duration={duration} pixelsPerSecond={pixelsPerSecond} />
    </div>
  );
}
