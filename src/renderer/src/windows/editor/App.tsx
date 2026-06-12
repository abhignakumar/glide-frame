import { CirclePause, CirclePlay, SkipBack, SkipForward } from 'lucide-react';
import React, { useEffect, useRef, useState, useCallback } from 'react';

import { editorApi } from './api';
import wallpaper from './assets/wallpaper.jpg';
import Timeline from './components/Timeline';
import { computeFinalFrameStates } from './final-frames';
import {
  DEFAULT_PIXELS_PER_SECOND,
  FRAME_DURATION_IN_SECONDS,
  MIN_PIXELS_PER_SECOND,
  MAX_PIXELS_PER_SECOND,
} from './lib/config';
import { formatTime, getInterpolatedFrame } from './lib/utils';
import { generateZoomCenters } from './zoom-centers';

import type { FinalFrameState } from './lib/types';
import type { TMouseMove, TZoomSegment } from 'src/preload';

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeLabelRef = useRef<HTMLSpanElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [viewportScale, setViewportScale] = useState(1);
  const [finalFrameStates, setFinalFrameStates] = useState<FinalFrameState[]>([]);
  const [videoSizing, setVideoSizing] = useState<{ width: string; height: string }>({
    width: 'auto',
    height: 'auto',
  });
  const [pixelsPerSecond, setPixelsPerSecond] = useState(DEFAULT_PIXELS_PER_SECOND);
  const [zoomSegments, setZoomSegments] = useState<TZoomSegment[]>([]);

  // --- Core Engine: Render Loop ---
  // We use this function to manually apply transforms without triggering React renders
  const renderFrame = useCallback(() => {
    if (!videoRef.current) return;

    const currentSec = videoRef.current.currentTime;
    const currentMs = currentSec * 1000;

    // 1. Calculate and apply Pan & Zoom transform
    const frameData = getInterpolatedFrame(currentMs, finalFrameStates);

    // transform: translate(Xpx, Ypx) scale(S)
    // Applies scale from center first, then pans the scaled result
    videoRef.current.style.transform = `translate(${frameData.videoTranslateX}px, ${frameData.videoTranslateY}px) scale(${frameData.videoScale})`;

    // 2. Update Timeline UI (Scrubber & Time Code)
    if (scrubberRef.current) {
      scrubberRef.current.style.transform = `translateX(${currentSec * pixelsPerSecond}px)`;
    }
    if (timeLabelRef.current) {
      timeLabelRef.current.innerText = formatTime(currentSec);
    }
  }, [finalFrameStates, pixelsPerSecond]);

  useEffect(() => {
    void editorApi.getProjectData().then((projectData) => {
      setZoomSegments(projectData.zoomSegments);
    });
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      renderFrame();
    }
  }, [pixelsPerSecond, isPlaying, renderFrame]);

  const loop = useCallback(
    function tick() {
      renderFrame();
      animationFrameId.current = requestAnimationFrame(tick);
    },
    [renderFrame],
  );

  // Handle Play/Pause side-effects
  useEffect(() => {
    if (isPlaying) {
      void videoRef.current?.play();
      animationFrameId.current = requestAnimationFrame(loop);
    } else {
      videoRef.current?.pause();
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      // Ensure we render one last frame exactly where it paused
      renderFrame();
    }
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isPlaying, loop, renderFrame]);

  // --- Viewport Scaling Logic ---
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Scale the 1920x1080 canvas down/up to fit within the preview wrapper
        const scale = Math.min(width / 1920, height / 1080);
        setViewportScale(scale);
      }
    });

    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  // --- Keyboard & Scrubber Events ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
        return;
      }
      if (isPlaying) return;

      if (e.key === 'ArrowRight') {
        videoRef.current.currentTime = Math.min(
          duration,
          videoRef.current.currentTime + FRAME_DURATION_IN_SECONDS,
        );
        renderFrame();
      } else if (e.key === 'ArrowLeft') {
        videoRef.current.currentTime = Math.max(
          0,
          videoRef.current.currentTime - FRAME_DURATION_IN_SECONDS,
        );
        renderFrame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration, isPlaying, renderFrame]);

  const computeAndSetFinalFrameStates = useCallback(async () => {
    if (!videoRef.current) return;
    const width = videoRef.current.clientWidth;
    const height = videoRef.current.clientHeight;

    const zoomSegments = (await editorApi.getProjectData()).zoomSegments;
    const mouseMoves = await editorApi.getMouseMoves();
    const videoScaledFactor = width / videoRef.current.videoWidth;
    const scaledMouseMoves: TMouseMove[] = mouseMoves.map((move) => {
      return {
        x: move.x * videoScaledFactor,
        y: move.y * videoScaledFactor,
        unixTimeMs: move.unixTimeMs,
        processTimeMs: move.processTimeMs,
      };
    });
    const zoomCenters = generateZoomCenters(
      zoomSegments,
      scaledMouseMoves,
      { width, height },
      { width: 1920, height: 1080 },
    );
    setFinalFrameStates(
      computeFinalFrameStates(duration * 1000, { width, height }, zoomSegments, zoomCenters),
    );
  }, [duration]);

  useEffect(() => {
    void computeAndSetFinalFrameStates();
  }, [videoSizing, computeAndSetFinalFrameStates]);

  function handleOnLoadedMetadata(e: React.SyntheticEvent<HTMLVideoElement, Event>) {
    const video = e.currentTarget;
    const duration = video.duration;
    setDuration(duration);

    // Compare the video's intrinsic aspect ratio to the 1920x1080 container (16:9)
    const videoRatio = video.videoWidth / video.videoHeight;
    const containerRatio = 1920 / 1080;

    if (videoRatio >= containerRatio) {
      // Video is wider or exactly 16:9 -> constrain by width
      setVideoSizing({ width: '100%', height: 'auto' });
    } else {
      // Video is taller than 16:9 -> constrain by height
      setVideoSizing({ width: 'auto', height: '100%' });
    }
  }

  return (
    <div className="flex flex-col w-screen h-screen bg-black text-white overflow-hidden">
      {/* --- PREVIEW AREA (Top 75%) --- */}
      <div className="shrink-0 h-[80%] w-full">
        <div className="h-full flex flex-col">
          {/* Preview Surface */}
          <div
            ref={wrapperRef}
            className="flex-1 flex items-center justify-center overflow-hidden pt-5"
          >
            {/* The 1920x1080 Fixed Canvas Area */}
            <div
              className="relative overflow-hidden flex items-center justify-center shrink-0 rounded-md"
              style={{
                width: '1920px',
                height: '1080px',
                transform: `scale(${viewportScale})`,
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
                  width: videoSizing.width,
                  height: videoSizing.height,
                  transformOrigin: 'center center',
                  willChange: 'transform',
                }}
              />
            </div>
          </div>

          <div className="h-16 flex items-center px-6 w-full shrink-0">
            {/* Left spacer to keep center controls perfectly centered */}
            <div className="flex-1"></div>

            {/* Center: Playback Controls */}
            <div className="flex gap-x-2 justify-center">
              <button
                onClick={() => {
                  if (!videoRef.current) return;
                  setIsPlaying(false);
                  videoRef.current.currentTime = 0;
                  renderFrame();
                }}
                className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-neutral-900 transition-colors duration-200"
              >
                <SkipBack size={20} />
              </button>
              <button
                onClick={() => setIsPlaying((prev) => !prev)}
                className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-neutral-900 transition-colors duration-200"
              >
                {isPlaying ? <CirclePause /> : <CirclePlay />}
              </button>
              <button
                onClick={() => {
                  if (!videoRef.current) return;
                  setIsPlaying(false);
                  videoRef.current.currentTime = Math.max(0, duration - FRAME_DURATION_IN_SECONDS);
                  renderFrame();
                }}
                className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-neutral-900 transition-colors duration-200"
              >
                <SkipForward size={20} />
              </button>
            </div>

            {/* Right: Zoom Slider */}
            <div className="flex-1 flex items-center justify-end gap-x-3">
              <span className="text-xs text-neutral-400 font-medium">Timeline Zoom</span>
              <input
                type="range"
                min={MIN_PIXELS_PER_SECOND}
                max={MAX_PIXELS_PER_SECOND}
                value={pixelsPerSecond}
                onChange={(e) => setPixelsPerSecond(Number(e.target.value))}
                className="w-32 accent-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- TIMELINE AREA (Bottom 20%) --- */}
      <div className="h-full overflow-x-scroll overflow-y-hidden px-4 scrollbar-none">
        <Timeline
          duration={duration}
          pixelsPerSecond={pixelsPerSecond}
          zoomSegments={zoomSegments}
          scrubberRef={scrubberRef}
          onSeek={(time) => {
            if (!videoRef.current) return;
            // Clamp the time to valid boundaries
            videoRef.current.currentTime = Math.min(Math.max(0, time), duration);
            renderFrame();
          }}
        />
      </div>
    </div>
  );
}
