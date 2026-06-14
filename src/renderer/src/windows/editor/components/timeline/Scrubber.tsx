interface ScrubberProps {
  scrubberRef: React.RefObject<HTMLDivElement | null>;
}

export default function Scrubber({ scrubberRef }: ScrubberProps) {
  return (
    <div
      ref={scrubberRef}
      className="absolute top-0 bottom-0 z-50 w-0 pointer-events-none"
      style={{ transform: 'translateX(0px)' }}
    >
      <div className="absolute top-[4px] left-0 -translate-x-1/2 w-3 h-3 bg-violet-900 rounded-full shadow-md" />
      <div className="absolute top-[14px] left-0 -translate-x-1/2 w-px h-full bg-violet-900" />
    </div>
  );
}
