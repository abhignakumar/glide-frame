import { editorApi } from '../api';
import wallpaper from '../assets/wallpaper.jpg';

interface PreviewProps {
  previewScale: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoSizing: { width: string; height: string } | null;
  setVideoSizing: React.Dispatch<React.SetStateAction<{ width: string; height: string } | null>>;
}

export default function Preview({
  previewScale,
  videoRef,
  videoSizing,
  setVideoSizing,
}: PreviewProps) {
  function handleOnLoadedMetadata(e: React.SyntheticEvent<HTMLVideoElement, Event>) {
    const video = e.currentTarget;
    const videoRatio = video.videoWidth / video.videoHeight;
    const containerRatio = 1920 / 1080;
    if (videoRatio >= containerRatio) {
      setVideoSizing({ width: '100%', height: 'auto' });
    } else {
      setVideoSizing({ width: 'auto', height: '100%' });
    }
  }

  return (
    <div
      className="relative overflow-hidden flex items-center justify-center shrink-0 rounded-md"
      style={{
        width: '1920px',
        height: '1080px',
        transform: `scale(${previewScale})`,
        transformOrigin: 'center center',

        backgroundImage: `url(${wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <video
        ref={videoRef}
        src={editorApi.getVideoSrcUrl()}
        preload="auto"
        onLoadedMetadata={handleOnLoadedMetadata}
        className="absolute shadow-black shadow-2xl"
        style={{
          display: videoSizing ? 'block' : 'none',
          width: videoSizing?.width,
          height: videoSizing?.height,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
