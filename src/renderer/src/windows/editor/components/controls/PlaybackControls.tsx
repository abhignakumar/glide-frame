import { CirclePause, CirclePlay, SkipBack, SkipForward } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  renderFrame: () => void;
}

export default function PlaybackControls({
  isPlaying,
  setIsPlaying,
  videoRef,
  renderFrame,
}: PlaybackControlsProps) {
  function handlePlayPauseButton() {
    setIsPlaying((prev) => !prev);
  }

  function handleFirstFrameButton() {
    if (!videoRef.current) return;
    setIsPlaying(false);
    videoRef.current.currentTime = 0;
    renderFrame();
  }

  function handleLastFrameButton() {
    if (!videoRef.current) return;
    setIsPlaying(false);
    videoRef.current.currentTime = Math.max(0, videoRef.current.duration);
    renderFrame();
  }

  return (
    <div className="flex gap-x-2 justify-center">
      <Button onClick={handleFirstFrameButton}>
        <SkipBack size={20} />
      </Button>
      <Button onClick={handlePlayPauseButton}>
        {isPlaying ? <CirclePause /> : <CirclePlay />}
      </Button>
      <Button onClick={handleLastFrameButton}>
        <SkipForward size={20} />
      </Button>
    </div>
  );
}

function Button({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      onFocus={(e) => e.currentTarget.blur()}
      className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-neutral-900 transition-colors duration-200"
    >
      {children}
    </button>
  );
}
