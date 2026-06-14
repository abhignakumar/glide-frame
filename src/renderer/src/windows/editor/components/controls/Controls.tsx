import PlaybackControls from './PlaybackControls';
import TimelineZoomControl from './TimelineZoomControl';

interface ControlsProps {
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  renderFrame: () => void;
  pixelsPerSecond: number;
  setPixelsPerSecond: React.Dispatch<React.SetStateAction<number>>;
}

export default function Controls({
  isPlaying,
  setIsPlaying,
  videoRef,
  renderFrame,
  pixelsPerSecond,
  setPixelsPerSecond,
}: ControlsProps) {
  return (
    <div className="h-16 flex items-center px-6 w-full shrink-0 border-t border-neutral-800">
      <div className="flex-1"></div>
      <PlaybackControls
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        videoRef={videoRef}
        renderFrame={renderFrame}
      />
      <div className="flex-1 flex items-center justify-end">
        <TimelineZoomControl
          pixelsPerSecond={pixelsPerSecond}
          setPixelsPerSecond={setPixelsPerSecond}
        />
      </div>
    </div>
  );
}
