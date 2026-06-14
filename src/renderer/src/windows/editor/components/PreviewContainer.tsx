import Preview from './Preview';

interface PreviewContainerProps {
  previewScale: number | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoSizing: { width: string; height: string } | null;
  setVideoSizing: React.Dispatch<React.SetStateAction<{ width: string; height: string } | null>>;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
}

export default function PreviewContainer({
  previewScale,
  videoRef,
  videoSizing,
  setVideoSizing,
  wrapperRef,
}: PreviewContainerProps) {
  return (
    <div ref={wrapperRef} className="flex-1 flex items-center justify-center overflow-hidden my-6">
      {previewScale && (
        <Preview
          previewScale={previewScale}
          videoRef={videoRef}
          videoSizing={videoSizing}
          setVideoSizing={setVideoSizing}
        />
      )}
    </div>
  );
}
