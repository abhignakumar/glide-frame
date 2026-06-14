import Controls from './controls/Controls';
import PreviewContainer from './PreviewContainer';

interface MainAreaProps {
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  renderFrame: () => void;
  pixelsPerSecond: number;
  setPixelsPerSecond: React.Dispatch<React.SetStateAction<number>>;
  previewScale: number | null;
  videoSizing: { width: string; height: string } | null;
  setVideoSizing: React.Dispatch<React.SetStateAction<{ width: string; height: string } | null>>;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
}

export default function MainArea({
  isPlaying,
  setIsPlaying,
  videoRef,
  renderFrame,
  pixelsPerSecond,
  setPixelsPerSecond,
  previewScale,
  setVideoSizing,
  videoSizing,
  wrapperRef,
}: MainAreaProps) {
  return (
    <div className="shrink-0 h-[80%] w-full">
      <div className="h-full flex flex-col">
        <PreviewContainer
          previewScale={previewScale}
          videoRef={videoRef}
          videoSizing={videoSizing}
          setVideoSizing={setVideoSizing}
          wrapperRef={wrapperRef}
        />
        <Controls
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          videoRef={videoRef}
          renderFrame={renderFrame}
          pixelsPerSecond={pixelsPerSecond}
          setPixelsPerSecond={setPixelsPerSecond}
        />
      </div>
    </div>
  );
}
