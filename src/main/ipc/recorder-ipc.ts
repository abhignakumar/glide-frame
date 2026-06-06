import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { BrowserWindow, screen, Menu, app } from 'electron';

import { projectsRootDir } from '../lib/config';
import { createRecorderWindow, createStopRecorderWindow } from '../windows';

import type { ChildProcess } from 'child_process';

let activeRecordingProcess: ChildProcess | null = null;
let activeStopWindow: BrowserWindow | null = null;

export function handleListDisplaySources(event: Electron.IpcMainInvokeEvent) {
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
                // TODO
                console.log('Open Editor Window');
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

function getProjectDirPath(display: Electron.Display): string {
  const resolvedRootDir = projectsRootDir.replace(/^~/, os.homedir());
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

export function stopRecordingProcess(): void {
  if (
    activeRecordingProcess &&
    activeRecordingProcess.stdin &&
    activeRecordingProcess.exitCode === null &&
    activeRecordingProcess.signalCode === null &&
    !activeRecordingProcess.killed
  ) {
    console.log('Sending stop signal to Recorder CLI...');
    try {
      activeRecordingProcess.stdin.write('\n');
    } catch (err) {
      console.warn('[Recorder stdin] Synchronous write error:', err);
    }
  }
}
