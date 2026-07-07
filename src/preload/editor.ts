import { contextBridge, ipcRenderer } from 'electron';

import {
  GET_MOUSE_MOVES,
  GET_MOUSE_CLICKS,
  GET_PROJECT_DATA,
  START_EXPORT,
  OPEN_EXPORT_VIDEO_DIALOG,
  UPDATE_PROJECT_DATA,
} from '../main/lib/constants';

import type { EditorAPI } from '../main/lib/types/ipc-api';

const projectDir = process.argv.find((arg) => arg.startsWith('projectDir='))?.split('=')[1];
const videoServerPort = process.argv
  .find((arg) => arg.startsWith('videoServerPort='))
  ?.split('=')[1];

if (!projectDir) {
  throw new Error('Project directory (projectDir) is undefined.');
}
if (!videoServerPort) {
  throw new Error('Video server port (videoServerPort) is undefined.');
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', {
      type: 'editor',
      getProjectData: () => ipcRenderer.invoke(GET_PROJECT_DATA, projectDir),
      getMouseMoves: () => ipcRenderer.invoke(GET_MOUSE_MOVES, projectDir),
      getMouseClicks: () => ipcRenderer.invoke(GET_MOUSE_CLICKS, projectDir),
      getProjectDir: () => projectDir,
      getVideoSrcUrl: () =>
        `http://127.0.0.1:${videoServerPort}/stream-video?videoPath=${encodeURIComponent(
          `${projectDir}/recording/display.mp4`,
        )}`,
      openExportVideoDialog: async () => {
        const { filePath } = (await ipcRenderer.invoke(OPEN_EXPORT_VIDEO_DIALOG)) as {
          filePath: string | null;
        };
        return filePath;
      },
      updateProjectData: (projectData) =>
        ipcRenderer.invoke(UPDATE_PROJECT_DATA, projectDir, projectData),
    } satisfies EditorAPI);
  } catch (error) {
    console.error(error);
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.origin !== window.location.origin) return;
    if (!event.data || typeof event.data !== 'object') return;
    const { type, filePath } = event.data as { type: string; filePath: string };
    if (type === 'INIT_EXPORT_STREAM') {
      const port = event.ports.length > 0 ? event.ports[0] : null;
      if (port) {
        ipcRenderer.postMessage(START_EXPORT, { filePath }, [port]);
      }
    }
  });
}
