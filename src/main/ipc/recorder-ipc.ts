import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { BrowserWindow, screen, Menu, app } from 'electron';

import { DEFAULT_ALL_SPRING_CONFIGS, DEFAULT_PROJECTS_ROOT_DIR } from '../lib/config';
import { GROUP_CLICKS_WITHIN_TIME_MS } from '../lib/constants';
import { calculateSpringSettlingDurationMs } from '../lib/utils';
import { createEditorWindow, createRecorderWindow, createStopRecorderWindow } from '../windows';

import type { MouseClick, ZoomSegment } from '../lib/types/types';
import type { ChildProcess } from 'child_process';
import type { Display, IpcMainInvokeEvent } from 'electron';

let activeRecordingProcess: ChildProcess | null = null;
let activeStopWindow: BrowserWindow | null = null;

export function handleListDisplaySources(event: IpcMainInvokeEvent) {
  const displays = screen.getAllDisplays();
  const recorderWindow = BrowserWindow.fromWebContents(event.sender);

  const menu = Menu.buildFromTemplate(
    displays.map((display) => ({
      label: display.label,
      click: async () => {
        // Start recording
        if (activeRecordingProcess) {
          console.warn('A recording is already in progress.');
          return;
        }

        recorderWindow?.close();
        let sessionConcluded = false;

        try {
          const projectDir = getProjectDirPath(display);
          const outputPath = path.join(projectDir, 'recording');

          await fs.promises.mkdir(projectDir, { recursive: true });

          const cliPath = getRecorderCliPath();
          try {
            await fs.promises.access(cliPath);
          } catch {
            throw new Error(`Recorder CLI binary not found at: ${cliPath}`);
          }

          activeRecordingProcess = spawn(cliPath, [
            '--displayId',
            display.id.toString(),
            '--outputPath',
            outputPath,
          ]);

          activeRecordingProcess.stdin?.on('error', (err) => {
            console.warn('Recorder stdin error (expected if process is closing):', err);
          });

          activeRecordingProcess.on('error', (err) => {
            if (sessionConcluded) return;
            sessionConcluded = true;

            console.error('[Recorder Spawn Error]:', err);
            activeRecordingProcess = null;

            if (activeStopWindow && !activeStopWindow.isDestroyed()) {
              activeStopWindow.close();
              activeStopWindow = null;
            }
            void createRecorderWindow();
          });

          activeRecordingProcess.stdout?.on('data', (chunk) => {
            console.log(`[Recorder]: ${chunk}`);
          });

          activeRecordingProcess.stderr?.on('data', (chunk) => {
            console.error(`[Recorder Error]: ${chunk}`);
          });

          activeRecordingProcess.on('close', (code, signal) => {
            if (sessionConcluded) return;
            sessionConcluded = true;

            console.log(`[Recorder] Process exited with code ${code} and signal ${signal}`);
            activeRecordingProcess = null;

            if (activeStopWindow && !activeStopWindow.isDestroyed()) {
              activeStopWindow.close();
              activeStopWindow = null;
            }

            if (code === 0) {
              try {
                const mouseClicksFileData = fs.readFileSync(
                  path.join(outputPath, 'mouse-clicks.json'),
                  'utf-8',
                );
                const mouseClicks = JSON.parse(mouseClicksFileData) as MouseClick[];
                const zoomSegments = generateZoomSegments(mouseClicks);
                const projectData = {
                  id: crypto.randomUUID(),
                  createdAt: new Date().toISOString(),
                  zoomSegments: zoomSegments,
                };
                fs.writeFileSync(
                  path.join(projectDir, 'project.json'),
                  JSON.stringify(projectData, null, 2),
                );
                void createEditorWindow(projectDir);
              } catch (err) {
                console.error('Failed to open editor window:', err);
                void createRecorderWindow();
              }
            } else {
              console.error('Recording stopped due to an error or signal termination.');
              void createRecorderWindow();
            }
          });

          activeStopWindow = await createStopRecorderWindow();
        } catch (error) {
          console.error('Failed to initiate recording sequence:', error);

          if (activeRecordingProcess && !activeRecordingProcess.killed) {
            activeRecordingProcess.kill('SIGKILL');
          }
          activeRecordingProcess = null;

          await createRecorderWindow();
        }
      },
    })),
  );

  menu.popup({
    window: recorderWindow ?? undefined,
  });
  return;
}

function getProjectDirPath(display: Display): string {
  const resolvedRootDir = DEFAULT_PROJECTS_ROOT_DIR.replace(/^~/, os.homedir());
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
  const safeLabel = display.label.replace(/[/\\?%*:|"<>]/g, '-').trim();
  return path.join(resolvedRootDir, `${safeLabel} ${dateStr} ${timeStr}`);
}

function getRecorderCliPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'Recorder');
  }
  return path.join(app.getAppPath(), 'native', 'Recorder', '.build', 'release', 'Recorder');
}

export function stopRecordingProcess(forceKill = false): void {
  if (
    activeRecordingProcess &&
    activeRecordingProcess.exitCode === null &&
    !activeRecordingProcess.killed
  ) {
    if (forceKill) {
      activeRecordingProcess.kill('SIGKILL');
    } else if (activeRecordingProcess.stdin) {
      try {
        activeRecordingProcess.stdin.write('\n');
      } catch (err) {
        console.warn('[Recorder stdin] error:', err);
      }
    }
  }
}

function generateZoomSegments(mouseClicks: MouseClick[]): ZoomSegment[] {
  const filteredMouseClicks = mouseClicks.filter((click) => click.type === 'mouseDown');
  const zoomSegments: ZoomSegment[] = [];
  let tempZoomSegment: ZoomSegment | null = null;
  const zoomTransitionTimeMs = calculateSpringSettlingDurationMs(
    DEFAULT_ALL_SPRING_CONFIGS.screenMovement,
  );
  const approximateVideoEndTimeMs =
    filteredMouseClicks[filteredMouseClicks.length - 1].processTimeMs;

  for (let i = 0; i < filteredMouseClicks.length - 1; i++) {
    tempZoomSegment ??= {
      id: crypto.randomUUID(),
      startTimeMs: Math.max(0, filteredMouseClicks[i].processTimeMs - zoomTransitionTimeMs),
      endTimeMs: 0,
      scale: 2,
    };
    if (
      i + 1 >= filteredMouseClicks.length - 1 ||
      (filteredMouseClicks[i + 1].processTimeMs - filteredMouseClicks[i].processTimeMs >
        GROUP_CLICKS_WITHIN_TIME_MS &&
        filteredMouseClicks[i].processTimeMs + GROUP_CLICKS_WITHIN_TIME_MS + zoomTransitionTimeMs <
          filteredMouseClicks[i + 1].processTimeMs - zoomTransitionTimeMs)
    ) {
      tempZoomSegment.endTimeMs =
        filteredMouseClicks[i].processTimeMs + GROUP_CLICKS_WITHIN_TIME_MS <
        approximateVideoEndTimeMs
          ? filteredMouseClicks[i].processTimeMs + GROUP_CLICKS_WITHIN_TIME_MS
          : approximateVideoEndTimeMs - 1000;
      zoomSegments.push(tempZoomSegment);
      tempZoomSegment = null;
    }
  }

  return zoomSegments;
}
