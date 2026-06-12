export default function TimelineRowItem({
  startTimeMs,
  endTimeMs,
  pixelsPerSecond,
  colorClass,
}: {
  startTimeMs: number;
  endTimeMs: number;
  pixelsPerSecond: number;
  colorClass: string;
}) {
  const startSec = startTimeMs / 1000;
  const endSec = endTimeMs / 1000;

  // Positional math
  const left = startSec * pixelsPerSecond;
  const width = (endSec - startSec) * pixelsPerSecond;

  // Re-calculate the step logic to draw matching vertical lines
  let step = 1;
  if (pixelsPerSecond >= 300) {
    step = 0.5;
  } else if (pixelsPerSecond >= 100) {
    step = 1;
  } else if (pixelsPerSecond >= 50) {
    step = 2.5;
  } else {
    step = 5;
  }

  const lines: React.ReactNode[] = [];
  // Find the first marker time that occurs after the start of this clip
  const firstLineSec = Math.ceil(startSec / step) * step;

  // Draw the inner vertical lines up to the end of the clip
  for (let t = firstLineSec; t <= endSec; t += step) {
    const xPos = (t - startSec) * pixelsPerSecond;
    lines.push(
      <div
        key={t}
        className="absolute top-0 bottom-0 w-px bg-neutral-600"
        style={{ left: `${xPos}px` }}
      />,
    );
  }

  return (
    <div
      className={`absolute top-0 bottom-0 ${colorClass} border border-neutral-500 hover:border-white/80 transition-all duration-250 ease-in-out rounded-xl overflow-hidden shadow-sm`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
      }}
    >
      {/* Grid Lines */}
      {lines}
    </div>
  );
}
