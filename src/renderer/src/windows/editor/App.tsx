import { ArrowUpFromLine } from 'lucide-react';
import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';

import { editorApi } from './api';
import MainArea from './components/MainArea';
import TimelineContainer from './components/timeline/TimelineContainer';
import { computeFinalFrameStates } from './final-frames';
import {
  DEFAULT_PIXELS_PER_SECOND,
  FRAME_DURATION_IN_SECONDS,
  MOUSE_ARROW_DATA,
  MOUSE_SIZE_TIMES,
} from './lib/config';
import { exportVideo } from './lib/export';
import { getInterpolatedFrame } from './lib/utils';
import { generateZoomCenters } from './zoom-centers';

import type { FinalFrameState } from './lib/types';
import type { TMouseClick, TMouseMove, TZoomSegment, TProjectData } from 'src/preload';

export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const transformContainerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef<HTMLImageElement | null>(null);
  const timelineContainerRef = useRef<HTMLDivElement | null>(null);
  const timelineZoomStateRef = useRef<{ time: number; visualX: number } | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [previewScale, setPreviewScale] = useState<number | null>(null);
  const [videoDurationMs, setVideoDurationMs] = useState<number | null>(null);
  const [videoSizing, setVideoSizing] = useState<{ width: string; height: string } | null>(null);
  const [, setProjectData] = useState<TProjectData | null>(null);
  const [zoomSegments, setZoomSegments] = useState<TZoomSegment[]>([]);
  const [mouseMoves, setMouseMoves] = useState<TMouseMove[]>([]);
  const [mouseClicks, setMouseClicks] = useState<TMouseClick[]>([]);
  const [finalFrameStates, setFinalFrameStates] = useState<FinalFrameState[]>([]);
  const [pixelsPerSecond, setPixelsPerSecond] = useState<number>(DEFAULT_PIXELS_PER_SECOND);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);

  useEffect(() => {
    if (wrapperRef.current) {
      const { width, height } = wrapperRef.current.getBoundingClientRect();
      const scale = Math.min(width / 1920, height / 1080);
      setPreviewScale(scale);
    }
    void editorApi.getProjectData().then((projectData) => {
      setProjectData(projectData);
      setZoomSegments(projectData.zoomSegments);
    });
    void editorApi.getMouseMoves().then((mouseMoves) => {
      setMouseMoves(mouseMoves);
    });
    void editorApi.getMouseClicks().then((mouseClicks) => {
      setMouseClicks(mouseClicks);
    });
  }, []);

  useEffect(() => {
    if (!videoRef.current || !videoRef.current.duration) return;
    setVideoDurationMs(videoRef.current.duration * 1000);
  }, [videoRef.current?.duration]);

  useEffect(() => {
    if (
      !videoRef.current ||
      !videoRef.current.duration ||
      zoomSegments.length === 0 ||
      mouseMoves.length === 0 ||
      mouseClicks.length === 0
    )
      return;
    const width = videoRef.current.clientWidth;
    const height = videoRef.current.clientHeight;
    const videoScaleFactor = width / videoRef.current.videoWidth;
    const scaledMouseMoves: TMouseMove[] = mouseMoves.map((mouseMove) => {
      return {
        ...mouseMove,
        x: mouseMove.x * videoScaleFactor,
        y: mouseMove.y * videoScaleFactor,
      };
    });
    const scaledMouseClicks: TMouseClick[] = mouseClicks.map((mouseClick) => {
      return {
        ...mouseClick,
        x: mouseClick.x * videoScaleFactor,
        y: mouseClick.y * videoScaleFactor,
      };
    });
    const zoomCenters = generateZoomCenters(
      zoomSegments,
      scaledMouseMoves.map((item) => ({ ...item })),
      { width, height },
      { width: 1920, height: 1080 },
    );
    const finalFrames = computeFinalFrameStates(
      videoRef.current.duration * 1000,
      { width, height },
      zoomSegments,
      zoomCenters,
      scaledMouseMoves.map((item) => ({ ...item })),
      scaledMouseClicks.map((item) => ({ ...item })),
    );
    setFinalFrameStates(finalFrames);
  }, [
    videoRef.current?.clientWidth,
    videoRef.current?.clientHeight,
    videoRef.current?.duration,
    zoomSegments,
    mouseMoves,
    mouseClicks,
  ]);

  const renderFrame = useCallback(() => {
    if (
      !videoRef.current ||
      !transformContainerRef.current ||
      !mouseRef.current ||
      !scrubberRef.current
    )
      return;
    const currentSec = videoRef.current.currentTime;
    const currentMs = currentSec * 1000;
    const frameData = getInterpolatedFrame(currentMs, finalFrameStates);
    mouseRef.current.style.transform = `translate(${frameData.mouseX - MOUSE_SIZE_TIMES * MOUSE_ARROW_DATA.hotspot.x}px, ${frameData.mouseY - MOUSE_SIZE_TIMES * MOUSE_ARROW_DATA.hotspot.y}px) scale(${frameData.mouseScale}) rotate(${frameData.mouseRotation}deg)`;
    transformContainerRef.current.style.transform = `translate(${frameData.videoTranslateX}px, ${frameData.videoTranslateY}px) scale(${frameData.videoScale})`;
    scrubberRef.current.style.transform = `translateX(${currentSec * pixelsPerSecond}px)`;
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
      if (!videoRef.current || !videoRef.current.duration) return;
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
        return;
      }
      if (isPlaying) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        videoRef.current.currentTime = Math.min(
          videoRef.current.duration,
          videoRef.current.currentTime + FRAME_DURATION_IN_SECONDS,
        );
        renderFrame();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
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
    if (!videoRef.current || !videoRef.current.duration) return;
    videoRef.current.currentTime = Math.min(
      Math.max(0, timestampSeconds),
      videoRef.current.duration,
    );
    renderFrame();
  }

  const handleUpdateZoomSegment = useCallback(
    (id: string, startTimeMs: number, endTimeMs: number) => {
      setZoomSegments((prev) =>
        prev.map((s) => (s.id === id ? { ...s, startTimeMs, endTimeMs } : s)),
      );
      setProjectData((prev) => {
        if (!prev) return prev;
        const updatedZoomSegments = prev.zoomSegments.map((s) =>
          s.id === id ? { ...s, startTimeMs, endTimeMs } : s,
        );
        const updatedProjectData = { ...prev, zoomSegments: updatedZoomSegments };
        void editorApi.updateProjectData(updatedProjectData);
        return updatedProjectData;
      });
    },
    [],
  );

  const handleAddZoomSegment = useCallback((startTimeMs: number, endTimeMs: number) => {
    const newSegment: TZoomSegment = {
      id: crypto.randomUUID(),
      startTimeMs,
      endTimeMs,
      scale: 2,
    };
    setProjectData((prev) => {
      if (!prev) return prev;
      const updatedZoomSegments = [...prev.zoomSegments, newSegment].sort(
        (a, b) => a.startTimeMs - b.startTimeMs,
      );
      const updatedProjectData = { ...prev, zoomSegments: updatedZoomSegments };
      void editorApi.updateProjectData(updatedProjectData);
      return updatedProjectData;
    });
    setZoomSegments((prev) => [...prev, newSegment].sort((a, b) => a.startTimeMs - b.startTimeMs));
  }, []);

  const handleDeleteZoomSegment = useCallback((id: string) => {
    setProjectData((prev) => {
      if (!prev) return prev;
      const updatedZoomSegments = prev.zoomSegments.filter((s) => s.id !== id);
      const updatedProjectData = { ...prev, zoomSegments: updatedZoomSegments };
      void editorApi.updateProjectData(updatedProjectData);
      return updatedProjectData;
    });
    setZoomSegments((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleSetPixelsPerSecond = (newPixelsPerSecond: number) => {
    if (pixelsPerSecond === newPixelsPerSecond) return;
    const video = videoRef.current;
    const scroll = timelineContainerRef.current;
    if (!video || !scroll) {
      setPixelsPerSecond(newPixelsPerSecond);
      return;
    }
    if (!timelineZoomStateRef.current) {
      const time = video.currentTime;
      const visualX = time * pixelsPerSecond - scroll.scrollLeft;
      timelineZoomStateRef.current = { time, visualX };
    }
    setPixelsPerSecond(newPixelsPerSecond);
  };

  useLayoutEffect(() => {
    if (timelineZoomStateRef.current && timelineContainerRef.current) {
      const { time, visualX } = timelineZoomStateRef.current;
      const newScrollLeft = time * pixelsPerSecond - visualX;
      timelineContainerRef.current.scrollLeft = newScrollLeft;
      timelineZoomStateRef.current = null;
    }
  }, [pixelsPerSecond]);

  async function handleExport() {
    if (
      !videoDurationMs ||
      isExporting ||
      zoomSegments.length === 0 ||
      mouseMoves.length === 0 ||
      mouseClicks.length === 0
    )
      return;
    setIsPlaying(false);

    const filePath = await editorApi.openExportVideoDialog();
    if (!filePath) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      await exportVideo(
        filePath,
        videoDurationMs,
        zoomSegments,
        mouseMoves,
        mouseClicks,
        (progress) => setExportProgress(progress),
      );
    } catch (err) {
      console.error('Failed to process video output:', err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex flex-col w-screen h-screen bg-black text-white overflow-hidden">
      {isExporting && (
        <div className="absolute inset-0 z-100 bg-black/50 flex flex-col items-center justify-center backdrop-blur-lg transition-opacity">
          <div className="text-neutral-200 text-3xl font-semibold mb-6">Rendering Export</div>
          <div className="w-80 h-4 bg-zinc-800 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-violet-600 transition-all duration-300 ease-out"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
          <div className="text-zinc-400 mt-3 font-semibold">{Math.floor(exportProgress)}%</div>
        </div>
      )}
      <button
        onClick={handleExport}
        disabled={isExporting}
        onFocus={(e) => e.currentTarget.blur()}
        className="flex items-center justify-center gap-2 absolute top-4 right-4 z-40 bg-violet-700 text-white font-medium py-2 px-6 rounded-md hover:bg-violet-600 transition-all duration-300 ease-in-out disabled:opacity-50"
      >
        <ArrowUpFromLine size={18} />
        Export
      </button>
      <MainArea
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        renderFrame={renderFrame}
        videoRef={videoRef}
        pixelsPerSecond={pixelsPerSecond}
        handleSetPixelsPerSecond={handleSetPixelsPerSecond}
        previewScale={previewScale}
        setVideoSizing={setVideoSizing}
        videoSizing={videoSizing}
        wrapperRef={wrapperRef}
        transformContainerRef={transformContainerRef}
        mouseRef={mouseRef}
      />
      <TimelineContainer
        videoDurationMs={videoDurationMs}
        pixelsPerSecond={pixelsPerSecond}
        zoomSegments={zoomSegments}
        scrubberRef={scrubberRef}
        seekTo={seekTo}
        onUpdateZoomSegment={handleUpdateZoomSegment}
        onAddZoomSegment={handleAddZoomSegment}
        onDeleteZoomSegment={handleDeleteZoomSegment}
        timelineContainerRef={timelineContainerRef}
      />
    </div>
  );
}
