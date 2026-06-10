import React, { useEffect, useRef, useState, useCallback } from 'react';

import { editorApi } from './api';
import { computeFinalFrameStates } from './final-frames';
import { FRAME_DURATION_IN_SECONDS } from './lib/config';
import { formatTime, getInterpolatedFrame } from './lib/utils';
import { generateZoomCenters } from './zoom-centers';

import type { FinalFrameState } from './lib/types';
import type { TMouseMove } from 'src/preload';

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeLabelRef = useRef<HTMLSpanElement>(null);
  const scrubberRef = useRef<HTMLInputElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [viewportScale, setViewportScale] = useState(1);
  const [finalFrameStates, setFinalFrameStates] = useState<FinalFrameState[]>([]);
  const [videoSizing, setVideoSizing] = useState<{ width: string; height: string }>({
    width: 'auto',
    height: 'auto',
  });

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
      scrubberRef.current.value = currentSec.toString();
    }
    if (timeLabelRef.current) {
      timeLabelRef.current.innerText = formatTime(currentSec);
    }
  }, [finalFrameStates]);

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

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newTime = parseFloat(e.target.value);
    videoRef.current.currentTime = newTime;
    renderFrame();
  };

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
    <div className="flex flex-col w-screen h-screen bg-neutral-900 text-white overflow-hidden">
      {/* --- PREVIEW AREA (Top 75%) --- */}
      <div
        ref={wrapperRef}
        className="shrink-0 h-[75%] w-full flex items-center justify-center overflow-hidden border-b border-neutral-800"
      >
        {/* The 1920x1080 Fixed Canvas Area */}
        <div
          className="relative bg-blue-500 overflow-hidden flex items-center justify-center shrink-0"
          style={{
            width: '1920px',
            height: '1080px',
            transform: `scale(${viewportScale})`,
            transformOrigin: 'center center',
          }}
        >
          <video
            ref={videoRef}
            src={editorApi.getVideoSrcUrl()}
            preload="auto"
            onLoadedMetadata={handleOnLoadedMetadata}
            className="absolute"
            style={{
              width: videoSizing.width,
              height: videoSizing.height,
              transformOrigin: 'center center',
              willChange: 'transform',
            }}
          />
        </div>
      </div>

      {/* --- TIMELINE AREA (Bottom 25%) --- */}
      <div className="grow flex flex-col p-4 space-y-4">
        {/* Controls */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:bg-neutral-200 transition-colors focus:outline-none"
          >
            {isPlaying ? (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 fill-current ml-1" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <span ref={timeLabelRef} className="font-mono text-sm opacity-80 w-20">
            00:00:00
          </span>
          <span className="font-mono text-sm opacity-50">/ {formatTime(duration)}</span>
        </div>

        {/* Timeline Scrubber */}
        <div className="relative w-full h-8 flex items-center group cursor-pointer">
          {/* Custom Track Visual (can be expanded to show timestamps/ticks later) */}
          <div className="absolute left-0 right-0 h-2 bg-neutral-800 rounded-full overflow-hidden">
            {/* Markers placeholder */}
            <div className="w-full h-full opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTM5IDB2MTBoMVYweiIgZmlsbD0iI0ZGRiIvPjwvc3ZnPg==')]" />
          </div>

          <input
            type="range"
            defaultValue={0}
            ref={scrubberRef}
            min={0}
            max={duration || 1}
            step={FRAME_DURATION_IN_SECONDS}
            onChange={handleScrub}
            onMouseDown={() => {
              if (isPlaying) setIsPlaying(false);
            }}
            className="absolute w-full h-full opacity-0 cursor-pointer z-10"
          />
        </div>

        <p className="text-xs text-neutral-500 text-center mt-auto">
          Tip: Use <kbd className="bg-neutral-800 px-1 py-0.5 rounded">Space</kbd> to play/pause,
          and <kbd className="bg-neutral-800 px-1 py-0.5 rounded">Left</kbd> /{' '}
          <kbd className="bg-neutral-800 px-1 py-0.5 rounded">Right</kbd> to step frames.
        </p>
      </div>
    </div>
  );
}
