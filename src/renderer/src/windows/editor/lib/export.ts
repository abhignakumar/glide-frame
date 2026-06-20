import 'pixi.js/unsafe-eval';

import {
  Input,
  UrlSource,
  ALL_FORMATS,
  VideoSampleSink,
  Output,
  Mp4OutputFormat,
  StreamTarget,
  CanvasSource,
} from 'mediabunny';
import * as PIXI from 'pixi.js';

import { editorApi } from '../api';
import { generateZoomCenters } from '../zoom-centers';
import { MOUSE_ARROW_DATA, MOUSE_SIZE_TIMES } from './config';
import { getInterpolatedFrame } from './utils';
import mousePng from '../assets/arrow.png';
import wallpaperJpg from '../assets/wallpaper.jpg';
import { computeFinalFrameStates } from '../final-frames';

import type { StreamTargetChunk } from 'mediabunny';
import type { TMouseClick, TMouseMove, TZoomSegment } from 'src/preload';

export async function exportVideo(
  filePath: string,
  videoDurationMs: number,
  zoomSegments: TZoomSegment[],
  mouseMoves: TMouseMove[],
  mouseClicks: TMouseClick[],
  onProgress?: (progress: number) => void,
): Promise<void> {
  const { port1, port2 } = new MessageChannel();
  const streamPort = port1;
  window.postMessage({ type: 'INIT_EXPORT_STREAM', filePath }, window.location.origin, [port2]);

  const streamState: { error: Error | null } = { error: null };
  streamPort.onmessage = (event) => {
    const { type, message } = event.data as { type: string; message?: string };
    if (type === 'error') {
      streamState.error = new Error(`Main process stream error: ${message ?? 'Unknown'}`);
    }
  };

  const writableStream = new WritableStream<StreamTargetChunk>({
    write(chunk) {
      if (streamState.error) throw new Error(streamState.error.message);
      streamPort.postMessage({ type: 'data', chunk: chunk.data, position: chunk.position });
    },
    close() {
      if (streamState.error) throw new Error(streamState.error.message);
      streamPort.postMessage({ type: 'done' });
      streamPort.close();
    },
    abort(err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      streamPort.postMessage({ type: 'error', message: errorMessage });
      streamPort.close();
    },
  });

  try {
    const fps = 60;
    const dt = 1 / fps;
    const width = 1920;
    const height = 1080;

    const output = new Output({
      format: new Mp4OutputFormat({ fastStart: false }),
      target: new StreamTarget(writableStream),
    });

    const app = new PIXI.Application();
    await app.init({
      width,
      height,
      backgroundColor: 0x000000,
      autoStart: false,
      sharedTicker: false,
      preference: 'webgl',
      preserveDrawingBuffer: true,
    });

    const videoSource = new CanvasSource(app.canvas, {
      codec: 'avc',
      bitrate: 15_000_000,
    });
    output.addVideoTrack(videoSource);

    const input = new Input({
      source: new UrlSource(editorApi.getVideoSrcUrl()),
      formats: ALL_FORMATS,
    });

    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) throw new Error('No video track found in input file');
    const sink = new VideoSampleSink(videoTrack);

    const bgTexture = await PIXI.Assets.load<PIXI.Texture>(wallpaperJpg);
    const bgSprite = new PIXI.Sprite(bgTexture);
    const bgScale = Math.max(width / bgTexture.width, height / bgTexture.height);
    bgSprite.scale.set(bgScale);
    bgSprite.anchor.set(0.5);
    bgSprite.position.set(width / 2, height / 2);
    app.stage.addChild(bgSprite);

    const vidW = await videoTrack.getDisplayWidth();
    const vidH = await videoTrack.getDisplayHeight();
    const videoRatio = vidW / vidH;
    const containerRatio = width / height;

    let targetW = 0;
    let targetH = 0;
    if (videoRatio >= containerRatio) {
      targetW = width;
      targetH = width / videoRatio;
    } else {
      targetH = height;
      targetW = height * videoRatio;
    }

    const videoCanvas = document.createElement('canvas');
    videoCanvas.width = vidW;
    videoCanvas.height = vidH;
    const videoCtx = videoCanvas.getContext('2d', { willReadFrequently: true });
    if (!videoCtx) throw new Error('Could not create 2d context for video frames');

    const videoTexture = PIXI.Texture.from(videoCanvas);
    const videoSprite = new PIXI.Sprite(videoTexture);
    videoSprite.width = targetW;
    videoSprite.height = targetH;
    videoSprite.anchor.set(0.5);

    const videoShadow = new PIXI.Graphics();
    const spread = -12;
    videoShadow.rect(
      -targetW / 2 - spread,
      -targetH / 2 - spread,
      targetW + spread * 2,
      targetH + spread * 2,
    );
    videoShadow.fill({ color: 0x000000, alpha: 0.85 });
    const videoShadowBlur = new PIXI.BlurFilter({ strength: 45, quality: 6 });
    videoShadowBlur.padding = 150;
    videoShadow.filters = [videoShadowBlur];
    const videoShadowContainer = new PIXI.Container();
    videoShadowContainer.position.set(0, 25);
    videoShadowContainer.addChild(videoShadow);

    const videoTransformContainer = new PIXI.Container();
    videoTransformContainer.addChild(videoShadowContainer);
    videoTransformContainer.addChild(videoSprite);
    app.stage.addChild(videoTransformContainer);

    const mouseTexture = await PIXI.Assets.load<PIXI.Texture>(mousePng);
    const mouseBaseScaleX =
      (MOUSE_ARROW_DATA.standardSize.width * MOUSE_SIZE_TIMES) / mouseTexture.width;
    const mouseBaseScaleY =
      (MOUSE_ARROW_DATA.standardSize.height * MOUSE_SIZE_TIMES) / mouseTexture.height;

    const mouseShadow = new PIXI.Sprite(mouseTexture);
    mouseShadow.tint = 0x000000;
    mouseShadow.alpha = 0.35;
    mouseShadow.anchor.set(
      MOUSE_ARROW_DATA.hotspot.x / MOUSE_ARROW_DATA.standardSize.width,
      MOUSE_ARROW_DATA.hotspot.y / MOUSE_ARROW_DATA.standardSize.height,
    );

    const mouseShadowBlur = new PIXI.BlurFilter({ strength: 12, quality: 4 });
    mouseShadowBlur.padding = 30;
    mouseShadow.filters = [mouseShadowBlur];

    videoTransformContainer.addChild(mouseShadow);

    const mouseSprite = new PIXI.Sprite(mouseTexture);
    mouseSprite.anchor.copyFrom(mouseShadow.anchor);
    videoTransformContainer.addChild(mouseSprite);

    const videoScaleFactor = targetW / vidW;
    const scaledExportMouseMoves = mouseMoves.map((m) => ({
      ...m,
      x: m.x * videoScaleFactor,
      y: m.y * videoScaleFactor,
    }));
    const scaledExportMouseClicks = mouseClicks.map((c) => ({
      ...c,
      x: c.x * videoScaleFactor,
      y: c.y * videoScaleFactor,
    }));

    const zoomCenters = generateZoomCenters(
      zoomSegments,
      scaledExportMouseMoves.map((item) => ({ ...item })),
      { width: targetW, height: targetH },
      { width, height },
    );

    const exportFinalFrameStates = computeFinalFrameStates(
      videoDurationMs,
      { width: targetW, height: targetH },
      zoomSegments,
      zoomCenters,
      scaledExportMouseMoves.map((item) => ({ ...item })),
      scaledExportMouseClicks.map((item) => ({ ...item })),
      fps,
    );

    await output.start();

    let outputTime = 0;

    for await (const sample of sink.samples()) {
      if (streamState.error) throw streamState.error;

      const sampleEndTime = sample.timestamp + sample.duration;
      if (outputTime >= sampleEndTime) {
        sample.close();
        continue;
      }

      const videoFrame = sample.toVideoFrame();
      videoCtx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
      videoCtx.drawImage(videoFrame, 0, 0, videoCanvas.width, videoCanvas.height);
      videoTexture.source.update();
      videoFrame.close();
      sample.close();

      while (outputTime < sampleEndTime && outputTime <= videoDurationMs / 1000) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (streamState.error) throw new Error(streamState.error);

        const frameData = getInterpolatedFrame(outputTime * 1000, exportFinalFrameStates);

        videoTransformContainer.position.set(
          width / 2 + frameData.videoTranslateX,
          height / 2 + frameData.videoTranslateY,
        );
        videoTransformContainer.scale.set(frameData.videoScale);

        const mouseXLocal = frameData.mouseX - targetW / 2;
        const mouseYLocal = frameData.mouseY - targetH / 2;

        mouseShadow.position.set(mouseXLocal, mouseYLocal + 25);
        mouseShadow.scale.set(
          mouseBaseScaleX * frameData.mouseScale,
          mouseBaseScaleY * frameData.mouseScale,
        );
        mouseShadow.rotation = frameData.mouseRotation * (Math.PI / 180);

        mouseSprite.position.set(mouseXLocal, mouseYLocal);
        mouseSprite.scale.set(
          mouseBaseScaleX * frameData.mouseScale,
          mouseBaseScaleY * frameData.mouseScale,
        );
        mouseSprite.rotation = frameData.mouseRotation * (Math.PI / 180);

        app.renderer.render({ container: app.stage });
        await videoSource.add(outputTime, dt);

        outputTime += dt;
        if (onProgress) {
          onProgress(Math.min(100, (outputTime / (videoDurationMs / 1000)) * 100));
        }
      }
    }

    while (outputTime <= videoDurationMs / 1000) {
      if (streamState.error) throw streamState.error;
      const frameData = getInterpolatedFrame(outputTime * 1000, exportFinalFrameStates);

      videoTransformContainer.position.set(
        width / 2 + frameData.videoTranslateX,
        height / 2 + frameData.videoTranslateY,
      );
      videoTransformContainer.scale.set(frameData.videoScale);

      const mouseXLocal = frameData.mouseX - targetW / 2;
      const mouseYLocal = frameData.mouseY - targetH / 2;

      mouseShadow.position.set(mouseXLocal, mouseYLocal + 25);
      mouseShadow.scale.set(
        mouseBaseScaleX * frameData.mouseScale,
        mouseBaseScaleY * frameData.mouseScale,
      );
      mouseShadow.rotation = frameData.mouseRotation * (Math.PI / 180);

      mouseSprite.position.set(mouseXLocal, mouseYLocal);
      mouseSprite.scale.set(
        mouseBaseScaleX * frameData.mouseScale,
        mouseBaseScaleY * frameData.mouseScale,
      );
      mouseSprite.rotation = frameData.mouseRotation * (Math.PI / 180);

      app.renderer.render({ container: app.stage });
      await videoSource.add(outputTime, dt);

      outputTime += dt;
      if (onProgress) {
        onProgress(Math.min(100, (outputTime / (videoDurationMs / 1000)) * 100));
      }
    }

    videoSource.close();
    await output.finalize();

    await PIXI.Assets.unload(wallpaperJpg);
    await PIXI.Assets.unload(mousePng);

    videoTexture.destroy(true);

    app.destroy(true, { children: true, texture: true });
  } catch (error) {
    console.error('Export failed:', error);
    if (!streamState.error) {
      streamPort.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
    streamPort.close();
    throw error;
  }
}
