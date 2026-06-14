import { useEffect, useRef, useState, useCallback } from 'react';

import { editorApi } from './api';
import MainArea from './components/MainArea';
import TimelineContainer from './components/timeline/TimelineContainer';
import { computeFinalFrameStates } from './final-frames';
import { DEFAULT_PIXELS_PER_SECOND, FRAME_DURATION_IN_SECONDS } from './lib/config';
import { getInterpolatedFrame } from './lib/utils';
import { generateZoomCenters } from './zoom-centers';

import type { FinalFrameState } from './lib/types';
import type { TMouseMove, TZoomSegment } from 'src/preload';

export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [previewScale, setPreviewScale] = useState<number | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoSizing, setVideoSizing] = useState<{ width: string; height: string } | null>(null);
  const [zoomSegments, setZoomSegments] = useState<TZoomSegment[]>([]);
  const [mouseMoves, setMouseMoves] = useState<TMouseMove[]>([]);
  const [finalFrameStates, setFinalFrameStates] = useState<FinalFrameState[]>([]);
  const [pixelsPerSecond, setPixelsPerSecond] = useState<number>(DEFAULT_PIXELS_PER_SECOND);

  useEffect(() => {
    if (wrapperRef.current) {
      const { width, height } = wrapperRef.current.getBoundingClientRect();
      const scale = Math.min(width / 1920, height / 1080);
      setPreviewScale(scale);
    }
    void editorApi.getProjectData().then((projectData) => {
      setZoomSegments(projectData.zoomSegments);
    });
    void editorApi.getMouseMoves().then((mouseMoves) => {
      setMouseMoves(mouseMoves);
    });
  }, []);

  useEffect(() => {
    if (!videoRef.current || !videoRef.current.duration) return;
    setVideoDuration(videoRef.current.duration);
  }, [videoRef.current?.duration]);

  useEffect(() => {
    if (!videoRef.current || zoomSegments.length === 0 || mouseMoves.length === 0) return;
    const width = videoRef.current.clientWidth;
    const height = videoRef.current.clientHeight;

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
      computeFinalFrameStates(
        videoRef.current.duration * 1000,
        { width, height },
        zoomSegments,
        zoomCenters,
      ),
    );
  }, [videoRef.current?.clientWidth, videoRef.current?.clientHeight, zoomSegments, mouseMoves]);

  const renderFrame = useCallback(() => {
    if (!videoRef.current) return;
    const currentSec = videoRef.current.currentTime;
    const currentMs = currentSec * 1000;
    const frameData = getInterpolatedFrame(currentMs, finalFrameStates);
    videoRef.current.style.transform = `translate(${frameData.videoTranslateX}px, ${frameData.videoTranslateY}px) scale(${frameData.videoScale})`;
    if (scrubberRef.current) {
      scrubberRef.current.style.transform = `translateX(${currentSec * pixelsPerSecond}px)`;
    }
  }, [finalFrameStates, pixelsPerSecond]);

  const loop = useCallback(
    function tick() {
      renderFrame();
      animationFrameIdRef.current = requestAnimationFrame(tick);
    },
    [renderFrame],
  );

  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      void videoRef.current.play();
      animationFrameIdRef.current = requestAnimationFrame(loop);
    } else {
      videoRef.current.pause();
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      renderFrame();
    }
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [isPlaying, renderFrame, loop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      e.preventDefault();
      if (e.key === ' ') {
        setIsPlaying((prev) => !prev);
        return;
      }
      if (isPlaying) return;

      if (e.key === 'ArrowRight') {
        videoRef.current.currentTime = Math.min(
          videoRef.current.duration,
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
  }, [isPlaying, renderFrame]);

  function seekTo(timestampSeconds: number) {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(
      Math.max(0, timestampSeconds),
      videoRef.current.duration,
    );
    renderFrame();
  }

  return (
    <div className="flex flex-col w-screen h-screen bg-black text-white overflow-hidden">
      <MainArea
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        renderFrame={renderFrame}
        videoRef={videoRef}
        pixelsPerSecond={pixelsPerSecond}
        setPixelsPerSecond={setPixelsPerSecond}
        previewScale={previewScale}
        setVideoSizing={setVideoSizing}
        videoSizing={videoSizing}
        wrapperRef={wrapperRef}
      />
      <TimelineContainer
        videoDuration={videoDuration}
        pixelsPerSecond={pixelsPerSecond}
        zoomSegments={zoomSegments}
        scrubberRef={scrubberRef}
        seekTo={seekTo}
      />
    </div>
  );
}
