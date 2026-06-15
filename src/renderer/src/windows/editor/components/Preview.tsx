import { editorApi } from '../api';
import mousePng from '../assets/arrow.png';
import wallpaper from '../assets/wallpaper.jpg';
import { MOUSE_ARROW_DATA, MOUSE_SIZE_TIMES } from '../lib/config';

interface PreviewProps {
  previewScale: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoSizing: { width: string; height: string } | null;
  setVideoSizing: React.Dispatch<React.SetStateAction<{ width: string; height: string } | null>>;
  transformContainerRef: React.RefObject<HTMLDivElement | null>;
  mouseRef: React.RefObject<HTMLImageElement | null>;
}

export default function Preview({
  previewScale,
  videoRef,
  videoSizing,
  setVideoSizing,
  transformContainerRef,
  mouseRef,
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
      <div
        ref={transformContainerRef}
        className="absolute shadow-black shadow-2xl flex items-center justify-center"
        style={{
          width: videoSizing?.width,
          height: videoSizing?.height,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      >
        <video
          ref={videoRef}
          src={editorApi.getVideoSrcUrl()}
          preload="auto"
          onLoadedMetadata={handleOnLoadedMetadata}
          className="w-full h-full"
          style={{ display: videoSizing ? 'block' : 'none' }}
        />
        <img
          ref={mouseRef}
          src={mousePng}
          alt="Cursor"
          className={`absolute top-0 left-0 pointer-events-none h-auto drop-shadow-black drop-shadow-2xl`}
          style={{
            willChange: 'transform',
            width: `${MOUSE_ARROW_DATA.standardSize.width * MOUSE_SIZE_TIMES}px`,
            transformOrigin: `${MOUSE_ARROW_DATA.hotspot.x * MOUSE_SIZE_TIMES}px ${MOUSE_ARROW_DATA.hotspot.y * MOUSE_SIZE_TIMES}px`,
            display: videoSizing ? 'block' : 'none',
          }}
        />
      </div>
    </div>
  );
}
