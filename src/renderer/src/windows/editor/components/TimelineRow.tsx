import TimelineRowItem from './TimelineRowItem';

export default function TimelineRow({
  duration,
  pixelsPerSecond,
}: {
  duration: number;
  pixelsPerSecond: number;
}) {
  return (
    <div className="w-full h-12 relative">
      {/* 
        The entire clip itself 
        duration is in seconds, so we multiply by 1000 for endTimeMs
      */}
      <TimelineRowItem
        startTimeMs={0}
        endTimeMs={duration * 1000}
        pixelsPerSecond={pixelsPerSecond}
      />
    </div>
  );
}
